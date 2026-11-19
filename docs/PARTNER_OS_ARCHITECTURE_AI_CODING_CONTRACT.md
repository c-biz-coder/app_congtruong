# PARTNER OS — ARCHITECTURE REFACTORING & AI CODING CONTRACT

> **Version:** 1.0  
> **Status:** MANDATORY  
> **Project:** `partner-os-workspace`  
> **Purpose:** Đây là hợp đồng kiến trúc và quy tắc kỹ thuật bắt buộc dành cho AI Coding Agents và Developer.
>
> **PRIORITY:** Không được tự ý thay đổi Tech Stack, kiến trúc lõi, quy tắc dữ liệu, Offline-first, Multi-tenant, Authorization hoặc Dependency Rules nếu chưa có quyết định kiến trúc mới được ghi nhận trong ADR.

---

# 1. MỤC TIÊU

Partner OS là hệ thống quản lý công trường / HSE / Construction Management theo mô hình:

- Monorepo
- Multi-tenant
- Offline-first
- Web + Mobile
- Shared Domain / Contracts
- Supabase PostgreSQL
- Supabase RLS
- WatermelonDB cho Local Database trên Mobile
- React + Vite cho Web
- React Native + Expo cho Mobile
- TypeScript
- Zustand
- Zod
- Turborepo
- CI/CD
- AI-assisted / Vibe Coding

Mục tiêu của kiến trúc:

1. AI không được tự ý phá kiến trúc.
2. Web và Mobile dùng chung Domain/Contracts nhưng không ép dùng chung UI.
3. Business logic không phụ thuộc React, Expo, Supabase hoặc WatermelonDB.
4. Offline-first là kiến trúc lõi, không phải tính năng phụ.
5. Multi-tenant và Authorization phải được bảo vệ ở cả Application Layer và Database/RLS.
6. Sync phải có Queue, Retry, Conflict Detection và Audit.
7. Mỗi Feature có phạm vi rõ ràng.
8. AI Agent phải có phạm vi sửa code rõ ràng.
9. Mọi thay đổi quan trọng phải có test.
10. CI phải có khả năng chặn code phá kiến trúc.

---

# 2. TECHNOLOGY CONTRACT

## 2.1. Công nghệ bắt buộc

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Web | React + Vite |
| Mobile | React Native + Expo |
| Styling Web | Tailwind CSS |
| State | Zustand |
| Validation | Zod |
| Backend | Supabase |
| Database | PostgreSQL |
| Authorization | Supabase RLS + Application Authorization |
| Local Mobile DB | WatermelonDB |
| Monorepo | Turborepo |
| Package manager | PNPM |
| Testing | Unit + Integration + E2E |
| CI/CD | GitHub Actions |

## 2.2. Cấm tự ý thay đổi

AI MUST NOT:

- đổi React sang Vue/Angular/Svelte;
- đổi Vite sang Next.js nếu chưa có ADR;
- đổi React Native/Expo;
- đổi Supabase;
- đổi PostgreSQL;
- đổi WatermelonDB;
- đổi Zustand;
- đổi Zod;
- đổi Turborepo;
- thêm framework backend khác chỉ vì tiện code;
- thêm ORM mới nếu chưa có ADR;
- thêm state-management library mới nếu Zustand đã đáp ứng;
- thêm UI framework mới nếu chưa được phê duyệt.

Nếu AI thấy Tech Stack hiện tại có vấn đề:

1. Không tự ý thay đổi.
2. Ghi nhận vấn đề.
3. Đề xuất ADR.
4. Chờ quyết định.
5. Chỉ thay đổi sau khi ADR được chấp thuận.

---

# 3. TARGET PROJECT STRUCTURE

Kiến trúc mục tiêu:

```text
partner-os-workspace/
│
├── .github/
│   └── workflows/
│       ├── build-test.yml
│       ├── deploy.yml
│       └── architecture-check.yml
│
├── .ai/
│   ├── agents/
│   │   ├── architect.md
│   │   ├── db.md
│   │   ├── core.md
│   │   ├── web.md
│   │   └── mobile.md
│   │
│   ├── rules/
│   │   ├── architecture.md
│   │   ├── coding.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   └── git.md
│   │
│   └── handover/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   ├── shared/
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── mobile/
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   ├── shared/
│       │   ├── database/
│       │   └── main/index.ts
│       └── package.json
│
├── packages/
│   ├── domain/
│   ├── contracts/
│   ├── auth/
│   ├── sync-engine/
│   ├── database/
│   ├── shared-utils/
│   ├── i18n/
│   └── ui/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed/
│   │   ├── roles.sql
│   │   ├── permissions.sql
│   │   ├── role_permissions.sql
│   │   └── demo.sql
│   ├── tests/
│   │   ├── rls/
│   │   └── functions/
│   └── config.toml
│
├── tests/
│   └── e2e/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── product/
│   ├── security/
│   ├── testing/
│   └── operations/
│
├── scripts/
│   ├── check-architecture.ts
│   ├── check-dependencies.ts
│   ├── validate-env.ts
│   ├── generate-types.ts
│   ├── database-reset.ts
│   └── verify-build.ts
│
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json
```

