# Technical Design v1 — Sổ ghi chú cá nhân

## 1. Thông tin tài liệu

**Tên dự án:** Sổ ghi chú cá nhân
**Loại sản phẩm:** Web app ghi chú cá nhân hướng công việc
**Phiên bản tài liệu:** Technical Design v1
**Phạm vi:** MVP
**Frontend:** React + Vite + TypeScript
**Backend:** FastAPI + SQLAlchemy sync
**Database:** PostgreSQL
**Development runtime:** Chạy trực tiếp trên local để hỗ trợ reload/HMR
**Production runtime:** Docker/Docker Compose
**Deployment đề xuất:** Ubuntu server cá nhân

---

## 2. Mục tiêu kỹ thuật

Technical Design này mô tả kiến trúc kỹ thuật cho MVP của dự án **Sổ ghi chú cá nhân**.

Mục tiêu kỹ thuật:

* Tạo nền tảng backend/frontend rõ ràng, dễ mở rộng.
* Đảm bảo dữ liệu người dùng được cô lập theo user.
* Hỗ trợ note có deadline, trạng thái, priority, folder, tag, assignee chính và sub-task.
* Hỗ trợ sub-task có assignee riêng.
* Hỗ trợ folder dạng cây.
* Hỗ trợ search/filter nâng cao.
* Hỗ trợ soft delete và Trash page.
* Hỗ trợ responsive UI cho desktop/mobile.
* Không hardcode cấu hình môi trường trong source code.
* Development chạy trực tiếp để có reload/HMR.
* Production deploy bằng Docker/Docker Compose.
* Không đưa notification, offline, PWA, realtime collaboration, AI vào MVP.

---

## 3. Phạm vi kỹ thuật MVP

### 3.1. Có trong MVP

MVP triển khai các nhóm chức năng sau:

1. Authentication.
2. User context.
3. Note CRUD.
4. Sub-task CRUD.
5. Assignee management.
6. Folder tree management.
7. Tag management.
8. Search/filter notes.
9. Dashboard/quick filters.
10. Trash page.
11. Responsive frontend.
12. Local development runtime.
13. Docker production deployment baseline.

### 3.2. Không có trong MVP

MVP không triển khai:

* Notification.
* Push reminder.
* Email reminder.
* Người được giao việc đăng nhập để xác nhận.
* Collaboration workflow.
* Realtime editing.
* Offline mode.
* PWA.
* AI.
* Voice-to-text.
* File/ảnh đính kèm.
* Version history.
* Audit history chi tiết.
* Role-based permission phức tạp.
* Hard delete từ UI.

---

## 4. Quyết định kỹ thuật đã chốt

### 4.1. Frontend

* Dùng **React + Vite + TypeScript**.
* Thiết kế frontend theo lớp:

  * Page
  * Component
  * Hook/ViewModel
  * Service
  * Repository/API
* Desktop layout ban đầu:

  * Folder/filter sidebar
  * Note list
  * Note detail/editor
* Mobile layout:

  * List view
  * Detail/edit view
  * Back navigation
* Giai đoạn development chạy Vite dev server trực tiếp để có HMR.

### 4.2. Backend

* Dùng **FastAPI**.
* Dùng **SQLAlchemy sync**, không dùng SQLAlchemy async ở MVP.
* Thiết kế backend theo lớp:

  * Router
  * Schema
  * Service
  * Repository
  * Model
* Note create/update phải dùng atomic transaction.
* Sub-task hỗ trợ cả:

  * Save cùng note payload.
  * Endpoint riêng để update nhanh.
* Giai đoạn development chạy Uvicorn trực tiếp với reload.

### 4.3. Database

* Dùng **PostgreSQL**.
* Dùng UUID làm primary key.
* Dùng `TIMESTAMPTZ` cho datetime.
* Deadline lưu chuẩn datetime, hiển thị theo giờ Việt Nam.
* Search MVP dùng `search_text` đã normalize không dấu.
* Chưa dùng PostgreSQL full-text search ở phase 1.

### 4.4. Auth

* Dùng JWT access token + refresh token.
* Ưu tiên HTTP-only cookie nếu deployment thuận lợi.
* Refresh token được lưu DB để hỗ trợ revoke/logout.
* MVP chưa cần role/permission phức tạp.

### 4.5. Environment/runtime

* Không hardcode `.env`, domain, local IP, database URL, JWT secret, API base URL trong source code.
* Development dùng `.env.development` hoặc environment variables.
* Local mobile test dùng local IP của máy dev.
* Local development chạy trực tiếp, không dùng Docker bắt buộc.
* Production deploy bằng Docker/Docker Compose.

### 4.6. Business rules

* Folder là primary organization.
* Tag là secondary organization.
* Folder dạng cây nhiều cấp.
* Xóa folder có note active: tự chuyển note về Inbox.
* Xóa folder có folder con active: block trong MVP.
* Assignee đang được dùng: không xóa, chỉ deactivate.
* Tag đang được dùng: remove khỏi note rồi soft delete tag.
* Note status không tự động đổi theo sub-task.
* Note và sub-task có `completed_at`.
* Không có audit/version history ở MVP.
* Trash page chỉ restore note, không hard delete.

---

## 5. Kiến trúc tổng thể

### 5.1. Sơ đồ tổng quan

```text
React Vite TypeScript Frontend
        |
        | REST API over HTTP/HTTPS
        v
FastAPI Backend
        |
        | SQLAlchemy sync
        v
PostgreSQL
```

### 5.2. Development runtime

```text
Browser / Mobile Browser
        |
        | http://LOCAL_IP:5173
        v
Vite Dev Server with HMR
        |
        | VITE_API_BASE_URL=http://LOCAL_IP:8000/api
        v
FastAPI Uvicorn with --reload
        |
        v
Local PostgreSQL
```

Development ưu tiên tốc độ sửa code:

* Frontend reload/HMR nhanh.
* Backend auto reload.
* Debug trực tiếp trên terminal.
* Không bắt buộc Docker trong quá trình code local.

### 5.3. Production runtime

```text
User Browser
    |
    | HTTPS
    v
Nginx
    |
    | /api/*
    v
FastAPI Docker container
    |
    v
PostgreSQL Docker container or PostgreSQL service

Nginx serves built React frontend
```

Production ưu tiên:

