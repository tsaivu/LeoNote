# PRD v1 — Sổ ghi chú cá nhân

## 1. Tổng quan sản phẩm

**Tên dự án:** Sổ ghi chú cá nhân
**Loại sản phẩm:** Web app quản lý ghi chú cá nhân hướng công việc
**Phiên bản:** MVP v1
**Người dùng chính:** Cá nhân người quản lý/cá nhân điều hành công việc hằng ngày

Sổ ghi chú cá nhân là một ứng dụng ghi chú có cấu trúc, dùng để ghi lại công việc, việc cần theo dõi, deadline, trạng thái xử lý, người phụ trách chính và các đầu việc con.

Sản phẩm không nhằm thay thế các công cụ quản trị dự án phức tạp. Mục tiêu là tạo một công cụ đơn giản, nhanh, rõ ràng, dễ nhập liệu, dễ tìm kiếm và dễ lọc lại công việc hằng ngày.

MVP chưa phải là hệ thống giao việc cộng tác hoàn chỉnh. Người được giao việc chưa cần nhận thông báo, chưa cần đăng nhập để xác nhận, và chưa cần phản hồi trạng thái. Assignee trong MVP là dữ liệu quản lý nội bộ để người dùng chính tự theo dõi.

---

## 2. Mục tiêu sản phẩm

Mục tiêu chính của MVP là tạo ra một app ghi chú cá nhân có khả năng quản lý công việc thực tế, đơn giản hơn Notion, rõ ràng hơn Google Keep, và ít phức tạp hơn các hệ thống task/project management.

Sản phẩm cần đạt các mục tiêu sau:

* Tạo ghi chú nhanh nhưng vẫn có cấu trúc.
* Mỗi ghi chú có tiêu đề, nội dung, deadline, trạng thái và độ ưu tiên.
* Mỗi ghi chú có một người phụ trách chính.
* Mỗi ghi chú có danh sách sub-task/checklist.
* Mỗi sub-task có một người phụ trách riêng.
* Quản lý ghi chú theo folder chính và tag phụ.
* Tìm kiếm và lọc nâng cao.
* Có đăng nhập và backend server.
* Có giao diện responsive dùng được trên desktop và mobile.
* Không làm notification, PWA/offline, AI, file đính kèm ở MVP.

---

## 3. Phạm vi MVP

## 3.1. Có trong MVP

MVP bao gồm các module sau:

1. Đăng nhập.
2. Quản lý ghi chú.
3. Quản lý sub-task/checklist.
4. Quản lý assignee.
5. Quản lý folder dạng cây.
6. Quản lý tag.
7. Dashboard/filter nhanh.
8. Tìm kiếm và lọc nâng cao.
9. Soft delete/thùng rác.
10. Responsive UI cho desktop và mobile.

## 3.2. Không có trong MVP

MVP không bao gồm:

* Notification/nhắc việc.
* Người được giao việc nhận thông báo.
* Người được giao việc đăng nhập để xác nhận.
* Cộng tác real-time.
* Offline mode.
* PWA.
* File/ảnh đính kèm.
* Voice-to-text.
* AI tóm tắt/gợi ý.
* Export PDF/Word.
* Phân quyền nhiều vai trò phức tạp.
* Lịch sử chỉnh sửa/version history.

---

## 4. Đối tượng người dùng

## 4.1. Người dùng chính

Người dùng chính là cá nhân cần ghi chú, theo dõi công việc, phân rã đầu việc và tự kiểm soát tiến độ.

Người dùng có thể dùng app trên:

* Desktop: để nhập liệu nhanh, quản lý danh sách, tìm kiếm và chỉnh sửa.
* Mobile: để xem nhanh, lọc nhanh, cập nhật trạng thái khi đang di chuyển.

## 4.2. Assignee trong MVP

Assignee là người được gắn vào ghi chú hoặc sub-task để người dùng chính dễ theo dõi trách nhiệm.

Trong MVP:

* Assignee là entity trong database.
* Assignee không cần tài khoản đăng nhập.
* Assignee không cần nhận thông báo.
* Assignee không cần xác nhận đã nhận việc.
* Assignee không cần thuộc nhóm/phòng ban.
* Assignee có thể được quản lý riêng: tạo, sửa, xóa mềm.

---

## 5. Khái niệm nghiệp vụ chính

## 5.1. Note / Main Task

