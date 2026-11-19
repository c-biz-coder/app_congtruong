partner-os-workspace/
├── .github/                                # Tác dụng: Tự động hóa CI/CD bằng GitHub Actions.
│   │                                       # Mục tiêu: Đảm bảo code luôn được test trước khi gộp và tự động triển khai lên server, giảm rủi ro lỗi do con người.
│   └── workflows/
│       ├── build-test.yml                  # Mục tiêu: Tự động chạy test khi AI hoặc bạn push code, giúp phát hiện lỗi sớm.
│       └── deploy.yml                      # Mục tiêu: Kịch bản tự động đưa Web lên server và đóng gói App Mobile.
│
├── HỆ THỐNG QUẢN TRỊ AI & KIẾN TRÚC        # Tác dụng: Bộ quy tắc điều khiển hành vi của AI Agent.
│   │                                       # Mục tiêu: Làm "lan can bảo vệ", không cho AI tự ý dùng thư viện lạ, code lung tung làm phá vỡ kiến trúc hệ thống.
│   ├── .clinerules                         # Mục tiêu: Bắt buộc AI dùng TypeScript, xử lý Offline-first, ép dùng Zustand và SQL. Luật cứng ép AI tuân thủ kiến trúc.
│   ├── .roomodes                           # Mục tiêu: Đăng ký trực tiếp 4 Chế độ AI chuyên trách (DBAgent, CoreAgent, WebAgent, MobileAgent) vào giao diện VS Code.
│   ├── AGENTS.md                           # Mục tiêu: Phân vai rõ ràng (WebAgent chỉ sửa web, MobileAgent chỉ sửa app) để tránh AI bị "loạn trí". Phân vai 5 AI Agents (DB, Core, Web, Mobile, Architect).
│   └── refactor-plan.md                    # Mục tiêu: Ghi chú các phần code cũ cần đập đi xây lại sau này. Kế hoạch dọn dẹp và kiểm soát chất lượng code.
│
├── docs/                                   # Tác dụng: Nơi lưu trữ tài liệu dự án. Là hồ sơ thiết kế & nghiệp vụ dự án.
│   │                                       # Mục tiêu: Cung cấp "não bộ" và ngữ cảnh để AI Agent đọc hiểu toàn cảnh dự án trước khi code.
│   ├── 0_ARCHITECTURE.md                   # Mục tiêu: Sơ đồ file dự án giúp AI không tạo file sai vị trí.
│   ├── 1_PRD.md                            # Mục tiêu: Mô tả yêu cầu nghiệp vụ 13 phân hệ để AI hiểu nó đang làm tính năng gì.
│   ├── 2_TECH_SPEC.md                      # Mục tiêu: Đặc tả kỹ thuật, luồng dữ liệu API/DB.
│   ├── 3_TRACKER.md                        # Mục tiêu: Checklist để AI tự đánh dấu tiến độ công việc.
│   └── 4_HANDOVER.md                       # Mục tiêu: Nhật ký bàn giao ca giữa 5 AI Agents, giúp lưu vết file đã tạo, cấu trúc dữ liệu và ghi chú kỹ thuật để Agent tiếp theo tiếp quản không bị quên/đoán mò.
│
├── audit-docs/                             # Mục tiêu: Lưu trữ báo cáo kiểm toán bảo mật, hiệu năng nhằm rà soát hệ thống định kỳ.
│
├── supabase/                               # Tác dụng: Cấu hình Backend PostgreSQL thay thế Firebase.
│   │                                       # Mục tiêu: Tối ưu chi phí server (không tính tiền theo lượt đọc/ghi), bảo mật tuyệt đối nhờ SQL và RLS.
│   ├── migrations/                         # Mục tiêu: Chứa file .sql định nghĩa bảng và các luật bảo mật dữ liệu Row Level Security (RLS).
│   ├── functions/                          # Mục tiêu: Chứa Edge Functions xử lý logic nặng trên server (gửi SMS, AI xử lý ảnh).
│   ├── seed.sql                            # Mục tiêu: Chứa dữ liệu khởi tạo (Định nghĩa sẵn 5 Role tĩnh).
│   └── config.toml                         # Mục tiêu: Cấu hình môi trường Supabase chạy cục bộ trên máy tính.
│
├── apps/                                   # Tác dụng: Nền tảng hiển thị tách biệt cho từng thiết bị.
│   │                                       # Mục tiêu: Tối ưu hóa trải nghiệm người dùng cuối (UX). Kế toán dùng Web nhiều bảng biểu, Công nhân dùng App nút bấm to.
│   ├── web/                                # WEB ADMIN (React + Vite + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── components/                 # Mục tiêu: Chứa UI DOM thuần túy (Không dùng chung với Mobile).
│   │   │   ├── features/                   # Mục tiêu: Chứa luồng xử lý của 13 phân hệ trên bản Web.
│   │   │   ├── store/                      # Mục tiêu: Quản lý trạng thái (Zustand state) riêng cho Web.
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html                      # Mục tiêu: File bắt buộc làm điểm khởi động cho Vite.
│   │   ├── .env.example            
│   │   ├── package.json                    # Mục tiêu: Quản lý thư viện cài đặt riêng cho Web.
│   │   └── vite.config.ts
│   │
│   └── mobile/                             # MOBILE APP (React Native + Expo)
│       ├── src/
│       │   ├── components/                 # Mục tiêu: Chứa UI Native (View, Text) tối ưu thao tác chạm ngoài trời nắng.
│       │   ├── features/                   # Mục tiêu: Luồng 13 phân hệ tối giản trên Mobile (Quét QR, Chụp ảnh, GPS).
│       │   ├── store/                      # Mục tiêu: Quản lý trạng thái (Zustand state) riêng cho Mobile.
│       │   ├── database/                   # Mục tiêu: Khởi tạo kết nối SQLite nội bộ cho WatermelonDB chạy offline.
│       │   ├── App.tsx
│       │   └── index.ts
│       ├── babel.config.js                 # Mục tiêu: File biên dịch bắt buộc để cài WatermelonDB trên React Native.
│       ├── .env.example            
│       ├── package.json                    # Mục tiêu: Quản lý thư viện cài đặt riêng cho Mobile.
│       └── app.json                
│
├── packages/                               # Tác dụng: Lõi nghiệp vụ chia sẻ giữa Web & Mobile.
│   │                                       # Mục tiêu: Tuân thủ nguyên tắc DRY (Don't Repeat Yourself). Sửa logic 1 lần, cập nhật cho toàn hệ thống.
│   ├── shared-core/
│   │   ├── auth/                           # Mục tiêu: Quản lý Role Tĩnh (Enum cứng: SYS_ADMIN, SITE_MANAGER...) tránh nhầm quyền.
│   │   ├── db/                             # Mục tiêu: Cấu hình lớp dữ liệu WatermelonDB (schema và models) dùng cho offline-first.
│   │   ├── sync-engine/                    # Mục tiêu: Trái tim của Offline-first. Tự động đẩy dữ liệu lên Supabase khi có mạng, dùng Last-Write-Wins để gỡ xung đột.
│   │   ├── schemas/                        # Mục tiêu: Validate chuẩn hóa đầu vào/ra của dữ liệu bằng Zod (đảm bảo Web và App không lệch data).
│   │   ├── hooks/                          # Mục tiêu: Tái sử dụng các đoạn logic phổ biến (VD: hook lấy GPS, hook kiểm tra mạng).
│   │   ├── i18n/                           # Mục tiêu: Quản lý đa ngôn ngữ (Việt, Hàn, Anh).
│   │   ├── index.ts                        # Mục tiêu: Điểm xuất (Entry point) để Web/Mobile import các hàm từ thư mục core.
│   │   └── package.json                    # Mục tiêu: Khai báo định danh package "@partner-os/shared-core".
│   │
│   └── shared-ui/                          # Tác dụng: Chứa Design Tokens (Mã màu HEX, Typography, Icons).
│       │                                   # Mục tiêu: Đồng bộ nhận diện thương hiệu. (Lưu ý: Không chứa Component logic để tránh lỗi React/React Native).
│       ├── index.ts                
│       └── package.json            
│
├── tests/                                  # Tác dụng: Thư mục kiểm thử tự động.
│   │                                       # Mục tiêu: Đảm bảo phần mềm chạy đúng nghiệp vụ trước khi phát hành, giảm thiểu lỗi cho người dùng cuối.
│   ├── unit/                               # Mục tiêu: Test các hàm tính toán riêng lẻ (tính công, đơn giá).
│   ├── integration/                        # Mục tiêu: Test luồng tương tác giữa các module (Đặc biệt là test đồng bộ khi rớt mạng -> có mạng).
│   └── e2e/                                # Mục tiêu: Giả lập kịch bản thao tác người dùng từ đầu đến cuối.
│
├── .prettierrc                             # Tác dụng: Tự động căn chỉnh định dạng code (khoảng trắng, dấu nháy).
│                                           # Mục tiêu: Giữ cho mã nguồn luôn đồng nhất thẩm mỹ, bất kể do AI hay lập trình viên viết.
│
├── eslint.config.mjs                       # Tác dụng: Quét và báo lỗi trực tiếp các đoạn code sai logic.
│                                           # Mục tiêu: Chặn AI tự ý chế ra hàm ảo hoặc viết code rác làm hỏng kiến trúc.
│
├── tsconfig.json                           # Tác dụng: Cấu hình quy tắc kiểm tra kiểu dữ liệu tĩnh của TypeScript.
│                                           # Mục tiêu: Lớp phòng thủ vững chắc nhất, từ chối chạy nếu AI truyền sai kiểu dữ liệu (VD: truyền số vào ID chuỗi).
│
├── turbo.json                              # Tác dụng: Trái tim điều phối của Turborepo.
│                                           # Mục tiêu: Tối ưu hóa tốc độ build và hỗ trợ chạy song song cả Web và Mobile cùng lúc chỉ bằng 1 lệnh.
│
└── package.json                            # Tác dụng: Quản lý thư viện và script gốc của Monorepo.
                                            # Mục tiêu: Nơi khởi chạy toàn bộ workspace.