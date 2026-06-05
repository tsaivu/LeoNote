# Web UI Sync Implementation Phase

## 1. MUC TIEU CUOI CUNG CUA PHASE NAY

Dong bo giao dien web cac man hinh quan ly voi mau dashboard/task hien tai, uu tien `/settings/folders`, dong thoi giu dung kien truc frontend Page -> Hook -> Service -> Repository/API va khong thay doi backend/API/business logic.

## 2. Hien trang code sau khi doc bang CodeGraph

- CodeGraph status: 124 files indexed, 1012 nodes, 1468 edges.
- Route `/` dung `NotesWorkspacePage` voi shell TaskFlow moi: `taskflow-shell`, `taskflow-sidebar`, `taskflow-main`.
- Route `/settings/folders`, `/settings/tags`, `/settings/assignees`, `/trash` dang dung shell cu: `app-shell`, `sidebar`, `content`, `topbar`.
- Cac man quan ly da co mobile components rieng: `MobileManagementHeader`, `MobilePageBarAction`, `MobilePanelHeader`.
- Hooks/data flow hien co:
  - Folders: `FolderManagementPage` -> `useFolders/useCreateFolder/useUpdateFolder/useDeleteFolder` -> `folderService` -> `folderRepository`.
  - Tags: `TagManagementPage` -> `useTags/useCreateTag/useUpdateTag/useDeleteTag` -> `tagService` -> `tagRepository`.
  - Assignees: `AssigneeManagementPage` -> `useAssignees/useCreateAssignee/useUpdateAssignee/useDeleteAssignee/useActivateAssignee/useDeactivateAssignee` -> `assigneeService` -> `assigneeRepository`.
  - Trash: `TrashPage` -> `useTrashNotes/useRestoreNote` -> `noteService` -> `noteRepository`.

## 3. Route/page/component/hook/service/repository/API lien quan

- Routes:
  - `/settings/folders`: `web/src/modules/folders/pages/FolderManagementPage.tsx`
  - `/settings/tags`: `web/src/modules/tags/pages/TagManagementPage.tsx`
  - `/settings/assignees`: `web/src/modules/assignees/pages/AssigneeManagementPage.tsx`
  - `/trash`: `web/src/modules/notes/pages/TrashPage.tsx`
- Shared UI:
  - `web/src/shared/components/DesktopSidebar.tsx`
  - `web/src/shared/components/MobileManagementHeader.tsx`
  - `web/src/shared/components/MobilePageBarAction.tsx`
  - `web/src/shared/components/MobilePanelHeader.tsx`
- Style:
  - `web/src/styles.css`
- API layers khong sua:
  - `folderRepository`, `tagRepository`, `assigneeRepository`, `noteRepository`

## 4. Pham vi thay doi

- Them `DesktopSidebar` de tai su dung sidebar TaskFlow tren cac man web khac.
- Doi shell desktop cua Folders/Tags/Assignees/Trash sang `taskflow-shell management-shell`.
- Doi content wrapper sang `taskflow-main management-main`.
- Them CSS scoped `.management-shell` cho topbar, grid, panel, row list, form controls, trash cards.
- Giu nguyen mobile management header va mobile behavior.

## 5. Danh sach file du kien/da sua

- `web/src/shared/components/DesktopSidebar.tsx`
- `web/src/modules/folders/pages/FolderManagementPage.tsx`
- `web/src/modules/tags/pages/TagManagementPage.tsx`
- `web/src/modules/assignees/pages/AssigneeManagementPage.tsx`
- `web/src/modules/notes/pages/TrashPage.tsx`
- `web/src/styles.css`
- `docs/web-ui-sync/implement-phase-.md`

## 6. Rui ro

- `styles.css` la stylesheet global lon; vi vay CSS moi duoc scope bang `.management-shell`.
- Cac man mobile truoc day dua vao `.app-shell .topbar`; khi doi sang `taskflow-shell`, can override `.management-shell .topbar { display: none; }` tren mobile.
- Sidebar shared can giu label/icon gan voi dashboard de dong bo nhung khong lam thay doi route.
- Trash van can `Link` cho nut Back to Dashboard, nen khong xoa import nay.

## 7. Cach test

- `npm run build` trong `web`.
- `git diff --check`.
- Kiem tra thu cong cac route:
  - `/settings/folders`
  - `/settings/tags`
  - `/settings/assignees`
  - `/trash`
  - `/`
- Kiem tra mobile width <= 760px de dam bao mobile header van hien va topbar desktop bi an.

## 8. Checklist checkpoint cuoi phase

- [x] Preflight branch/status/log.
- [x] Kiem tra CodeGraph status/index.
- [x] Dung CodeGraph context/explore de tim route/page/hook/service/repository/API lien quan.
- [x] Lap plan truoc khi implement.
- [x] Implement chi trong frontend UI shell/style.
- [x] Audit diff va scope.
- [x] Chay validation.
- [x] Bao cao checkpoint cuoi phase.