Một ghi chú chính đồng thời là một đầu việc chính.

Mỗi ghi chú có:

* Tiêu đề.
* Nội dung.
* Deadline.
* Trạng thái.
* Độ ưu tiên.
* Một assignee chính.
* Folder.
* Tag.
* Danh sách sub-task.
* Thời gian tạo.
* Thời gian cập nhật.
* Trạng thái xóa mềm.

## 5.2. Sub-task / Checklist

Sub-task là đầu việc con nằm trong một ghi chú chính.

Mỗi sub-task có:

* Nội dung.
* Trạng thái hoàn thành.
* Một assignee riêng.
* Thứ tự hiển thị.
* Thời gian tạo.
* Thời gian cập nhật.

Mỗi sub-task chỉ thuộc một ghi chú chính.

## 5.3. Assignee

Assignee là danh sách người được dùng để gán vào note hoặc sub-task.

MVP không cần nhóm/phòng ban cho assignee.

## 5.4. Folder

Folder là cách tổ chức chính của ghi chú.

Yêu cầu:

* Folder có quản lý riêng.
* Folder hỗ trợ dạng cây nhiều cấp.
* Một ghi chú thuộc một folder chính.
* Có thể có folder mặc định như `Inbox` hoặc `Chưa phân loại`.

## 5.5. Tag

Tag là cách tổ chức phụ.

Yêu cầu:

* Tag có quản lý riêng.
* Một ghi chú có thể có nhiều tag.
* Cho phép tạo tag nhanh trong lúc tạo/sửa ghi chú.
* Tag dùng cho lọc và tìm kiếm.

---

## 6. Trạng thái và độ ưu tiên

## 6.1. Trạng thái ghi chú

Trạng thái cần tối giản.

Đề xuất trạng thái MVP:

* `TODO`: Chưa làm.
* `DOING`: Đang làm.
* `PENDING`: Chờ xử lý/chờ thêm thông tin.
* `DONE`: Đã xong.

## 6.2. Trạng thái sub-task

Sub-task có thể dùng trạng thái đơn giản:

* `TODO`: Chưa xong.
* `DONE`: Đã xong.

## 6.3. Độ ưu tiên

Độ ưu tiên gồm 4 mức:

* `LOW`
* `MEDIUM`
* `HIGH`
* `CRITICAL`

Mặc định khi tạo mới: `MEDIUM`.

---

## 7. Deadline

Mỗi ghi chú có deadline gồm cả ngày và giờ.

## 7.1. Format hiển thị

Giao diện hiển thị deadline theo định dạng:

```text
dd/mm/yyyy hh:mm
```

Ví dụ:

```text
02/06/2026 14:30
```

## 7.2. Lưu trữ backend

Backend lưu deadline bằng kiểu datetime chuẩn để lọc, sắp xếp và so sánh chính xác.

Yêu cầu:

* UI dùng múi giờ Việt Nam.
* Backend xử lý nhất quán theo giờ Việt Nam hoặc lưu UTC kèm quy đổi rõ ràng.
* Khi hiển thị lại cho người dùng, luôn hiển thị theo giờ Việt Nam.

---

## 8. Luồng sử dụng chính

## 8.1. Tạo ghi chú

Người dùng mở app, bấm tạo ghi chú mới và nhập:

* Tiêu đề.
* Nội dung.
* Deadline.
* Trạng thái.
* Độ ưu tiên.
* Assignee chính.
* Folder.
* Tag nếu cần.
* Danh sách sub-task nếu cần.

Người dùng bấm **Lưu** để tạo ghi chú.

MVP không dùng auto-save.

## 8.2. Cập nhật ghi chú

Người dùng có thể sửa:

* Tiêu đề.
* Nội dung.
* Deadline.
* Trạng thái.
* Độ ưu tiên.
* Assignee chính.
* Folder.
* Tag.
* Sub-task.

Sau khi sửa, người dùng bấm **Lưu**.

## 8.3. Quản lý sub-task

Trong chi tiết ghi chú, người dùng có thể:

* Thêm sub-task.
* Sửa nội dung sub-task.
* Gán assignee cho sub-task.
* Đánh dấu sub-task đã xong/chưa xong.
* Xóa sub-task.
* Sắp xếp sub-task theo thứ tự đơn giản nếu cần.

## 8.4. Tìm kiếm và lọc

Người dùng có thể tìm kiếm và lọc theo:

