# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use clean non-verbose code and reusable components when possible. Use global variables for colors and other styling choices when appropriate.

## Project

Popcorn — a movie/TV rating app. Users rate titles on a 0–6 "popcorn bag" scale in half-bag increments, keep a personal watched timeline, and follow other users for a basic activity feed. Currently mid-build; only the auth/foundation layer (Phase 1 of the MVP plan) is implemented. Search, ratings, timeline, and social features are stubbed client-side pages awaiting their backend routes.

## Commands

All commands run from the repo root via npm workspaces (`shared`, `server`, `client`). There is no top-level test runner config beyond delegating to each workspace.

```bash
npm run dev          # boots server (tsx watch, :8080) and client (Vite, :5173) concurrently
npm run build         # builds shared -> server -> client, in that order (order matters: server/client import @popcorn/shared's dist output)
npm run typecheck     # tsc --noEmit across all three workspaces
npm run test          # vitest run across all three workspaces
npm run lint          # eslint across all three workspaces — NOTE: no eslint config exists yet, this will currently fail
```

Single-workspace equivalents: `npm run <script> --workspace=server` (or `-w client`, `-w shared`).

Server-specific (run from `server/`, or `--workspace=server`):
```bash
npx prisma migrate dev --name <name>   # create + apply a migration against DATABASE_URL/DIRECT_URL
npx prisma migrate deploy               # apply pending migrations (used in CI/deploy, not local dev)
npx prisma generate                     # regenerate the Prisma client after schema changes
npx prisma studio                       # browse/edit data in Neon
```

A single test file: `npx vitest run path/to/file.test.ts` (from within the relevant workspace).

### Environment setup

Real secrets live in `server/.env` and `client/.env` (both gitignored, never commit them). `.env.example` at the root documents every variable and where to obtain it; `server/.env.example` just points back to the root file. Required for the server to boot: `DATABASE_URL`/`DIRECT_URL` (Neon), `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` (Firebase Admin service account), `TMDB_API_KEY` (themoviedb.org). The client needs the matching `VITE_FIREBASE_*` values from the same Firebase project's Web App config, plus `VITE_API_BASE_URL`.

`shared` must be built (`npm run build -w shared`) before `server` or `client` typecheck/build will resolve `@popcorn/shared` — it's consumed via its compiled `dist/` output, not source, since both workspaces import it as a package (`import { ... } from "@popcorn/shared"`), not a relative path.

## Architecture

### Workspace layout

- **`shared/`** — Zod schemas (`src/schemas/*.schema.ts`) and constants (`src/constants/rating.ts`, e.g. `RATING_MIN`/`RATING_MAX`/`RATING_STEP`), re-exported from `src/index.ts`. This is the single source of truth for request/response shapes: the server's `validate()` middleware and the client's forms both import the same schema, so a shape change here propagates to both sides' types via `z.infer`.
- **`server/`** — Express + Prisma API.
- **`client/`** — React (Vite) SPA.

### Server request flow

Layering is strict: `routes/` → `controllers/` (thin — parse request, call a service, shape the response) → `services/` (business logic + the only layer that touches `prisma`). Don't call Prisma directly from a controller.

- `src/app.ts` wires the middleware pipeline: `helmet` → `cors` (allow-listed to `CLIENT_ORIGIN`) → `express.json` → routes → `errorHandler` (must stay last). `express-async-errors` is imported first so `async` route/controller handlers can `throw` directly instead of needing manual `try/catch` + `next(err)`.
- `src/middleware/auth.ts` exports `requireAuth` (401s if no valid Firebase ID token, or if the token is valid but has no matching local `User` row yet) and `optionalAuth` (attaches `req.user` if present, otherwise continues unauthenticated) — both verify the `Authorization: Bearer <idToken>` header via `firebase-admin` (`src/lib/firebaseAdmin.ts`) and look up the local `User` by `firebaseUid`.
- **Auth is two-layer by design**: Firebase owns identity/credentials; Postgres owns the app's `User` row (keyed by internal `id`, with `firebaseUid` as the link). A Firebase account only gets a matching `User` row after the client calls `POST /api/auth/bootstrap` — `requireAuth` will 401 a valid Firebase token if bootstrap hasn't run yet. The client's `AuthProvider` (`client/src/hooks/useAuth.tsx`) calls `/api/auth/bootstrap` automatically on every `onAuthStateChanged` firing, so this is transparent in normal use — but keep it in mind when hitting the API directly (e.g. via curl/tests) with a fresh Firebase user.
- `src/middleware/validate.ts` — generic `validate(schema, 'body'|'query'|'params')` using `shared` Zod schemas; on failure the thrown `ZodError` is caught by `errorHandler` and turned into a 400.
- `src/lib/errors.ts` defines `HttpError` and subclasses (`UnauthorizedError`, `ForbiddenError`, `NotFoundError`); `errorHandler` maps `ZodError` → 400, `HttpError` → its `.status`, anything else → 500.
- `src/lib/prisma.ts` — singleton `PrismaClient`, cached on `globalThis` in non-production to survive `tsx watch` reloads without exhausting connections.
- Ownership checks (e.g. "can this user edit this rating/comment") belong in the service layer, comparing `req.user.id` against the row's `userId`, and throw `ForbiddenError` — there's no separate authorization middleware.

