# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use clean non-verbose code and reusable components when possible. Use global variables for colors and other styling choices when appropriate.

## Project

Popcorn — a movie/TV rating app. Users rate titles on a 0–6 "popcorn bag" scale in half-bag increments, keep a personal watched timeline, and follow other users for a basic activity feed. All 5 MVP phases are implemented: auth, TMDB search/detail, ratings CRUD + personal timeline, the social layer (follow/unfollow, activity feed, comments, user discovery), and polish/deploy (accessibility, responsive, Docker, CI/CD). The deploy pipeline exists in the repo but has not yet been exercised against real infrastructure — see "Deploy pipeline" below for what's still required before `git push` to `main` produces a live deploy.

## Commands

All commands run from the repo root via npm workspaces (`shared`, `server`, `client`). There is no top-level test runner config beyond delegating to each workspace.

```bash
npm run dev          # boots server (tsx watch, :8080) and client (Vite, :5173) concurrently
npm run build         # builds shared -> server -> client, in that order (order matters: server/client import @popcorn/shared's dist output)
npm run typecheck     # tsc --noEmit across all three workspaces
npm run test          # vitest run across all three workspaces
npm run lint          # eslint across all three workspaces, via the single root eslint.config.mjs (flat config)
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

`server`'s `build` script runs `prisma generate` **before** `tsc` (`"prisma generate && tsc -p tsconfig.json"`) — that order matters and was a real bug once: with it reversed, `tsc` typechecks against the un-generated Prisma client stub (no model types, `Prisma.Decimal` missing, query results typed `any`), and it silently "worked" on this dev machine only because `prisma generate` had already been run manually beforehand at some point, populating `node_modules/@prisma/client` before the misordered script ever ran. A clean environment (a fresh clone, or the Docker build stage) has no such head start and fails immediately — that's exactly how this got caught, via `docker build` on the `server/Dockerfile`, not via local `npm run build`.

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

### Ratings (`src/services/rating.service.ts`)

`POST /api/ratings` always **upserts** on `[userId, titleId]` rather than erroring on a duplicate — rating a title you've already rated silently updates that existing row (same `id`, new `score`/`review`/`updatedAt`) instead of requiring the client to know whether to POST or PATCH. `PATCH /api/ratings/:id` and `DELETE /api/ratings/:id` exist for direct edits by id and both call `requireOwnedRating` first, throwing `ForbiddenError` if `req.user.id` doesn't match the row's `userId` — the client currently only uses the upsert path (`RatingForm` always POSTs) and reserves PATCH for a future inline-edit-from-timeline flow. The timeline endpoint (`GET /api/users/:userId/ratings`) takes `type`/`sort`/`order`/`cursor`/`limit` per `timelineQuerySchema` and returns cursor-paginated `{ ratings, nextCursor }` with the `Title` relation embedded on each entry.

### `PopcornRating` (`client/src/components/rating/PopcornRating.tsx`)

The signature UI piece, reused across the title detail page, `RatingForm`, and `RatingCard` (timeline). Each of the 6 bags is an outline SVG with a clipped, absolutely-positioned filled SVG on top (`width: 50%` or `100%`) — not three separate icon assets. `readOnly` renders `role="img"` with a descriptive `aria-label` and no interaction; the interactive mode is `role="slider"` with `aria-valuemin/max/now/valuetext`, arrow-key ±0.5 stepping (Home/End to bounds), and pointer events (unified mouse+touch) that map the cursor's X position within the 6-bag row to the nearest half-bag — left half of a bag = half-fill, right half = full. jsdom doesn't implement `PointerEvent` (see `client/src/test/setup.ts` for the polyfill), which is required for `PopcornRating.test.tsx`'s pointer-mapping assertions to get real `clientX` values.

### Social layer (`src/services/follow.service.ts`, `feed.service.ts`, `comment.service.ts`)

`followUser`/`unfollowUser` are both idempotent (upsert / `deleteMany` rather than create / delete-by-unique-key) so double-clicking Follow or unfollowing something you don't follow never errors; `followUser` also guards against self-follow (`BadRequestError`, 400). `getPublicUser` (`GET /api/users/:userId`) enriches the base `User` row with `followerCount`/`followingCount` (`follow.service.ts#getFollowCounts`) and, when the caller is authenticated via `optionalAuth`, `viewerIsFollowing` — the client's `ProfilePage` reads this directly rather than making a second request to check follow state. The feed (`GET /api/feed`, `feed.service.ts`) queries `Rating` where `user.followers` (the rater's followers relation) has some row with `followerId` equal to the viewer — i.e. "ratings by people I follow" — cursor-paginated like the timeline, with the rater's `{id, displayName, avatarUrl}` embedded per entry. Comments are scoped two ways: `POST/GET /api/ratings/:ratingId/comments` (nested under `ratings.routes.ts`) for creating/listing on a specific rating, and a flat `DELETE /api/comments/:id` (`comments.routes.ts`) for deletion by id with the same ownership-check pattern as ratings. `toRatingDto` (Decimal→number conversion) is factored into `src/lib/dto.ts` since both `rating.service.ts` and `feed.service.ts` need it.

