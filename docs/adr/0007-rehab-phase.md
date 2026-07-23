# 0007 — REHAB phase

## Status
Accepted

## Context
A 4-week Achilles rehab training block was needed as a first-class phase alongside Phase 1 and Phase 2, not as a one-off edit to Phase 2's program. It is used during injury recovery, which can start at any point — it is not the next step in the linear Phase 1 → Phase 2 progression.

The phase architecture already supports this: every phase difference is expressed as a `PHASE_CONFIG[id]` entry (program, weeks, meta, storage keys, feature flags, and the names of the Supabase functions to call), rendered by a single `<Tracker>` — see `skills/app-conventions.md` ("PHASE_CONFIG pattern"). So a new phase is additive config, not a new component or a `src/` tree, and does not touch the single-file constraint of `0001-single-file-monolith.md`.

## Decision
Add a `rehab` phase as a new `PHASE_CONFIG` entry.

- **Program:** `PROGRAM_REHAB` — Mon/Tue/Thu/Fri split (same day shape as Phase 2), warm-up + working sections. Sections reuse existing `SECTION_COLORS` keys; no new design tokens (`skills/design-system.md`).
- **Weeks:** `WEEKS_REHAB = ["W1","W2","W3","W4"]` — four progressive weeks, **no deload**. The deload banner / 55%-of-PR chip (`0002-deload-55-percent-rule.md`) only triggers on week labels containing "Deload", so none fire here — no code branch needed.
- **Tracking:** weight **and** RPE per set (`hasRPE: true, hasNotes: false`), identical to Phase 2. The source plan carries no per-exercise RPE targets or suggested-weight seeds, so exercises use `rpe: "—"` (input still shown; no target chip value) and omit `suggestedWeight`.
- **Access:** always available — openable from the landing screen regardless of Phase 1/2 completion (`canOpen` short-circuits `true` for `rehab`). It is not gated and does not gate anything else.
- **Storage:** localStorage keys `rehab-tracker-v1` / `rehab-types-v1` / `rehab-rpe-v1`; completion flag `rehab_completed`; Supabase table `tracker_data_rehab`.
- **Supabase:** new table with the same shape as `tracker_data_p2` (`sql/create_tracker_data_rehab.sql`), and `hydrateRehabTrackerState` / `upsertRehabTrackerState` in `frontend/supabaseClient.mjs` that **reuse the Phase 2 row converters** (`localStateToRowsP2` / `rowsToP2State`) — same row shape, so no new converter and no `rowConverters.test.mjs` change. No migration path (rehab has no localStorage-only history to import).

### Rejected alternatives
- **Editing Phase 2's `PROGRAM_P2` in place / a "rehab mod" flag on Phase 2.** Conflates two distinct programs in one config, and would drag rehab through Phase 2's deload weeks and gating. Rejected in favour of a separate phase.
- **Gating REHAB behind Phase 2 completion** (extending the linear chain). Rejected — rehab is entered on injury, not on program progress, so it must be reachable immediately.
- **A dedicated pain/discomfort check-in instead of RPE.** Considered (the Achilles check-in in `skills/workout-mode.md` exists), but RPE was chosen to match Phase 2 and reuse its converters/UI with zero new logic. Can be revisited if load-tolerance tracking proves insufficient.

## Consequences
- Adding future phases stays a config-only exercise; the `for (const id of [...])` loop in `generateProgressMarkdown` and the landing/routing switches are the only per-phase touch points to extend.
- `tracker_data_rehab` must be created in Supabase (run `sql/create_tracker_data_rehab.sql`) before cloud sync works for the phase; until then rehab still works offline via localStorage, consistent with the dual-storage model (`0003-localstorage-supabase-dual-storage.md`).
- Because rehab reuses the P2 converters, any future change to the P2 row shape affects rehab too — they are intentionally coupled.
