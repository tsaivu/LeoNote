# VPS Docker Deployment Implementation Phase

## 1. MỤC TIÊU CUỐI CÙNG CỦA PHASE NÀY

Tạo quy trình deploy từ local lên VPS Ubuntu 22.04 bằng một lệnh `deploy.sh`, không thực hiện Git push, không xung đột các Docker service hiện có, phục vụ domain `leo.nkplastic.com`, và khởi tạo production database với duy nhất user cấu hình `mrleo`.

## 2. Hiện trạng code sau khi đọc bằng CodeGraph

- Frontend là React/Vite/PWA; backend là FastAPI + SQLAlchemy sync; database là PostgreSQL.
- Repo đã có Dockerfiles, Compose, Nginx gateway và Alembic migration.
- Backend trước đây hardcode seed `admin` trong startup.
- VPS đang dùng host Nginx trên port 80/443.
- Các host port đã dùng: 3456, 3457, 5432 loopback, 6379, 8001, 8020, 8021, 8910, 8911.
- Các Compose project hiện có: `nkp-erp`, `nkp-qc-v2`, `nkplastic-demo`, `nms2026`.
- `leo.nkplastic.com` chưa resolve DNS tại thời điểm khảo sát.
- Kiểm tra sau đó xác nhận DNS `leo.nkplastic.com` đã trỏ về `103.167.89.122`.
- VPS đã có host Nginx, Certbot 1.21.0 và các certificate cho domain khác; chưa có certificate cho `leo.nkplastic.com`.

## 3. Route/page/component/hook/service/repository/API liên quan

- Backend startup/config: `backend/app/main.py`, `backend/app/core/config.py`
- Production seed: `backend/app/seed.py`
- Initial schema SQL: `docs/sql/personal-notes-postgresql-schema.sql`
- Registration boundary: `backend/app/modules/auth/router.py`
- Docker: `deploy/docker-compose.yml`, `deploy/docker/*.Dockerfile`
- Container Nginx: `deploy/nginx/nginx.conf`, `deploy/nginx/web-static.conf`
- Local deployment runner: `deploy.sh`
- API contracts và frontend data layers không thay đổi.

## 4. Phạm vi thay đổi

- Bind Docker gateway vào loopback port cấu hình, mặc định local config dùng port trống 9120.
- Không publish PostgreSQL hoặc backend ra host.
- Tạo host Nginx vhost và tùy điều kiện chạy Certbot.
- `deploy.sh` hỏi có rebuild frontend/backend image hay không.
- Certbot được chạy với `--cert-name` đúng domain để tránh dùng nhầm certificate domain khác.
- Nếu không cấu hình `LETSENCRYPT_EMAIL`, Certbot chạy bằng `--register-unsafely-without-email`.
- Chuyển seed hardcode sang environment.
- Production enforce đúng một user và tắt registration.
- Đóng gói/upload/build/migrate/health-check bằng `deploy.sh`.
- Không push Git trong deploy script.

## 5. Danh sách file dự kiến sửa

- `.gitignore`
- `deploy.sh`
- `deploy/deploy.local.env.example`
- `deploy/.env.production.example`
- `deploy/docker-compose.yml`
- `deploy/nginx/web-static.conf`
- `deploy/README.md`
- `backend/app/core/config.py`
- `backend/app/main.py`
- `backend/app/seed.py`
- `backend/app/modules/auth/router.py`
- `backend/tests/conftest.py`
- `backend/.env.example`
- `backend/.env.development.example`
- `docs/deploy-vps/implement-phase-.md`

## 6. Rủi ro

- DNS chưa trỏ đúng sẽ khiến Certbot bị bỏ qua và PWA chưa có HTTPS public.
- Production seed sẽ cố ý làm backend fail nếu database có user khác, tránh âm thầm xóa dữ liệu.
- Password seed nằm trong file local và remote `.env.production`; cả hai phải có quyền truy cập hạn chế và không được commit.
- `deploy.sh` hỗ trợ password prompt mặc định; SSH public-key chỉ là lựa chọn optional.
- Backup source không thay thế database backup ngoài VPS.
- Host Nginx config có thể bị ảnh hưởng nếu administrator sửa cùng file ngoài script.
- Backend Docker image phải có `/docs/sql` vì migration đầu tiên đọc schema SQL từ path này.

## 7. Cách test

- Chạy `bash -n deploy.sh`.
- Chạy `git diff --check`.
- Chạy frontend production build.
- Chạy backend integration tests phù hợp.
- Chạy `docker compose config` với file local production env.
- Xác nhận script không có `git add`, `git commit` hoặc `git push`.
- Sau deploy: kiểm tra Docker health, `/health`, user count bằng 1 và login seed trả HTTP 200.

## 8. Checklist checkpoint cuối phase

- [x] Commit phase PWA trước.
- [x] Preflight branch/status/log.
- [x] Đọc script deploy tham khảo.
- [x] CodeGraph discovery startup/seed/Docker.
- [x] Khảo sát read-only VPS container/port/proxy.
- [x] Chọn topology và port không xung đột.
- [x] Implement deploy script và seed production.
- [x] Audit diff.
- [x] Chạy validation/test.
- [ ] Báo cáo checkpoint.
## 9. Deployment issue log

- Backend unhealthy can be caused by startup errors before `/health` is available.
- The deploy script prints Docker diagnostics on remote failure: compose `ps` and recent logs for `postgres`, `backend`, and `nginx`.
- The initial Alembic migration reads `/docs/sql/personal-notes-postgresql-schema.sql`; the backend Docker image copies `docs/sql` to `/docs/sql`.
- Bcrypt rejects passwords longer than 72 bytes. The deploy script validates `SEED_PASSWORD` length locally and remotely before Docker startup and prints only the byte count, not the secret value.
- Backend dependency versions are pinned to `passlib==1.7.4` and `bcrypt==4.0.1` because floating `bcrypt` can install 5.x, which breaks Passlib's bcrypt backend self-check during startup.
