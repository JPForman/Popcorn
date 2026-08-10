# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use clean non-verbose code and reusable components when possible. Use global variables for colors and other styling choices when appropriate.

## Project

Popcorn — a movie/TV rating app. Users rate titles on a 0–6 "popcorn bag" scale in half-bag increments, keep a personal watched timeline, and follow other users for a basic activity feed. All 4 core MVP layers are implemented: auth, TMDB search/detail, ratings CRUD + personal timeline, and the social layer (follow/unfollow, activity feed, comments). Remaining work is polish/deploy (responsive + accessibility passes, Dockerfile, `firebase.json`, GitHub Actions).

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

### Ratings (`src/services/rating.service.ts`)

`POST /api/ratings` always **upserts** on `[userId, titleId]` rather than erroring on a duplicate — rating a title you've already rated silently updates that existing row (same `id`, new `score`/`review`/`updatedAt`) instead of requiring the client to know whether to POST or PATCH. `PATCH /api/ratings/:id` and `DELETE /api/ratings/:id` exist for direct edits by id and both call `requireOwnedRating` first, throwing `ForbiddenError` if `req.user.id` doesn't match the row's `userId` — the client currently only uses the upsert path (`RatingForm` always POSTs) and reserves PATCH for a future inline-edit-from-timeline flow. The timeline endpoint (`GET /api/users/:userId/ratings`) takes `type`/`sort`/`order`/`cursor`/`limit` per `timelineQuerySchema` and returns cursor-paginated `{ ratings, nextCursor }` with the `Title` relation embedded on each entry.

### `PopcornRating` (`client/src/components/rating/PopcornRating.tsx`)

The signature UI piece, reused across the title detail page, `RatingForm`, and `RatingCard` (timeline). Each of the 6 bags is an outline SVG with a clipped, absolutely-positioned filled SVG on top (`width: 50%` or `100%`) — not three separate icon assets. `readOnly` renders `role="img"` with a descriptive `aria-label` and no interaction; the interactive mode is `role="slider"` with `aria-valuemin/max/now/valuetext`, arrow-key ±0.5 stepping (Home/End to bounds), and pointer events (unified mouse+touch) that map the cursor's X position within the 6-bag row to the nearest half-bag — left half of a bag = half-fill, right half = full. jsdom doesn't implement `PointerEvent` (see `client/src/test/setup.ts` for the polyfill), which is required for `PopcornRating.test.tsx`'s pointer-mapping assertions to get real `clientX` values.

### Social layer (`src/services/follow.service.ts`, `feed.service.ts`, `comment.service.ts`)

`followUser`/`unfollowUser` are both idempotent (upsert / `deleteMany` rather than create / delete-by-unique-key) so double-clicking Follow or unfollowing something you don't follow never errors; `followUser` also guards against self-follow (`BadRequestError`, 400). `getPublicUser` (`GET /api/users/:userId`) enriches the base `User` row with `followerCount`/`followingCount` (`follow.service.ts#getFollowCounts`) and, when the caller is authenticated via `optionalAuth`, `viewerIsFollowing` — the client's `ProfilePage` reads this directly rather than making a second request to check follow state. The feed (`GET /api/feed`, `feed.service.ts`) queries `Rating` where `user.followers` (the rater's followers relation) has some row with `followerId` equal to the viewer — i.e. "ratings by people I follow" — cursor-paginated like the timeline, with the rater's `{id, displayName, avatarUrl}` embedded per entry. Comments are scoped two ways: `POST/GET /api/ratings/:ratingId/comments` (nested under `ratings.routes.ts`) for creating/listing on a specific rating, and a flat `DELETE /api/comments/:id` (`comments.routes.ts`) for deletion by id with the same ownership-check pattern as ratings. `toRatingDto` (Decimal→number conversion) is factored into `src/lib/dto.ts` since both `rating.service.ts` and `feed.service.ts` need it.

### Client structure

- `src/router.tsx` defines the full route tree (`createBrowserRouter`).
- `src/hooks/useAuth.tsx` — `AuthProvider`/`useAuth`, wraps Firebase's `onAuthStateChanged`, exposes `{ firebaseUser, loading }`, and performs the bootstrap-call side effect described above.
- `src/components/layout/ProtectedRoute.tsx` — redirects to `/login` when `useAuth()` has no user; used as a wrapping route in `router.tsx`, not a per-page guard.
- `src/lib/apiClient.ts` — thin fetch wrapper; attaches the current Firebase ID token to every request and throws `ApiError` on non-2xx responses (surfaced through React Query's error channel).
- `src/lib/queryClient.ts` — shared `QueryClient` instance for React Query, which is the intended pattern for all server-state fetching/mutation going forward (not plain `useEffect`/`useState`).
- Styling is CSS Modules + Sass (`*.module.scss` per component, global tokens in `src/styles/_variables.scss` / `_mixins.scss`, imported via `@use`). Mobile-first: base styles target the smallest viewport, `respond-up($breakpoint)` mixin layers on `min-width` media queries.
- `src/components/social/CommentThread.tsx` is only mounted (and only fetches `GET /api/ratings/:ratingId/comments`) when its parent (`RatingCard` or `ActivityItem`) has a local `showComments` toggle switched on — comments aren't fetched for every card on a timeline/feed page load, only on demand.

### Module system note

`shared` and `server` are ESM (`"type": "module"`) compiled with `NodeNext`/`Bundler` resolution — relative imports between `.ts` files must use explicit `.js` extensions (e.g. `import { env } from "../config/env.js"`), even though the source files are `.ts`. This is required by `NodeNext` module resolution, not a typo.

## Planning context

This repo is being built in phases (Foundation → TMDB integration → Rating core → Social layer → Polish/deploy); the first four are done. Polish/deploy is next: mobile-first responsive pass, accessibility pass (axe scan, alt text, landmarks), and the actual deploy pipeline. Deploy target is Firebase Hosting (client) + Cloud Run (server), migrations run via `prisma migrate deploy` in CI, GitHub Actions for CI/CD — none of that pipeline exists yet (no `.github/workflows/`, `Dockerfile`, or `firebase.json` in the repo currently).
