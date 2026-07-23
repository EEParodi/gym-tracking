# supabase.md

## Status
✅ LIVE. Implemented in `frontend/supabaseClient.mjs` (ES module, exposed as `window.supabase` for `index.html`). This file documents the integration as it exists — see `docs/adr/0003` (dual storage) and `docs/adr/0004` (magic-link auth) for rationale.

---

## Project setup
- Provider: supabase.com (free tier)
- Project URL and anon key are set in `index.html` as `window.SUPABASE_URL` / `window.SUPABASE_ANON_KEY` before the module loads. The anon key is public by design — data is protected by RLS, not by key secrecy.
- Client loaded from CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm` (pinned to major v2) with `persistSession`, `autoRefreshToken`, `detectSessionInUrl` enabled.

---

## Tables

Two columnar tables, one row per `(user, day, exercise, week)`. Canonical DDL lives in [`sql/create_tracker_data.sql`](../sql/create_tracker_data.sql) and [`sql/create_tracker_data_p2.sql`](../sql/create_tracker_data_p2.sql).

### `tracker_data` (Phase 1)
```
id uuid PK · user_id uuid → auth.users · date date · week text · day text ·
section text · exercise text · sets int · reps text · weight text · type text ·
notes text · updated_at timestamptz
UNIQUE (user_id, day, exercise, week)
```

### `tracker_data_p2` (Phase 2)
Same shape plus `rpe numeric(3,1)` (nullable — supports 8.5-style values).

### `tracker_data_rehab` (Rehab)
Identical shape to `tracker_data_p2` (with `rpe`). DDL in [`sql/create_tracker_data_rehab.sql`](../sql/create_tracker_data_rehab.sql). The app reuses the P2 row converters for it — see `docs/adr/0007-rehab-phase.md`. Must be created in Supabase before rehab cloud sync works; until then rehab runs offline via localStorage.

All three tables have RLS enabled with a single `auth.uid() = user_id` policy for all operations.

> Historical note: an earlier plan used a key/value JSONB table — it never shipped. The columnar layout was chosen so rows are directly queryable/exportable.

---

## Auth flow — magic link (ADR 0004)
- No passwords. `sendMagicLink(email)` calls `auth.signInWithOtp` with `emailRedirectTo` set to the current origin+path.
- On app mount, `getSession()` resolves the persisted session; the user object flows into `<Tracker cloudUser={...}>`.
- Localhost dev bypass: typing `dev` as the email on localhost marks Phase 1 complete and opens Phase 2 without auth (see `sendLoginLink` in `index.html`).
- `signupWithEmail` / `loginWithEmailPassword` exist in the module but are legacy and unused.

---

## State ↔ row conversion
- Converters live in `frontend/rowConverters.mjs` (pure, unit-tested in `rowConverters.test.mjs`); `supabaseClient.mjs` imports them and re-exposes `localStorageStateToRows` / `rowsToTrackerState` on the API.
- They convert between the app's `{ "Day 1||Back Squat": { W1: { weight, comment } } }` shape and flat rows (P2 variants add `rpeLog`).
- `type === "bw"` rows hydrate back with `weight: ""`.
- Rows missing `day`, `exercise`, or `week` are silently skipped on hydrate.

## Read/write functions (per phase, selected via `PHASE_CONFIG.hydrateFn/upsertFn/migrateFn`)
| Phase 1 | Phase 2 | Rehab |
|---|---|---|
| `hydrateTrackerStateFromSupabase(userId)` | `hydrateP2TrackerState(userId)` | `hydrateRehabTrackerState(userId)` |
| `upsertTrackerStateToSupabase({userId, weights, types, metaByKey})` | `upsertP2TrackerState({..., rpeLog})` | `upsertRehabTrackerState({..., rpeLog})` |
| `migrateLocalToSupabaseIfNeeded(userId)` | — (no migration needed) | — (no migration needed) |

Rehab's helpers hit `tracker_data_rehab` but reuse the Phase 2 converters (`localStateToRowsP2` / `rowsToP2State`) — same row shape.

All upserts use `onConflict: "user_id,day,exercise,week"` — re-syncing is idempotent, last write wins.

---

## Login/hydration flow (in `Tracker`'s cloud `useEffect`)
1. On login, hydrate from Supabase.
2. If remote has data → overwrite local state **and** localStorage (cloud is source of truth, ADR 0003).
3. If remote is empty and the phase has a `migrateFn` (Phase 1 only) → one-time push of localStorage to Supabase, guarded by the `phase1-migration-done` localStorage flag, then re-hydrate.
4. After hydration completes, day/week auto-advance via `computeNextWorkingDay`.
5. Ongoing sync is **manual only**: SYNC CLOUD (upsert) and LOAD CLOUD (hydrate + overwrite local) buttons. No auto-sync on every keystroke.

See `skills/sync-troubleshooting.md` for debugging this flow.

---

## Gotchas
- `window.supabase` is this repo's API object, NOT the raw supabase-js client. The raw client is private inside the module (`getClient()`).
- Magic link emails can land in spam.
- `signInWithOtp` sends a new link on every call — the SEND LINK button disables while `authStatus === "sending"`.
- Parallel-tab migration is safe but wasteful: the upsert conflict key de-duplicates, and the migration flag prevents repeats once set.
- Free tier limits (500MB DB, 2GB bandwidth) are far beyond this app's needs.
