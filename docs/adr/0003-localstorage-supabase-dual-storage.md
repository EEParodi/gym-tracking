# 0003 — localStorage + Supabase dual storage

## Status
Accepted

## Context
The app started as a purely local, single-user tracker backed by `localStorage`. Adding cloud sync (multi-device use, coach/client features) required a durable backend without abandoning the offline-friendly, zero-setup experience the app already had.

## Decision
Use `localStorage` as an offline cache and Supabase Postgres as the source of truth once a user is logged in:

- Logged out / offline: reads and writes go to `localStorage` only (`phase1-tracker-v1`, `phase2-tracker-v1`, etc. — see `docs/architecture.md`).
- Logged in: on mount, `hydrateTrackerState*` fetches remote rows. If remote has data, it overwrites local state. If remote is empty, `migrateLocalToSupabaseIfNeeded` pushes existing local data up once, then re-hydrates (see `docs/migration.md`).
- Sync is manual (`SYNC CLOUD` / `LOAD CLOUD` buttons) — never automatic, to keep behavior predictable and avoid surprising overwrites.

## Consequences
- The app works fully offline with zero backend dependency, which matters for a gym-floor use case with unreliable connectivity.
- The migration path is a one-time, one-directional push (local → remote) triggered only when remote is empty — it does not attempt continuous two-way sync or conflict resolution.
- Any change to the hydrate/migrate flow must keep the "manual sync only" invariant from `skills/app-conventions.md`.
