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

### Commit 3 — Auth client layer (apps/web)
Prompt: build the frontend auth layer on top of commit 2's API — `lib/apiClient.ts` (a fetch
wrapper always sending `credentials: 'include'`, `Content-Type: application/json` only on
POST/PUT, parsing JSON and throwing a typed `ApiError` on `status >= 400`); `hooks/useSession.ts`
(an SWR hook against `/api/auth/me`, `revalidateOnFocus: false`, translating a 401 into
`session: null` instead of an SWR error state); `components/auth/RoleSwitcher.tsx` (a `<select>`
that posts to `/api/auth/login` and calls `mutate()`); `components/auth/RoleGate.tsx` (renders
`children` only when `session && hasAllPermissions(session.role, requires)`, `null` while
loading, `fallback ?? null` otherwise); `components/layout/Header.tsx`; and React Router wiring
in `App.tsx` for `/` (`DashboardPage`) and `/admin/audit` (`AuditPage`, gated by `RoleGate` +
`UnauthorizedNotice`). Same code rules, plus commit-specific ones: no `useEffect` for fetching
(SWR owns all data-fetching), and no duplicating the permission matrix — `RoleGate` imports
`hasAllPermissions` straight from `@app/shared` instead of re-implementing role checks in the
UI. Verified end-to-end with a headless-Chromium script (Playwright) driving the actual dev
servers, not just the unit test suite: role switch updates the dashboard text live, and
`/admin/audit` shows `UnauthorizedNotice` as viewer / the real content as admin.

### Commit 4 — CoinGecko data layer (apps/api)
Prompt: build the market-data layer on top of commits 2–3 — a dependency-free
`shared/cache/memoryCache.ts` (`MemoryCache` class, lazy expiration on read);
`repositories/coinGeckoRepository.ts` (native `fetch` + `AbortController` timeout,
exponential backoff retry on 429/5xx up to `_MAX_RETRIES`, throwing an exported
`RateLimitedError` once retries are exhausted, HTTP only — no caching here);
`domains/markets/marketsService.ts` (per-method try/catch, cache key from
`vsCurrency` + sorted `ids`, TTLs of 30s/5min/1h for markets/chart/currencies,
mock-data fallback with `source: 'mock'` when the repository throws
`RateLimitedError`, structured `console.log` events for cache hit/miss/mock-fallback,
mapping raw CoinGecko shapes to the new `MarketDTO`/`ChartPoint` types in
`@app/shared` so the route never leaks the raw repo response); and
`routes/markets.routes.ts` (`GET /api/markets`, `GET /api/markets/:id/chart`,
`GET /api/currencies`, all behind `withAuth({ requires: ['metrics:read'] })`,
Zod-validated query/params, `X-Data-Source: mock` header when the service reports
a mock response). Verified the actual deliverable twice against the real network,
not just mocks: once against live CoinGecko (`GET /api/markets?vs=usd` as an
authenticated viewer returned real market data), and once with `COINGECKO_BASE_URL`
pointed at an unreachable host to force `RateLimitedError` and confirm the mock
fallback + `X-Data-Source: mock` header actually show up end-to-end.

### Commit 5 — Dashboard UI (apps/web)
Prompt: build the market dashboard on top of commit 4's API — `MetricSelector.tsx`
(checkbox multi-select over `price`/`change24h`/`volume24h`/`marketCap`, internal
state + `onChange` callback, options as a file constant); `CurrencySelector.tsx`
(SWR against `/api/currencies`, controlled `value`/`onChange`, default `'usd'`);
`MetricsGrid.tsx` (SWR against `/api/markets?vs=<>` with `refreshInterval: 30_000`,
top-10 rows, columns driven by `visibleMetrics`, skeleton while loading, a yellow
banner when the response carried `X-Data-Source: mock`, clickable rows calling
`onSelectAsset`); `PriceChart.tsx` (SWR against `/api/markets/:id/chart?days=<>`,
a Recharts `ResponsiveContainer`/`LineChart` with a tooltip, a `1D`/`7D`/`30D`
toggle above the chart); and `DashboardPage.tsx` wiring it all together inside
`RoleGate requires={['metrics:read']}`, owning `vsCurrency`/`visibleMetrics`/
`selectedAsset` state and a controls-on-top / grid-left / chart-right layout that
stacks on mobile. Same commit rules as before: SWR for all fetching, no manual
`useEffect`, short components, no backend changes (pure consumption of commit 4's
routes). `X-Data-Source` isn't exposed by the existing `apiClient.get()` (it only
returns the parsed body), so I added a small `apiClient.getWithHeaders()` alongside
it rather than reaching for a raw `fetch()` in the component, keeping `credentials:
'include'` and the `ApiError` handling shared. Verified in a real browser (Playwright
driving the actual dev servers): switching the currency re-fetches and re-labels
every value, unchecking a metric removes its column live, clicking a row selects
the asset and renders a real price line for all three timeframes.

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

