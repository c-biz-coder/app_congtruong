# ADR-001: Hồ sơ thiết kế migration M-A đến M-F

> Trạng thái: **ĐỀ XUẤT – CHỜ DUYỆT**. Không tạo, không chạy migration nào từ tài liệu này.
> Căn cứ: [ADR-001-monorepo.md](./ADR-001-monorepo.md) mục "Đã duyệt bổ sung" và "Q-PM".
> 007b giữ trạng thái **IMPLEMENTED + TESTED – PENDING ACCEPTANCE**. 007c, 007d, 007e chưa được duyệt.

## 0. Sự kiện kiểm tra schema hiện tại (đọc từ repo)

| # | Phát hiện | Bằng chứng | Hệ quả |
| --- | --- | --- | --- |
| S1 | `project_memberships` **không có cột thu hồi** (`status`, `revoked_at`). Thu hồi hiện tại = xóa dòng. | [20260923000009_project_memberships.sql](../../supabase/migrations/20260923000009_project_memberships.sql) dòng 25–38 | Không thể khôi phục "membership đã thu hồi" nếu không lưu lịch sử. Cần quyết định ở M-D (xem Q-D1). |
| S2 | `is_project_member` không lọc `projects.deleted_at` và không lọc `project_companies.status`. | 007b dòng 93–102 | Project xóa mềm và công ty `ENDED`/`SUSPENDED` vẫn cho quyền đọc qua helper. Cần M-B và M-F xử lý. |
| S3 | `is_main_contractor_manager` so sánh chuỗi cứng `pm.role = 'SITE_MANAGER'`, không dùng scope. | 007b dòng 110–125 | Sau M-A, role này đổi sang `PROJECT_MANAGER`. Helper phải sửa theo, nếu không quyền sẽ mất hoặc sai. |
| S4 | Role `COMPANY_ADMIN`, `PROJECT_MANAGER`, `SITE_SUPERVISOR` không có trong migration. Chỉ `PROJECT_VIEWER` được thêm bởi 008. | grep `insert into public.roles` và `roles` | `project_memberships.role` có FK tới `roles(name)`. M-A phải thêm role trước khi ghi membership mới. Đã kiểm tra `supabase/seed/roles.sql`: chỉ có 5 role cố định `SYS_ADMIN`, `PROJECT_VIEWER`, `SITE_MANAGER`, `SUB_CONTRACTOR`, `WORKER`. `PROJECT_VIEWER` có từ 008, 4 role còn lại có từ seed. |
| S5 | Bảng có `project_id`: `workers` (nullable, `on delete set null`), `project_companies`, `project_memberships`. Không tìm thấy bảng nghiệp vụ khác trong migration. | grep `project_id` | Phạm vi M-B hiện chỉ gồm `projects`, `workers`, `project_companies`, `project_memberships`. Module chấm công, công việc, nhật ký, vật tư **chưa tồn tại** trong schema. |
| S6 | Policy `projects` (004) và `workers` (003, 004) đọc `current_app_role()` và `current_tenant_id()` từ JWT. Policy 004 có `'SYS_ADMIN'` và `'SUB_CONTRACTOR'` dạng chuỗi. | 004 dòng 138–221; 003 dòng 40–54; 002 dòng 92–99 | Đây là phụ thuộc vào claim. M-C và M-F phải thay đổi các policy này. |
| S7 | Hook `custom_access_token_hook` lấy một membership bằng `order by created_at, id limit 1`. | 004 phần đầu | Token có thể mang tenant/role sai khi user có nhiều membership. Không sửa hook trong giai đoạn này. |

## 1. Quyết định cần chủ dự án duyệt trước khi viết hồ sơ chi tiết

| Mã | Câu hỏi | Đề xuất | Trạng thái |
| --- | --- | --- | --- |
| Q-D1 | Thu hồi membership: giữ lịch sử ở đâu? | Thêm bảng `project_membership_history` ghi mỗi lần INSERT/DELETE (trigger). Không thêm cột `revoked_at` vào bảng hiện tại, để không đổi 007b. | ĐÃ DUYỆT (người dùng, 2026-11-18) |
| Q-D2 | Hàng `project_memberships` đã bị xóa có khôi phục được không? | Không. M-D chỉ khôi phục project. Người được cấp lại phải có một quyết định mới (một INSERT mới, có audit). | ĐÃ DUYỆT (người dùng, 2026-11-18) |
| Q-D3 | Thứ tự M-B và M-F | M-B trước (lọc deleted_at và status), M-F sau (đổi nguồn quyền sang DB). | ĐÃ DUYỆT (người dùng, 2026-11-18) |
| Q-D4 | Có thêm role `COMPANY_ADMIN`, `PROJECT_MANAGER`, `SITE_SUPERVISOR` vào `roles` ở M-A không? | Thêm ba role này vào `roles` ở M-A. Không đổi role của user hiện có. | ĐÃ DUYỆT (người dùng, 2026-11-18) |

