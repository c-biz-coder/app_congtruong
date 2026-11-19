# Coding Rules

1. **TypeScript strict.** No `any` — use `unknown`, generics or real types.
2. **Factory overhead = 0:** prefer small typed files over mega `utils.ts`,
   `helpers.ts`, `service.ts`.
3. **File size:** keep files under ~300 lines; split by responsibility
   (component, hook, schema, service, types).
4. **Naming:**
   - Tables/columns: `snake_case`
   - Variables/functions: `camelCase`
   - Components/types: `PascalCase`
5. **State:** Zustand only for global state (session, tenant, project, app
   settings, UI prefs). Business data lives in the DB / local DB — never in
   Zustand.
6. **Application layer:** business flows (`CreateContractor`, `SubmitIncident`)
   live in application services, not in `onClick()` / `useEffect()`.
7. **No mock data in production code.** Mocks only in tests/fixtures.
8. **No fake implementations.** `TODO`/`return null` are not "done". Use
   `throw new Error("Not implemented")` when something is intentionally pending
   and report STATUS: PARTIAL/BLOCKED.
9. **Public API hygiene:** import packages by name only via their `index.ts`.