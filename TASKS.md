# Project Backlog: SpendGuard AI

| Task ID | Tên nhiệm vụ | Mô tả ngắn | Độ khó | Ước tính | Phụ thuộc | MVP / Optional |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SETUP-01** | Khởi tạo Workspace & Git | Tạo thư mục dự án, git init, cấu trúc thư mục, file README.md ban đầu. | Dễ | 1 giờ | Không | **Bắt buộc (MVP)** |
| **DB-01** | Khởi tạo CSDL SQLite & Schema | Viết script khởi tạo CSDL SQLite (`rules`, `limits`, `proposals`, `logs`). | Trung bình | 2 giờ | SETUP-01 | **Bắt buộc (MVP)** |
| **BE-01** | Khung Express Server & API Rules | Tạo Express server, kết nối SQLite, viết API CRUD cho quy tắc an toàn & hạn mức. | Trung bình | 3 giờ | DB-01 | **Bắt buộc (MVP)** |
| **AI-01** | AI Agent Simulator API | Xây dựng endpoint mô phỏng AI Agent gửi yêu cầu hành động (payload JSON: số tiền, mô tả, ví đích). | Dễ | 2 giờ | BE-01 | **Bắt buộc (MVP)** |
| **BE-02** | SpendGuard Core Engine | Viết logic kiểm tra: so khớp đề xuất của AI với hạn mức chi tiêu và quy tắc an toàn. Tự động chặn hoặc đưa vào trạng thái chờ. | Khó | 4 giờ | AI-01 | **Bắt buộc (MVP)** |
| **NEAR-01** | Tích hợp NEAR Testnet & API | Viết module tích hợp `near-api-js` để kết nối NEAR Testnet và xử lý ký/gửi giao dịch khi được duyệt. | Khó | 4 giờ | BE-02 | **Bắt buộc (MVP)** |
| **FE-01** | Giao diện Dashboard (Tailwind) | Dựng giao diện HTML + Tailwind CSS (bảng danh sách đề xuất, form cài đặt hạn mức, trạng thái ví NEAR). | Trung bình | 4 giờ | SETUP-01 | **Bắt buộc (MVP)** |
| **FE-02** | Tích hợp Frontend & API/NEAR | Viết JavaScript gọi Backend API để render dữ liệu, xử lý sự kiện bấm nút Phê duyệt/Từ chối và kết nối ví NEAR. | Trung bình | 4 giờ | FE-01, NEAR-01 | **Bắt buộc (MVP)** |
| **TEST-01** | Kiểm thử & Sửa lỗi (Testing) | Viết script test hoặc kiểm thử thủ công các kịch bản: vượt hạn mức, đúng hạn mức, duyệt giao dịch Testnet. | Trung bình | 3 giờ | FE-02 | **Bắt buộc (MVP)** |
| **DOC-01** | Hoàn thiện tài liệu & Demo | Viết hướng dẫn chạy chi tiết trong README.md, quay video demo và chuẩn bị bài nộp. | Dễ | 2 giờ | TEST-01 | **Bắt buộc (MVP)** |