## 2. Hồ sơ M-A: Lớp ánh xạ role một chỗ

**Mục tiêu và phạm vi:** Ghi lại đề xuất ánh xạ role cũ sang role mới cho từng tài khoản, để người duyệt quyết định thủ công. Không tự đổi dữ liệu. Phạm vi: `SITE_MANAGER` (theo D-SM, M1). `MAIN_BOD` đã xử lý ở 008.

**Schema thay đổi**
- Bảng mới `role_migration_reviews`: `id`, `source_table` (`memberships` | `project_memberships`), `source_id`, `user_id`, `tenant_id`, `project_id` (nullable), `project_company_id` (nullable), `participation_type` (snapshot), `old_role`, `suggested_role`, `decided_role` (nullable), `decided_by`, `decided_at`, `note`, `created_at`.
- Ràng buộc: unique `(source_table, source_id)`. Check `decided_role` thuộc `roles`. Check `decided_role` nếu có thì `decided_by` và `decided_at` không null.
- Thêm role vào `roles` (sau Q-D4): `COMPANY_ADMIN`, `PROJECT_MANAGER`, `SITE_SUPERVISOR`.

**RLS/policy:** Bảng review chỉ có RLS bật. Không policy cho `authenticated`. Chỉ truy cập qua service/Dashboard của người được ủy quyền.

**Quan hệ phụ thuộc:** Cần Q-D4. Không đổi `memberships.role` hay `project_memberships.role` của dòng hiện có.

**Backfill và dữ liệu cũ**
- Tạo đề xuất cho mọi `SITE_MANAGER`:
  - `MAIN_CONTRACTOR` → `suggested_role = PROJECT_MANAGER`, `needs_manual_review = true`.
  - `SUBCONTRACTOR` → `suggested_role = SITE_SUPERVISOR`.
- Không có đề xuất cho `COMPANY_ADMIN` (không tồn tại trong dữ liệu cũ).
- Trường hợp không đủ dữ liệu: `participation_type` không xác định (không có `project_companies`), hoặc `project_memberships` không tồn tại → ghi `status = needs_info`, không đề xuất.

**Rollback:** Chuyển bảng review sang `archive` rồi `drop table`. Không đụng `memberships`, `project_memberships`.

**pgTAP tối thiểu**
- Không tạo dòng `decided_role` nếu chưa có người duyệt.
- Không cho `decided_role` là role có quyền cao hơn `suggested_role` (không nâng quyền).
- Không tạo hai review cùng một `(source_table, source_id)`.
- User `authenticated` không đọc được bảng review.

**Kiểm thử hồi quy:** Toàn bộ `supabase test db` cũ (33 test 007b, 7 test 008, các test 001–006) phải đạt.

**Rủi ro:** Ánh xạ tự động sai cho SITE_MANAGER của Main Contractor → mức Cao. Biện pháp: không có hàm tự quyết, mọi chuyển đổi phải qua `decided_role`.

**Điều kiện nghiệm thu:** Chủ dự án duyệt danh sách review trên staging (ẩn danh). Không có chuyển đổi nào trên production.

## 3. Hồ sơ M-B: Soft-delete và trạng thái công ty tham gia

**Mục tiêu và phạm vi:** Project đã xóa mềm (`deleted_at is not null`) và công ty có `status <> 'ACTIVE'` không cho truy cập nghiệp vụ qua helper và policy (D-SOFT, S2).

**Schema thay đổi:** Không thêm cột. Có thể thêm index `projects(deleted_at)` nếu cần (đánh giá theo số dòng thật trên staging).