* Ổn định.
* Dễ restart.
* Dễ backup.
* Dễ migrate server.
* Cấu hình tách khỏi source code.
* Docker/Docker Compose quản lý service.

---

## 6. Backend architecture

### 6.1. Cấu trúc backend đề xuất

```text
backend/
  app/
    core/
      config.py
      database.py
      security.py
      timezone.py
      errors.py

    modules/
      auth/
        models.py
        schemas.py
        repositories.py
        services.py
        routers.py

      users/
        models.py
        schemas.py
        repositories.py
        services.py
        routers.py

      assignees/
        models.py
        schemas.py
        repositories.py
        services.py
        routers.py

      folders/
        models.py
        schemas.py
        repositories.py
        services.py
        routers.py

      tags/
        models.py
        schemas.py
        repositories.py
        services.py
        routers.py

      notes/
        models.py
        schemas.py
        repositories.py
        services.py
        routers.py

      subtasks/
        schemas.py
        repositories.py
        services.py
        routers.py

      dashboard/
        schemas.py
        services.py
        routers.py

      search/
        normalize.py

    main.py
```

### 6.2. Layer responsibilities

#### Router

Router chịu trách nhiệm:

* Định nghĩa endpoint.
* Nhận request.
* Inject current user.
* Gọi service.
* Trả response.

Router không xử lý business logic phức tạp.

#### Schema

Schema chịu trách nhiệm:

* Validate request bằng Pydantic.
* Chuẩn hóa response DTO.
* Không chứa database query.

#### Service

Service chịu trách nhiệm:

* Business logic.
* Transaction boundary.
* Validation nghiệp vụ.
* Gọi repository.
* Quyết định soft delete, restore, deactivate.

#### Repository

Repository chịu trách nhiệm:

* Query database.
* Insert/update/delete model.
* Không quyết định nghiệp vụ.

#### Model

Model chịu trách nhiệm:

* SQLAlchemy ORM mapping.
* Relationship.
* Index.
* Constraint.

---

## 7. SQLAlchemy sync decision

MVP dùng SQLAlchemy sync.

### 7.1. Lý do

Ứng dụng này là CRUD-heavy app với nhiều quan hệ:

* Note.
* Sub-task.
* Assignee.
* Folder tree.
* Tag many-to-many.
* Trash/soft delete.
* Search/filter.

SQLAlchemy sync phù hợp vì:

* Dễ viết.
* Dễ debug.
* Dễ test.
* Transaction rõ ràng.
* Ít lỗi lazy-loading hơn async.
* Phù hợp với MVP cá nhân.
* Dễ để AI coding agent hoặc developer khác tiếp tục.

### 7.2. Vì sao chưa dùng async ở MVP

SQLAlchemy async có lợi khi hệ thống có nhiều I/O đồng thời, realtime, polling hoặc external API. Tuy nhiên với MVP này, lợi ích chưa đủ lớn so với độ phức tạp tăng thêm.

Rủi ro khi dùng async quá sớm:

* Code dài hơn.
* Transaction khó debug hơn.
* Relationship/lazy loading dễ lỗi hơn.
* Test phức tạp hơn.
* Nếu viết không chuẩn, async không nhanh hơn sync.

### 7.3. Khi nào cần async sau này

Có thể cân nhắc async hoặc worker riêng sau này nếu có:

* Realtime collaboration.
* Notification fan-out.
* WebSocket.
* External API polling.
* Lượng request đồng thời rất lớn.
* Background sync/offline.

MVP không cần trả giá độ phức tạp này.

---

## 8. Frontend architecture

### 8.1. Cấu trúc frontend đề xuất

```text
web/
  src/
    app/
      App.tsx
      router.tsx

    shared/
      api/
        apiClient.ts
      components/
        Button.tsx
        Modal.tsx
        Select.tsx
        DateTimeInput.tsx
        ConfirmDialog.tsx
      utils/
        datetime.ts
        textNormalize.ts
      types/
        common.ts

    modules/
      auth/
        api/
          authApi.ts
        repositories/
          authRepository.ts
        services/
          authService.ts
        hooks/
          useAuth.ts
        pages/
          LoginPage.tsx

      personal-notes/
        api/
          noteApi.ts
          assigneeApi.ts
          folderApi.ts
          tagApi.ts
          dashboardApi.ts

        repositories/
          noteRepository.ts
          assigneeRepository.ts
          folderRepository.ts
          tagRepository.ts
          dashboardRepository.ts

        services/
          noteService.ts
          assigneeService.ts
          folderService.ts
          tagService.ts
          dashboardService.ts

        hooks/
          useNotes.ts
          useNoteDetail.ts
          useNoteEditor.ts
          useAssignees.ts
          useFolders.ts
          useTags.ts
          useDashboardSummary.ts

        pages/
          NotesWorkspacePage.tsx
          AssigneeManagementPage.tsx
          FolderManagementPage.tsx
          TagManagementPage.tsx
          TrashPage.tsx

        components/
          NotesSidebar.tsx
          QuickFilters.tsx
          FolderTree.tsx
          TagFilterList.tsx
          NoteList.tsx
          NoteListItem.tsx
          NoteDetailPanel.tsx
          NoteEditor.tsx
          SubTaskEditor.tsx
          AssigneeSelect.tsx
          FolderSelect.tsx
          TagPicker.tsx
          PrioritySelect.tsx
          StatusSelect.tsx
          DeadlineInput.tsx
          TrashNoteList.tsx

        types/
          noteTypes.ts
          assigneeTypes.ts
          folderTypes.ts
          tagTypes.ts
          dashboardTypes.ts
```

### 8.2. Frontend layer responsibilities

#### Page

* Route-level screen.
* Compose hooks and components.
* Không gọi API trực tiếp.

#### Component

* UI rendering.
* Nhận props.
* Không chứa business logic lớn.

#### Hook/ViewModel

* Quản lý state.
* Gọi service.
* Chuẩn bị data cho component.
* Quản lý loading/error.

#### Service

* Business transformation phía frontend.
* Validate nhẹ trước khi gửi API.
* Format datetime display.
* Map API data sang UI model nếu cần.

#### Repository/API

* Gọi HTTP client.
* Không xử lý UI.
* Không chứa business rules.

---

## 9. Environment & runtime rules

### 9.1. Không hardcode cấu hình

Toàn bộ cấu hình runtime phải lấy từ `.env` hoặc environment variables.

Không hardcode trong source code các giá trị sau:

* Database URL.
* API base URL.
* JWT secret.
* CORS origins.
* Cookie domain.
* Server host/port.
* Local IP.
* Public domain.
* Timezone config.
* Deployment mode.

Ví dụ không được hardcode:

```ts
const API_BASE_URL = "http://192.168.1.10:8000/api";
```

Đúng:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

Backend cũng tương tự:

```py
DATABASE_URL = settings.DATABASE_URL
JWT_SECRET_KEY = settings.JWT_SECRET_KEY
```

### 9.2. Environment files policy

Các file `.env` thật không được commit.

Nên commit file mẫu:

```text
.env.example
.env.development.example
.env.production.example
```

Không commit:

```text
.env
.env.local
.env.development
.env.production
```

`.gitignore` cần có:

```gitignore
.env
.env.*
!.env.example
!.env.development.example
!.env.production.example
```

### 9.3. Development environment

Giai đoạn phát triển chạy local trực tiếp, không bắt buộc Docker.

Mục tiêu:

* Backend chạy trực tiếp bằng FastAPI/Uvicorn.
* Frontend chạy trực tiếp bằng Vite dev server.
* Hỗ trợ reload/HMR nhanh.
* Dễ debug.
* Dễ xem log.
* Dễ sửa code liên tục.

Ví dụ local dev:

```bash
# Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
npm run dev -- --host 0.0.0.0
```

Frontend `.env.development`:

```env
VITE_API_BASE_URL=http://LOCAL_IP:8000/api
```

Backend `.env.development`:

```env
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
APP_TIMEZONE=Asia/Ho_Chi_Minh

DATABASE_URL=postgresql://user:password@localhost:5432/personal_notes_dev
JWT_SECRET_KEY=change-me-dev
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

CORS_ORIGINS=http://localhost:5173,http://LOCAL_IP:5173
COOKIE_SECURE=false
```

`LOCAL_IP` là IP LAN của máy dev, ví dụ `192.168.x.x`, để test từ điện thoại trong cùng mạng nội bộ.

### 9.4. Local mobile testing

Khi test mobile trên local:

* Frontend Vite chạy với `--host 0.0.0.0`.
* Backend FastAPI chạy với `--host 0.0.0.0`.
* Điện thoại truy cập frontend bằng local IP của máy dev.
* API base URL dùng local IP, không dùng `localhost`.

Ví dụ:

```env
VITE_API_BASE_URL=http://192.168.1.20:8000/api
```

Lưu ý:

* Trên điện thoại, `localhost` là chính điện thoại, không phải máy dev.
* Cần mở firewall cho port frontend/backend nếu Windows chặn.
* CORS backend phải cho phép origin local IP của frontend.

### 9.5. Production deployment

Khi deploy production, dùng Docker/Docker Compose.

Mục tiêu:

* Runtime ổn định.
* Dễ backup.
* Dễ restart.
* Dễ migrate server.
* Không phụ thuộc môi trường máy dev.
* Cấu hình tách khỏi source code.

Production dùng:

* Nginx reverse proxy.
* Frontend build static.
* Backend FastAPI container.
* PostgreSQL container hoặc PostgreSQL service.
* Docker Compose để quản lý service.

Production `.env.production`:

```env
APP_ENV=production
APP_TIMEZONE=Asia/Ho_Chi_Minh

DATABASE_URL=postgresql://user:strong-password@db:5432/personal_notes
JWT_SECRET_KEY=strong-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

CORS_ORIGINS=https://notes.example.com
COOKIE_SECURE=true
COOKIE_DOMAIN=notes.example.com
```

Frontend production:

```env
VITE_API_BASE_URL=https://notes.example.com/api
```

### 9.6. Runtime mode summary

| Môi trường        | Cách chạy                   | Mục tiêu                      |
| ----------------- | --------------------------- | ----------------------------- |
| Local development | Chạy trực tiếp              | Reload/HMR, debug nhanh       |
| Local mobile test | Chạy trực tiếp với local IP | Test trên điện thoại cùng LAN |
| Production        | Docker/Docker Compose       | Ổn định, dễ vận hành          |

---

## 10. Database design

### 10.1. Nguyên tắc chung

* Tất cả bảng nghiệp vụ có `user_id` để cô lập dữ liệu.
* Dùng UUID cho ID.
* Dùng `created_at`, `updated_at`, `deleted_at`.
* Không hard delete từ UI.
* Query mặc định loại bỏ `deleted_at IS NOT NULL`.
* Dùng `TIMESTAMPTZ`.
* Deadline hiển thị theo giờ Việt Nam.

---

## 10.2. Table: users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);
```

Notes:

* `timezone` mặc định là `Asia/Ho_Chi_Minh`.
* MVP chưa cần multi-role.

---

## 10.3. Table: refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

Notes:

* Không lưu raw refresh token.
* Chỉ lưu hash.
* Logout thì set `revoked_at`.

---

## 10.4. Table: assignees

```sql
CREATE TABLE assignees (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    phone TEXT NULL,
    email TEXT NULL,
    note TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_assignees_user_id ON assignees(user_id);
CREATE INDEX idx_assignees_user_active ON assignees(user_id, is_active);
```

Unique constraint đề xuất:

```sql
CREATE UNIQUE INDEX uq_assignees_user_name_active
ON assignees(user_id, lower(name))
WHERE deleted_at IS NULL;
```

Business rule:

* Nếu assignee chưa được dùng: có thể soft delete.
* Nếu assignee đang được dùng: deactivate bằng `is_active = FALSE`.
* Assignee inactive vẫn hiển thị trong note cũ.
* Assignee inactive không hiện trong dropdown tạo mới.
* Có thể active lại.

---

## 10.5. Table: folders

```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID NULL REFERENCES folders(id),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
```

Unique constraint đề xuất:

```sql
CREATE UNIQUE INDEX uq_folders_user_parent_name_active
ON folders(user_id, parent_id, lower(name))
WHERE deleted_at IS NULL;
```

Business rule:

* Mỗi user có folder hệ thống `Inbox`.
* Không cho xóa folder `Inbox`.
* Xóa folder có note active: chuyển note về `Inbox`.
* Xóa folder có folder con active: block trong MVP.
* Không cho tạo vòng lặp parent-child.

---

## 10.6. Table: tags

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
```

Unique constraint:

```sql
CREATE UNIQUE INDEX uq_tags_user_slug_active
ON tags(user_id, slug)
WHERE deleted_at IS NULL;
```

Business rule:

* Tag có màn quản lý riêng.
* Tag có thể tạo nhanh khi tạo/sửa note.
* Xóa tag đang được dùng:

  * Remove khỏi `note_tags`.
  * Soft delete tag.

---

## 10.7. Table: notes

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    folder_id UUID NOT NULL REFERENCES folders(id),
    main_assignee_id UUID NOT NULL REFERENCES assignees(id),

    title TEXT NOT NULL,
    content TEXT NULL,

    status TEXT NOT NULL,
    priority TEXT NOT NULL,

    deadline_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NULL,

    search_text TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT chk_notes_status
      CHECK (status IN ('TODO', 'DOING', 'PENDING', 'DONE')),

    CONSTRAINT chk_notes_priority
      CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);
