# sync-troubleshooting.md

Debugging localStorage ↔ Supabase sync. Read `skills/supabase.md` first for the normal flow.

## The design (ADR 0003) — what is NOT a bug
- Sync is **manual**: edits write to localStorage instantly, to Supabase only on SYNC CLOUD. Data "missing" from another device usually means the user never pressed SYNC.
- LOAD CLOUD and the on-login hydrate **overwrite local state** when the cloud has data. Local edits made offline and never synced are lost by design if the user loads cloud afterwards.
- Parallel-tab migration is idempotent (upsert on `user_id,day,exercise,week`) — duplicate migrations waste requests but cannot corrupt data.

## Decision tree: "my data isn't syncing"

1. **Logged in?** Header shows `CLOUD / <email>` vs `CLOUD / OFFLINE`. Offline → magic link never completed (check spam; link redirects to the origin it was requested from — a localhost link won't log in production).
2. **Sync button state?** `NOT LOGGED IN` / `NO DATA` / `SYNC ERROR` labels are diagnostic. Since the error-surfacing change, the failure message renders under the sync buttons (aria-live region) — read it.
3. **Hydrate returning nothing?** In DevTools console: `await window.supabase.hydrateTrackerStateFromSupabase((await window.supabase.getSession()).session.user.id)` (or `hydrateP2TrackerState`). An `error` field here means RLS/auth/network; empty `weights` means the table genuinely has no rows for that user.
4. **Check the tables** in the Supabase dashboard → Table Editor → `tracker_data` / `tracker_data_p2`, filter by `user_id`. RLS means the SQL editor under the service role sees rows the anon client can't — if rows exist but hydrate is empty, suspect a wrong/expired session user id.
5. **Migration ran twice / never?** Flag is `localStorage["phase1-migration-done"]`. Migration only fires when the remote is EMPTY — once any row exists remotely, local-only Phase 1 data will never auto-migrate again; use SYNC CLOUD instead.

## Known failure modes
| Symptom | Cause | Fix |
|---|---|---|
| Rows skipped on hydrate | Row missing `day`/`exercise`/`week` (converters skip silently) | Inspect the raw row in the dashboard |
| Weight blank after load but type set | `type === "bw"` intentionally blanks weight | Not a bug |
| Sync appears to work, other device stale | Other device restored from its own localStorage; hydrate only auto-runs on login | Press LOAD CLOUD |
| `Missing userId` error | Session expired between mount and click | Re-login |

## localStorage quick reference
Inspect via DevTools → Application → Local Storage. Keys are listed in `skills/app-conventions.md` (Data Model). Nuking a key is safe locally — LOAD CLOUD restores from Supabase.