**RLS/policy thay đổi**
- `create or replace` `is_project_member`, `is_main_contractor_manager`: thêm `join projects p ... p.deleted_at is null` và `pc.status = 'ACTIVE'`.
- Viết lại policy `projects` (004) và `workers`, `project_companies`, `project_memberships` để thêm `deleted_at is null` khi đọc nghiệp vụ.
- Lấy danh sách policy và bảng con bằng truy vấn `pg_policies` và `information_schema.columns` trước khi viết. Không dựa vào danh sách trong tài liệu.

**Quan hệ phụ thuộc:** Sau M-A, helper dùng role mới. Nếu M-B chạy trước M-A, helper vẫn dùng `'SITE_MANAGER'`. Đề xuất: M-B không đổi tên role, chỉ thêm điều kiện trạng thái.

**Backfill và dữ liệu cũ:** Không xóa dữ liệu. Membership của project đã xóa mềm **được giữ nguyên** (D-SOFT). Chỉ các truy vấn nghiệp vụ bị chặn.

**Rollback:** File `.down.sql` khôi phục định nghĩa helper và policy từ bản trước (lưu trong `supabase/rollbacks/`). Không cần khôi phục dữ liệu.

**pgTAP tối thiểu**
- Project đã xóa mềm: MAIN_CONTRACTOR manager không đọc được `projects`, `workers`.
- Project đã xóa mềm: `project_memberships` của nó vẫn còn (không mất dữ liệu).
- Công ty `SUSPENDED` hoặc `ENDED` không đọc được `workers` của project.
- Không có regression với project `ACTIVE`.

**Kiểm thử hồi quy:** 007b (33 test), 008 (7 test), 003/004 workers và projects.

**Rủi ro:** Policy cũ bị quên một bảng con có `project_id` → rò dữ liệu. Biện pháp: danh sách bảng con lấy từ `information_schema`, có test cho từng bảng.

**Điều kiện nghiệm thu:** pgTAP đạt, audit staging cho thấy số membership không đổi trước và sau M-B.

## 4. Hồ sơ M-C: Bỏ đường cross-tenant qua SYS_ADMIN

**Mục tiêu và phạm vi:** Không cho SYS_ADMIN trong JWT đọc hoặc ghi dữ liệu tenant khác (D-SYS). Quản trị hệ thống chỉ qua Supabase Dashboard.

**Schema thay đổi:** Không.

**RLS/policy thay đổi:** Viết lại các policy 001–004 có `'SYS_ADMIN'` trong danh sách (xem S6). Các policy này bỏ nhánh SYS_ADMIN, giữ nguyên quyền nghiệp vụ của tenant. Không thêm quyền toàn cục mới.

**Quan hệ phụ thuộc:** Phụ thuộc M-B (cùng sửa policy `projects`, `workers`). Nên gộp thứ tự để tránh viết lại hai lần; nếu tách, M-C chạy sau M-B.

**Backfill và dữ liệu cũ:** Không có. Nếu có tài khoản SYS_ADMIN đang dùng thật, ghi vào báo cáo audit (chưa xác minh).

**Rollback:** Khôi phục policy cũ từ file `.down.sql`.

**pgTAP tối thiểu**
- User có claim `app_role = 'SYS_ADMIN'` không đọc được `workers` hay `projects` của tenant khác.
- Cập nhật `membership.test.sql` và `workers.test.sql` theo mô hình mới (test hiện có chứa kỳ vọng cũ phải được rà soát, không xóa để pass).

**Kiểm thử hồi quy:** Toàn bộ test RLS 001–008.

**Rủi ro:** Có người dùng SYS_ADMIN thật đang phụ thuộc quyền cross-tenant → mất truy cập. Biện pháp: audit staging liệt kê tài khoản SYS_ADMIN và cách họ đang truy cập; báo chủ dự án trước.

**Điều kiện nghiệm thu:** Không SYS_ADMIN claim nào đọc được dữ liệu tenant khác trong pgTAP. Chủ dự án xác nhận danh sách người bị ảnh hưởng.

## 5. Hồ sơ M-D: Lịch sử xóa/khôi phục project và membership

**Mục tiêu và phạm vi:** Thêm `soft_delete_project` và `restore_project` (M5). Restore chỉ đặt `deleted_at = null`, không khôi phục membership đã thu hồi. Ghi lịch sử.