* Tiêu đề.
* Nội dung.
* Folder.
* Tag.
* Trạng thái.
* Độ ưu tiên.
* Deadline.
* Assignee chính.
* Assignee của sub-task.
* Hôm nay.
* Quá hạn.
* Đang làm.
* Chờ xử lý.

---

## 9. Dashboard và filter nhanh

MVP cần có khu vực dashboard hoặc filter nhanh.

Các filter tối thiểu:

* Hôm nay.
* Quá hạn.
* Đang làm.
* Chờ xử lý.
* Độ ưu tiên cao/critical.
* Đã xong.

Dashboard không cần phức tạp. Mục tiêu là giúp người dùng mở app lên là thấy ngay việc cần xử lý.

---

## 10. Giao diện người dùng

## 10.1. Desktop layout

Desktop tạm thời dùng bố cục 3 vùng:

1. Sidebar bên trái: folder tree, tag/filter nhanh.
2. Khu vực giữa: danh sách ghi chú.
3. Khu vực bên phải: chi tiết ghi chú.

## 10.2. Mobile layout

Mobile dùng luồng đơn giản:

1. Danh sách ghi chú.
2. Bấm vào một ghi chú để mở chi tiết.
3. Có nút quay lại danh sách.
4. Nút tạo mới luôn dễ thấy.

MVP chưa cần PWA/offline, nhưng giao diện mobile phải responsive tốt và dùng được như app.

---

## 11. Quản lý dữ liệu

## 11.1. Entity chính

Các entity chính trong MVP:

* User.
* Note.
* SubTask.
* Assignee.
* Folder.
* Tag.

## 11.2. Quan hệ dữ liệu

Quan hệ chính:

* Một User có nhiều Note.
* Một User có nhiều Assignee.
* Một User có nhiều Folder.
* Một User có nhiều Tag.
* Một Note thuộc một User.
* Một Note thuộc một Folder.
* Một Note có một Assignee chính.
* Một Note có nhiều Tag.
* Một Note có nhiều SubTask.
* Một SubTask có một Assignee.
* Một Folder có thể có Folder cha.
* Một Folder có thể có nhiều Folder con.

## 11.3. Soft delete

Các dữ liệu quan trọng nên dùng soft delete:

* Note.
* SubTask.
* Assignee.
* Folder.
* Tag.

Khi xóa ghi chú, ghi chú không bị xóa hẳn khỏi database mà được đưa vào thùng rác hoặc đánh dấu `deleted_at`.

---

## 12. Đăng nhập và bảo mật

MVP cần đăng nhập.

Yêu cầu:

* Người dùng phải đăng nhập để sử dụng app.
* Dữ liệu ghi chú được gắn với user.
* User chỉ thấy dữ liệu của chính mình.
* Password được hash.
* Backend API cần xác thực bằng token/session phù hợp.
* Không cần phân quyền phức tạp trong MVP.

---

## 13. Backend server và triển khai

MVP cần backend server.

Có thể cân nhắc hai hướng:

1. **Vercel/serverless**, nếu stack kỹ thuật phù hợp và không gây khó cho backend/database.
2. **Ubuntu server cá nhân**, nếu cần kiểm soát tốt hơn backend FastAPI, PostgreSQL, file cấu hình và deploy lâu dài.

Định hướng kỹ thuật đề xuất:

* Frontend: React + Vite.
* Backend: FastAPI.
* Database: PostgreSQL.
* Deployment: ưu tiên dễ kiểm soát và dễ bảo trì.

---

## 14. Yêu cầu phi chức năng

## 14.1. Hiệu năng

MVP cần phản hồi nhanh khi:

* Mở danh sách ghi chú.
* Tìm kiếm.
* Lọc theo dashboard/filter.
* Tạo/sửa ghi chú.
* Cập nhật trạng thái.

## 14.2. Tính ổn định

Không được để xảy ra:

* Mất ghi chú sau khi lưu.
* Ghi chú hiển thị sai user.
* Xóa nhầm không thể khôi phục.
* Deadline sai giờ Việt Nam.
* Assignee chính và assignee sub-task bị lẫn nhau.

## 14.3. Khả năng mở rộng

Thiết kế MVP cần để sau này mở rộng được:

* Notification.
* Người được giao việc đăng nhập.
* Cộng tác.
* File/ảnh đính kèm.
* AI.
* Voice-to-text.
* PWA/offline.