```

Indexes:

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_user_status ON notes(user_id, status);
CREATE INDEX idx_notes_user_priority ON notes(user_id, priority);
CREATE INDEX idx_notes_user_deadline ON notes(user_id, deadline_at);
CREATE INDEX idx_notes_user_folder ON notes(user_id, folder_id);
CREATE INDEX idx_notes_user_assignee ON notes(user_id, main_assignee_id);
CREATE INDEX idx_notes_user_deleted ON notes(user_id, deleted_at);
CREATE INDEX idx_notes_search_text ON notes(user_id, search_text);
```

Business rule:

* Note bắt buộc có title.
* Note bắt buộc có deadline.
* Note bắt buộc có status.
* Note bắt buộc có priority.
* Note bắt buộc có main assignee.
* Note bắt buộc thuộc một folder.
* Nếu không chọn folder thì dùng `Inbox`.
* Note status không tự động đổi theo sub-task.
* Nếu note chuyển sang `DONE`, set `completed_at`.
* Nếu note chuyển khỏi `DONE`, clear `completed_at`.

---

## 10.8. Table: note_tags

```sql
CREATE TABLE note_tags (
    note_id UUID NOT NULL REFERENCES notes(id),
    tag_id UUID NOT NULL REFERENCES tags(id),
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);
```

Business rule:

* Một note có nhiều tag.
* Một tag thuộc nhiều note.
* Khi xóa note, không cần xóa note_tags ngay nếu dùng soft delete note.
* Khi xóa tag, remove note_tags liên quan rồi soft delete tag.

---

## 10.9. Table: subtasks

```sql
CREATE TABLE subtasks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    note_id UUID NOT NULL REFERENCES notes(id),
    assignee_id UUID NOT NULL REFERENCES assignees(id),

    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TODO',
    sort_order INTEGER NOT NULL DEFAULT 0,

    completed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT chk_subtasks_status
      CHECK (status IN ('TODO', 'DONE'))
);
```

Indexes:

```sql
CREATE INDEX idx_subtasks_user_id ON subtasks(user_id);
CREATE INDEX idx_subtasks_note_id ON subtasks(note_id);
CREATE INDEX idx_subtasks_user_note ON subtasks(user_id, note_id);
CREATE INDEX idx_subtasks_user_assignee ON subtasks(user_id, assignee_id);
CREATE INDEX idx_subtasks_user_status ON subtasks(user_id, status);
CREATE INDEX idx_subtasks_user_deleted ON subtasks(user_id, deleted_at);
```

Business rule:

* Sub-task bắt buộc có title.
* Sub-task bắt buộc có assignee.
* Sub-task thuộc một note.
* Sub-task status chỉ gồm `TODO` và `DONE`.
* Nếu sub-task chuyển sang `DONE`, set `completed_at`.
* Nếu sub-task chuyển khỏi `DONE`, clear `completed_at`.

---

## 11. Datetime và timezone

### 11.1. UI format

UI hiển thị deadline theo format:

```text
dd/mm/yyyy hh:mm
```

Ví dụ:

```text
02/06/2026 14:30
```

### 11.2. API format

API nhận/trả datetime theo ISO 8601 có timezone:

```text
2026-06-02T14:30:00+07:00
```

### 11.3. Database format

Database dùng `TIMESTAMPTZ`.

### 11.4. Quy tắc timezone

* Timezone mặc định: `Asia/Ho_Chi_Minh`.
* Frontend nhập theo giờ Việt Nam.
* Frontend gửi ISO datetime có timezone `+07:00`.
* Backend validate datetime.
* Backend lưu `TIMESTAMPTZ`.
* Backend trả datetime có timezone.
* Frontend hiển thị lại theo `dd/mm/yyyy hh:mm`.

---

## 12. Search design

### 12.1. Mục tiêu search MVP

MVP cần tìm/lọc theo:

* Title.
* Content.
* Folder.
* Tag.
* Status.
* Priority.
* Deadline.
* Main assignee.
* Sub-task assignee.
* Quick filter.

### 12.2. Search text normalized

Phase 1 dùng `search_text` normalized.

Ví dụ note:

```text
Title: Kiểm tra tiến độ đơn hàng Nhật
Content: Cần rà lại các đơn còn deadline tuần này
Assignee: Nguyễn Văn A
Tags: nhật, đơn hàng
```

`search_text` có thể lưu:

```text
kiem tra tien do don hang nhat can ra lai cac don con deadline tuan nay nguyen van a nhat don hang
```

Search query cũng normalize tương tự.

### 12.3. Vì sao chưa dùng full-text search ở MVP

Chưa dùng PostgreSQL `tsvector` ở phase 1 vì:

* MVP cần triển khai nhanh.
* Dữ liệu ban đầu chưa lớn.
* Normalize text + `ILIKE` đủ dùng.
* Dễ debug hơn.

Có thể nâng cấp sau:

* `search_vector`.
* GIN index.
* Ranking kết quả.
* Fuzzy search.

### 12.4. Filter quick

Quick filter hỗ trợ:

```text
today
overdue
doing
pending
done
high_priority
critical
```

Định nghĩa:

* `today`: `deadline_at` nằm trong ngày hiện tại theo giờ Việt Nam.
* `overdue`: `deadline_at < now` và status chưa DONE.
* `doing`: status = DOING.
* `pending`: status = PENDING.
* `done`: status = DONE.
* `high_priority`: priority = HIGH.
* `critical`: priority = CRITICAL.

---

## 13. API design

### 13.1. API conventions

Base path:

