# Task Dashboard Web UI Implementation Phase

## 1. MỤC TIÊU CUỐI CÙNG CỦA PHASE NÀY

Đồng bộ giao diện web của màn hình dashboard/task với các màn hình management còn lại, đổi branding web từ `TaskFlow` sang `Leo Task Management` với logo sư tử, và thêm phím tắt `F2` để mở form tạo task mới.

## 2. Hiện trạng code sau khi đọc bằng CodeGraph

- CodeGraph status/index đã hoạt động với 127 file được index.
- Page dashboard/task là `NotesWorkspacePage`.
- Luồng tạo task mới đi qua function `startNewNote`, đang được dùng bởi nút `New Task`, floating button mobile và query `?new=1`.
- Sidebar desktop shared nằm ở `DesktopSidebar`, nhưng `NotesWorkspacePage` còn giữ sidebar copy riêng với brand `TaskFlow`.
- CSS dashboard task dùng `.taskflow-desktop-header` không có border/card như `.management-shell .topbar`.
- Nút `New Task` đang dùng màu riêng `#0f6ff8`, lệch với token primary và button style của các màn hình còn lại.

## 3. Route/page/component/hook/service/repository/API liên quan

- Route/page: `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- Shared component: `web/src/shared/components/DesktopSidebar.tsx`
- Login brand: `web/src/modules/auth/pages/LoginPage.tsx`
- UI styles: `web/src/styles.css`
- Hook/ViewModel: không đổi, page vẫn dùng `useNotes`, `useFolders`, `useAssignees`, `useTags`
- Service/repository/API: không đổi trong phase này

## 4. Phạm vi thay đổi

- Dùng `DesktopSidebar` shared cho dashboard/task desktop.
- Đổi brand text thành `Leo Task Management`.
- Đổi logo thành mark sư tử bằng CSS, không thêm asset generated/build output.
- Thêm shortcut `F2` trong `NotesWorkspacePage` để gọi `startNewNote`.
- Bo viền/card hóa desktop task header và đổi nút `New Task` sang token primary.
- Không thay đổi backend, database, API contract, route data, mutation, business logic.

## 5. Danh sách file dự kiến sửa

- `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- `web/src/shared/components/DesktopSidebar.tsx`
- `web/src/modules/auth/pages/LoginPage.tsx`
- `web/src/styles.css`
- `docs/task-dashboard-web-ui/implement-phase-.md`

## 6. Rủi ro

- `DesktopSidebar` là shared component, nên brand đổi sẽ ảnh hưởng toàn bộ màn hình desktop dùng sidebar, đúng với yêu cầu đổi branding web.
- Shortcut `F2` là global trong dashboard/task page; nếu form đang dirty, vẫn đi qua confirm hiện có của `startNewNote`.
- CSS logo là mark CSS, không phải file ảnh raster, để tránh thêm generated asset và giữ repo nhẹ.

## 7. Cách test

- Chạy `git diff --check`.
- Chạy frontend build bằng `npm.cmd run build` trong thư mục `web`.
- Kiểm tra `git status --short` để xác nhận không có generated/cache/build output bị dirty.
- Kiểm tra diff scope chỉ gồm dashboard task, shared sidebar, login brand, CSS và docs phase.

## 8. Checklist checkpoint cuối phase

- [x] Preflight branch/status/log.
- [x] CodeGraph status/index.
- [x] CodeGraph discovery route/page/component/style/create flow.
- [x] Plan trước khi implement.
- [x] Implement đúng scope.
- [x] Audit diff và file ngoài scope.
- [x] Chạy validation/test.
- [x] Báo cáo checkpoint cuối phase.