---

# 4. LAYERED ARCHITECTURE

Kiến trúc phải tuân thủ:

```text
UI
 ↓
Feature
 ↓
Application
 ↓
Domain
 ↓
Contracts
 ↓
Infrastructure Adapters
 ↓
Database / External Services
```

Không được đảo ngược dependency.

## 4.1. Domain Layer

Domain phải độc lập.

Domain MUST NOT import:

- React
- React Native
- Expo
- Zustand
- Supabase client
- WatermelonDB
- browser APIs
- mobile APIs

Domain chỉ chứa:

- Entities
- Value Objects
- Business Rules
- Domain Types
- Domain Services
- Domain Errors

Ví dụ:

```text
packages/domain/
├── entities/
├── value-objects/
├── enums/
├── services/
├── rules/
└── errors/
```

---

# 5. SHARED PACKAGES

Không tạo một `shared-core` khổng lồ.

Cấm pattern:

```text
packages/shared-core/
    ├── auth
    ├── database
    ├── sync
    ├── hooks
    ├── i18n
    └── everything
```

Thay vào đó:

```text
packages/
├── domain/
├── contracts/
├── auth/
├── sync-engine/
├── database/
├── shared-utils/
├── i18n/
└── ui/
```

## 5.1. Nguyên tắc

Mỗi package phải có:

- trách nhiệm duy nhất;
- public API rõ ràng;
- `index.ts` làm public entry point;
- dependency rõ ràng;
- test riêng;
- không import ngược từ app.

---

# 6. DOMAIN PACKAGE

```text
packages/domain/
├── entities/
├── value-objects/
├── enums/
├── rules/
├── services/
├── errors/
└── index.ts
```

Ví dụ:

```text
entities/
├── User.ts
├── Organization.ts
├── Project.ts
├── Contractor.ts
├── Worker.ts
├── Inspection.ts
├── Incident.ts
└── Permit.ts
```

Domain phải mô tả nghiệp vụ, không mô tả UI.

---

# 7. CONTRACTS PACKAGE

```text
packages/contracts/
├── api/
├── dto/
├── schemas/
├── events/
└── index.ts
```

Zod schemas được dùng để đảm bảo:

```text
Web ↔ API ↔ Mobile ↔ Sync
```

có cùng contract.

Mọi dữ liệu đi qua boundary quan trọng phải được validate.

Không tin tưởng dữ liệu từ:

- API;
- local database;
- external integration;
- user input;
- sync queue.

---

# 8. AUTHORIZATION ARCHITECTURE

Authorization phải có nhiều lớp:

```text
User
 ↓
Membership
 ↓
Organization
 ↓
Project
 ↓
Role
 ↓
Permission
 ↓
Policy
 ↓
Resource
```

Không chỉ kiểm tra `user_id`.

## 8.1. Package

```text
packages/auth/
├── roles/
├── permissions/
├── policies/
├── guards/
├── types/
└── index.ts
```

Ví dụ:

```text
project.read
project.write
contractor.read
contractor.write
safety.create
safety.approve
incident.create
incident.approve
report.export
```

---

# 9. MULTI-TENANCY

Hệ thống phải thiết kế Multi-tenant từ đầu.

Mọi dữ liệu tenant-sensitive phải xác định được:

```text
organization_id
```

Dữ liệu theo công trường phải có thể xác định:

```text
project_id
site_id
```

Mô hình:

```text
User
 ↓
Membership
 ↓
Organization
 ↓
Project
 ↓
Site
 ↓
Resource
```

Không được tạo bảng nghiệp vụ quan trọng mà không xem xét tenant boundary.

---

# 10. SUPABASE + RLS

Supabase PostgreSQL là nguồn dữ liệu server chính.

RLS là lớp bảo mật bắt buộc.

