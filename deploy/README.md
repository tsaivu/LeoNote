# LeoNote Production Deploy

Production baseline uses Docker Compose with:

- `postgres`: PostgreSQL database with persistent volume.
- `backend`: FastAPI app, runs `alembic upgrade head` before Uvicorn.
- `web`: built React/Vite static site.
- `nginx`: public reverse proxy, routes `/api/*` to backend and all other paths to web.

## Setup

1. Copy `deploy/.env.production.example` to `deploy/.env.production`.
2. Set strong values for `POSTGRES_PASSWORD` and `JWT_SECRET_KEY`.
3. Set `CORS_ORIGINS` and `COOKIE_DOMAIN` to the production domain.
4. Build and start:

```bash
cd deploy
docker compose --env-file .env.production up -d --build
```

## Health Check

```bash
curl http://localhost/health
```

## Backup

Run inside the Postgres container context:

```bash
cd deploy
docker compose --env-file .env.production exec postgres sh /backups/backup-postgres.sh
```

If the script is not mounted into the container, run it from a one-off Postgres image:

```bash
cd deploy
docker run --rm --network deploy_default \
  --env-file .env.production \
  -e POSTGRES_HOST=postgres \
  -v "$(pwd)/backups:/backups" \
  -v "$(pwd)/scripts/backup-postgres.sh:/backup-postgres.sh:ro" \
  postgres:16-alpine sh /backup-postgres.sh
```

Keep backup files outside the application containers and copy them to external storage when running production.

## Restore

Restore only into an empty or explicitly prepared database:

```bash
gunzip -c backups/personal_notes_YYYYMMDDTHHMMSSZ.sql.gz \
  | docker compose --env-file .env.production exec -T postgres \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```