**Schema thay đổi**
- `project_history`: `id`, `project_id`, `event` (`DELETED` | `RESTORED`), `actor_user_id`, `tenant_id`, `reason`, `occurred_at`. Append-only (không update/delete cho `authenticated`).
- `project_membership_history` (Q-D1): ghi INSERT/DELETE của `project_memberships` qua trigger, gồm `actor_user_id`, `old` và `new` dạng jsonb.

**RLS/policy thay đổi**
- Đọc lịch sử: COMPANY_ADMIN của tenant sở hữu.
- Ghi lịch sử: chỉ qua hàm security definer.

**Hàm**
- `restore_project(p_project_id)`: kiểm tra caller là COMPANY_ADMIN (scope COMPANY) của `projects.tenant_id`, hoặc có người ủy quyền hợp lệ. Đặt `deleted_at = null`. Ghi `project_history`. Không đụng `project_memberships`.
- `soft_delete_project(p_project_id, p_reason)`: cùng kiểm tra. Đặt `deleted_at = now()`.

**Quan hệ phụ thuộc:** Phụ thuộc M-B (helper đã lọc deleted_at). Cần Q-D1, Q-D2.

**Backfill và dữ liệu cũ:** Project đã xóa mềm trước đây không có lịch sử. Ghi một dòng `event = 'LEGACY_DELETED'` với `occurred_at` không rõ (ghi `null`, đánh dấu là dữ liệu cũ). Không suy đoán thời điểm.

**Rollback:** Archive hai bảng lịch sử, drop hàm và trigger. Không xóa project hay membership.

**pgTAP tối thiểu**
- Người không phải COMPANY_ADMIN của tenant sở hữu không restore được.
- COMPANY_ADMIN của tenant khác không restore được.
- Restore xong, `project_memberships` đã thu hồi (đã xóa) vẫn không tồn tại.
- Mỗi lần delete/restore có đúng một dòng lịch sử.
- `project_history` không update/delete được.

**Kiểm thử hồi quy:** Toàn bộ test 007b và M-B.

**Rủi ro:** Không biết lý do membership đã bị xóa (không có cột thu hồi, S1). Biện pháp: Q-D1 để có lịch sử từ thời điểm triển khai trở đi.

**Điều kiện nghiệm thu:** Chủ dự án duyệt Q-D1, Q-D2. pgTAP đạt. Thao tác restore được ghi lịch sử trên staging.

## 6. Hồ sơ M-E: Audit log append-only

**Mục tiêu và phạm vi:** Ghi lại thao tác đặc quyền và xuất báo cáo (D-AUD, Q-PM-3). Phải có trước M-D nếu M-D cần ghi audit, và trước mọi chức năng quản trị đặc quyền.

**Schema thay đổi:** `audit_log` gồm `id`, `occurred_at`, `actor_user_id`, `action`, `target_type`, `target_id`, `tenant_id`, `project_id`, `project_company_id`, `payload jsonb`, `request_id`.

**RLS/policy thay đổi**
- Không có policy `update`/`delete`. Revoke grant `update`, `delete`, `truncate` từ `authenticated` và `anon`.
- Trigger `before update or delete` ném lỗi.
- Đọc: COMPANY_ADMIN của `tenant_id` tương ứng.
- Ghi: qua hàm security definer `write_audit(...)`, kiểm tra actor hợp lệ.

**Quan hệ phụ thuộc:** Độc lập với schema. Cần cho M-D và cho xuất báo cáo của PROJECT_MANAGER (Q-PM-3).

**Backfill và dữ liệu cũ:** Không có. Audit bắt đầu từ thời điểm triển khai, không suy đoán lịch sử.

**Rollback:** Không xóa dữ liệu audit. Rollback chỉ gỡ hàm ghi, và chỉ khi bảng còn rỗng. Nếu đã có dữ liệu thì không rollback mà giữ nguyên.

**pgTAP tối thiểu**
- `update` và `delete` trên `audit_log` bị từ chối, kể cả với role `postgres` qua trigger (kiểm tra thực tế).
- User không thuộc tenant không đọc được.
- `write_audit` từ chối actor không có quyền liên quan.

**Kiểm thử hồi quy:** Test RLS hiện có không đổi.

**Rủi ro:** Ghi quá nhiều dữ liệu (PII trong `payload`). Biện pháp: payload chỉ chứa khóa định danh và mục đích; danh sách trường cho phép phải được duyệt.