Không được coi frontend authorization là lớp bảo mật duy nhất.

Phải có:

```text
Frontend Guard
+
Application Authorization
+
PostgreSQL RLS
```

Ví dụ:

```text
User
 ↓
JWT
 ↓
Membership
 ↓
RLS Policy
 ↓
Organization / Project / Resource
```

## 10.1. RLS Tests

Mọi bảng nhạy cảm phải có test:

- user đúng tenant;
- user khác tenant;
- role không đủ permission;
- project không thuộc organization;
- admin;
- manager;
- normal user;
- unauthorized access.

---

# 11. DATABASE STRUCTURE

```text
supabase/
├── migrations/
├── functions/
├── seed/
│   ├── roles.sql
│   ├── permissions.sql
│   ├── role_permissions.sql
│   └── demo.sql
├── tests/
│   ├── rls/
│   └── functions/
└── config.toml
```

Không để toàn bộ seed trong một file lớn.

Migration phải:

- có thứ tự;
- không sửa lịch sử migration đã chạy production;
- migration mới phải tạo thay đổi mới;
- destructive migration phải được xem xét đặc biệt.

---

# 12. DATABASE TYPES

Database types nên được generate tự động từ Supabase.

Không tự tay duy trì duplicate type nếu có thể generate.

Script:

```bash
pnpm db:generate-types
```

Mục tiêu:

```text
PostgreSQL
    ↓
Generated TypeScript Types
    ↓
Contracts
```

---

# 13. OFFLINE-FIRST ARCHITECTURE

Offline-first là yêu cầu lõi.

Mobile phải có khả năng:

- đọc dữ liệu local;
- tạo dữ liệu khi offline;
- sửa dữ liệu khi offline;
- xếp hàng thay đổi;
- retry;
- đồng bộ khi online;
- phát hiện conflict;
- xử lý conflict;
- ghi audit.

Không được thiết kế theo kiểu:

```text
UI → API → Database
```

mà không có local-first behavior trên Mobile.

---

# 14. WATERMELONDB

WatermelonDB là local database implementation cho Mobile.

Không đưa WatermelonDB dependency vào Domain.

Kiến trúc:

```text
Feature
 ↓
Application
 ↓
Repository Interface
 ↓
Database Adapter
 ↓
WatermelonDB
```

Mobile:

```text
apps/mobile/src/database/
├── schema/
├── models/
├── adapters/
├── migrations/
└── index.ts
```

---

# 15. SYNC ENGINE

Sync Engine phải được thiết kế độc lập.

```text
packages/sync-engine/
├── engine/
├── queue/
├── outbox/
├── inbox/
├── retry/
├── conflict/
├── transport/
├── cursor/
├── versioning/
├── audit/
└── index.ts
```

Luồng:

```text
Local DB
 ↓
Outbox
 ↓
Sync Engine
 ↓
Network
 ↓
Supabase
```

Khi offline:

```text
Local DB
 ↓
Outbox
 ↓
Retry Queue
```

Khi online:

```text
Retry Queue
 ↓
Sync Engine
 ↓
Server
```

---

# 16. KHÔNG DÙNG LWW CHO MỌI DỮ LIỆU

Last-Write-Wins chỉ là một conflict strategy.

Không được mặc định:

```text
mọi conflict = LWW
```

Có thể sử dụng:

```text
LWW
Server Wins
Client Wins
Field Merge
Version Check
Manual Resolution
```

Chiến lược phải phụ thuộc loại dữ liệu.

Ví dụ:

- UI preferences → LWW có thể phù hợp.
- Checklist → cần version/conflict handling.
- Incident record → không được âm thầm ghi đè.
- Approval → cần business rule.
- Audit log → append-only, không overwrite.

---

# 17. SYNC METADATA

Entity cần thiết có thể có:

```text
id
organization_id
project_id
created_at
updated_at
created_by
updated_by
version
sync_status
deleted_at
```

Sync system có thể cần:

```text
operation_id
device_id
client_timestamp
server_timestamp
sync_cursor
retry_count
last_error
```

Không tự ý thêm tất cả fields vào mọi bảng. Chỉ thêm khi có yêu cầu nghiệp vụ/kỹ thuật.

---

# 18. FEATURE-BASED ARCHITECTURE

Không tổ chức toàn bộ app chỉ theo technical type.

Không làm:

```text
components/
hooks/
services/
stores/
```

rồi dồn mọi nghiệp vụ vào đó.