```text
/api
```

Response lỗi chuẩn:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": {}
  }
}
```

Pagination response:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100
}
```

---

## 13.2. Auth API

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### POST /api/auth/login

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Anh Tú",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "access_token": "jwt-if-not-cookie-mode",
  "expires_in": 3600
}
```

Nếu dùng HTTP-only cookie, refresh token không trả trong JSON.

---

## 13.3. Notes API

```text
GET    /api/notes
POST   /api/notes
GET    /api/notes/{note_id}
PUT    /api/notes/{note_id}
DELETE /api/notes/{note_id}
POST   /api/notes/{note_id}/restore
```

### GET /api/notes query params

```text
q
folder_id
tag_ids
status
priority
main_assignee_id
subtask_assignee_id
deadline_from
deadline_to
quick_filter
include_deleted
page
page_size
sort
```

### POST /api/notes request

```json
{
  "title": "Kiểm tra tiến độ đơn hàng Nhật",
  "content": "Cần rà lại các đơn còn deadline tuần này.",
  "folder_id": "uuid-folder",
  "main_assignee_id": "uuid-assignee-main",
  "status": "TODO",
  "priority": "HIGH",
  "deadline_at": "2026-06-02T14:30:00+07:00",
  "tag_ids": ["uuid-tag-1", "uuid-tag-2"],
  "subtasks": [
    {
      "title": "Kiểm tra lịch cắt",
      "assignee_id": "uuid-assignee-1",
      "status": "TODO",
      "sort_order": 1
    },
    {
      "title": "Kiểm tra lịch thổi",
      "assignee_id": "uuid-assignee-2",
      "status": "TODO",
      "sort_order": 2
    }
  ]
}
```

### PUT /api/notes/{note_id} request

```json
{
  "title": "Kiểm tra tiến độ đơn hàng Nhật",
  "content": "Cập nhật lại nội dung.",
  "folder_id": "uuid-folder",
  "main_assignee_id": "uuid-assignee-main",
  "status": "DOING",
  "priority": "HIGH",
  "deadline_at": "2026-06-02T16:00:00+07:00",
  "tag_ids": ["uuid-tag-1"],
  "subtasks": [
    {
      "id": "uuid-subtask-existing",
      "title": "Kiểm tra lịch cắt",
      "assignee_id": "uuid-assignee-1",
      "status": "DONE",
      "sort_order": 1
    },
    {
      "title": "Sub-task mới",
      "assignee_id": "uuid-assignee-2",
      "status": "TODO",
      "sort_order": 2
    }
  ]
}
```

PUT note behavior:

* Sub-task có `id`: update.
* Sub-task không có `id`: create.
* Sub-task cũ không còn trong payload: soft delete.
* Toàn bộ thao tác chạy trong một transaction.
* Nếu bất kỳ phần nào lỗi, rollback toàn bộ.

### Note response

```json
{
  "id": "uuid-note",
  "title": "Kiểm tra tiến độ đơn hàng Nhật",
  "content": "Cần rà lại các đơn còn deadline tuần này.",
  "folder": {
    "id": "uuid-folder",
    "name": "Sản xuất"
  },
  "main_assignee": {
    "id": "uuid-assignee-main",
    "name": "Tổ trưởng sản xuất",
    "is_active": true
  },
  "status": "TODO",
  "priority": "HIGH",
  "deadline_at": "2026-06-02T14:30:00+07:00",
  "deadline_display": "02/06/2026 14:30",
  "completed_at": null,
  "tags": [
    {
      "id": "uuid-tag-1",
      "name": "Nhật",
      "slug": "nhat"
    }
  ],
  "subtasks": [
    {
      "id": "uuid-subtask-1",
      "title": "Kiểm tra lịch cắt",
      "assignee": {
        "id": "uuid-assignee-1",
        "name": "Tổ cắt",
        "is_active": true
      },
      "status": "TODO",
      "sort_order": 1,
      "completed_at": null
    }
  ],
  "created_at": "2026-06-02T09:00:00+07:00",
  "updated_at": "2026-06-02T09:00:00+07:00",
  "deleted_at": null
}
```

---

## 13.4. Sub-task API

Endpoint riêng cho sub-task dùng cho update nhanh.

```text
POST   /api/notes/{note_id}/subtasks
PATCH  /api/subtasks/{subtask_id}
DELETE /api/subtasks/{subtask_id}
POST   /api/subtasks/{subtask_id}/restore
```

### POST /api/notes/{note_id}/subtasks

```json
{
  "title": "Kiểm tra tồn kho",
  "assignee_id": "uuid-assignee",
  "status": "TODO",
  "sort_order": 3
}
```

### PATCH /api/subtasks/{subtask_id}

```json
{
  "title": "Kiểm tra tồn kho thành phẩm",
  "assignee_id": "uuid-assignee",
  "status": "DONE",
  "sort_order": 3
}
```

PATCH behavior:

* Cho phép cập nhật từng phần.
* Nếu status chuyển sang `DONE`, set `completed_at`.
* Nếu status chuyển khỏi `DONE`, clear `completed_at`.

---

## 13.5. Assignee API

```text
GET    /api/assignees
POST   /api/assignees
PUT    /api/assignees/{assignee_id}
POST   /api/assignees/{assignee_id}/deactivate
POST   /api/assignees/{assignee_id}/activate
DELETE /api/assignees/{assignee_id}
```

Business behavior:

* `DELETE` chỉ soft delete nếu assignee chưa được dùng.
* Nếu assignee đang được dùng, API trả lỗi hoặc hướng dẫn dùng deactivate.
* UI nên dùng deactivate là hành vi mặc định.

### POST /api/assignees

```json
{
  "name": "Nguyễn Văn A",
  "phone": "0900000000",
  "email": "a@example.com",
  "note": "Tổ trưởng"
}
```

---

## 13.6. Folder API

```text
GET    /api/folders/tree
POST   /api/folders
PUT    /api/folders/{folder_id}
DELETE /api/folders/{folder_id}
POST   /api/folders/{folder_id}/restore
```

Delete folder behavior:

* Không cho xóa Inbox.
* Nếu folder có folder con active: block.
* Nếu folder có note active: chuyển note về Inbox rồi soft delete folder.
* Nếu folder không có note active: soft delete folder.

---

## 13.7. Tag API

```text
GET    /api/tags
POST   /api/tags
PUT    /api/tags/{tag_id}
DELETE /api/tags/{tag_id}
POST   /api/tags/{tag_id}/restore
```

Delete tag behavior:

* Remove tag khỏi `note_tags`.
* Soft delete tag.
* Note không bị xóa.

---

## 13.8. Dashboard API

```text
GET /api/dashboard/summary
```

Response:

```json
{
  "today_count": 5,
  "overdue_count": 2,
  "doing_count": 4,
  "pending_count": 3,
  "done_count": 20,
  "high_priority_count": 6,
  "critical_count": 1
}
```

---

## 13.9. Trash API

Có thể dùng `GET /api/notes?include_deleted=true`, nhưng nên có endpoint rõ hơn cho UI.

```text
GET  /api/trash/notes
POST /api/trash/notes/{note_id}/restore
```

MVP không có hard delete từ UI.

---

## 14. Transaction design

### 14.1. Create note transaction

Khi tạo note:

1. Validate folder thuộc user.
2. Validate main assignee thuộc user và active.
3. Validate tags thuộc user.
4. Validate sub-task assignees thuộc user và active.
5. Create note.
6. Create note_tags.
7. Create subtasks.
8. Update `search_text`.
9. Commit.

Nếu bước nào lỗi: rollback toàn bộ.

### 14.2. Update note transaction

Khi update note:

1. Load note theo `note_id` và `user_id`.
2. Validate note chưa bị xóa.
3. Validate folder.
4. Validate main assignee.
5. Validate tags.
6. Update note fields.
7. Replace note_tags.
8. Upsert subtasks:

   * Existing ID: update.
   * Missing ID: create.
   * Existing DB sub-task absent from payload: soft delete.
9. Update `search_text`.
10. Commit.

Nếu bước nào lỗi: rollback toàn bộ.

### 14.3. Delete folder transaction

Khi xóa folder:

1. Validate folder thuộc user.
2. Validate không phải Inbox.
3. Nếu có folder con active: block.
4. Tìm Inbox của user.
5. Chuyển note active trong folder sang Inbox.
6. Soft delete folder.
7. Commit.

### 14.4. Delete tag transaction

Khi xóa tag:

1. Validate tag thuộc user.
2. Delete rows trong `note_tags`.
3. Soft delete tag.
4. Commit.

---

## 15. Business validation rules

### 15.1. Note validation

* `title` bắt buộc.
* `deadline_at` bắt buộc.
* `status` thuộc `TODO`, `DOING`, `PENDING`, `DONE`.
* `priority` thuộc `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
* `folder_id` phải thuộc user hiện tại.
* `main_assignee_id` phải thuộc user hiện tại.
* Main assignee phải active khi tạo mới hoặc đổi assignee.
* `tag_ids` phải thuộc user hiện tại.
* Sub-task trong payload phải có title và assignee.
* Sub-task assignee phải active khi tạo mới hoặc đổi assignee.

