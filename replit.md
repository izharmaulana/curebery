# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, react-leaflet, zustand, framer-motion

## Applications

### CureBery (artifacts/cure-bery)
Platform layanan perawat online Indonesia.

**Features:**
- Split-screen login page (pasien sisi kiri, perawat sisi kanan)
- Dashboard pasien: sidebar daftar perawat terdekat (3km) + peta interaktif
- Dashboard perawat: kelola status online/offline
- Peta interaktif menggunakan react-leaflet + OpenStreetMap (gratis, no API key)
- Auth dengan zustand state management + localStorage persistence
- Dark Mode: toggle di header pasien & perawat, CSS variable-based, tersimpan di localStorage
- Riwayat Layanan (`/riwayat`): histori layanan dengan stats, filter status, pencarian, dan bintang rating
- Rating Modal: muncul setelah tenaga medis tiba di lokasi tracking (bintang 1-5 + quick tags + komentar)
- Leaderboard Kuis (`/leaderboard`): podium top 3 + daftar peringkat dengan badge, skor disimpan dari game-quiz

**Demo Accounts (stored in PostgreSQL):**
- Pasien: budi@test.com / test123
- Perawat: rina@test.com / test123

**Backend Architecture:**
- PostgreSQL + Drizzle ORM for all data (no in-memory state)
- Session-based auth via express-session (connect.sid cookie)
- SHA-256 password hashing (demo grade)
- Vite dev proxy: `/api/*` → API server port 8080
- Auto-refetch every 20s for real-time nurse list

**Known Working Flows (E2E tested):**
- Patient login → dashboard with map + nearby nurses
- Nurse login → dashboard with online/offline toggle
- Nurse toggle status → persists to DB, visible to patients

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── cure-bery/          # CureBery React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, session, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `health.ts`: `GET /healthz`
  - `auth.ts`: `POST /auth/login/patient`, `POST /auth/login/nurse`, `POST /auth/logout`, `GET /auth/me`
  - `nurses.ts`: `GET /nurses/nearby`, `PUT /nurses/me/location`, `PUT /nurses/me/status`, `GET /nurses/me/profile`
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/users.ts` — usersTable (patients + nurses login) and nursesTable (nurse profiles)

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
