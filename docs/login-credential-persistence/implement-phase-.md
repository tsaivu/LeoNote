# Login Credential Persistence Implementation Phase

## 1. MỤC TIÊU CUỐI CÙNG CỦA PHASE NÀY

Thêm tính năng lưu username và password ở màn hình login, có lựa chọn không lưu, lưu theo phiên trình duyệt, hoặc lưu vĩnh viễn trên thiết bị hiện tại.

## 2. Hiện trạng code sau khi đọc bằng CodeGraph

- CodeGraph status/index đã hoạt động với 127 file được index.
- `LoginPage` đang gọi `authService.login(username, password)` rồi lưu auth session qua `setAuthSession`.
- `AuthContext` hiện lưu access token, refresh token và user vào `localStorage`.
- `authService` gọi `authRepository`, còn `authRepository` gọi API `/auth/login`.
- Backend auth route/service/repository không cần thay đổi vì yêu cầu chỉ là ghi nhớ thông tin nhập login phía client.
- Trước phase này, `LoginPage` hardcode sẵn `admin` và `123123`.

## 3. Route/page/component/hook/service/repository/API liên quan

- Page: `web/src/modules/auth/pages/LoginPage.tsx`
- Hook/ViewModel: `web/src/modules/auth/hooks/useAuth.ts`
- Service mới: `web/src/modules/auth/services/loginCredentialStorage.ts`
- Auth service hiện có: `web/src/modules/auth/services/authService.ts`
- Repository/API hiện có: `web/src/modules/auth/repositories/authRepository.ts`, `/auth/login`
- Styles: `web/src/styles.css`

## 4. Phạm vi thay đổi

- Thêm frontend service đọc/ghi credential vào `sessionStorage` hoặc `localStorage`.
- Thêm UI chọn chế độ lưu login trên `LoginPage`.
- Tự điền username/password từ storage nếu đã lưu.
- Chỉ lưu sau khi login thành công.
- Không thay đổi backend, API contract, token flow, auth context hoặc database.

## 5. Danh sách file dự kiến sửa

- `web/src/modules/auth/pages/LoginPage.tsx`
- `web/src/modules/auth/services/loginCredentialStorage.ts`
- `web/src/styles.css`
- `docs/login-credential-persistence/implement-phase-.md`

## 6. Rủi ro

- Lưu password ở frontend, đặc biệt bằng `localStorage`, có rủi ro bảo mật nếu thiết bị/trình duyệt bị dùng chung hoặc bị XSS.
- Chế độ vĩnh viễn lưu đến khi người dùng đổi lựa chọn hoặc storage bị xóa.
- Không mã hóa password ở client vì không có key an toàn trong browser; đây là tradeoff theo yêu cầu MVP/local convenience.

## 7. Cách test

- Chạy `git diff --check`.
- Chạy `npm.cmd run build` trong thư mục `web`.
- Kiểm tra login form có 3 chế độ lưu.
- Kiểm tra chế độ `Until browser closes` dùng `sessionStorage`.
- Kiểm tra chế độ `Always` dùng `localStorage`.
- Kiểm tra `Do not save` xóa credential đã lưu.

## 8. Checklist checkpoint cuối phase

- [x] Commit phase trước.
- [x] Preflight branch/status/log.
- [x] CodeGraph status/index.
- [x] CodeGraph discovery login/auth flow.
- [x] Plan trước khi implement.
- [x] Implement đúng scope.
- [x] Audit diff và file ngoài scope.
- [x] Chạy validation/test.
- [x] Báo cáo checkpoint cuối phase.