**User discovery**: `GET /api/users?q=` (`user.service.ts#searchUsers`, `PeoplePage`) exists because following was originally only reachable if you already had someone's `userId` from a URL — there was no way to find people to follow. It's a case-insensitive `displayName` partial match, excludes the viewer from their own results, and batches follow-state with a single `Follow.findMany({followingId: {in: [...]}})` rather than N+1 `isFollowing` calls per result. `useFollowUser`/`useUnfollowUser` invalidate both the `["user", userId]` and `["userSearch"]` query keys on success so a follow/unfollow from search results and from a profile page stay in sync.

### Client structure

- `src/router.tsx` defines the full route tree (`createBrowserRouter`).
- `src/hooks/useAuth.tsx` — `AuthProvider`/`useAuth`, wraps Firebase's `onAuthStateChanged`, exposes `{ firebaseUser, loading }`, and performs the bootstrap-call side effect described above.
- `src/components/layout/ProtectedRoute.tsx` — redirects to `/login` when `useAuth()` has no user; used as a wrapping route in `router.tsx`, not a per-page guard.
- `src/lib/apiClient.ts` — thin fetch wrapper; attaches the current Firebase ID token to every request and throws `ApiError` on non-2xx responses (surfaced through React Query's error channel).
- `src/lib/queryClient.ts` — shared `QueryClient` instance for React Query, which is the intended pattern for all server-state fetching/mutation going forward (not plain `useEffect`/`useState`).
- Styling is CSS Modules + Sass (`*.module.scss` per component, global tokens in `src/styles/_variables.scss` / `_mixins.scss`, imported via `@use`). Mobile-first: base styles target the smallest viewport, `respond-up($breakpoint)` mixin layers on `min-width` media queries.
- `$color-primary` in `_variables.scss` is `#c2410c`, not a brighter orange, specifically because it's used as link/text color throughout (`a { color: $color-primary }` in `global.scss`) — a brighter shade measured under WCAG AA's 4.5:1 contrast threshold against `$color-bg`; this one clears it (~4.8:1). Don't brighten it without rechecking contrast.
- `global.scss` gives `button`/`input`/`select`/`textarea` a shared base style including `min-height: 44px` (mobile touch target sizing) and a bordered/padded look; small text-styled buttons that intentionally break from this (e.g. the "Comments" toggle on `RatingCard`/`ActivityItem`, the delete button in `CommentThread`) explicitly override `min-height: auto` in their own module — that override is deliberate, not a missed base style.
- `App.tsx` renders a `.skipLink` (styled in `global.scss`, off-screen until focused) before `Header`, targeting `<main id="main-content">` — standard skip-navigation pattern for keyboard users.
- `src/components/social/CommentThread.tsx` is only mounted (and only fetches `GET /api/ratings/:ratingId/comments`) when its parent (`RatingCard` or `ActivityItem`) has a local `showComments` toggle switched on — comments aren't fetched for every card on a timeline/feed page load, only on demand.

### Module system note

`shared` and `server` are ESM (`"type": "module"`) compiled with `NodeNext`/`Bundler` resolution — relative imports between `.ts` files must use explicit `.js` extensions (e.g. `import { env } from "../config/env.js"`), even though the source files are `.ts`. This is required by `NodeNext` module resolution, not a typo.

### Deploy pipeline

`.github/workflows/ci.yml` (lint/typecheck/test/build, called both directly on PRs and as a reusable `workflow_call` job from `deploy.yml`) and `.github/workflows/deploy.yml` (on push to `main`: gate → `prisma migrate deploy` against production Neon → build+push `server/Dockerfile` to Artifact Registry → `gcloud run deploy` → build the client with the live Cloud Run URL as `VITE_API_BASE_URL` → `firebase deploy --only hosting`) both exist in the repo. **They will fail** until the GitHub repo has all the secrets listed in the comment block at the top of `deploy.yml` (`GCP_PROJECT_ID`, `GCP_SA_KEY`, `DATABASE_URL`, `DIRECT_URL`, `CLIENT_ORIGIN`, the `FIREBASE_*` admin values, `FIREBASE_SERVICE_ACCOUNT` for hosting deploy specifically, `TMDB_API_KEY`, and the `VITE_FIREBASE_*` values) — that's expected and safe, since nothing partially deploys on a failed run. `server/Dockerfile` is a two-stage build (`node:20-alpine` both stages) and has been verified locally: it builds, and a container run from it correctly reads/writes the real Neon DB and calls TMDB (see the build-script-ordering note above for the one real bug this verification caught). `firebase.json`/`.firebaserc` target project `popcorn-70873`. None of this has been exercised against real GCP/Firebase infrastructure yet — Artifact Registry repo creation, the Cloud Run service account, and the GitHub secrets themselves still need to be provisioned before the first real deploy.

### Linting

`eslint.config.mjs` at the repo root is the **only** ESLint config — flat config (ESLint 10), applies to all three workspaces via file-pattern overrides (`server/**/*.ts` + `shared/**/*.ts` get Node globals, `client/**/*.{ts,tsx}` gets browser globals + `eslint-plugin-react-hooks`). Each workspace's `lint` script is just `eslint src`; there's no per-workspace `.eslintrc`.