### Data model (`server/prisma/schema.prisma`)

`User` (keyed by internal `id`, `firebaseUid` unique) → `Rating` (unique per `[userId, titleId]`, `score` is `Decimal(2,1)` to avoid float rounding on half-bag values) → `Title` (unique per `[tmdbId, type]`, cached from TMDB on read) → `Comment` (on a `Rating`) and `Follow` (composite PK `[followerId, followingId]`). All child relations cascade-delete from `User`. Average ratings are computed on read via `prisma.rating.aggregate`, not denormalized onto `Title`.

### TMDB integration (`src/services/tmdb.service.ts`, `title.service.ts`)

`tmdb.service.ts` is the only module that talks to the TMDB HTTP API directly (search + `/movie|tv/{id}?append_to_response=credits`) and maps TMDB's response shape into this app's DTOs. `title.service.ts` owns the cache-on-read policy: `getOrFetchTitle(tmdbId, type, viewerId?)` upserts the `Title` row (keyed by `[tmdbId, type]`) only when missing or older than `TITLE_STALE_MS` (7 days) — but cast is fetched live from TMDB on *every* call regardless of staleness and is never persisted (deliberately no `Cast`/`Person` table for MVP). The same function also computes `averageScore`/`ratingCount` via `prisma.rating.aggregate` and, when a `viewerId` is passed (from `optionalAuth`), the viewer's own rating — so the title-detail response is a single merged DTO, not something callers assemble themselves. `searchTitles` is a thin passthrough to TMDB search with no DB write — search results are transient/preview, not cached until a title's detail page is actually opened.

### Client structure

- `src/router.tsx` defines the full route tree (`createBrowserRouter`) even though most page components are currently stubs — this is intentional scaffolding from the MVP plan, not dead code to clean up.
- `src/hooks/useAuth.tsx` — `AuthProvider`/`useAuth`, wraps Firebase's `onAuthStateChanged`, exposes `{ firebaseUser, loading }`, and performs the bootstrap-call side effect described above.
- `src/components/layout/ProtectedRoute.tsx` — redirects to `/login` when `useAuth()` has no user; used as a wrapping route in `router.tsx`, not a per-page guard.
- `src/lib/apiClient.ts` — thin fetch wrapper; attaches the current Firebase ID token to every request and throws `ApiError` on non-2xx responses (surfaced through React Query's error channel).
- `src/lib/queryClient.ts` — shared `QueryClient` instance for React Query, which is the intended pattern for all server-state fetching/mutation going forward (not plain `useEffect`/`useState`).
- Styling is CSS Modules + Sass (`*.module.scss` per component, global tokens in `src/styles/_variables.scss` / `_mixins.scss`, imported via `@use`). Mobile-first: base styles target the smallest viewport, `respond-up($breakpoint)` mixin layers on `min-width` media queries.

### Module system note

`shared` and `server` are ESM (`"type": "module"`) compiled with `NodeNext`/`Bundler` resolution — relative imports between `.ts` files must use explicit `.js` extensions (e.g. `import { env } from "../config/env.js"`), even though the source files are `.ts`. This is required by `NodeNext` module resolution, not a typo.

## Planning context

This repo is being built in phases (Foundation → TMDB integration → Rating core → Social layer → Polish/deploy); Foundation and TMDB integration are done. Ratings are still read-only aggregates with no create/edit/delete UI or endpoints yet. Deploy target is Firebase Hosting (client) + Cloud Run (server), migrations run via `prisma migrate deploy` in CI, GitHub Actions for CI/CD — none of that pipeline exists yet (no `.github/workflows/`, `Dockerfile`, or `firebase.json` in the repo currently).
