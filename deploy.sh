#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${ROOT_DIR}/deploy/deploy.local.env"
ARCHIVE_FILE=""
PRODUCTION_ENV_FILE=""

cleanup() {
  if [[ -n "${ARCHIVE_FILE}" && -f "${ARCHIVE_FILE}" ]]; then
    rm -f "${ARCHIVE_FILE}"
  fi
  if [[ -n "${PRODUCTION_ENV_FILE}" && -f "${PRODUCTION_ENV_FILE}" ]]; then
    rm -f "${PRODUCTION_ENV_FILE}"
  fi
}
trap cleanup EXIT

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

require_value() {
  local name="$1"
  [[ -n "${!name:-}" ]] || fail "${name} is required in ${CONFIG_FILE}"
}

prompt_yes_no() {
  local prompt="$1"
  local default_value="$2"
  local answer=""
  read -r -p "${prompt} [${default_value}]: " answer
  answer="${answer:-${default_value}}"
  [[ "${answer}" =~ ^[Yy]$ ]]
}

[[ -f "${CONFIG_FILE}" ]] || fail "Missing ${CONFIG_FILE}. Copy deploy/deploy.local.env.example and configure it first."

set -a
# shellcheck disable=SC1090
source "${CONFIG_FILE}"
set +a

for variable in \
  VPS_HOST VPS_PORT VPS_USER VPS_DIR DEPLOY_DOMAIN APP_HTTP_PORT \
  POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD JWT_SECRET_KEY \
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES JWT_REFRESH_TOKEN_EXPIRE_DAYS APP_TIMEZONE \
  VITE_API_BASE_URL SEED_USERNAME SEED_PASSWORD SEED_DISPLAY_NAME \
  SEED_ENFORCE_SINGLE_USER ALLOW_REGISTRATION; do
  require_value "${variable}"
done