**Điều kiện nghiệm thu:** pgTAP đạt. Chủ dự án duyệt danh sách trường `payload` cho từng action.

## 7. Hồ sơ M-F: Chuyển policy tenant từ claim sang DB

**Mục tiêu và phạm vi:** Quyết định quyền dựa trên `memberships` và `project_memberships` trong DB, không dựa vào claim (D-AUTH, D-REV). Thu hồi có hiệu lực ở truy vấn kế tiếp, dù JWT cũ còn hạn.

**Schema thay đổi:** Không.

**RLS/policy thay đổi**
- Helper mới: `my_tenant_ids()` (đã có), `has_project_role(p_project_id, p_roles text[])`, `has_project_company_role(p_project_company_id, p_roles text[])`. Đều `security definer`, `search_path=''`.
- Viết lại policy đang dùng `current_tenant_id()` và `current_app_role()` (S6).
- Hook `custom_access_token_hook` **giữ nguyên** trong giai đoạn này.

**Quan hệ phụ thuộc:** Phụ thuộc M-A (role mới), M-B (lọc deleted_at và status), M-C (bỏ SYS_ADMIN). Đây là bước cuối cùng.

**Backfill và dữ liệu cũ:** Không.

**Rollback:** Khôi phục policy cũ từ `.down.sql`. Hook không thay đổi nên rollback không ảnh hưởng token.

**pgTAP tối thiểu**
- Xóa `project_memberships` của user, token cũ còn hạn: truy vấn kế tiếp bị từ chối.
- Đổi claim `tenant_id` của token cũ sang tenant khác: không đọc được dữ liệu tenant mới.
- Không cross-company trong cùng project.
- Không cross-project.

**Kiểm thử hồi quy:** Toàn bộ test RLS, cộng test frontend và backend nếu có đọc claim (xem mục 9).

**Rủi ro:** Frontend (`apps/web/src/features/auth/membership.ts`, `App.tsx`) và `packages/auth` vẫn đọc claim để hiển thị. Nếu claim sai, UI sai nhưng DB vẫn chặn. Mức Trung bình.

**Điều kiện nghiệm thu:** Các test thu hồi tức thì đạt. Chủ dự án duyệt phạm vi thay đổi frontend nếu cần.

## 8. Thứ tự đề xuất và phụ thuộc

```
M-E (audit)  ──────────────┐
M-A (role review) ──┐      │
                    ├─> M-B (soft-delete, status) ──> M-C (bỏ SYS_ADMIN) ──> M-D (restore + history) ──> M-F (DB-based authz)
                    │
007c (role mapping) ── chỉ sau khi M-A được duyệt và không tạo chức năng đặc quyền
```

- M-E phải xong trước M-D nếu M-D ghi audit, và trước mọi chức năng đặc quyền.
- M-A không phụ thuộc M-B nhưng cần Q-D4.
- 007c không được gộp với M-F.

## 9. Phụ thuộc RLS, helper, membership, hook và frontend

| Thành phần | Phụ thuộc | Ghi chú |
| --- | --- | --- |
| `memberships` | Hook, `my_tenant_ids`, policy 002–004 | Deprecated role; dùng để biết tenant. |
| `project_companies` | `is_project_member` (không lọc status), `project_memberships` FK | Cần M-B. |
| `project_memberships` | `is_project_member`, `is_main_contractor_manager` | Không có cột thu hồi (S1). |
| `custom_access_token_hook` | Claim `tenant_id`, `app_role` (004) | Lấy một membership (S7). Không sửa trong giai đoạn này. |
| `current_app_role()` / `current_tenant_id()` | Policy 002–004 | Đây là chỗ M-C và M-F thay đổi. |
| `packages/auth` | Đọc claim (`membership/index.ts`, `policies/index.ts`) | Cần cập nhật sau M-F. |
| `apps/web` | `features/auth/membership.ts`, `app/App.tsx` (nhánh `WORKER`) | Chỉ hiển thị; không quyết định quyền. |
| `apps/mobile` | Không đọc `app_role` hoặc `tenant_id` từ JWT; `supabase-sync-transport.ts` gửi `tenant_id` từ dữ liệu local | RLS phải chặn ghi sai tenant. Mobile không cần đổi trong M-A..M-F. |

## 10. Vấn đề chưa đủ thông tin