### 15.2. Folder validation

* Folder name bắt buộc.
* Không trùng name trong cùng parent.
* Không được set parent thành chính nó.
* Không được tạo vòng lặp parent-child.
* Không xóa Inbox.
* Không xóa folder còn folder con active.

### 15.3. Assignee validation

* Name bắt buộc.
* Không trùng name trong cùng user.
* Nếu đang được dùng, không hard delete.
* Assignee inactive không dùng cho note/sub-task mới.
* Assignee inactive vẫn hiển thị trong dữ liệu cũ.

### 15.4. Tag validation

* Name bắt buộc.
* Slug tự sinh từ name.
* Không trùng slug trong cùng user.
* Có thể tạo nhanh trong note editor.

---

## 16. Error code design

Các error code đề xuất:

```text
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_UNAUTHORIZED

VALIDATION_ERROR
RESOURCE_NOT_FOUND
RESOURCE_DELETED

NOTE_NOT_FOUND
NOTE_INVALID_STATUS
NOTE_INVALID_PRIORITY

ASSIGNEE_NOT_FOUND
ASSIGNEE_INACTIVE
ASSIGNEE_IN_USE

FOLDER_NOT_FOUND
FOLDER_HAS_ACTIVE_CHILDREN
FOLDER_IS_SYSTEM
FOLDER_INVALID_PARENT
FOLDER_CYCLE_DETECTED

TAG_NOT_FOUND
TAG_DUPLICATED

SUBTASK_NOT_FOUND

CONFLICT_ERROR
INTERNAL_ERROR
```

Ví dụ response:

```json
{
  "error": {
    "code": "FOLDER_HAS_ACTIVE_CHILDREN",
    "message": "Không thể xóa folder vì vẫn còn folder con.",
    "details": {
      "folder_id": "uuid"
    }
  }
}
```

---

## 17. Frontend page map

### 17.1. LoginPage

Route:

```text
/login
```

Chức năng:

* Đăng nhập.
* Hiển thị lỗi đăng nhập.
* Redirect về workspace sau khi login.

### 17.2. NotesWorkspacePage

Route:

```text
/
```

hoặc:

```text
/notes
```

Desktop layout:

```text
[Sidebar: Folder + Quick Filters + Tags] | [Note List] | [Note Detail/Edit]
```

Mobile layout:

```text
Note List -> Note Detail/Edit
```

Chức năng:

* Xem danh sách note.
* Search/filter.
* Quick filters.
* Chọn folder.
* Chọn tag.
* Tạo note.
* Sửa note.
* Xóa note.
* Restore không nằm ở page này mà ở Trash page.

### 17.3. AssigneeManagementPage

Route:

```text
/settings/assignees
```

Chức năng:

* List assignee.
* Create assignee.
* Edit assignee.
* Deactivate assignee.
* Activate assignee.

### 17.4. FolderManagementPage

Route:

```text
/settings/folders
```

Chức năng:

* Hiển thị folder tree.
* Create folder.
* Edit folder.
* Delete folder.
* Không cần drag/drop ở MVP.

### 17.5. TagManagementPage

Route:

```text
/settings/tags
```

Chức năng:

* List tag.
* Create tag.
* Edit tag.
* Delete tag.

### 17.6. TrashPage

Route:

```text
/trash
```

Chức năng:

* List note đã xóa.
* Search đơn giản.
* Restore note.
* Không hard delete ở MVP.

---

## 18. Frontend state management

MVP có thể dùng React hooks và context.

Đề xuất:

