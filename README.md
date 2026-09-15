# dynamic-rbac-dashboard

Real-time financial dashboard with dynamic, server-enforced RBAC. Technical assessment project.

## Stack

- `apps/api` — Node.js + Express + TypeScript
- `apps/web` — Vite + React + TypeScript
- `packages/shared` — shared types, RBAC matrix, pure helpers

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

- API runs on http://localhost:4000 (health check at `GET /health`)
- Web runs on http://localhost:5173 (requests to `/api/*` proxy to the API)

## Other scripts

```bash
npm run build   # build shared, api, and web
npm test        # run tests across all workspaces
npm run lint     # lint across all workspaces
npm run start:all # docker compose up --build
```
