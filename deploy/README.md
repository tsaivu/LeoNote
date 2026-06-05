# Leo Task Management VPS Deployment

Production runs on Docker Compose behind the Ubuntu host Nginx:

- `leonote-postgres`: PostgreSQL 16 with a named persistent volume.
- `leonote-backend`: FastAPI and Alembic, internal Docker network only.
- `leonote-web`: React/Vite/PWA static build, internal Docker network only.
- `leonote-nginx`: internal gateway bound to `127.0.0.1:<APP_HTTP_PORT>`.
- Host Nginx: public HTTP/HTTPS virtual host for the configured domain.

The deployment does not publish PostgreSQL or backend ports to the internet.

## Local Configuration

Copy the example once:

```bash
cp deploy/deploy.local.env.example deploy/deploy.local.env
```

Set the VPS, domain, loopback port, optional Let's Encrypt email, database secrets and initial user. This file is ignored by Git.

By default, leave `SSH_IDENTITY_FILE` blank and enter the VPS password when `ssh`/`scp` prompts.

For unattended one-command deploys, optionally configure `SSH_IDENTITY_FILE`. Generate and install the key once:

```bash
ssh-keygen -t ed25519 -f deploy/leonote_deploy_key -N ""
cat deploy/leonote_deploy_key.pub \
  | ssh root@YOUR_VPS "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

The second command asks for the current VPS password once. The private/public deploy-key files are ignored by Git.

The initial production database is enforced as single-user:

- `SEED_USERNAME` and `SEED_PASSWORD` create the first user.
- `SEED_ENFORCE_SINGLE_USER=true` blocks backend startup if another user exists.
- `ALLOW_REGISTRATION=false` disables the public registration endpoint.
- Existing seed-user passwords are not silently reset; keep the local deploy password aligned if the user changes it.

## DNS

Create an `A` record for the deployment domain pointing to the VPS public IPv4 address. The script installs the HTTP virtual host regardless, but only requests a Let's Encrypt certificate when DNS resolves to the configured VPS and `LETSENCRYPT_EMAIL` is set.

## Deploy

Run from Git Bash, WSL or another Bash environment:

```bash
./deploy.sh
```

The script:

1. Asks whether to rebuild the frontend and backend images.
2. Builds the frontend locally as a validation gate when frontend rebuild is enabled.
3. Packages source while excluding Git, local environments, caches and build output.
4. Checks remote container names and the selected loopback port for conflicts.
5. Uploads and starts the Docker Compose project as `leonote`, rebuilding only selected images.
6. Runs migrations before the backend starts.
7. Configures and reloads host Nginx.
8. Requests/renews SSL when DNS and Certbot are ready. If `LETSENCRYPT_EMAIL` is blank, Certbot runs without registering an email.
9. Verifies health, exactly one database user and seed-user login.

No Git commit or push is performed by `deploy.sh`.

## Backups

Source snapshots are stored under `/opt/leonote/backups` before replacement. PostgreSQL data uses the `leonote_postgres_data` Docker volume.

Run a database backup:

```bash
cd /opt/leonote/deploy
docker compose -p leonote --env-file .env.production exec postgres \
  sh /backups/backup-postgres.sh
```

Copy database backups to external storage; a Docker volume on the same VPS is not a complete disaster-recovery strategy.