* Auth state: React Context.
* Page data: hooks riêng từng module.
* Không cần Redux ở MVP.
* Có thể dùng TanStack Query nếu muốn quản lý cache/loading tốt hơn.

Đề xuất mặc định:

* Dùng **TanStack Query** cho các query/mutation CRUD chính.
* Dùng local component state cho form đang edit.
* Dùng Context cho auth/current user.

TanStack Query phù hợp cho:

* Fetch notes.
* Fetch folder tree.
* Fetch tags.
* Fetch assignees.
* Dashboard summary.
* Invalidate sau create/update/delete.

---

## 19. UI behavior

### 19.1. Note editor

Note editor gồm:

* Title input.
* Content textarea.
* Deadline input.
* Status select.
* Priority select.
* Main assignee select.
* Folder select.
* Tag picker.
* Sub-task editor.
* Save button.
* Delete button.

MVP không auto-save. Người dùng phải bấm Save.

### 19.2. Sub-task editor

Sub-task editor gồm:

* Checkbox/status.
* Title input.
* Assignee select.
* Delete sub-task button.
* Add sub-task button.

### 19.3. Dirty state

Frontend nên có dirty state:

* Nếu người dùng sửa note chưa lưu và chuyển note khác, hỏi xác nhận.
* Nếu bấm refresh hoặc back khi có thay đổi chưa lưu, cảnh báo cơ bản.

### 19.4. Disabled assignee display

Nếu assignee inactive nhưng đang gắn vào note cũ:

* Vẫn hiển thị tên.
* Có badge nhỏ: `Đã ngừng dùng`.
* Không cho chọn assignee này ở note/sub-task mới.

---

## 20. Security design

### 20.1. Authentication

* Password hash bằng bcrypt hoặc argon2.
* Login trả access token.
* Refresh token lưu HTTP-only cookie nếu có thể.
* Refresh token lưu hash trong DB.
* Logout revoke refresh token.

### 20.2. Authorization

Mọi query nghiệp vụ phải filter theo `user_id`.

Không bao giờ chỉ query bằng `id`.

Ví dụ đúng:

```text
WHERE id = :note_id AND user_id = :current_user_id
```

Ví dụ sai:

```text
WHERE id = :note_id
```

### 20.3. CORS/cookie

Nếu frontend và backend cùng domain:

```text
https://notes.example.com
https://notes.example.com/api
```

Cookie dễ xử lý hơn.

Nếu khác domain:

```text
https://app.example.com
https://api.example.com
```

Cần cấu hình CORS, SameSite, Secure cookie cẩn thận.

Đề xuất MVP: deploy cùng domain dưới Nginx.

---

## 21. Deployment design

### 21.1. Local development

Local development không dùng Docker bắt buộc.

Backend:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```bash
cd web
npm run dev -- --host 0.0.0.0
```

Database local:

* Có thể dùng PostgreSQL cài trực tiếp trên máy dev.
* Hoặc dùng PostgreSQL Docker container riêng nếu muốn.
* Nhưng backend/frontend vẫn chạy trực tiếp để giữ reload/HMR.

### 21.2. Production server layout

```text
/opt/personal-notes/
  backend/
  web/
  deploy/
    docker-compose.yml
    nginx/
      nginx.conf
  .env.production
```

### 21.3. Production Docker Compose services

Production có thể gồm:

```text
nginx
backend
postgres
```

Hoặc nếu PostgreSQL cài ngoài Docker:

```text
nginx
backend
external-postgres
```

Đề xuất MVP: dùng Docker Compose cho backend + postgres + nginx để dễ tái triển khai.

### 21.4. Environment variables

Backend production `.env.production`:

```env
APP_ENV=production
APP_TIMEZONE=Asia/Ho_Chi_Minh

DATABASE_URL=postgresql://user:strong-password@db:5432/personal_notes
JWT_SECRET_KEY=strong-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

CORS_ORIGINS=https://notes.example.com
COOKIE_SECURE=true
COOKIE_DOMAIN=notes.example.com
```

Frontend production `.env.production`:

```env
VITE_API_BASE_URL=https://notes.example.com/api
```

### 21.5. Backup

MVP cần có backup DB đơn giản:

* Daily `pg_dump`.
* Giữ 7–30 bản gần nhất.
* Backup file `.sql.gz`.
* Backup folder nằm ngoài container volume hoặc sync ra nơi khác.

---

## 22. Testing strategy

### 22.1. Backend tests

Backend cần test:

* Auth login.
* Current user data isolation.
* Note create with subtasks.
* Note update with subtasks.
* Sub-task quick update.
* Folder tree.
* Delete folder moves notes to Inbox.
* Delete folder with child folders is blocked.
* Assignee deactivate behavior.
* Tag delete removes note_tags.
* Trash restore.
* Quick filters.
* Search normalized text.
* Deadline timezone.
* Environment config loading.

### 22.2. Frontend tests

MVP có thể bắt đầu với smoke/manual tests, sau đó thêm automated tests.

Nên test thủ công:

* Login.
* Create note.
* Edit note.
* Add sub-task.
* Change sub-task status.
* Search/filter.
* Folder tree selection.
* Tag selection.
* Trash restore.
* Mobile responsive layout.
* Local mobile test qua local IP.
* HMR/reload trong development.

### 22.3. Integration tests

Nên có integration tests cho endpoint chính:

* `POST /api/notes`
* `PUT /api/notes/{id}`
* `GET /api/notes`
* `DELETE /api/folders/{id}`
* `POST /api/trash/notes/{id}/restore`
* `PATCH /api/subtasks/{id}`
* `POST /api/auth/login`

---

## 23. Implementation phases

### Phase 0 — Project foundation

Mục tiêu:

* Khởi tạo repo.
* Tạo frontend React Vite TypeScript.
* Tạo backend FastAPI.
* Tạo PostgreSQL config.
* Tạo base architecture.
* Tạo migration tool.
* Tạo auth skeleton.
* Tạo `.env.example`, `.env.development.example`, `.env.production.example`.
* Đảm bảo local dev chạy trực tiếp có reload/HMR.

Deliverables:

* Running backend.
* Running frontend.
* DB connection.
* Health check endpoint.
* Base docs.
* Environment policy.
* Local dev runbook.

### Phase 1 — Auth + User foundation

Mục tiêu:

* User model.
* Login.
* JWT access/refresh token.
* Current user endpoint.
* Auth guard frontend.

