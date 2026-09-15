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

### Commit 2 — Backend authentication (session cookies + RBAC middleware)
Prompt: implement `apps/api` authentication — a Zod-validated `env` module
(`shared/config/env.ts`) that fails fast at startup on a missing `SESSION_SECRET`; a
`domains/auth/session.ts` issuing/verifying HS256 JWTs via `jose` (8h TTL, random
`crypto.randomUUID()` subject) with an `httpOnly`/`sameSite=lax` cookie builder; a
`shared/middleware/withAuth({ requires })` that reads the `session` cookie, returns
401/403 as appropriate, and — only on success — augments `req.session` via declaration
merging (`types/express.d.ts`) before calling `next()`; `routes/auth.routes.ts` for
`POST /login`, `POST /logout`, `GET /me`; and integration (supertest) + unit tests for
all of it. Same code rules as commit 1 (braces always, single `return result` at the
end of each method, file-level `_SCREAMING_SNAKE` constants, mandatory try/catch under
`domains/`, no `any`), plus: the server is the final authority for RBAC — the login
route derives its Zod role enum from `@app/shared`'s `ROLE_PERMISSIONS` keys instead of
a separately hand-typed list, so a role can't be added to the shared matrix without the
API accepting it.

## Bugs / hallucinations detected

- `apps/web`'s `vitest run` script exits with code 1 ("No test files found") when the workspace
  has no test files yet, which breaks the root `npm test --workspaces --if-present` run even
  though the workspace itself has nothing wrong. Fixed by adding a minimal smoke test
  (`src/App.test.tsx`) that renders the placeholder dashboard heading, plus a
  `src/setupTests.ts` wiring `@testing-library/jest-dom` and a `test` block (jsdom environment)
  in `vite.config.ts`.

- `res.clearCookie(name, options)` in Express 4 logs a deprecation warning when `options`
  includes `maxAge` ("this option will be ignored" in Express 5) — reusing the same
  `CookieOptions` object built for setting the cookie (which needs `maxAge` for the 8h TTL)
  to also clear it was wrong. Caught by running the test suite (the warning showed up in
  stderr during `POST /api/auth/logout`), not by static review. Fixed by splitting
  `session.ts`'s cookie builder into a shared `buildBaseCookieOptions()` (httpOnly,
  sameSite, secure, path — no maxAge) used by both `buildCookie()` (adds maxAge, for
  login) and a new `buildClearCookie()` (no maxAge, for logout):

  ```diff
  - export function buildCookie(_token: string): CookieOptions {
  -   ...
  -   result = {
  -     httpOnly: true,
  -     sameSite: 'lax',
  -     secure: env.NODE_ENV === 'production',
  -     path: '/',
  -     maxAge: _SESSION_TTL_SECONDS * 1000,
  -   };
  +   function buildBaseCookieOptions(): Omit<CookieOptions, 'maxAge'> {
  +     return { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/' };
  +   }
  +
  +   export function buildCookie(_token: string): CookieOptions {
  +     ...
  +     result = { ...buildBaseCookieOptions(), maxAge: _SESSION_TTL_SECONDS * 1000 };
  +   }
  +
  +   export function buildClearCookie(): CookieOptions {
  +     ...
  +     result = buildBaseCookieOptions();
  +   }
  ```

  `auth.routes.ts`'s logout handler now calls `res.clearCookie(_COOKIE_NAME, buildClearCookie())`
  instead of reusing `buildCookie('')`.