- `apps/web`'s `vitest`/`vite` versions were mismatched: `vitest@^2.1.4` bundles `vite@5`
  internally, but `npm create vite@latest` had scaffolded the workspace on `vite@8`. Both
  versions type-checked fine on their own, but `vite.config.ts` — which merges `vitest/config`'s
  `defineConfig` (typed against vite 5) with `@vitejs/plugin-react`/`@tailwindcss/vite` (typed
  against vite 8) — failed `tsc -b` with a wall of "Plugin<any> is not assignable" errors. This
  never showed up in `vitest run` (which just executes the config, doesn't type-check it against
  the *other* vite's types) or in the day-to-day dev server — only `npm run build -w apps/web`
  (`tsc -b && vite build`) caught it, and only because I ran the full build instead of trusting
  the test suite alone. Fixed by upgrading `vitest` to `^5.0.1` (peer-compatible with `vite@8`)
  across all three workspaces for consistency.

- `apps/api`'s `dev`/`start` scripts never actually loaded the root `.env` file — `env.ts`
  reads `process.env` directly, and neither `tsx watch` nor plain `node` source `.env` on their
  own. `npm run dev` (with no shell-exported `SESSION_SECRET`) crashed immediately on the Zod
  validation this project's own commit 2 added, so the README's documented quick-start ("cp
  .env.example .env; npm run dev") never actually worked. Only surfaced when I tried to drive
  the app in a real browser instead of relying on the test suite's injected `test.env` values.
  Fixed with Node's built-in `--env-file-if-exists=../../.env` flag on both scripts (falls back
  to the Zod error, not a Node crash, if `.env` is still missing) — with one follow-up bug of
  its own: placing the flag *before* `tsx`'s `watch` subcommand (`tsx --env-file-if-exists=... watch src/index.ts`)
  makes tsx's CLI parser treat the literal string `watch` as the entry module instead of the
  subcommand, crashing with `ERR_MODULE_NOT_FOUND` for a module named `watch`. The flag has to
  go *after* `watch`: `tsx watch --env-file-if-exists=../../.env src/index.ts`.

- `apps/api/tsconfig.json` had no `exclude`, so `tsc -p .` (the `build` script) compiled
  `src/app.test.ts` straight into `dist/app.test.js` as CommonJS. Vitest's default include glob
  then picked up that compiled file as a second, unrelated test suite and crashed with "Vitest
  cannot be imported in a CommonJS module using require()" the next time `npm test` ran after a
  build. Only surfaced by running `npm run build` followed by `npm test` back to back, not by
  either command alone. Fixed by adding `"exclude": ["src/**/*.test.ts"]` to
  `apps/api/tsconfig.json`.

- `tests/integration/markets.test.ts` (supertest + msw) initially used
  `onUnhandledRequest: 'error'`, copying the pattern from the CoinGecko repository's own unit
  test. That broke both tests in the file — not because the CoinGecko mock was wrong, but
  because msw's Node interceptor patches the process's HTTP stack globally, so it also
  intercepted supertest's own loopback requests to the ephemeral local server the app under
  test runs on, and errored on those as "unhandled" since only the CoinGecko URL had a
  handler. Fixed by switching that file's `server.listen()` to
  `onUnhandledRequest: 'bypass'`, so only the explicitly-mocked CoinGecko endpoint is
  intercepted and every other request (the real local supertest traffic) passes through
  untouched. The repository-level unit test correctly keeps `'error'`, since it never goes
  through a local server — only the direct outbound `fetch` calls under test exist there.

- `MetricSelector` defaults every checkbox to checked (its own internal state starts as
  `DEFAULT_METRIC_KEYS`, all four keys), but it only calls `onChange` when the user actually
  toggles a checkbox — never on mount, per the "no `useEffect`" rule. If `DashboardPage` had
  initialized its own `visibleMetrics` state to `[]` (the naive reading of "local state" with
  no explicit initial value), the grid would render with every checkbox showing checked while
  displaying zero metric columns, until the user unchecked and rechecked something. Caught
  before it ever ran, while wiring `DashboardPage` and noticing the two components' defaults
  weren't actually the same value. Fixed by exporting `MetricSelector`'s default list as
  `DEFAULT_METRIC_KEYS` and having `DashboardPage` initialize its state from that same
  constant, so both components agree on the initial selection without an effect keeping them
  in sync.