Tuy nhiên, không triển khai các tính năng này trong MVP.

---

## 15. Tiêu chí nghiệm thu MVP

MVP được coi là đạt khi:

1. Người dùng đăng nhập được.
2. Người dùng tạo được ghi chú có tiêu đề, nội dung, deadline, trạng thái, độ ưu tiên, folder, tag và assignee chính.
3. Người dùng thêm được sub-task vào ghi chú.
4. Mỗi sub-task gán được một assignee riêng.
5. Người dùng quản lý được assignee.
6. Người dùng quản lý được folder dạng cây.
7. Người dùng quản lý được tag.
8. Người dùng lọc được ghi chú theo hôm nay, quá hạn, đang làm, chờ xử lý.
9. Người dùng tìm kiếm được theo tiêu đề, nội dung, folder, tag, trạng thái, deadline, độ ưu tiên và assignee.
10. Người dùng xóa mềm được ghi chú.
11. Người dùng khôi phục được ghi chú từ thùng rác hoặc dữ liệu vẫn còn trong database để phục hồi.
12. Giao diện dùng được trên desktop.
13. Giao diện dùng được trên mobile.
14. Deadline hiển thị đúng định dạng `dd/mm/yyyy hh:mm`.
15. Deadline xử lý đúng theo giờ Việt Nam.
16. Dữ liệu của user này không lộ sang user khác.

---

## 16. Các quyết định đã chốt

* Ghi chú có deadline và trạng thái.
* Tiêu đề và nội dung là hai trường riêng.
* Có checklist/sub-task.
* Có assignee chính cho ghi chú.
* Có assignee riêng cho từng sub-task.
* Assignee là entity trong database, không phải text tự do.
* Assignee không cần nhóm/phòng ban ở MVP.
* Mỗi ghi chú có một assignee chính.
* Mỗi sub-task có một assignee.
* Deadline có cả ngày và giờ.
* UI hiển thị deadline theo `dd/mm/yyyy hh:mm`.
* Sử dụng giờ Việt Nam.
* Không cần notification ở MVP, chỉ cần lọc.
* Folder là cách tổ chức chính.
* Tag là cách tổ chức phụ.
* Folder có quản lý riêng.
* Folder hỗ trợ dạng cây.
* Tag có quản lý riêng và có thể tạo nhanh.
* Trạng thái tối giản.
* Có priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
* Không auto-save, dùng nút Lưu.
* Có tìm kiếm/lọc nâng cao.
* Có đăng nhập.
* Có backend server.
* Có thể cân nhắc Vercel hoặc Ubuntu server cá nhân.
* Xóa mềm/thùng rác.
* Responsive mobile UI.
* Chưa cần PWA/offline ở MVP.

---

## 17. Rủi ro cần kiểm soát

## 17.1. MVP bị phình thành app quản trị công việc phức tạp

Cần giữ rõ ràng: chưa có notification, chưa có cộng tác, chưa có xác nhận từ người được giao.

## 17.2. Assignee bị hiểu nhầm là user đăng nhập

MVP cần tách rõ:

* User là người dùng hệ thống.
* Assignee là danh bạ người phụ trách để gắn vào note/sub-task.

## 17.3. Deadline sai múi giờ

Cần quy chuẩn từ đầu cách lưu và hiển thị deadline theo giờ Việt Nam.

## 17.4. Folder tree gây phức tạp UI

Cần làm đơn giản:

* Tạo folder.
* Sửa folder.
* Xóa mềm folder.
* Chọn folder cho note.
* Hiển thị folder dạng cây.

Chưa cần kéo thả folder trong MVP.

## 17.5. Tìm kiếm nâng cao quá rộng

MVP nên làm đủ các filter chính, chưa cần fuzzy search hoặc AI search.

---

## 18. Kết luận MVP

MVP của Sổ ghi chú cá nhân là một hệ thống ghi chú có cấu trúc, tập trung vào việc giúp người dùng cá nhân ghi lại, phân loại, giao trách nhiệm theo dõi và kiểm soát tiến độ công việc hằng ngày.

Sản phẩm phải đơn giản, nhanh, dễ tìm, dễ lọc, dùng tốt trên desktop và mobile.

MVP không giải quyết bài toán cộng tác hay notification, nhưng thiết kế dữ liệu phải đủ sạch để có thể mở rộng sang các tính năng đó ở các phase sau.