1. Dashboard JWT TTL (D-JWT): chưa xác minh.
2. Có staging với dữ liệu ẩn danh hay không: chưa xác nhận.
3. Số lượng membership, tài khoản SITE_MANAGER và SYS_ADMIN thật: chưa biết.
4. `seed.sql` có định nghĩa `COMPANY_ADMIN`, `PROJECT_MANAGER`, `SITE_SUPERVISOR` không: chưa kiểm tra trong phiên này.
5. Danh sách trường cho `Q-PM-1` và `Q-PM-3` đã được duyệt (người dùng, 2026-11-18). `Q-PM-1` chỉ cho `workers.full_name`, `workers.phone_number`, `workers.code`, `workers.status` và tên công ty tham gia. `Q-PM-3` xuất dữ liệu tổng hợp, không kèm số điện thoại hay mã nội bộ của nhân sự, trừ khi được duyệt riêng.
6. Module chấm công, công việc, nhật ký, vật tư chưa có bảng: không thể thiết kế RLS cho chúng.
7. Có hay không cột thu hồi trên `project_memberships` trên DB thật: chỉ biết từ migration, chưa kiểm chứng trên DB có dữ liệu.

## 11. Kế hoạch audit read-only trên staging (chưa chạy)

**Điều kiện:** Có staging với bản sao dữ liệu đã ẩn danh. Không kết nối production (D-DATA).

**Các bước**
1. Snapshot staging trước khi chạy (chủ dự án duyệt).
2. Chạy audit ở chế độ read-only: `set transaction read only`. Không `insert`, `update`, `delete`.
3. Đối chiếu số dòng: `memberships`, `project_companies`, `project_memberships`, `projects` (kể cả `deleted_at not null`), `workers`.
4. Liệt kê:
   - `SITE_MANAGER` theo tenant và `participation_type`.
   - `SYS_ADMIN` và cách truy cập.
   - Project đã xóa mềm có membership.
   - Công ty `SUSPENDED` hoặc `ENDED` còn membership.
   - Tenant có membership nhưng không có `project_companies`.
   - User có nhiều membership ở nhiều tenant (ảnh hưởng hook).
5. Xuất báo cáo, không kèm dữ liệu cá nhân (chỉ đếm và mã định danh đã băm).

**Điều kiện dừng:** Số dòng không khớp giữa các lần đếm, hoặc có membership không thuộc tenant hợp lệ.

**Không được tuyên bố:** Backfill đã được xác minh trên dữ liệu thật khi chưa chạy audit trên staging.

## 12. Trạng thái

- 007b: IMPLEMENTED + TESTED – PENDING ACCEPTANCE.
- M-A đến M-F: ĐỀ XUẤT – CHỜ DUYỆT.
- 007c, 007d, 007e: chưa thiết kế chi tiết, chưa triển khai.
- Không sửa code, database, migration, RLS, role, hook trong bước này.

## 13. SQL outline và test case ID (bản thiết kế, chưa tạo migration)

Quy ước: `T-<hồ sơ>-<số>`. Mỗi test ID phải có trong pgTAP trước khi migration tương ứng được duyệt triển khai. Outline SQL dưới đây là cấu trúc, không phải file migration.

### 13.1 M-A: role review và thêm role

```
-- 1. Thêm role (Q-D4)
insert into public.roles (name) values ('COMPANY_ADMIN'), ('PROJECT_MANAGER'), ('SITE_SUPERVISOR')
  on conflict (name) do nothing;
-- 2. Bảng review
create table public.role_migration_reviews (...);   -- theo mục 2
alter table public.role_migration_reviews enable row level security;
-- không tạo policy cho authenticated/anon
-- 3. Backfill đề xuất (chỉ insert, không update role gốc)
insert into public.role_migration_reviews (...)
select 'project_memberships', pm.id, ...,
       case when pc.participation_type = 'MAIN_CONTRACTOR' then 'PROJECT_MANAGER'
            when pc.participation_type = 'SUBCONTRACTOR'   then 'SITE_SUPERVISOR' end,
       ...
from public.project_memberships pm
left join public.project_companies pc on (pc.project_id, pc.tenant_id) = (pm.project_id, pm.tenant_id)
where pm.role = 'SITE_MANAGER';
```

