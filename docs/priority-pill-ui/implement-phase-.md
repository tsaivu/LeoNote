# Priority Pill UI Implementation Phase

## 1. MỤC TIÊU CUỐI CÙNG CỦA PHASE NÀY

Đồng bộ giao diện priority pill trên màn hình web dashboard/task, đặc biệt phần bộ lọc priority và badge priority trong task table/detail, theo phong cách UI dashboard/task hiện có mà không thay đổi backend, API contract, hook/service/repository hoặc business logic.

## 2. Hiện trạng code sau khi đọc bằng CodeGraph

- CodeGraph index đang hoạt động và đã index frontend/backend của repo.
- Route/page liên quan nằm trong module notes, page chính là `NotesWorkspacePage`.
- Priority badge được render từ helper `priorityChipClass` và `priorityLabel`.
- Bộ lọc priority nằm trong `taskflow-priority-pills`.
- Hiện trạng trước khi sửa: `CRITICAL` dùng chung class và label với `HIGH`, trong khi filter lại hiển thị `CRITICAL` là `Urgent`, gây lệch nghĩa và lệch visual.

## 3. Route/page/component/hook/service/repository/API liên quan

- Route/page: `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- Component/page symbols: `NotesWorkspacePage`, `priorityChipClass`, `priorityLabel`
- UI styles: `web/src/styles.css`
- Hook/ViewModel: không đổi, page đang dùng `useNotes`, `useFolders`, `useAssignees`, `useTags`
- Service/repository/API: không đổi trong phase này
- Shared UI pattern liên quan: `.taskflow-tabs`, `.taskflow-priority-pills`, `.priority-badge`, mobile `.taskflow-table .priority-badge`

## 4. Phạm vi thay đổi

- Sửa mapping label/class priority trên dashboard/task.
- Thêm class variant cho priority filter pill.
- Đồng bộ CSS priority badge và priority filter pill cho desktop/mobile.
- Không thay đổi dữ liệu, API payload, query, mutation, backend, database hoặc routing.

## 5. Danh sách file dự kiến sửa

- `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- `web/src/styles.css`
- `docs/priority-pill-ui/implement-phase-.md`

## 6. Rủi ro

- CSS priority badge là class dùng lại trong page notes, nên thay đổi có thể ảnh hưởng những vị trí khác trong cùng dashboard/task đang hiển thị priority.
- Mobile table đang dùng badge dạng dot tròn; cần giữ override mobile để không làm vỡ layout card.
- Không có visual regression automated trong repo, cần kiểm tra build và diff scope.

## 7. Cách test

- Chạy `git diff --check`.
- Chạy frontend build bằng `npm.cmd run build` trong thư mục `web`.
- Kiểm tra `git diff` để xác nhận chỉ có file đúng scope.
- Kiểm tra final `git status --short`.

## 8. Checklist checkpoint cuối phase

- [x] Preflight branch/status/log.
- [x] CodeGraph status/index.
- [x] CodeGraph discovery route/page/component/style liên quan.
- [x] Plan trước khi implement.
- [x] Implement đúng scope.
- [x] Audit diff và file ngoài scope.
- [x] Chạy validation/test.
- [x] Báo cáo checkpoint cuối phase.
