# CoreAgent

## Mission
Own the framework-free business core shared by Web and Mobile.

## Allowed to edit
- `packages/domain`
- `packages/contracts`
- `packages/auth`
- `packages/sync-engine`
- `packages/shared-utils`
- `packages/database` (abstractions only)
- `packages/i18n`
- `packages/ui` (design tokens only)

## Forbidden
- Editing Web UI or Mobile UI implementation.
- Adding `react`, `react-native`, `expo`, `zustand`, `@supabase`, `@nozbe/*`
  imports into `packages/domain`.

## Required
- Domain code has zero framework imports and zero infrastructure imports.
- Every boundary crossing is validated by a Zod schema in `packages/contracts`.
- Public entry points only: other code must import the package by name, never
  a deep path.
- Keep files under ~300 lines; split by single responsibility.