| Test ID | Kiểm tra |
| --- | --- |
| T-MA-01 | Ba role mới tồn tại trong `roles`; chạy lại migration không lỗi (idempotent). |
| T-MA-02 | `decided_role` là null sau backfill. |
| T-MA-03 | Không tạo hai review cho cùng `(source_table, source_id)`. |
| T-MA-04 | `decided_role` không hợp lệ (không thuộc `roles`) bị từ chối. |
| T-MA-05 | `decided_role` có giá trị nhưng thiếu `decided_by` hoặc `decided_at` bị từ chối. |
| T-MA-06 | Authenticated không select/insert/update được `role_migration_reviews`. |
| T-MA-07 | `project_memberships.role` và `memberships.role` của dòng cũ không đổi sau migration. |

### 13.2 M-B: soft-delete và trạng thái công ty

```
create or replace function public.is_project_member(p_project_id uuid, ...) ...
  -- thêm: join projects p on p.id = ... and p.deleted_at is null
  -- thêm: join project_companies pc ... and pc.status = 'ACTIVE'
create or replace function public.is_main_contractor_manager(p_project_id uuid) ...
  -- giữ nguyên tên role đến khi M-A được áp dụng; điều kiện deleted_at và status được thêm vào
-- policy: drop policy <tên> on public.<bảng>; create policy <tên> ... with (... and deleted_at is null)
-- pg_policies và information_schema.columns được truy vấn để lấy danh sách trước khi viết
```

| Test ID | Kiểm tra |
| --- | --- |
| T-MB-01 | MAIN_CONTRACTOR manager không select được `projects` có `deleted_at` khác null. |
| T-MB-02 | Cùng user không select được `workers` của project đã xóa mềm. |
| T-MB-03 | `project_memberships` của project đã xóa mềm vẫn còn sau migration (không mất dữ liệu). |
| T-MB-04 | Công ty `SUSPENDED` không đọc được `workers` của project. |
| T-MB-05 | Công ty `ENDED` không đọc được `workers` của project. |
| T-MB-06 | Project `ACTIVE` không đổi kết quả so với 007b (không hồi quy). |
| T-MB-07 | Mỗi bảng con có `project_id` đều có policy đã được cập nhật (kiểm tra theo danh sách `information_schema`). |

### 13.3 M-E: audit log append-only (làm trước M-D)

```
create table public.audit_log (id uuid primary key default gen_random_uuid(), occurred_at timestamptz not null default now(), actor_user_id uuid, action text not null, target_type text, target_id text, tenant_id uuid, project_id uuid, project_company_id uuid, payload jsonb not null default '{}', request_id text);
revoke update, delete, truncate on public.audit_log from authenticated, anon;
create function public.audit_log_block_mutation() returns trigger ... raise exception;
create trigger audit_log_no_update_delete before update or delete on public.audit_log for each row execute function ...;
create function public.write_audit(...) returns uuid language plpgsql security definer set search_path = '' ...;
```

| Test ID | Kiểm tra |
| --- | --- |
| T-ME-01 | `update` và `delete` trên `audit_log` bị từ chối, kể cả với role `postgres` qua trigger. |
| T-ME-02 | `truncate` bị từ chối (trigger hoặc revoke). |
| T-ME-03 | User không thuộc tenant không select được `audit_log`. |
| T-ME-04 | `write_audit` từ chối actor không có quyền trên tenant đích. |
| T-ME-05 | Payload không chứa khóa ngoài danh sách cho phép (kiểm tra theo action đã duyệt). |

### 13.4 M-C: bỏ đường cross-tenant qua SYS_ADMIN

Không thêm schema. Viết lại policy có nhánh `'SYS_ADMIN'` (xem S6) để bỏ nhánh đó, giữ quyền nghiệp vụ của tenant.

| Test ID | Kiểm tra |
| --- | --- |
| T-MC-01 | Claim `app_role = 'SYS_ADMIN'` không select được `projects` của tenant khác. |
| T-MC-02 | Claim `app_role = 'SYS_ADMIN'` không select được `workers` của tenant khác. |
| T-MC-03 | Claim `app_role = 'SYS_ADMIN'` không insert được dòng có `tenant_id` khác tenant của mình. |
| T-MC-04 | Test cũ có kỳ vọng SYS_ADMIN xuyên tenant được rà soát và sửa, không xóa để pass. |

### 13.5 M-D: restore project và lịch sử

