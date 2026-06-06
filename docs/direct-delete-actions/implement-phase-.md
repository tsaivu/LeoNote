# Direct Delete Actions Implementation Phase

## 1. MUC TIEU CUOI CUNG CUA PHASE NAY

Them nut xoa truc tiep tren task card/row o ca web va mobile, va tren card/row Folder, Team, Tag, su dung dung luong xoa mem/deactivate hien co.

## 2. Hien trang code sau khi doc bang CodeGraph

- Task dashboard route `/` render `NotesWorkspacePage`.
- Task delete flow da co: `useDeleteNote -> noteService.remove -> noteRepository.remove -> DELETE /notes/{note_id}`.
- Folder delete flow da co: `useDeleteFolder -> folderService.delete -> folderRepository.delete -> DELETE /folders/{folder_id}`.
- Team delete flow da co: `useDeleteAssignee -> assigneeService.delete -> assigneeRepository.delete -> DELETE /assignees/{assignee_id}`; backend co the deactivate neu assignee dang duoc dung.
- Tag delete flow da co: `useDeleteTag -> tagService.delete -> tagRepository.delete -> DELETE /tags/{tag_id}`.
- Backend da thuc thi soft delete/deactivate va user isolation; khong can sua API/backend.

## 3. Route/page/component/hook/service/repository/API lien quan

- Task page: `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- Folder page: `web/src/modules/folders/pages/FolderManagementPage.tsx`
- Team page: `web/src/modules/assignees/pages/AssigneeManagementPage.tsx`
- Tag page: `web/src/modules/tags/pages/TagManagementPage.tsx`
- Hooks: `useDeleteNote`, `useDeleteFolder`, `useDeleteAssignee`, `useDeleteTag`
- Services/repositories/API: existing delete methods only; khong sua contract
- Style: `web/src/styles.css`

## 4. Pham vi thay doi

- Them direct delete button tren task row/card.
- Dieu chinh task card mobile: title rong hon gan toi priority, delete nam dong cuoi sau progress.
- Bo floating `+` tren web task board vi desktop da co nut `New Task`.
- Chinh filter desktop thanh hai cot bang nhau trong mot dong: status va priority.
- Them direct delete button tren folder/team/tag row/card.
- Khong hien delete truc tiep cho system folder.
- Khong sua backend, database, migration, business logic, API contract.

## 5. Danh sach file du kien sua

- `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- `web/src/modules/folders/pages/FolderManagementPage.tsx`
- `web/src/modules/assignees/pages/AssigneeManagementPage.tsx`
- `web/src/modules/tags/pages/TagManagementPage.tsx`
- `web/src/styles.css`
- `docs/direct-delete-actions/implement-phase-.md`

## 6. Rui ro

- Direct delete phai dung `window.confirm` de tranh bam nham.
- Nut xoa trong task row phai `stopPropagation` de khong mo detail.
- Folder system `Inbox` khong duoc xoa.
- Assignee delete co the thanh deactivate theo backend rule neu dang duoc dung.

## 7. Cach test

- Chay `npm run build`.
- Chay `git diff --check`.
- Kiem tra UI web/mobile: nut Delete tren task, folder, team, tag; bam Delete khong mo/chon nham card.
- Kiem tra mobile task card: title khong bi ngan do nut delete, dong cuoi co deadline/progress/delete.
- Kiem tra web task board: khong con floating `+`, filter status/priority can bang hai cot.

## 8. Checklist checkpoint cuoi phase

- [x] Preflight branch/status/log.
- [x] CodeGraph discovery delete flows.
- [x] Plan scoped UI changes.
- [x] Implement direct delete buttons.
- [x] Audit diff.
- [x] Test build/diff check.
- [x] Bao cao checkpoint.
