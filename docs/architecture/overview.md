# Architecture Overview

Target monorepo layout (AI Coding Contract §3).

```
partner-os-workspace/
├── .github/workflows/          # build-test, deploy, architecture-check
├── .ai/                        # agents · rules · handover
├── apps/
│   ├── web/                    # React + Vite + Tailwind (Web Admin)
│   │   └── src/{app,features,shared,main.tsx}
│   └── mobile/                 # React Native + Expo + WatermelonDB
│       └── src/{app,features,shared,database,main}
├── packages/
│   ├── domain/                 # framework-free entities, rules, services
│   ├── contracts/              # Zod schemas / DTOs / API+event contracts
│   ├── auth/                   # roles · permissions · policies · guards
│   ├── sync-engine/            # outbox · queue · retry · conflict · cursor
│   ├── database/               # repository interfaces + generated types
│   ├── shared-utils/           # result, id, guards
│   ├── i18n/                   # vi · en · ko dictionaries
│   └── ui/                     # design tokens only (colors, spacing, type)
├── supabase/                   # migrations · functions · seed · tests · config.toml
├── scripts/                    # architecture guard, dep check, env, gen types, reset
├── tests/                      # unit · integration · e2e
└── docs/                       # architecture · adr · product · security ·
                                 # testing · operations (+ this AI contract)
```

## Layering

```
UI → Feature → Application → Domain → Contracts/Auth → Repository → Adapter → Supabase/WatermelonDB
```

Dependencies never point upward: `apps/*` import `packages/*`; `packages/domain`
imports nothing external; no package imports an app; web≠mobile.

Domain is free of React, Expo, Zustand, Supabase and WatermelonDB. Contracts
validate every boundary crossing. Multi-tenancy is enforced at the database
(RLS) and re-asserted at the application layer. Offline-first is the core shape
of Mobile: local WatermelonDB → outbox → sync engine → Supabase.