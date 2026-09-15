# dynamic-rbac-dashboard

A real-time financial dashboard (market data, a per-user watchlist, volatility
alert thresholds, and an audit log) built around **dynamic, server-enforced
RBAC**: three roles, five permissions, and a rule that holds everywhere in
this codebase — the UI hides what a role can't use, but the API is the only
real authority. Every gated route re-checks permissions itself; nothing is
ever secured by hiding a button. Technical assessment project.

## Stack

- `apps/api` — Node.js + Express + TypeScript. Session auth via signed JWT
  cookies (`jose`), Zod-validated input everywhere, in-memory repositories
  (no database — this is a scoped assessment, not a production backend).
- `apps/web` — Vite + React + TypeScript + Tailwind. All data fetching goes
  through SWR; no `useEffect`-based fetching anywhere.
- `packages/shared` — `Role`/`Permission`/DTO types, the `ROLE_PERMISSIONS`
  matrix, and `hasPermission`/`hasAllPermissions` helpers, consumed by both
  apps so the permission matrix exists in exactly one place.

## Quick start

### Option A — Docker (closest to production)

```bash
cp .env.example .env   # fill in SESSION_SECRET
npm install
npm run start:all      # docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:4000 (health check at `GET /health`)

### Option B — local dev (hot reload)

```bash
cp .env.example .env   # fill in SESSION_SECRET
npm install
npm run dev
```

- API: http://localhost:4000 (`tsx watch`, restarts on change)
- Web: http://localhost:5173 (Vite dev server, proxies `/api/*` to the API)

Either way, `packages/shared` is compiled once automatically (`predev`/root
`build` build it first) — you don't need a separate step for it.

## Folder structure

```
apps/
  api/
    src/
      domains/        business logic per feature (auth, markets, watchlist,
                       thresholds, audit) — try/catch per method, no framework
                       imports beyond what's strictly needed
      repositories/    data access (in-memory stores, the CoinGecko HTTP
                       client) — no business rules here
      routes/          Express routers: Zod validation, withAuth(...), maps
                       service results/errors to HTTP responses
      shared/          cross-cutting: env validation, the withAuth middleware,
                       the in-memory cache
    tests/
      unit/            per-module tests (mocked collaborators)
      integration/     supertest against the real createApp()
  web/
    src/
      components/      one folder per feature area (auth, markets, watchlist,
                       thresholds, audit, layout)
      hooks/           SWR wrappers (useSession, useThresholds)
      lib/             apiClient (fetch wrapper: credentials, JSON, ApiError)
      pages/           route-level components (Dashboard, Audit)
    tests/             cross-cutting component tests (e.g. RoleGate)
packages/
  shared/
    src/               Role/Permission/DTO types, the RBAC matrix, pure
                       helpers — no Node or React dependency
```

## RBAC matrix

| Permission          | viewer | trader | admin |
| -------------------- | :----: | :----: | :---: |
| `metrics:read`       |   ✅   |   ✅   |  ✅   |
| `watchlist:read`      |        |   ✅   |  ✅   |
| `watchlist:write`     |        |   ✅   |  ✅   |
| `audit:read`          |        |        |  ✅   |
| `thresholds:write`    |        |        |  ✅   |

The matrix itself lives in one place: `packages/shared/src/permissions.ts`
(`ROLE_PERMISSIONS`). Both the API's `withAuth({ requires })` middleware and
the web's `<RoleGate requires={...}>` component call the same
`hasAllPermissions(role, requires)` helper against it — the frontend never
re-implements the check.

## Endpoints and required permissions

| Method | Path                       | Requires             | Notes                                   |
| ------ | -------------------------- | --------------------- | ---------------------------------------- |
| GET    | `/health`                  | —                      | Liveness check                           |
| POST   | `/api/auth/login`          | —                      | Body `{ role }`, sets the session cookie |
| POST   | `/api/auth/logout`         | —                      | Clears the session cookie                |
| GET    | `/api/auth/me`             | valid session          | Returns `{ role }`                       |
| GET    | `/api/markets`              | `metrics:read`         | Query `vs`, `ids`                        |
| GET    | `/api/markets/:id/chart`    | `metrics:read`         | Query `days` (`1`\|`7`\|`30`)            |
| GET    | `/api/currencies`           | `metrics:read`         |                                           |
| GET    | `/api/watchlist`             | `watchlist:read`       |                                           |
| POST   | `/api/watchlist`             | `watchlist:write`      | Body `{ id }`                            |
| DELETE | `/api/watchlist/:id`         | `watchlist:write`      |                                           |
| GET    | `/api/thresholds`            | `metrics:read`         |                                           |
| PUT    | `/api/thresholds`            | `thresholds:write`     | Body `{ volatilityAlertPct }`, range `[0.1, 100]` |
| GET    | `/api/audit`                 | `audit:read`           | Query `action`, `role`, `limit`          |

A request that's authenticated but lacks the required permission gets `403`;
one with no valid session cookie gets `401` — regardless of what the UI shows.

## Switching role for testing

There's no real login/user system — this is an RBAC demo, not an identity
system. The **role switcher** in the header (top right) calls
`POST /api/auth/login` with the chosen role and issues a fresh session for
it. Use it to move between `viewer` → `trader` → `admin` and watch the UI
(and the API's actual responses) change with it. To confirm the server is
the real authority rather than the UI just hiding buttons, try the same
request the UI would send but from a shell:

```bash
curl -c cookies.txt -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"role":"trader"}'

curl -b cookies.txt -X PUT localhost:4000/api/thresholds \
  -H 'Content-Type: application/json' -d '{"volatilityAlertPct":8}'
# -> 403, even though the request itself is well-formed
```

## Running tests

```bash
npm test               # every workspace, once
npm run test:watch -w apps/api     # watch mode, a single workspace
npm run test:coverage -w apps/web  # coverage report, a single workspace
```

`npm test` at the root builds `packages/shared` first (via a `pretest`
hook), then runs `vitest run` in `packages/shared`, `apps/api`, and
`apps/web`. Each workspace also exposes `test`, `test:watch`, and
`test:coverage` individually.

## Other scripts

```bash
npm run build      # build shared, api, and web (in that order)
npm run lint        # lint across all workspaces
npm run start:all   # docker compose up --build
```
