# AI Prompts Log

## Key Prompts

### Commit 1 — Monorepo scaffolding + shared RBAC matrix
Prompt: scaffold the npm-workspaces monorepo (`apps/api`, `apps/web`, `packages/shared`) with
fixed root scripts (`dev`/`build`/`test`/`lint`/`start:all`), a strict base `tsconfig`, the
`Role`/`Permission`/`Session` types and `ROLE_PERMISSIONS` matrix with `hasPermission`/
`hasAllPermissions` helpers in `packages/shared`, a minimal Express app in `apps/api` exposing
`GET /health`, a Vite + React + TS + Tailwind app in `apps/web` proxying `/api` to port 4000, a
Vitest suite covering all 15 role × permission combinations, and `AI_PROMPTS.md`/`README.md`
placeholders — no business logic yet, per the project's code rules (braces always, single
return per method, magic values as file-level `_SCREAMING_SNAKE` constants, strict TS with no
`any`).

## Bugs / hallucinations detected

- `apps/web`'s `vitest run` script exits with code 1 ("No test files found") when the workspace
  has no test files yet, which breaks the root `npm test --workspaces --if-present` run even
  though the workspace itself has nothing wrong. Fixed by adding a minimal smoke test
  (`src/App.test.tsx`) that renders the placeholder dashboard heading, plus a
  `src/setupTests.ts` wiring `@testing-library/jest-dom` and a `test` block (jsdom environment)
  in `vite.config.ts`.