[[ "${VPS_DIR}" == /opt/* && "${VPS_DIR}" != "/opt/" ]] || fail "VPS_DIR must be a project directory below /opt"
[[ "${APP_HTTP_PORT}" =~ ^[0-9]+$ ]] || fail "APP_HTTP_PORT must be numeric"
SEED_PASSWORD_BYTES="$(printf '%s' "${SEED_PASSWORD}" | wc -c | tr -d '[:space:]')"
[[ "${SEED_PASSWORD_BYTES}" -le 72 ]] || fail "SEED_PASSWORD is ${SEED_PASSWORD_BYTES} bytes; bcrypt passwords must be 72 bytes or less"

SSH_ARGS=(-p "${VPS_PORT}")
SCP_ARGS=(-P "${VPS_PORT}")
if [[ -n "${SSH_IDENTITY_FILE:-}" ]]; then
  if [[ "${SSH_IDENTITY_FILE}" != /* ]]; then
    SSH_IDENTITY_FILE="${ROOT_DIR}/${SSH_IDENTITY_FILE}"
  fi
  [[ -f "${SSH_IDENTITY_FILE}" ]] || fail "SSH identity file not found: ${SSH_IDENTITY_FILE}"
  SSH_ARGS+=(-i "${SSH_IDENTITY_FILE}")
  SCP_ARGS+=(-i "${SSH_IDENTITY_FILE}")
else
  printf 'SSH_IDENTITY_FILE is blank; ssh/scp will prompt for the VPS password if needed.\n'
fi

require_command ssh
require_command scp
require_command tar
require_command curl
require_command npm

printf 'Deploy target: %s@%s:%s -> %s\n' "${VPS_USER}" "${VPS_HOST}" "${VPS_PORT}" "${VPS_DIR}"
printf 'Domain: %s, loopback port: %s\n' "${DEPLOY_DOMAIN}" "${APP_HTTP_PORT}"
printf 'Production seed user: %s, password bytes: %s\n' "${SEED_USERNAME}" "${SEED_PASSWORD_BYTES}"

REBUILD_FRONTEND="y"
REBUILD_BACKEND="y"
if prompt_yes_no "Rebuild frontend image and run local frontend build?" "Y"; then
  REBUILD_FRONTEND="y"
else
  REBUILD_FRONTEND="n"
fi
if prompt_yes_no "Rebuild backend image?" "Y"; then
  REBUILD_BACKEND="y"
else
  REBUILD_BACKEND="n"
fi

printf '\n[1/6] Local validation\n'
if [[ "${REBUILD_FRONTEND}" == "y" ]]; then
  (
    cd "${ROOT_DIR}/web"
    npm run build
  )
else
  printf 'Skipping local frontend build by user choice.\n'
fi

printf '\n[2/6] Preparing production environment and archive\n'
PRODUCTION_ENV_FILE="$(mktemp)"
chmod 600 "${PRODUCTION_ENV_FILE}"
cat >"${PRODUCTION_ENV_FILE}" <<EOF
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=${JWT_ACCESS_TOKEN_EXPIRE_MINUTES}
JWT_REFRESH_TOKEN_EXPIRE_DAYS=${JWT_REFRESH_TOKEN_EXPIRE_DAYS}
APP_TIMEZONE=${APP_TIMEZONE}
CORS_ORIGINS=https://${DEPLOY_DOMAIN}
COOKIE_SECURE=true
COOKIE_DOMAIN=${DEPLOY_DOMAIN}
VITE_API_BASE_URL=${VITE_API_BASE_URL}
APP_HTTP_PORT=${APP_HTTP_PORT}
SEED_USERNAME=${SEED_USERNAME}
SEED_PASSWORD=${SEED_PASSWORD}
SEED_DISPLAY_NAME=${SEED_DISPLAY_NAME}
SEED_ENFORCE_SINGLE_USER=${SEED_ENFORCE_SINGLE_USER}
ALLOW_REGISTRATION=${ALLOW_REGISTRATION}
EOF

ARCHIVE_FILE="$(mktemp --suffix=.tar.gz)"
tar \
  --exclude='.git' \
  --exclude='.codegraph' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.pytest_cache' \
  --exclude='.venv' \
  --exclude='venv' \
  --exclude='deploy/deploy.local.env' \
  --exclude='deploy/.env.production' \
  --exclude='deploy/backups' \
  -czf "${ARCHIVE_FILE}" \
  -C "${ROOT_DIR}" .

REMOTE_ARCHIVE="/tmp/leonote-deployment.tar.gz"
REMOTE_ENV="/tmp/leonote-production.env"

printf '\n[3/6] Uploading deployment bundle\n'
scp "${SCP_ARGS[@]}" "${ARCHIVE_FILE}" "${VPS_USER}@${VPS_HOST}:${REMOTE_ARCHIVE}"
scp "${SCP_ARGS[@]}" "${PRODUCTION_ENV_FILE}" "${VPS_USER}@${VPS_HOST}:${REMOTE_ENV}"

printf '\n[4/6] Remote conflict checks and Docker deployment\n'
LETSENCRYPT_EMAIL_ARG="${LETSENCRYPT_EMAIL:-__EMPTY__}"
ssh "${SSH_ARGS[@]}" "${VPS_USER}@${VPS_HOST}" bash -s -- \
  "${VPS_DIR}" "${APP_HTTP_PORT}" "${DEPLOY_DOMAIN}" "${VPS_HOST}" "${LETSENCRYPT_EMAIL_ARG}" \
  "${REMOTE_ARCHIVE}" "${REMOTE_ENV}" "${REBUILD_FRONTEND}" "${REBUILD_BACKEND}" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

VPS_DIR="$1"
APP_HTTP_PORT="$2"
DEPLOY_DOMAIN="$3"
EXPECTED_IP="$4"
LETSENCRYPT_EMAIL="$5"
REMOTE_ARCHIVE="$6"
REMOTE_ENV="$7"
REBUILD_FRONTEND="$8"
REBUILD_BACKEND="$9"
if [[ "${LETSENCRYPT_EMAIL}" == "__EMPTY__" ]]; then
  LETSENCRYPT_EMAIL=""
fi

dump_docker_diagnostics() {
  local exit_code="$?"
  echo ""
  echo "Remote deploy failed with exit code ${exit_code}. Docker diagnostics:"
  if [[ -d "${VPS_DIR}/deploy" ]]; then
    cd "${VPS_DIR}/deploy" || return "${exit_code}"
    docker compose -p leonote --env-file .env.production ps || true
    docker compose -p leonote --env-file .env.production logs --tail=160 postgres backend nginx || true
  fi
  return "${exit_code}"
}
trap dump_docker_diagnostics ERR

[[ "${VPS_DIR}" == /opt/* && "${VPS_DIR}" != "/opt/" ]] || {
  echo "Unsafe VPS_DIR: ${VPS_DIR}" >&2
  exit 1
}

if docker ps -a --format '{{.Names}}' | grep -Eq '^leonote-(postgres|backend|web|nginx)$'; then
  for container in leonote-postgres leonote-backend leonote-web leonote-nginx; do
    if docker inspect "${container}" >/dev/null 2>&1; then
      project="$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "${container}")"
      [[ "${project}" == "leonote" ]] || {
        echo "Container name conflict: ${container} belongs to project ${project}" >&2
        exit 1
      }
    fi
  done
fi

if ss -ltnH | awk '{print $4}' | grep -Eq "(:|\])${APP_HTTP_PORT}$"; then
  current_binding="$(docker port leonote-nginx 80/tcp 2>/dev/null || true)"
  echo "${current_binding}" | grep -q "127.0.0.1:${APP_HTTP_PORT}" || {
    echo "Port ${APP_HTTP_PORT} is already in use by another service" >&2
    exit 1
  }
fi

command -v nginx >/dev/null 2>&1 || {
  echo "Host nginx is required" >&2
  exit 1
}

mkdir -p "${VPS_DIR}/backups"
if [[ -d "${VPS_DIR}/backend" || -d "${VPS_DIR}/web" || -d "${VPS_DIR}/deploy" ]]; then
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_file="${VPS_DIR}/backups/source-${timestamp}.tar.gz"
  tar --exclude='deploy/.env.production' -czf "${backup_file}" \
    -C "${VPS_DIR}" backend web deploy 2>/dev/null || true
  chmod 600 "${backup_file}" 2>/dev/null || true
fi

rm -rf "${VPS_DIR}/backend" "${VPS_DIR}/web" "${VPS_DIR}/deploy"
mkdir -p "${VPS_DIR}"
tar -xzf "${REMOTE_ARCHIVE}" -C "${VPS_DIR}"
chmod 600 "${REMOTE_ENV}"
install -m 600 "${REMOTE_ENV}" "${VPS_DIR}/deploy/.env.production"
rm -f "${REMOTE_ARCHIVE}" "${REMOTE_ENV}"
mkdir -p "${VPS_DIR}/deploy/backups"

cd "${VPS_DIR}/deploy"
env_value() {
  local key="$1"
  sed -n "s/^${key}=//p" .env.production | tail -n 1
}

POSTGRES_USER_VALUE="$(env_value POSTGRES_USER)"
POSTGRES_DB_VALUE="$(env_value POSTGRES_DB)"
SEED_USERNAME_VALUE="$(env_value SEED_USERNAME)"
SEED_PASSWORD_VALUE="$(env_value SEED_PASSWORD)"
SEED_PASSWORD_BYTES="$(printf '%s' "${SEED_PASSWORD_VALUE}" | wc -c | tr -d '[:space:]')"
[[ "${SEED_PASSWORD_BYTES}" -le 72 ]] || {
  echo "Remote SEED_PASSWORD is ${SEED_PASSWORD_BYTES} bytes; bcrypt passwords must be 72 bytes or less" >&2
  exit 1
}
echo "Remote production seed user: ${SEED_USERNAME_VALUE}, password bytes: ${SEED_PASSWORD_BYTES}"

docker compose -p leonote --env-file .env.production config >/dev/null
build_services=()
if [[ "${REBUILD_BACKEND}" =~ ^[Yy]$ ]]; then
  build_services+=(backend)
fi
if [[ "${REBUILD_FRONTEND}" =~ ^[Yy]$ ]]; then
  build_services+=(web)
fi
if [[ "${#build_services[@]}" -gt 0 ]]; then
  docker compose -p leonote --env-file .env.production build "${build_services[@]}"
fi
if [[ "${REBUILD_BACKEND}" =~ ^[Yy]$ || "${REBUILD_FRONTEND}" =~ ^[Yy]$ ]]; then
  docker compose -p leonote --env-file .env.production up -d --remove-orphans
else
  if docker image inspect leonote-backend >/dev/null 2>&1 && docker image inspect leonote-web >/dev/null 2>&1; then
    docker compose -p leonote --env-file .env.production up -d --no-build --remove-orphans
  else
    echo "Backend/web images do not exist yet. Re-run with frontend/backend rebuild enabled." >&2
    exit 1
  fi
fi

echo "Waiting for the Docker gateway health check..."
for attempt in $(seq 1 36); do
  if curl --fail --silent "http://127.0.0.1:${APP_HTTP_PORT}/health" >/dev/null; then
    break
  fi
  if [[ "${attempt}" -eq 36 ]]; then
    docker compose -p leonote --env-file .env.production ps
    docker compose -p leonote --env-file .env.production logs --tail=100 backend nginx
    echo "Docker gateway health check failed" >&2
    exit 1
  fi
  sleep 5
done

NGINX_SITE="/etc/nginx/sites-available/leonote.conf"
cat >"${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DEPLOY_DOMAIN};

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:${APP_HTTP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
ln -sfn "${NGINX_SITE}" /etc/nginx/sites-enabled/leonote.conf
nginx -t
systemctl reload nginx

resolved_ip="$(getent ahostsv4 "${DEPLOY_DOMAIN}" | awk 'NR == 1 {print $1}')"
if [[ "${resolved_ip}" == "${EXPECTED_IP}" ]]; then
  if command -v certbot >/dev/null 2>&1; then
    certbot_args=(
      --nginx
      --domain "${DEPLOY_DOMAIN}"
      --non-interactive
      --agree-tos
      --redirect
      --expand
      --cert-name "${DEPLOY_DOMAIN}"
      --deploy-hook "systemctl reload nginx"
    )
    if [[ -n "${LETSENCRYPT_EMAIL}" ]]; then
      certbot_args+=(--email "${LETSENCRYPT_EMAIL}")
    else
      certbot_args+=(--register-unsafely-without-email)
    fi
    certbot "${certbot_args[@]}"
    nginx -t
    systemctl reload nginx
  else
    echo "DNS is ready, but Certbot is not installed; HTTPS was not configured."
  fi
else
  echo "DNS for ${DEPLOY_DOMAIN} does not resolve to ${EXPECTED_IP}; HTTPS was skipped."
fi

user_count="$(
  docker compose -p leonote --env-file .env.production exec -T postgres \
    psql -U "${POSTGRES_USER_VALUE}" -d "${POSTGRES_DB_VALUE}" -tAc "SELECT count(*) FROM users;"
)"
seed_username="$(
  docker compose -p leonote --env-file .env.production exec -T postgres \
    psql -U "${POSTGRES_USER_VALUE}" -d "${POSTGRES_DB_VALUE}" -tAc "SELECT username FROM users LIMIT 1;"
)"
[[ "${user_count//[[:space:]]/}" == "1" ]] || {
  echo "Expected exactly one production user, found ${user_count}" >&2
  exit 1
}
[[ "${seed_username//[[:space:]]/}" == "${SEED_USERNAME_VALUE}" ]] || {
  echo "Unexpected production seed username: ${seed_username}" >&2
  exit 1
}

login_status="$(
  curl --silent --output /dev/null --write-out '%{http_code}' \
    --header 'Content-Type: application/json' \
    --data "{\"username\":\"${SEED_USERNAME_VALUE}\",\"password\":\"${SEED_PASSWORD_VALUE}\"}" \
    "http://127.0.0.1:${APP_HTTP_PORT}/api/auth/login"
)"
[[ "${login_status}" == "200" ]] || {
  echo "Seed user login verification failed with HTTP ${login_status}" >&2
  exit 1
}

docker compose -p leonote --env-file .env.production ps
REMOTE_SCRIPT

printf '\n[5/6] Public health checks\n'
curl --connect-timeout 5 --max-time 15 --fail --silent --show-error "http://${DEPLOY_DOMAIN}/health" || true
curl --connect-timeout 5 --max-time 15 --fail --silent --show-error "https://${DEPLOY_DOMAIN}/health" || true

printf '\n[6/6] Deployment completed\n'
printf 'Application target: https://%s (after DNS and TLS are ready)\n' "${DEPLOY_DOMAIN}"
printf 'Production seed user: %s\n' "${SEED_USERNAME}"