Phải tổ chức theo Feature:

```text
features/
├── projects/
├── contractors/
├── workers/
├── safety/
├── health/
├── environment/
├── incidents/
├── inspections/
├── permits/
├── documents/
├── attendance/
├── equipment/
└── reports/
```

Mỗi feature có thể có:

```text
features/contractors/
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── store/
├── types/
└── index.ts
```

Chỉ tạo thư mục khi thực sự cần.

---

# 19. WEB ARCHITECTURE

```text
apps/web/src/
├── app/
├── features/
├── shared/
└── main.tsx
```

`shared/` chỉ chứa những thứ thực sự dùng chung.

Ví dụ:

```text
shared/
├── components/
├── hooks/
├── utils/
├── constants/
└── config/
```

Không đưa business logic của một feature vào `shared`.

---

# 20. MOBILE ARCHITECTURE

```text
apps/mobile/src/
├── app/
├── features/
├── shared/
├── database/
└── main/
```

Mobile được phép có native-specific implementation.

Không ép Web và Mobile dùng chung UI components.

Chia sẻ:

- Domain;
- Contracts;
- Auth rules;
- Validation;
- Sync logic;
- Utilities;
- i18n;
- Design tokens.

Không bắt buộc chia sẻ:

- React DOM components;
- React Native components;
- browser-specific APIs;
- native-specific APIs.

---

# 21. UI PACKAGE

`packages/ui` hoặc `shared-ui` chỉ chứa:

- Design Tokens;
- Typography;
- Spacing;
- Icons;
- Colors;
- Theme;
- Platform-neutral design definitions.

Không đưa business logic vào UI package.

Nếu có component dùng chung Web + Mobile, phải kiểm tra compatibility trước khi đưa vào package.

---

# 22. ZUSTAND RULES

Zustand không phải database.

Không lưu toàn bộ application data lâu dài vào global Zustand.

Phân loại:

### Global state

```text
auth
session
current organization
current project
app settings
UI preferences
```

### Feature state

```text
contractor filters
inspection draft
safety checklist UI state
report filters
```

### Persistent business data

Phải nằm ở:

```text
Database / Local DB
```

không phải Zustand.

---

# 23. APPLICATION LAYER

Application Layer điều phối use cases.

Ví dụ:

```text
CreateContractor
UpdateContractor
ApproveContractor
CreateSafetyInspection
SubmitIncident
ApprovePermit
SyncProject
```

Không đưa toàn bộ nghiệp vụ vào React component.

Không đưa business logic quan trọng vào:

```text
onClick()
useEffect()
```

nếu logic đó thuộc Domain/Application.

---

# 24. REPOSITORY PATTERN

UI không truy cập database trực tiếp.

Sai:

```text
Component
 ↓
Supabase.from(...)
```

Đúng:

```text
Component
 ↓
Feature
 ↓
Application Service
 ↓
Repository
 ↓
Adapter
 ↓
Supabase / WatermelonDB
```

Repository Interface có thể nằm ở abstraction layer.

Implementation nằm ở infrastructure/app-specific layer.

---

# 25. DEPENDENCY RULES

Bắt buộc:

```text
UI
 ↓
Feature
 ↓
Application
 ↓
Domain
```

Không được:

```text
Domain → React
Domain → Supabase
Domain → WatermelonDB
Domain → Expo
```

Không được:

```text
Component → Database
```

Không được:

```text
Web → Mobile
Mobile → Web
```

Không được:

```text
Package → App
```

Không được import ngược từ app vào package.

---

# 26. ARCHITECTURE GUARD

Phải xây dựng cơ chế kiểm tra dependency.

Mục tiêu:

```text
AI viết code
     ↓
Architecture Guard
     ↓
PASS / FAIL
```

Các rule tối thiểu:

1. Domain không import framework.
2. Domain không import infrastructure.
3. Shared package không import app.
4. Web không import Mobile.
5. Mobile không import Web.
6. UI không import database trực tiếp.
7. Feature không import private implementation của feature khác.
8. Cross-feature communication phải thông qua public API/contract.
9. Không circular dependency.
10. Không import package nội bộ bằng deep path nếu package đã có public entry point.

Có thể dùng ESLint rules, dependency-cruiser hoặc custom script.

---

# 27. AI AGENT RULES

Có 5 Agent chính:

```text
Architect
DBAgent
CoreAgent
WebAgent
MobileAgent
```

## Architect

Được:

- thiết kế;
- review architecture;
- tạo ADR;
- kiểm tra dependency;
- lập migration/refactor plan.

Không được tự ý viết hàng loạt business feature nếu không được giao.

## DBAgent

Được sửa:

```text
supabase/
packages/database/
packages/contracts/
```

Không được tự ý sửa UI.

## CoreAgent

Được sửa:

```text
packages/domain/
packages/contracts/
packages/auth/
packages/sync-engine/
packages/shared-utils/
```

Không được tự ý sửa Web UI hoặc Mobile UI.

## WebAgent

Được sửa:

```text
apps/web/
```

và import public API từ packages.

Không được sửa Mobile implementation.

## MobileAgent

Được sửa:

```text
apps/mobile/
```

và phần package được giao.

Không được sửa Web implementation.

---

# 28. SCOPE LOCK

Mỗi AI task phải có:

```text
Allowed Files
Forbidden Files
Objective
Acceptance Criteria
```

Ví dụ:

```text
Allowed:
apps/web/src/features/contractors/**

Forbidden:
apps/mobile/**
supabase/**
packages/domain/**
```

Nếu phát hiện cần sửa file ngoài scope:

1. Dừng.
2. Báo cáo file cần sửa.
3. Giải thích dependency.
4. Không tự ý sửa.

---

# 29. FILE SIZE RULE

AI phải tránh file quá lớn.

Mặc định:

```text
< 300 lines
```

Nếu file vượt khoảng 300 dòng và có thể tách hợp lý:

```text
MUST REFACTOR
```

Tách theo:

- component;
- service;
- hook;
- schema;
- types;
- utility;
- sub-feature.

Không được tách máy móc chỉ để giảm số dòng.

Mục tiêu là cohesion cao và coupling thấp.

---

# 30. SINGLE RESPONSIBILITY

Một file nên có một trách nhiệm chính.

Không tạo file:

```text
utils.ts
helpers.ts
common.ts
service.ts
```

khổng lồ chứa hàng chục chức năng không liên quan.

Tên file phải thể hiện trách nhiệm.

Ví dụ:

```text
calculateOvertime.ts
validatePermit.ts
createIncident.ts
syncContractor.ts
```

tốt hơn:

```text
helpers.ts
utils.ts
manager.ts
```

---

# 31. NO MOCK DATA IN PRODUCTION CODE

AI MUST NOT tạo mock data để giả vờ tính năng đã hoàn thành.

Không được:

```ts
const contractors = [...]
```

để thay thế database nếu task yêu cầu database thật.

Mock chỉ được phép trong:

- unit test;
- integration test;
- Storybook/test fixture nếu dự án sử dụng;
- development fixture có đánh dấu rõ.

Không được commit mock data như production data.

---

# 32. NO FAKE IMPLEMENTATION

Không được tạo:

```text
TODO
FIXME
return true
return []
return null
```

để giả lập chức năng đã hoàn thành.

Nếu chưa triển khai được:

```text
throw new Error("Not implemented");
```

hoặc báo cáo rõ trạng thái task, tùy ngữ cảnh.

Không được đánh dấu task hoàn thành khi implementation chưa thật.

---

# 33. ENVIRONMENT VARIABLES

Không hard-code:

- Supabase URL;
- Supabase keys;
- API keys;
- secrets;
- tokens;
- credentials.

Dùng:

```text
.env
.env.local
.env.example
```

Secret không được commit.

`.env.example` chỉ chứa placeholder.

---

# 34. SECURITY

Bắt buộc:

- RLS;
- least privilege;
- input validation;
- output validation khi cần;
- authentication;
- authorization;
- secure secret handling;
- audit trail cho thao tác nhạy cảm;
- không log secrets;
- không log access tokens;
- không đưa service-role key vào client.

Service-role credentials chỉ được dùng ở trusted server environment.

---

# 35. AUDIT LOG

Các thao tác quan trọng cần audit:

```text
Create
Update
Delete
Approve
Reject
Assign
Permission Change
Role Change
Export
Security-sensitive actions
```

Audit log phải có khả năng xác định:

```text
who
what
when
where/context
resource
old/new state nếu cần
```

Không dùng audit log như một bảng CRUD thông thường nếu nghiệp vụ yêu cầu append-only.

---

# 36. OBSERVABILITY

Production cần theo dõi:

```text
Error
Crash
Performance
API latency
Sync success
Sync failure
Queue size
Retry count
Conflict count
Last sync time
```

Kiến trúc:

