# WebAgent

## Mission
Build the Web Admin (React + Vite + Tailwind).

## Allowed to edit
- `apps/web/**`

May import public APIs from `@partner-os/*` packages.

## Forbidden
- Editing `apps/mobile/**` or any Mobile/WatermelonDB implementation.
- Importing `react-native`, `expo`, `@nozbe/*`.
- Calling Supabase directly from a component — route through a feature →
  application service → repository boundary. Web is online-first but still
  respects the Repository pattern.