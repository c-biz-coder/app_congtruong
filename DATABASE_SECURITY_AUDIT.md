# DATABASE & SECURITY AUDIT (Phase B, nhóm 1)

Trạng thái: AUDIT ONLY. Không sửa code, migration, RLS hay RPC trong đợt này.
Phạm vi: migration 009, 012, 013, 017, 018, 019 (đọc), 020; seed `roles.sql`, `role_permissions.sql`.
Commit đối chiếu: `592c398` (VS-01), nhánh `chc/rn-086-align`.

## Findings

### DB-SEC-01 (P1): PROJECT_MANAGER gán được mọi role, không chỉ WORKER và PROJECT_VIEWER — FIXED_PENDING_ACCEPTANCE (migration 021, pgTAP `subcontractor_project_visibility.test.sql`, `supabase test db` PASS). Chưa ACCEPTED.
- Vị trí: `supabase/migrations/20260923000020_project_manager_members.sql:41-55` (`assert_can_touch_role`), áp dụng ở `add_project_member` (dòng 56+) và `update_project_member_role` (dòng 107+).
- Hành vi: hàm chỉ chặn `p_role in ('SITE_MANAGER', 'PROJECT_MANAGER')`. Mọi role khác trong bảng `roles` đều được gán.
- Bảng `roles` hiện có: `SYS_ADMIN`, `SITE_MANAGER`, `SUB_CONTRACTOR`, `WORKER`, `PROJECT_VIEWER` (`supabase/seed/roles.sql:4-8`), cộng `PROJECT_MANAGER` (migration 018).
- Quyết định đã duyệt (owner, mục 1 "CHỐT QUYỀN PROJECT_MANAGER"): PROJECT_MANAGER chỉ thêm, sửa, thu hồi WORKER và PROJECT_VIEWER.
- Hệ quả: PROJECT_MANAGER có thể cấp `SYS_ADMIN` hoặc `SUB_CONTRACTOR` cho người khác trong dự án. Việc leo thang thực tế còn phụ thuộc vào cách ứng dụng đọc `project_memberships.role`. **Chưa kiểm chứng** trong code đọc quyền. Mức độ: UNVERIFIED impact, nhưng vi phạm trực tiếp quyết định đã duyệt.
- Đề xuất (chưa áp dụng): đổi allowlist trong `assert_can_touch_role` thành chỉ `WORKER` và `PROJECT_VIEWER` cho nhánh PROJECT_MANAGER. Cần migration mới (không sửa 020), kèm pgTAP test cho `SYS_ADMIN`, `SUB_CONTRACTOR`, `SITE_MANAGER`, `PROJECT_MANAGER`. Cần owner phê duyệt trước khi triển khai.

### DB-SEC-02 (P2): role `MAIN_BOD` được RLS tham chiếu nhưng không có trong seed
- Vị trí: `20260923000002_init_tenancy.sql:92`, `20260923000004_rls_hardening.sql:196`.
- Chưa được khai báo trong `supabase/seed/roles.sql`. Các policy so sánh với `auth.jwt()->>'role'` hoặc `current_app_role()`, nên có thể là tham chiếu chết hoặc role JWT cũ. **UNVERIFIED**.

### DB-SEC-03 (P1): SUBCONTRACTOR không thấy dự án mình tham gia — FIXED_PENDING_ACCEPTANCE (migration 021: policy `projects` SELECT thêm `is_participating_company`, chỉ mở ở mức project row; module data không mở rộng). Chưa kiểm tra ACL `has_function_privilege` trên DB thật. Chưa ACCEPTED.
- Vị trí: `20260923000013_soft_deleted_project_visibility.sql:7-10`. Policy `projects` chỉ cho xem trong tenant sở hữu và chưa bị xóa.
- Hệ quả: SUBCONTRACTOR không đọc được project qua RLS, dù có `project_companies` ACTIVE. Đây là quyết định nghiệp vụ, chưa có quyết định của owner. Không tự sửa.

### DB-SEC-04 (ghi nhận, không phải lỗ hổng): `write_audit` cấp EXECUTE cho `authenticated`
- Vị trí: `20260923000012_is_project_member_soft_delete.sql:103-104`.
- Hàm kiểm tra `auth.uid()`, tenant membership và project membership (dòng 36-60). Đã có kiểm soát, nhưng cần test pgTAP xác nhận user ngoài tenant/project không ghi được audit. **UNVERIFIED** cho trường hợp biên.

### DB-SEC-05 (ghi nhận): `workers` và `attendance` có policy ghi trực tiếp cho `authenticated`
- Vị trí: `20260923000003_init_workers.sql:37-51`, `20260923000019_init_attendance.sql:44-64`. Đây là các policy ghi bảng, không đi qua RPC.
- Theo owner, PROJECT_MANAGER phải kiểm tra tại RPC. Hai bảng này chưa có RPC kiểm soát tương đương. Thuộc phạm vi các slice sau, ghi nhận để rà soát.

### DB-SEC-06 (ghi nhận): trùng định nghĩa hàm
- `add_project_member` và `remove_project_member` được định nghĩa ở 017, 018 và 020. Phiên bản cuối (020) là phiên bản đang có hiệu lực. Không sửa lịch sử, nhưng rủi ro bảo trì cao.

## Đã xác minh

- `is_project_member` loại trừ dự án đã soft-delete (migration 012).
- Các hàm `SECURITY DEFINER` đều có `set search_path = ''`. Quan sát từ 009, 012, 013, 017, 018, 020.
- RPC quyền dự án có kiểm tra `auth.uid()` và `assert_member_manager` (020:24-38).
- `REVOKE`/`GRANT` có mặt cho các RPC đã liệt kê; `project_member_manager_level` và `assert_can_touch_role` chỉ cấp cho nội bộ.

## Chưa xác minh

- Ứng dụng đọc role từ `project_memberships` hay từ JWT, và SYS_ADMIN cấp ở project có tạo quyền thực tế không.
- Chưa chạy `supabase test db` trong đợt này để đối chiếu với các test hiện có.
- Chưa kiểm tra ACL thực tế trên DB local (`has_function_privilege`), chỉ đối chiếu bằng migration.

## Tiếp theo

1. Owner quyết định DB-SEC-01 và DB-SEC-03.
2. Đọc RPC/RLS nhóm multi-tenant và offline (Phase B nhóm 2 và 3).
3. Chạy kiểm tra ACL thực tế và `supabase test db` khi owner xác nhận, vì Docker có thể cần khởi động.
