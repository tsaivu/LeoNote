# Mobile Dashboard Layout Implementation Phase

## 1. MUC TIEU CUOI CUNG CUA PHASE NAY

Sua scroll thua tren mobile o man hinh dashboard/task khi noi dung ngan, vi du chi co mot task, va sap xep lai bottom navigation thanh `Tasks - Folders - Create - Team - More..` ma khong thay doi data flow, API contract, backend, hoac cac man hinh management khac.

## 2. Hien trang code sau khi doc bang CodeGraph

- Route `/` render `NotesWorkspacePage`.
- `NotesWorkspacePage` chua mobile header, filter panel, task board va table card mobile.
- Dashboard summary dung `useDashboardSummary -> dashboardService -> dashboardRepository -> /dashboard/summary`.
- Notes data layer va mutation hooks khong lien quan den loi scroll thua.
- Mobile layout dang co nhieu lop padding/min-height: `app-mobile-shell`, `taskflow-shell`, va `taskflow-board`.
- Bottom nav cu hien thi 6 item truc tiep, lam menu hep va xau tren mobile.

## 3. Route/page/component/hook/service/repository/API lien quan

- Route/page: `web/src/app/App.tsx`, `web/src/modules/notes/pages/NotesWorkspacePage.tsx`
- Component shared: `DesktopSidebar`, `MobileAppHeader`, bottom nav trong `App`
- Hook/ViewModel: notes hooks trong `web/src/modules/notes/hooks/useNotes.ts`, dashboard summary hook `useDashboardSummary`
- Service/repository/API: `dashboardService`, `dashboardRepository`, notes services/repositories; khong can sua
- Style: `web/src/styles.css`

## 4. Pham vi thay doi

- Them class wrapper rieng cho route task dashboard tren mobile.
- Giam padding/min-height cong don chi trong scope `.app-mobile-shell-tasks`.
- Doi bottom nav mobile thanh 5 item chinh va them More menu chua Profile, Trash, Tags.
- Can chinh lai nut Create trong bottom nav de khong lech, chi hien dau `+`, va dam bao bottom nav khong hien trong web layout.
- Tablet portrait can khong de task table tran ngang viewport.
- Mobile filter panel phai hien thanh hai dong: dong status va dong priority rieng.
- Logo/app icon/avatar su dung `web/public/lion.png` thay icon CSS/SVG cu.
- Login hero bo marketing copy, chi giu logo lion lon va ten app.
- Login mobile giam kich thuoc logo lion va padding de tranh scroll khong can thiet.
- Khong sua backend, database, migration, business logic, API contract.

## 5. Danh sach file du kien sua

- `web/src/app/App.tsx`
- `web/src/styles.css`
- `docs/mobile-dashboard-layout/implement-phase-.md`

## 6. Rui ro

- Neu co route khac dung chung task layout nhung khong phai `/`, class scoped se khong ap dung.
- Neu danh sach task dai, page van can scroll tu nhien; thay doi khong duoc chan scroll noi dung that.
- Can kiem tra tren viewport mobile vi browser chrome/address bar co the thay doi chieu cao viewport.
- More menu can duoc dong khi dieu huong sang route moi de tranh che noi dung.

## 7. Cach test

- Chay `npm run build`.
- Chay `git diff --check`.
- Kiem tra mobile viewport: dashboard/task voi mot task khong co khoang trong scroll thua; voi nhieu task van scroll duoc.
- Kiem tra bottom nav mobile: Tasks, Folders, Create, Team, More..; More mo duoc Profile, Trash, Tags.
- Kiem tra Create o bottom nav can giua, chi hien dau `+` tren mobile va khong hien trong web layout.
- Kiem tra tablet portrait: task table khong tran khoi board/page.
- Kiem tra mobile filter: status va priority khong bi ep chung mot hang.
- Kiem tra favicon/PWA icon/sidebar/mobile avatar hien lion image tu `public/lion.png`.
- Kiem tra login hero khong con text marketing va logo lion du lon.
- Kiem tra login mobile khong scroll khi noi dung form binh thuong.

## 8. Checklist checkpoint cuoi phase

- [x] Preflight branch/status/log.
- [x] CodeGraph discovery route/page/component/data flow.
- [x] Plan scoped UI fix.
- [x] Implement scoped mobile layout fix.
- [x] Implement More bottom navigation.
- [x] Audit diff.
- [x] Test build/diff check.
- [x] Bao cao checkpoint.