Deliverables:

* Login page.
* Protected route.
* Token refresh.
* Logout.
* User data isolation baseline.

### Phase 2 — Master data foundation

Mục tiêu:

* Assignee CRUD/deactivate.
* Folder tree CRUD.
* Tag CRUD.
* Inbox default folder.

Deliverables:

* Assignee management.
* Folder management.
* Tag management.
* APIs and tests.

### Phase 3 — Notes core

Mục tiêu:

* Notes table.
* Subtasks table.
* Note create/update with subtasks.
* Note list/detail.
* Note editor.

Deliverables:

* Create note.
* Edit note.
* Add/edit/remove sub-task.
* Main assignee.
* Sub-task assignee.
* Folder/tag assignment.

### Phase 4 — Search/filter/dashboard

Mục tiêu:

* `search_text` normalized.
* Query filters.
* Quick filters.
* Dashboard summary.

Deliverables:

* Search by keyword.
* Filter by folder/tag/status/priority/deadline/assignee.
* Today/overdue/doing/pending filters.
* Dashboard counts.

### Phase 5 — Trash + soft delete hardening

Mục tiêu:

* Soft delete note.
* Trash page.
* Restore note.
* Folder delete moves note to Inbox.
* Assignee deactivate behavior.
* Tag delete behavior.

Deliverables:

* Trash UI.
* Restore action.
* Backend tests for soft delete.

### Phase 6 — Responsive polish + MVP audit

Mục tiêu:

* Mobile layout.
* Desktop layout polish.
* Validation messages.
* Smoke test.
* Deployment runbook.

Deliverables:

* MVP acceptance checklist.
* Deployment documentation.
* Final audit.

### Phase 7 — Production deployment

Mục tiêu:

* Dockerfile backend.
* Frontend build.
* Docker Compose.
* Nginx config.
* Production `.env` example.
* Backup script.

Deliverables:

* Production deploy runbook.
* Docker Compose stack.
* SSL/Nginx guide.
* DB backup/restore guide.

---

## 24. Acceptance criteria

MVP technical acceptance đạt khi:

1. User đăng nhập được.
2. User chỉ thấy dữ liệu của chính mình.
3. Tạo note với title, content, deadline, status, priority, folder, tag, main assignee được.
4. Tạo note kèm sub-task được.
5. Sub-task có assignee riêng.
6. Sửa note và sub-task trong cùng payload được.
7. Update nhanh sub-task bằng endpoint riêng được.
8. Folder dạng cây hoạt động.
9. Xóa folder có note sẽ chuyển note về Inbox.
10. Xóa folder có folder con bị block.
11. Assignee đang dùng không bị xóa, chỉ deactivate.
12. Tag đang dùng được remove khỏi note và soft delete.
13. Search/filter hoạt động.
14. Quick filters hoạt động.
15. Trash page xem note đã xóa và restore được.
16. Deadline hiển thị đúng `dd/mm/yyyy hh:mm`.
17. Deadline xử lý đúng giờ Việt Nam.
18. Desktop layout dùng được.
19. Mobile layout dùng được.
20. Local development chạy trực tiếp có reload/HMR.
21. Local mobile test được qua local IP.
22. Production có Docker/Docker Compose setup.
23. Không hardcode `.env`, local IP, domain, secret trong source code.
24. Backend tests cho business rules chính pass.

---

## 25. Các rủi ro kỹ thuật

### 25.1. Scope creep

Rủi ro: MVP bị kéo thành app giao việc/collaboration.

Kiểm soát:

* Không notification.
* Không assignee login.
* Không xác nhận nhận việc.
* Không realtime collaboration.

### 25.2. Folder tree phức tạp

Rủi ro: folder tree kéo theo drag/drop, recursive delete, permission phức tạp.

Kiểm soát:

* Không drag/drop ở MVP.
* Không xóa folder có child active.
* Xóa folder có note thì chuyển note về Inbox.

### 25.3. Timezone sai

Rủi ro: deadline hiển thị lệch giờ.

Kiểm soát:

* API dùng ISO datetime có timezone.
* DB dùng `TIMESTAMPTZ`.
* UI luôn hiển thị theo `Asia/Ho_Chi_Minh`.

### 25.4. Search chưa đủ mạnh

Rủi ro: `ILIKE` + normalized search_text có thể chậm khi dữ liệu lớn.

Kiểm soát:

* MVP dùng normalized search.
* Sau này nâng cấp `tsvector` + GIN index nếu cần.

### 25.5. Full note save làm mất sub-task

Rủi ro: PUT note payload thiếu sub-task cũ khiến sub-task bị soft delete nhầm.

Kiểm soát:

* Frontend phải luôn load full note trước khi edit.
* Dirty state rõ ràng.
* Service update cần test kỹ.
* Có Trash/soft delete cho sub-task.

### 25.6. Hardcoded environment config

Rủi ro: local IP, domain, database URL hoặc secret bị hardcode vào source code.

Kiểm soát:

* Tất cả config qua `.env`.
* Commit file `.env.example`, không commit `.env` thật.
* CI/test có thể grep kiểm tra các pattern nguy hiểm nếu cần.

### 25.7. Docker làm chậm development

Rủi ro: dùng Docker ngay trong development khiến reload/HMR chậm và khó debug.

Kiểm soát:

* Development chạy trực tiếp.
* Docker chỉ dùng cho production/deploy.
* Có runbook riêng cho local dev.

---

## 26. Kết luận kỹ thuật

Technical Design v1 chọn hướng đơn giản, rõ ràng và dễ triển khai:

* React Vite TypeScript cho frontend.
* FastAPI + SQLAlchemy sync cho backend.
* PostgreSQL cho database.
* Local development chạy trực tiếp để có reload/HMR.
* Local mobile test dùng local IP từ `.env`.
* Production deploy bằng Docker/Docker Compose.
* Mọi config đi qua `.env` hoặc environment variables.
* CRUD architecture theo lớp.
* Transaction chặt cho note/sub-task.
* Soft delete để bảo vệ dữ liệu.
* Search normalized đủ dùng cho MVP.
* Không mở rộng sang notification/collaboration/offline trong giai đoạn đầu.

Thiết kế này đủ sạch để triển khai MVP nhanh, đồng thời vẫn giữ đường mở rộng cho các phase sau như notification, assignee login, file attachment, AI, PWA/offline và collaboration.
