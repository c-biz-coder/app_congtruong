# PRODUCT REQUIREMENTS DOCUMENT (PRD) — Partner OS

**Dự án:** Partner OS — Hệ thống Quản trị Nhân lực & Thi công Công trường
**Đặc thù:** Multi-tenant (Đa tiền thuê), Offline-first (Ưu tiên ngoại tuyến), Đa ngôn ngữ.
**Mục tiêu:** Kim chỉ nam cho AI Agents và đội phát triển hiểu rõ 13 phân hệ
trước khi thiết kế Database Schema và UI.

---

## I. Tổng quan người dùng & phân quyền (RBAC)

Roles tĩnh ánh xạ trực tiếp vào Supabase RLS (`packages/auth`, `supabase/seed/roles.sql`):

1. **SYS_ADMIN** — Quản trị viên hệ thống.
2. **PROJECT_VIEWER** — Xem dữ liệu công trình được phân quyền và xuất báo cáo; không tạo/sửa/xóa, không quản lý nhân sự (thay thế MAIN_BOD, migration 008).
3. **SITE_MANAGER** — Chỉ huy trưởng công trường.
4. **SUB_CONTRACTOR** — Quản lý thầu phụ (chỉ nhân sự/vật tư của đội mình).
5. **WORKER** — Công nhân (lịch, phiếu lương, báo cáo an toàn qua App).

## II. Chi tiết 13 phân hệ

1. **Định danh & Phân quyền (Auth & Onboarding)** — Web quản lý tài khoản thầu
   phụ + QR; Mobile đăng nhập PIN/Biometrics, onboarding chụp CCCD.
2. **Hồ sơ Nhân sự (HRM)** — Web lưu hợp đồng/chứng chỉ, cảnh báo hết hạn;
   Mobile thẻ công nhân QR + tra cứu kỹ năng.
3. **Chấm công & Vị trí** — Web tổng hợp công, duyệt OT; Mobile GPS + offline
   + chấm công hộ tổ đội.
4. **An toàn Lao động (HSE & TBM)** — Web dashboard chỉ số an toàn/quỹ phạt;
   Mobile điểm danh TBM, chụp ảnh vi phạm offline.
5. **Tính lương & Công nhật** — Web công thức lương, tạm ứng, xuất Excel/PDF;
   Mobile phiếu lương + khiếu nại.
6. **Nhà thầu phụ (Hub)** — Web đánh giá năng lực, khối lượng khoán; Mobile
   xác nhận khối lượng / ký số.
7. **Giao việc & Nhật ký thi công** — Web Gantt kế hoạch vs thực tế; Mobile
   nhật ký thi công offline (thời tiết, người, thiết bị, ảnh).
8. **Tài liệu & Bản vẽ** — Web upload PDF/CAD phiên bản + watermark; Mobile
   pre-download xem offline dưới hầm.
9. **QA/QC & Punchlist** — Web checklist nghiệm thu; Mobile punchlist + khoanh
   đỏ trên ảnh offline.
10. **Tài sản & Vật tư** — Web máy móc, bảo trì, hao hụt; Mobile QR mượn/trả,
    báo hỏng.
11. **Quyết toán & Khối lượng** — Web hồ sơ thanh toán, đối chiếu QA/QC;
    **không hỗ trợ Mobile**.
12. **Giao tiếp & Thông báo** — Web push/SMS khẩn; Mobile đa ngôn ngữ, dịch tự
    động Việt <-> Hàn <-> Anh.
13. **Dashboard & Analytics** — Web biểu đồ động; Mobile dashboard thu gọn cho
    Chỉ huy trưởng.

## III. Yêu cầu phi chức năng (cho AI Agent)

1. Schema mới phải có Zod Schema tương ứng tại `packages/contracts/schemas`.
2. Mobile: mọi write đều vào WatermelonDB local trước, không gọi Supabase trực tiếp.
3. Không rò rỉ dữ liệu tài chính/đơn giá/nhân sự giữa thầu phụ A và B (RLS).