```text
Application
 ↓
Observability
 ├── Logging
 ├── Error Tracking
 ├── Metrics
 └── Alerts
```

Không log dữ liệu nhạy cảm.

---

# 37. TESTING STRATEGY

Phải có:

```text
Unit
Integration
E2E
RLS/Security
```

## Unit

Test:

- domain rules;
- calculation;
- validation;
- pure functions.

## Integration

Test:

- repository;
- database;
- sync;
- API;
- authentication;
- authorization.

## E2E

Test:

```text
Login
 ↓
Select Organization
 ↓
Select Project
 ↓
Create Resource
 ↓
Edit
 ↓
Offline
 ↓
Reconnect
 ↓
Sync
 ↓
Verify
```

## Security/RLS

Test tenant isolation và permissions.

---

# 38. CI/CD QUALITY GATE

Pull Request không được merge nếu:

```text
Lint FAIL
OR
Typecheck FAIL
OR
Unit Test FAIL
OR
Integration Test FAIL
OR
Build FAIL
OR
Architecture Guard FAIL
OR
Security/RLS test FAIL
```

Pipeline tối thiểu:

```text
Pull Request
    ↓
Install
    ↓
Lint
    ↓
Typecheck
    ↓
Unit
    ↓
Integration
    ↓
Architecture Guard
    ↓
Build
    ↓
E2E
    ↓
Security
    ↓
PASS
```

---

# 39. TURBOREPO

Turborepo dùng để:

- cache;
- task orchestration;
- dependency-aware build;
- test;
- lint;
- typecheck.

Các script nên hỗ trợ:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm architecture:check
pnpm db:generate-types
```

Không tạo script trùng chức năng không cần thiết.

---

# 40. GIT / COMMIT RULES

AI phải commit thường xuyên theo task nhỏ.

Không tạo một commit khổng lồ cho nhiều mục tiêu không liên quan.

Khuyến nghị:

```text
feat:
fix:
refactor:
test:
docs:
chore:
build:
ci:
```

Ví dụ:

```text
feat(contractor): add contractor creation flow
fix(sync): retry failed outbox operations
refactor(domain): extract contractor rules
test(sync): add offline conflict tests
docs(architecture): add sync ADR
```

Mỗi commit nên:

- build được;
- typecheck được;
- không chứa thay đổi không liên quan;
- dễ rollback.

---

# 41. SCOPE LOCK + SMALL CHANGES

AI không được tiện tay:

- format toàn bộ project;
- rename hàng loạt;
- đổi package;
- sửa file không liên quan;
- refactor module khác;
- đổi API không được yêu cầu.

Nếu task:

```text
"Thêm nút Create Contractor"
```

không được nhân tiện:

```text
refactor auth
đổi database
đổi routing
đổi UI framework
```

---

# 42. DOCUMENTATION

Các tài liệu bắt buộc:

```text
docs/
├── architecture/
├── adr/
├── product/
├── security/
├── testing/
└── operations/
```

## Architecture

Mô tả:

- system architecture;
- package dependency;
- data flow;
- offline architecture;
- sync architecture;
- deployment.

## ADR

Mỗi quyết định kiến trúc lớn phải có ADR.

Ví dụ:

```text
ADR-001-monorepo.md
ADR-002-supabase.md
ADR-003-offline-first.md
ADR-004-watermelondb.md
ADR-005-sync-conflict.md
ADR-006-multi-tenancy.md
ADR-007-authorization.md
```

---

# 43. ADR FORMAT

Mỗi ADR:

```markdown
# ADR-XXX: Title

## Status

Proposed / Accepted / Superseded / Rejected

## Context

Vấn đề cần giải quyết.

## Decision

Quyết định được chọn.

## Alternatives

Các phương án khác.

## Consequences

Ưu điểm / nhược điểm / trade-offs.

## Security Impact

Ảnh hưởng bảo mật.

## Migration Impact

Ảnh hưởng migration.
```

AI không được thay đổi architecture decision quan trọng mà không cập nhật ADR.

---

# 44. REFACTORING RULE

Khi refactor:

1. Đọc architecture docs.
2. Xác định scope.
3. Xác định dependency.
4. Không phá API nếu chưa có migration plan.
5. Viết/điều chỉnh test.
6. Refactor.
7. Typecheck.
8. Test.
9. Architecture check.
10. Build.

Không refactor lớn trong cùng task với feature không liên quan.

---

# 45. MIGRATION STRATEGY

Không được "đập toàn bộ rồi xây lại" nếu hệ thống đang có dữ liệu production.

Refactor theo từng bước:

```text
Current
 ↓
