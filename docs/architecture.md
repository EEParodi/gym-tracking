## Architecture

**Frontend:** Single file — `index.html`. No bundler, no `package.json`. React 18 via CDN unpkg, Babel standalone for in-browser JSX, inline styles only.

**Auth:** Magic-link via Supabase (`sendMagicLink`). No email/password. On localhost, typing `dev` in the email field bypasses auth for development.

**Storage:** localStorage (offline cache) ↔ Supabase Postgres (primary source of truth when logged in).

---

### Supabase tables

| Table | Phase | Extra column |
|---|---|---|
| `tracker_data` | Phase 1 | — |
| `tracker_data_p2` | Phase 2 | `rpe` |

**Upsert conflict key:** `(user_id, day, exercise, week)` — one row per user/day/exercise/week combination.

**Row shape:** `{ user_id, day, exercise, week, weight, comment, type, section, sets, reps }`

---

### Data model

**localStorage keys**

| Key | Contents |
|---|---|
| `phase1-tracker-v1` | Phase 1 weight + comment entries |
| `phase1-types-v1` | Phase 1 BB/DB/BW type per exercise |
| `phase2-tracker-v1` | Phase 2 weight + comment entries |
| `phase2-types-v1` | Phase 2 types |
| `phase2-rpe-v1` | Phase 2 RPE log |
| `phase-tracker-last-phase` | Last active phase (`"phase1"` or `"phase2"`) |
| `phase1_completed` | `"true"` when Phase 1 is locked |
| `phase2_completed` | `"true"` when Phase 2 is locked |

**Weight entry shape:**
```js
{ "Monday||Back squat": { "W1": { weight: "150", comment: "" }, "W2": { weight: "155" } } }
```

**Key convention:** always `"${day}||${exerciseName}"` — double pipe, never change.

---

### Component structure

```
App
├── PhaseLanding          — phase selector + magic-link login form
├── Tracker (phase1)      — driven by PHASE_CONFIG.phase1
└── Tracker (phase2)      — driven by PHASE_CONFIG.phase2
    └── RPEInput          — RPE text input (Phase 2 only)
TypeToggle                — BB / DB / BW selector (shared)
```

`PHASE_CONFIG` maps each phase to its program data, storage keys, Supabase function names, and feature flags (`hasRPE`, `hasNotes`).

---

### Cloud sync flow

1. On mount with a logged-in user, `hydrateTrackerState*` fetches remote rows.
2. If remote has data → overwrite local state + localStorage.
3. If remote is empty **and** `migrateFn` is set (Phase 1 only) → run `migrateLocalToSupabaseIfNeeded`, then re-hydrate.
4. Manual SYNC CLOUD calls `upsertTrackerState*` to push current state.
5. Manual LOAD CLOUD calls `hydrateTrackerState*` to pull latest.