```
create table public.project_history (id uuid primary key default gen_random_uuid(), project_id uuid not null, event text not null check (event in ('DELETED','RESTORED','LEGACY_DELETED')), actor_user_id uuid, tenant_id uuid not null, reason text, occurred_at timestamptz);
create table public.project_membership_history (...);   -- Q-D1, trigger insert/delete
create function public.restore_project(p_project_id uuid) returns void language plpgsql security definer set search_path = '' ...;
  -- kiểm tra caller là COMPANY_ADMIN scope COMPANY của projects.tenant_id hoặc người ủy quyền hợp lệ
  -- update projects set deleted_at = null; insert project_history (event='RESTORED'); không đụng project_memberships
create function public.soft_delete_project(p_project_id uuid, p_reason text) ... -- tương tự, deleted_at = now()
-- Backfill: insert project_history (event='LEGACY_DELETED', occurred_at = null) cho project có deleted_at not null
```

| Test ID | Kiểm tra |
| --- | --- |
| T-MD-01 | PROJECT_MANAGER không restore được project. |
| T-MD-02 | COMPANY_ADMIN của tenant khác không restore được. |
| T-MD-03 | COMPANY_ADMIN của tenant sở hữu restore được; `deleted_at` về null. |
| T-MD-04 | Sau restore, membership đã bị xóa trước đó vẫn không tồn tại (Q-D2). |
| T-MD-05 | Mỗi lần delete hoặc restore sinh đúng một dòng `project_history`. |
| T-MD-06 | `project_history` không update hoặc delete được. |
| T-MD-07 | Mỗi insert/delete của `project_memberships` sinh đúng một dòng `project_membership_history` (Q-D1). |
| T-MD-08 | Project legacy đã xóa mềm có dòng `LEGACY_DELETED` với `occurred_at` null. |

### 13.6 M-F: quyết định quyền từ DB, không từ claim

```
create function public.has_project_role(p_project_id uuid, p_roles text[]) returns boolean language sql stable security definer set search_path = '' ...;
create function public.has_project_company_role(p_project_company_id uuid, p_roles text[]) returns boolean ...;
-- viết lại policy đang dùng current_tenant_id()/current_app_role() theo danh sách của M-F
-- hook custom_access_token_hook: giữ nguyên
```

| Test ID | Kiểm tra |
| --- | --- |
| T-MF-01 | Xóa `project_memberships` của user; token cũ còn hạn; truy vấn kế tiếp bị từ chối. |
| T-MF-02 | Token cũ có `tenant_id` sai (giả lập claim) không đọc được dữ liệu tenant thật. |
| T-MF-03 | Không có quyền xuyên công ty trong cùng project. |
| T-MF-04 | Không có quyền xuyên project. |
| T-MF-05 | Hook không đổi: kiểm tra định nghĩa hàm trước và sau migration bằng so sánh nội dung. |

### 13.7 Phạm vi test chung

- Chạy lại toàn bộ `supabase test db` sau mỗi hồ sơ: 007b (33 test), 008 (7 test), 001–006.
- Mỗi hồ sơ có `.down.sql` trong `supabase/rollbacks/`, và pgTAP kiểm tra rollback trên DB tạm.
- Không chạy trên production. Mọi kiểm tra dữ liệu thật qua audit read-only trên staging (mục 11).

## 14. Trạng thái cập nhật (sau mục 13)

- M-E đã triển khai trên DB local (`20260923000010_audit_log.sql`), pgTAP 8 test trong bộ 41 test PASS. Chưa nghiệm thu.
- M-A đến M-D, M-F: chưa triển khai. Tiếp theo: M-A.
- 007b: IMPLEMENTED + TESTED – PENDING ACCEPTANCE. 007c, 007d, 007e chưa triển khai.
- M-A đến M-F: SQL outline và test ID đã có. Thiết kế đã được duyệt theo thứ tự; từng migration vẫn cần chốt điều kiện nghiệm thu riêng trước khi viết file migration.
- Chưa tạo migration, chưa chạy SQL, chưa sửa RLS, role, hook hay code.
- Điều kiện còn mở trước M-E: danh sách trường `payload` cho từng action của `audit_log` (chưa duyệt, mục 6 và T-ME-05).
- 007b: IMPLEMENTED + TESTED – PENDING ACCEPTANCE. 007c, 007d, 007e chưa triển khai.
- 007b: IMPLEMENTED + TESTED – PENDING ACCEPTANCE.
