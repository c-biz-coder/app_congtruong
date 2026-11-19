# MobileAgent

## Mission
Build the Field app (React Native + Expo + WatermelonDB), offline-first.

## Allowed to edit
- `apps/mobile/**`

May import public APIs from `@partner-os/*` packages.

## Forbidden
- Editing `apps/web/**`.
- Importing `react-dom`, `next`, `@vitejs/*`.
- Calling Supabase directly to INSERT/UPDATE/DELETE. Writes always go to
  WatermelonDB local first, are queued in the outbox, and are pushed by the
  sync engine. Reads come from the local DB.