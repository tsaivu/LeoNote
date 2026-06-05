# User Management Implementation Phase

## 1. MUC TIEU CUOI CUNG CUA PHASE NAY

Hoan thien module quan ly user de nguoi dung dang nhap co the cap nhat ten hien thi, email va mat khau, co UI web/mobile responsive theo mau TaskFlow dashboard/task, giu dung kien truc Backend Router -> Service -> Repository va Frontend Page -> Hook -> Service -> Repository/API.

## 2. Hien trang code sau khi doc bang CodeGraph

- CodeGraph status: 125 files indexed, 1022 nodes, 1478 edges.
- Backend da co `users` module voi `GET /users/me`, nhung chua co update profile/password.
- Model `User` da co `email`, `display_name`, `password_hash`, `timezone`; khong can migration.
- Auth response frontend/backend chua expose `email`, nen can bo sung type/schema.
- Frontend da co AuthContext luu user vao localStorage, can them API de cap nhat user context sau khi save profile.
- UI hien tai dung TaskFlow shell, `DesktopSidebar`, `MobileManagementHeader` va `management-shell` responsive.

## 3. Route/page/component/hook/service/repository/API lien quan

- Backend:
  - `backend/app/modules/users/router.py`
  - `backend/app/modules/users/service.py`
  - `backend/app/modules/users/repository.py`
  - `backend/app/modules/users/schema.py`
  - `backend/app/modules/auth/schema.py`
  - `backend/app/modules/auth/service.py`
- Frontend:
  - Route: `/settings/profile`
  - Page: `web/src/modules/users/pages/ProfilePage.tsx`
  - Hook: `web/src/modules/users/hooks/useUserProfile.ts`
  - Service: `web/src/modules/users/services/userService.ts`
  - Repository/API: `web/src/modules/users/repositories/userRepository.ts`
  - Types: `web/src/modules/users/types/userTypes.ts`
  - Context: `web/src/shared/contexts/AuthContext.tsx`
  - Navigation: `web/src/app/router.tsx`, `web/src/app/App.tsx`, `DesktopSidebar`, dashboard sidebar.

## 4. Pham vi thay doi

- Them `PUT /users/me` de cap nhat `display_name`, `email`.
- Them `PUT /users/me/password` de cap nhat mat khau sau khi verify current password.
- Validate email duplicate theo user active.
- Cap nhat frontend auth user type/context/localStorage sau khi save profile.
- Them profile page responsive voi 2 form rieng: Account Details va Password.
- Khong thay doi bang DB/migration, business logic note/folder/tag/assignee.

## 5. Danh sach file du kien/da sua

- `backend/app/modules/users/schema.py`
- `backend/app/modules/users/repository.py`
- `backend/app/modules/users/service.py`
- `backend/app/modules/users/router.py`
- `backend/app/modules/auth/schema.py`
- `backend/app/modules/auth/service.py`
- `web/src/modules/auth/types/authTypes.ts`
- `web/src/shared/contexts/AuthContext.tsx`
- `web/src/modules/users/types/userTypes.ts`
- `web/src/modules/users/repositories/userRepository.ts`
- `web/src/modules/users/services/userService.ts`
- `web/src/modules/users/hooks/useUserProfile.ts`
- `web/src/modules/users/pages/ProfilePage.tsx`
- `web/src/app/router.tsx`
- `web/src/app/App.tsx`
- `web/src/shared/components/DesktopSidebar.tsx`
- `web/src/shared/components/MobileAppHeader.tsx`
- `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- `web/src/styles.css`
- `backend/tests/integration/test_user_profile.py`

## 6. Rui ro

- Doi password can verify current password; neu sai tra `CURRENT_PASSWORD_INVALID`.
- Email unique dua vao unique index DB va check service, can rollback khi IntegrityError.
- AuthContext can update localStorage sau khi save profile de header/mobile ten user thay doi ngay.
- Bottom nav mobile them Profile thanh 6 item; can kiem tra fit text tren mobile nho.

## 7. Cach test

- Backend: chay pytest neu moi truong backend san sang.
- Frontend: `npm run build` trong `web`.
- `git diff --check`.
- Manual:
  - Login.
  - Mo `/settings/profile`.
  - Cap nhat name/email va refresh page de kiem tra localStorage.
  - Doi password sai current password phai bao loi.
  - Doi password dung current password phai thanh cong.
  - Kiem tra responsive mobile route `/settings/profile`.

## 8. Checklist checkpoint cuoi phase

- [x] Preflight branch/status/log.
- [x] Kiem tra CodeGraph status/index.
- [x] Dung CodeGraph context/explore de xac dinh users/auth/frontend architecture.
- [x] Lap plan truoc khi implement.
- [x] Implement backend users profile/password endpoints.
- [x] Implement frontend profile route, hooks, service, repository, responsive UI.
- [x] Audit diff va scope.
- [x] Chay validation/test.
- [x] Bao cao checkpoint cuoi phase.
