# Mobile UI Sync Implementation Phase

## 1. MUC TIEU CUOI CUNG CUA PHASE NAY

Dong bo UI mobile cua cac man hinh con lai theo chuan mobile dashboard/task, dam bao responsive cho `/settings/folders`, `/settings/tags`, `/settings/assignees`, `/trash` ma khong thay doi data flow, business logic, backend hay API contract.

## 2. Hien trang code sau khi doc bang CodeGraph

- CodeGraph status: 125 files indexed, 1022 nodes, 1478 edges.
- Dashboard/task mobile dang dung `taskflow-shell`, `taskflow-mobile-header`, `taskflow-mobile-toolbar`, `taskflow-board`, mobile table cards va bottom nav.
- Cac man quan ly da duoc doi sang `taskflow-shell management-shell` trong phase web sync, nhung mobile overrides cu chu yeu scope theo `.app-shell`, nen can bo sung `.management-shell` mobile rules.
- Cac mobile shared components hien co:
  - `MobileManagementHeader`
  - `MobilePageBar`
  - `MobilePageBarAction`
  - `MobilePanelHeader`
- Cac page van giu hooks/service/repository hien co, khong can sua API layer.

## 3. Route/page/component/hook/service/repository/API lien quan

- `/settings/folders`: `FolderManagementPage` -> `useFolders` -> `folderService` -> `folderRepository`
- `/settings/tags`: `TagManagementPage` -> `useTags` -> `tagService` -> `tagRepository`
- `/settings/assignees`: `AssigneeManagementPage` -> `useAssignees` -> `assigneeService` -> `assigneeRepository`
- `/trash`: `TrashPage` -> `useTrashNotes/useRestoreNote` -> `noteService` -> `noteRepository`
- CSS target: `web/src/styles.css`

## 4. Pham vi thay doi

- Them responsive CSS scoped trong media `max-width: 760px` cho `.management-shell`.
- Dong bo mobile spacing/panel/card/form/button/list/trash card voi dashboard/task mobile.
- Giu mobile header sticky va bottom nav theo pattern hien co.
- Khong sua backend, repositories, services, hooks, API contracts.

## 5. Danh sach file du kien/da sua

- `web/src/styles.css`
- `docs/mobile-ui-sync/implement-phase-.md`

File dang lien quan tu phase web sync nhung khong sua logic trong phase mobile:

- `web/src/modules/folders/pages/FolderManagementPage.tsx`
- `web/src/modules/tags/pages/TagManagementPage.tsx`
- `web/src/modules/assignees/pages/AssigneeManagementPage.tsx`
- `web/src/modules/notes/pages/TrashPage.tsx`
- `web/src/shared/components/DesktopSidebar.tsx`

## 6. Rui ro

- `styles.css` co nhieu block mobile cu scope theo `.app-shell`; can dung `.management-shell` de tranh anh huong dashboard/task.
- Cac man quan ly co form/list khac nhau, nen button full-width va row-card mobile phai duoc scope chung nhung khong lam vo trash action.
- Trash card co action restore rieng, can giu nut Restore khong bi keo full width qua muc can thiet.

## 7. Cach test

- `npm run build` trong `web`.
- `git diff --check`.
- Test thu cong mobile width <= 760px:
  - `/`
  - `/settings/folders`
  - `/settings/tags`
  - `/settings/assignees`
  - `/trash`
- Kiem tra desktop khong bi regression o cac route tren.

## 8. Checklist checkpoint cuoi phase

- [x] Preflight branch/status/log.
- [x] Kiem tra CodeGraph status/index.
- [x] Dung CodeGraph context/explore de xac dinh mobile UI pattern va page lien quan.
- [x] Lap plan truoc khi implement.
- [x] Implement CSS mobile scoped cho `.management-shell`.
- [x] Audit diff va scope.
- [x] Chay validation.
- [x] Bao cao checkpoint cuoi phase.
