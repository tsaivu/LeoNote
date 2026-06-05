# UI Discovery Implementation Phase

## 1. MUC TIEU CUOI CUNG CUA PHASE NAY

Doc hieu codebase frontend lien quan den giao dien web, xac dinh route/page/component/hook/service/repository/API dang duoc dung, lap plan sua UI an toan theo kien truc hien co, sau do implement layout web cho man dashboard chinh route `/`.

## 2. Hien trang code sau khi doc bang CodeGraph

- CodeGraph status: 124 files indexed, 1012 nodes, 1355 edges.
- Frontend nam trong `web/src`, React + Vite + TypeScript, dung React Router va TanStack Query.
- Route root `/` render `NotesWorkspacePage`.
- Cac route quan tri gom `/settings/folders`, `/settings/tags`, `/settings/assignees`; route thung rac la `/trash`; route login la `/login`.
- `NotesWorkspacePage` hien la page lon, chua nhieu state va UI inline cho note list, detail, create/edit form, picker modal, subtask modal.
- Cac component trong `web/src/modules/notes/components` gom `NoteEditor`, `NoteList`, `QuickFilters`, `SubtaskEditor` hien chi la placeholder; `RichTextEditor` la component that dang duoc page su dung.
- CSS chinh cua ung dung nam trong `web/src/styles.css`; note workspace dung cac class nhu `app-shell`, `sidebar`, `content`, `topbar`, `workspace-grid`, `panel`, `note-list`, `note-card`, `create-task-*`, `picker-*`, `taskflow-mobile-*`.
- Shared mobile UI co cac component `MobileAppHeader`, `MobileManagementHeader`, `MobilePageBar`, `MobilePageBarAction`, `MobilePanelHeader`.

## 3. Route/page/component/hook/service/repository/API lien quan

- App/router:
  - `web/src/app/router.tsx`: khai bao routes.
  - `web/src/app/App.tsx`: shell + mobile bottom nav.
  - `web/src/app/providers.tsx`: `QueryClientProvider` + `AuthProvider`.
- Notes workspace:
  - Page: `web/src/modules/notes/pages/NotesWorkspacePage.tsx`.
  - Component dang dung that: `web/src/modules/notes/components/RichTextEditor.tsx`.
  - Placeholder components can can nhac neu tach UI sau: `NoteEditor.tsx`, `NoteList.tsx`, `QuickFilters.tsx`, `SubtaskEditor.tsx`.
  - Hook: `web/src/modules/notes/hooks/useNotes.ts`.
  - Service: `web/src/modules/notes/services/noteService.ts`.
  - Repository/API: `web/src/modules/notes/repositories/noteRepository.ts`.
  - Types: `web/src/modules/notes/types/noteTypes.ts`.
- Master data ma page dang dung:
  - Folders: `useFolders`, `useCreateFolder`, `folderService`, `folderRepository`.
  - Assignees: `useAssignees`, `useCreateAssignee`, `assigneeService`, `assigneeRepository`.
  - Tags: `useTags`, `useCreateTag`, `tagService`, `tagRepository`.
- Shared API:
  - `web/src/shared/api/httpClient.ts`: doc `VITE_API_BASE_URL`, gan Authorization header, refresh token khi 401.
  - `web/src/shared/api/queryClient.ts`: React Query client.
- Shared helpers:
  - `web/src/shared/lib/datetime.ts`: format gio Viet Nam.
  - `web/src/shared/lib/richText.ts`: sanitize/check rich text.

CodeGraph trace:

- `useNotes` statically calls `noteService`.
- `noteService` delegates to `noteRepository`.
- `noteRepository` uses `httpGet`, `httpPost`, `httpPut`, `httpDelete` from shared `httpClient`.
- Trace truc tiep tu `NotesWorkspacePage` den `noteRepository` bi ngat o dynamic/object method calls, nhung `codegraph_explore` da xac nhan bang source path: Page -> Hooks -> Service -> Repository -> shared API.

## 4. Pham vi thay doi

Trong phase nay:

- Doc hieu frontend va tao tai lieu plan.
- Implement layout desktop/web cho dashboard chinh trong `NotesWorkspacePage`.
- Them desktop dashboard header gom title, search, nut tao task, metric cards va project tabs desktop.
- Thu gon board/table va nut floating de tranh layout bi nang, tao khoang cach ro hon giua header va data table.
- Khong sua backend, database, migration, business logic, API contract.
- Khong refactor rong, khong doi kien truc.

Khi co scope UI cu the:

- Uu tien sua trong `NotesWorkspacePage.tsx` va `styles.css` neu la workspace hien tai.
- Neu can tach de giam rui ro, chi tach theo component placeholder san co trong `web/src/modules/notes/components`, giu luong data qua page/hook hien co.
- Reuse shared mobile components va class design system san co.

## 5. Danh sach file du kien sua

Phase discovery da tao/cap nhat:

- `docs/ui-discovery/implement-phase-.md`

File da sua trong phase implement:

- `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- `web/src/styles.css`

File co kha nang sua o phase implement sau, tuy vao yeu cau UI tiep theo:

- `web/src/modules/notes/components/NoteList.tsx` neu can tach list
- `web/src/modules/notes/components/NoteEditor.tsx` neu can tach editor
- `web/src/modules/notes/components/SubtaskEditor.tsx` neu can tach subtask modal
- `web/src/modules/notes/components/QuickFilters.tsx` neu can tach filter UI

File khong duoc sua neu chi la UI frontend:

- `backend/**`
- `backend/migrations/**`
- `web/src/modules/*/repositories/*` tru khi co bang chung API contract frontend sai
- `.env`, cache/runtime/build output, `.codegraph/`

## 6. Rui ro

- `NotesWorkspacePage.tsx` dang tap trung nhieu logic state, form, mutation va UI; sua layout inline co rui ro lam vo luong create/update/detail.
- `styles.css` la global stylesheet lon; thay doi class chung nhu `.btn`, `.panel`, `.note-card` co the anh huong nhieu page.
- Mobile layout co nhieu class rieng `taskflow-mobile-*`; can test desktop va mobile neu sua workspace.
- Cac component placeholder ton tai nhung chua duoc page import su dung; tach component can lam co kiem soat de khong doi behavior.
- Metric cards hien tinh theo danh sach note dang hien thi theo filter hien tai, khong goi API summary moi.

## 7. Cach test

- `npm run build` trong `web`.
- `git diff --check`.
- Neu co implement UI sau nay, can test thu cong:
  - login -> `/`
  - list/filter/search notes
  - mo detail note
  - create/update note bang nut Luu
  - update subtask
  - responsive desktop va mobile

Repo frontend hien khong co script lint/test trong `web/package.json`.

## 8. Checklist checkpoint cuoi phase

- [x] Preflight branch/status/log.
- [x] Kiem tra CodeGraph status/index.
- [x] Dung CodeGraph search/explore de tim route/page/component/hook/service/repository/API.
- [x] Xac dinh flow Page -> Hook -> Service -> Repository -> API.
- [x] Xac dinh file lien quan va file khong duoc sua.
- [x] Implement layout web dashboard route `/`.
- [x] Chay validation sau khi tao doc.
- [x] Bao cao checkpoint cuoi phase.