Compatibility Layer
 ↓
New Architecture
 ↓
Migrate Feature
 ↓
Test
 ↓
Remove Old Code
```

Legacy code phải được đánh dấu rõ.

Ví dụ:

```text
docs/refactor-plan.md
```

hoặc issue/tracker tương ứng.

---

# 46. DEFINITION OF DONE

Một task chỉ được xem là DONE khi:

- [ ] Đúng scope.
- [ ] Không đổi Tech Stack trái phép.
- [ ] Không mock production data.
- [ ] Không fake implementation.
- [ ] TypeScript pass.
- [ ] ESLint pass.
- [ ] Test pass.
- [ ] Architecture Guard pass.
- [ ] Không circular dependency.
- [ ] Không security violation.
- [ ] Không hard-code secret.
- [ ] Multi-tenant boundary được bảo đảm nếu liên quan.
- [ ] RLS được cập nhật nếu liên quan.
- [ ] Documentation được cập nhật nếu architecture thay đổi.
- [ ] ADR được cập nhật nếu là quyết định kiến trúc.
- [ ] Commit nhỏ, rõ mục tiêu.
- [ ] Handover được cập nhật nếu task chuyển Agent.

---

# 47. AI HANDOVER CONTRACT

Mỗi Agent khi kết thúc task phải ghi:

```markdown
# HANDOVER

## Agent

WebAgent / MobileAgent / CoreAgent / DBAgent / Architect

## Task

Mô tả task.

## Completed

Các phần đã hoàn thành.

## Files Changed

Danh sách file.

## Architecture Impact

Có/Không.

## Database Impact

Có/Không.

## API/Contract Impact

Có/Không.

## Security Impact

Có/Không.

## Tests

Các test đã chạy.

## Known Issues

Các vấn đề còn lại.

## Next Agent

Agent tiếp theo.

## Recommended Next Step

Bước tiếp theo.
```

Không được nói "đã hoàn thành" nếu chưa chạy verification.

---

# 48. ARCHITECTURE CHECKLIST

Trước khi merge:

### Architecture

- [ ] Domain độc lập framework.
- [ ] Không import ngược dependency.
- [ ] Không circular dependency.
- [ ] Không God Package.
- [ ] Feature boundary rõ ràng.
- [ ] Shared package không chứa business logic không liên quan.

### Data

- [ ] Multi-tenant boundary rõ.
- [ ] Repository boundary đúng.
- [ ] Local DB không được truy cập trực tiếp từ UI.
- [ ] Sync metadata đúng.
- [ ] Conflict strategy được xác định.

### Security

- [ ] RLS.
- [ ] Permission.
- [ ] Tenant isolation.
- [ ] Secrets không hard-code.
- [ ] Không expose service-role key.
- [ ] Audit nếu cần.

### Quality

- [ ] TypeScript.
- [ ] ESLint.
- [ ] Tests.
- [ ] Build.
- [ ] Architecture Guard.

---

# 49. ARCHITECTURE PRINCIPLES

Các nguyên tắc không được phá vỡ:

## Principle 1 — Domain First

Business rules không phụ thuộc framework.

## Principle 2 — Feature Ownership

Mỗi feature sở hữu logic của chính nó.

## Principle 3 — Explicit Dependencies

Dependency phải rõ ràng.

## Principle 4 — Database Is Not UI State

Database và Zustand có trách nhiệm khác nhau.

## Principle 5 — Offline Is First-Class

Offline không phải error case.

## Principle 6 — Security Is Layered

Frontend guard không thay thế RLS.

## Principle 7 — Multi-tenancy Is Foundational

Tenant isolation phải được thiết kế từ database.

## Principle 8 — AI Must Be Constrained

AI chỉ sửa đúng scope được giao.

## Principle 9 — Automation Must Verify

Không tin AI chỉ vì AI nói "done".

## Principle 10 — Small Changes

Thay đổi nhỏ, test nhanh, rollback dễ.

---

# 50. AI EXECUTION PROTOCOL

Trước khi viết code, AI MUST thực hiện:

```text
1. Đọc task.
2. Đọc AGENTS.md.
3. Đọc architecture rules.
4. Xác định Agent role.
5. Xác định Allowed Files.
6. Xác định Forbidden Files.
7. Kiểm tra architecture hiện tại.
8. Lập implementation plan ngắn.
9. Xác định test cần viết.
10. Code.
11. Chạy lint.
12. Chạy typecheck.
13. Chạy test.
14. Chạy architecture check.
15. Kiểm tra git diff.
16. Kiểm tra scope.
17. Cập nhật documentation nếu cần.
18. Cập nhật handover.
19. Commit.
20. Báo cáo kết quả.
```

Không được bỏ qua bước verification chỉ vì task nhỏ.

---

# 51. AI RESPONSE FORMAT

Sau mỗi task, AI phải báo cáo:

```text
TASK:
<task>

