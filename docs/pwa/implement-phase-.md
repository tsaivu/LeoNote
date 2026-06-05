# PWA Implementation Phase

## 1. MỤC TIÊU CUỐI CÙNG CỦA PHASE NÀY

Cho phép triển khai PWA có kiểm soát cho Leo Task Management, hỗ trợ cài đặt ứng dụng và cache app shell/static assets mà không làm thay đổi transaction, API contract hoặc cơ chế lưu dữ liệu hiện tại.

## 2. Hiện trạng code sau khi đọc bằng CodeGraph

- CodeGraph index đang hoạt động với 128 file được index.
- Frontend dùng React, Vite và TypeScript.
- Repo chưa được phép triển khai PWA do Boundary Rules cũ cấm PWA, Offline Mode và Service Worker.
- Vite entry nằm ở `web/src/main.tsx`, app shell toàn cục nằm ở `web/src/app/App.tsx`.
- HTTP client dùng `VITE_API_BASE_URL` và fetch trực tiếp tới API; service worker phải giữ API ở chế độ NetworkOnly.
- PWA được triển khai bằng `vite-plugin-pwa` và Workbox để quản lý manifest, precache và vòng đời cập nhật.

## 3. Route/page/component/hook/service/repository/API liên quan

- App shell: `web/src/app/App.tsx`
- PWA status/update component: `web/src/shared/components/PwaStatus.tsx`
- Vite/Workbox config: `web/vite.config.js`
- Manifest/icons: cấu hình manifest trong Vite và assets trong `web/public`
- API boundary: `web/src/shared/api/httpClient.ts` được đọc để xác nhận URL/API behavior, không sửa.
- Auth service/repository/API và các API nghiệp vụ không được cache dữ liệu nhạy cảm.

## 4. Phạm vi thay đổi

- Cho phép PWA và Service Worker cho installability, app shell và static assets.
- Không cho phép Offline CRUD, Background Sync, mutation queue hoặc Push Notification.
- API auth và nghiệp vụ phải ưu tiên network.
- Không cache token, credential, response dữ liệu người dùng hoặc API mutation.
- Hiển thị trạng thái offline rõ ràng và yêu cầu click `Update` khi có service worker mới.
- Không tự động reload để tránh mất dữ liệu form chưa lưu.

## 5. Danh sách file dự kiến sửa

- `agents.md`
- `docs/pwa/implement-phase-.md`
- `web/package.json`
- `web/package-lock.json`
- `web/vite.config.js`
- `web/index.html`
- `web/src/app/App.tsx`
- `web/src/shared/components/PwaStatus.tsx`
- `web/src/vite-env.d.ts`
- `web/src/styles.css`
- `web/public/leo-lion.svg`
- `web/public/leo-lion-maskable.svg`

## 6. Rủi ro

- Cache sai API hoặc auth response có thể gây lộ dữ liệu và hiển thị dữ liệu cũ.
- Service Worker không có version strategy có thể giữ bundle cũ sau deploy.
- Offline fallback không rõ ràng có thể khiến người dùng hiểu nhầm thao tác đã được lưu.

## 7. Cách test

- Kiểm tra `git diff --check`.
- Audit diff chỉ gồm rule/docs trong phase này.
- Chạy frontend production build.
- Kiểm tra output có `manifest.webmanifest`, service worker và Workbox bundle.
- Kiểm tra manifest có name, theme, start URL và icon.
- Kiểm tra Workbox config không cache API/cross-origin request.

## 8. Checklist checkpoint cuối phase

- [x] Preflight branch/status/log.
- [x] Kiểm tra CodeGraph status/index.
- [x] Cập nhật Boundary Rules.
- [x] Giữ nguyên lệnh cấm Push Notification, Offline CRUD và Auto-save.
- [x] CodeGraph discovery Vite/app/API flow.
- [x] Thêm manifest, icons, service worker và update lifecycle.
- [x] Audit diff.
- [x] Build và kiểm tra PWA output.
- [x] Cập nhật tài liệu phase.
