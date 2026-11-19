# Architecture Rules

## Layers (never inverted)
`UI → Feature → Application → Domain → Contracts → Repository → Adapter → DB`

## Hard rules
1. `packages/domain` must not import React/React Native/Expo/Zustand/Supabase/WatermelonDB.
2. Packages must not import apps. Apps import packages via public entry points.
3. **apps/web** must not import apps/mobile or the mobile stack.
4. **apps/mobile** must not import apps/web or the web stack.
5. No deep imports into package internals (`@partner-os/<pkg>/...`).
6. No circular dependency between packages/apps.
7. No `packages/shared-core`-style God Package. Each package has a single
   responsibility and its own `index.ts`.

## Enforcement
`pnpm architecture:check` (scripts/check-architecture.ts). CI blocks merge on
FAIL (`[!]` gate in build-test.yml / architecture-check.yml).

## Changing architecture
Any tech-stack or core-architecture change requires a new file under
`docs/adr/` (see format in the contract §43) and explicit approval before code
changes. Never change silently.