STATUS:
DONE / PARTIAL / BLOCKED

FILES CHANGED:
<list>

ARCHITECTURE IMPACT:
<yes/no + explanation>

DATABASE IMPACT:
<yes/no>

SECURITY IMPACT:
<yes/no>

TESTS:
<commands + result>

ARCHITECTURE CHECK:
PASS / FAIL

KNOWN ISSUES:
<list>

NEXT STEP:
<next step>
```

---

# 52. HARD RULES — TUYỆT ĐỐI

AI MUST NOT:

1. Tự ý đổi Tech Stack.
2. Tự ý thêm framework.
3. Tự ý tạo mock production data.
4. Tự ý tạo fake implementation.
5. Tự ý sửa file ngoài scope.
6. Tự ý sửa database schema ngoài task.
7. Bypass RLS.
8. Đưa service-role key vào client.
9. Đưa business logic lớn vào UI.
10. Cho UI truy cập database trực tiếp.
11. Cho Domain import framework.
12. Tạo circular dependency.
13. Tạo God Package.
14. Tạo file khổng lồ không cần thiết.
15. Đánh dấu task DONE khi chưa verify.
16. Xóa test để làm pipeline pass.
17. Disable ESLint/TypeScript chỉ để code chạy.
18. Disable RLS để giải quyết lỗi.
19. Bỏ qua conflict trong Offline Sync.
20. Commit secret.
21. Refactor ngoài phạm vi.
22. Thay đổi kiến trúc lớn mà không có ADR.

---

# 53. PRIORITY ORDER

Khi có xung đột giữa các mục tiêu, ưu tiên:

```text
1. Security
2. Data Integrity
3. Architecture Integrity
4. Correctness
5. Testability
6. Maintainability
7. Performance
8. Developer Convenience
```

Không hy sinh Security/Data Integrity chỉ để code nhanh hơn.

---

# 54. FINAL ARCHITECTURE

Kiến trúc chuẩn cuối cùng:

```text
                         USERS
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
        React Web                  React Native
             │                           │
             ▼                           ▼
         Features                    Features
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                    Application Layer
                           │
                           ▼
                      Domain Layer
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
              Contracts           Auth
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                     Repository
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
             Local DB            Supabase
          WatermelonDB          PostgreSQL
                 │                   │
                 └─────────┬─────────┘
                           ▼
                       Sync Engine
                           │
                           ▼
                     Edge Functions
                           │
                           ▼
                 External Integrations
```

AI Governance:

```text
                         AI GOVERNANCE
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
        Architect           DBAgent          CoreAgent
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 WebAgent           MobileAgent
                    │                   │
                    └─────────┬─────────┘
                              ▼
                           CODEBASE
                              │
                              ▼
                     Architecture Guard
                              │
                              ▼
                            CI/CD
                              │
                              ▼
                         Production
```

---

# 55. FINAL INSTRUCTION TO AI

> **Bạn không chỉ đang viết code. Bạn đang duy trì một hệ thống kiến trúc dài hạn.**
>
> Mọi code phải tuân thủ Architecture Contract này.
>
> Nếu yêu cầu của người dùng mâu thuẫn với Architecture Contract, không được âm thầm phá kiến trúc. Hãy:
>
> 1. Xác định xung đột.
> 2. Giải thích tác động.
> 3. Đề xuất phương án.
> 4. Nếu là thay đổi kiến trúc, tạo ADR.
> 5. Chờ quyết định trước khi thay đổi kiến trúc.
>
> **Không đo chất lượng bằng số dòng code được tạo ra.**
>
> Đo bằng:
>
> - correctness;
> - security;
> - maintainability;
> - testability;
> - architecture integrity;
> - data integrity;
> - khả năng mở rộng;
> - khả năng nhiều AI Agent cùng làm việc mà không phá code của nhau.
>
> **AI là người thực thi. Architecture là luật. CI là người kiểm tra.**
