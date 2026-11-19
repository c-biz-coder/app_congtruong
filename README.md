# App quản lý công trường — bộ mã khởi đầu MVP

Đây là bản trích xuất từ Partner OS để bắt đầu một dự án mới, **không phải
ứng dụng MVP hoàn chỉnh hay sẵn sàng triển khai thực tế**. Giữ nguyên tên
package `@partner-os/*` để các phụ thuộc nội bộ tiếp tục hoạt động.

## Những gì có thể tận dụng

| Nhu cầu MVP | Mã hiện có | Việc còn thiếu |
| --- | --- | --- |
| Công trình | Bảng `projects`, entity và trạng thái dự án | API, màn hình và quy trình quản lý |
| Nhân viên và đội thi công | Worker domain, Zod contracts, API Supabase và màn hình danh sách web; local repository, outbox và màn hình danh sách mobile | Đăng nhập, màn hình thêm/sửa, quản lý đội; tích hợp và kiểm thử toàn bộ luồng |
| Chấm công QR/GPS | Chưa có tính năng | Thiết kế và triển khai |
| Nhật ký công trường | Chưa có tính năng | Thiết kế và triển khai |
| Công việc hằng ngày | Chưa có tính năng | Thiết kế và triển khai |
| Báo cáo cơ bản | Chưa có tính năng | Thiết kế và triển khai |

Nền tảng đi kèm gồm React/Vite, Expo/React Native, WatermelonDB, Supabase,
migration multi-tenant/RLS, auth/permission primitives, sync-engine, kiểm thử
và công cụ kiểm tra kiến trúc. Đây là mã nền tảng cần tiếp tục hoàn thiện:
sync chưa kết nối transport thực tế; use-case tạo worker offline chưa được
nối với màn hình; chưa có luồng đăng nhập hoàn chỉnh. Mobile chưa được kiểm
thử native trong quá trình trích xuất. Không coi các migration/RLS là đã
được kiểm chứng bảo mật: phải bổ sung và chạy kiểm thử RLS trước khi dùng.

## Cấu trúc

- `apps/web`: web admin và ví dụ danh sách nhân viên.
- `apps/mobile`: ứng dụng hiện trường, cơ sở dữ liệu local và ví dụ danh sách.
- `packages/`: domain, contracts, auth, database, sync và các tiện ích chia sẻ.
- `supabase/`: cấu hình local, migration và dữ liệu demo.
- `tests/`, `scripts/`: kiểm thử và các công cụ kiểm tra.
- `docs/`, `.ai/`: kiến trúc và quy tắc kế thừa từ dự án nguồn; các tài liệu
  mô tả kiến trúc mục tiêu hoặc kế hoạch, không chứng minh tính năng đã hoàn thành.

## Khởi động

Yêu cầu Node.js >= 20 và pnpm 12.5.1; cần Supabase CLI và Docker nếu chạy
backend local. Cài từ thư mục này:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @partner-os/web dev
pnpm --filter @partner-os/mobile dev
```

Trước khi kết nối, sao chép các tệp `.env.example` ở root, `apps/web` và
`apps/mobile` thành `.env` tương ứng, rồi điền cấu hình Supabase và device ID
thích hợp. Không commit tệp `.env`; **không** đưa service-role key vào các
biến `VITE_*` hoặc `EXPO_PUBLIC_*` vì các biến đó xuất hiện ở client.

Backend local, khi đã cài Supabase CLI và Docker:

```powershell
supabase start
supabase test db
```

Dữ liệu demo chỉ dành cho local. Danh sách web dùng tenant demo trong cấu hình,
nhưng vẫn cần phiên đăng nhập và quyền RLS hợp lệ; không vô hiệu hóa RLS để
làm demo. Luồng đăng nhập và thiết lập tài khoản/quyền cần được hoàn thiện.

Kiểm tra nền tảng:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm architecture:check
pnpm build
```

`pnpm build` của mobile chỉ kiểm tra TypeScript, không tạo hoặc kiểm thử
APK/IPA. Chạy thêm kiểm thử native và end-to-end cùng Supabase thực trước khi
phát hành. Không sao chép dữ liệu vận hành, credentials hay `node_modules`
từ dự án nguồn vào dự án mới.

## Hướng phát triển đề xuất

1. Hoàn thiện đăng nhập, tenant, phân quyền và kiểm thử RLS.
2. Hoàn thiện công trình, nhân viên, đội thi công và luồng offline/sync.
3. Triển khai chấm công QR/GPS, nhật ký và công việc hằng ngày.
4. Bổ sung báo cáo cơ bản, kiểm thử trên thiết bị thật và triển khai.

Hợp đồng kiến trúc kế thừa: [docs/PARTNER_OS_ARCHITECTURE_AI_CODING_CONTRACT.md](docs/PARTNER_OS_ARCHITECTURE_AI_CODING_CONTRACT.md).
