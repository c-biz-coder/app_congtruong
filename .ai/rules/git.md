# Git Rules

- Commit small, focused changes (one goal per commit). No mega-commits.
- Conventional prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`,
  `chore:`, `build:`, `ci:`; add a scope when useful.

  ```
  feat(contractor): add contractor creation flow
  fix(sync): retry failed outbox operations
  refactor(domain): extract contractor rules
  test(sync): add offline conflict tests
  docs(architecture): add sync ADR
  ```

- Every commit should build, typecheck, and not mix unrelated changes.
- Never commit secrets or `.env` files.
- Do not disable lint/typecheck to force a green build — fix the code.
- Rebase cleanly; prefer small rollback-safe steps over large rewrites.