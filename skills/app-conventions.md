# app-conventions.md

## Project: Training Tracker (Phase 1 + Phase 2)
Personal gym tracking web app. Single HTML file, no build step, mobile-first (Android).

---

## Live URLs
| Resource | URL |
|---|---|
| App | https://eeparodi.github.io/phase1-tracking/ |
| Repo | https://github.com/eeparodi/phase1-tracking |

---

## Stack
- **Single file**: all UI in `index.html` — no bundler, no `src/` tree (ADR 0001)
- **React 18** via CDN (`unpkg.com/react@18/umd/react.production.min.js`)
- **Babel standalone** via CDN for in-browser JSX
- **No TypeScript**, no component libraries, no CSS files — inline styles only (design tokens in `skills/design-system.md`)
- Pure business logic lives in `frontend/businessLogic.mjs` and `frontend/rowConverters.mjs`; Supabase wrapper in `frontend/supabaseClient.mjs` — the only sanctioned files outside `index.html` (plus tests)
- A root `package.json` exists **solely** for `npm test` — it does not introduce a build step

---

## Program Structure

```js
const DAYS        = ["Day 1", ..., "Day 5 (Optional)"];        // Phase 1
const WEEKS       = ["W1", "W2", "W3", "W4", "W5 (Deload)"];   // Phase 1
const WEEKS_P2    = ["W1", ..., "W5 (Deload)", "W6", "W7", "W8 (Deload)"]; // Phase 2
const WEEKS_REHAB = ["W1", "W2", "W3", "W4"];                  // Rehab — 4 weeks, no deload
```

Phase 1 exercises: `{ section, name, sets, reps, rpe, cue }`.
Phase 2 (`PROGRAM_P2`, days Monday/Tuesday/Thursday/Friday) adds optional `suggestedWeight: { w1, w2 }` seed values.
Rehab (`PROGRAM_REHAB`, same Mon/Tue/Thu/Fri shape) tracks weight + RPE like Phase 2 but carries no per-exercise RPE targets (`rpe: "—"`) and no `suggestedWeight` seeds — see `docs/adr/0007-rehab-phase.md`.

Deload weeks are any week whose label contains `"Deload"` — a warning banner reminds to cut loads 40–50%. Rehab has none.

### PHASE_CONFIG pattern
All phase differences are config, not code forks. `PHASE_CONFIG[phaseId]` provides: `program`, `weeks`, `meta`, storage keys, `optionalDay`, `dayLabel`, feature flags (`hasRPE`, `hasNotes`), and the names of the Supabase functions to call (`hydrateFn`, `upsertFn`, `migrateFn`). A single `<Tracker config={...}>` renders every tracker phase (`phase1`, `phase2`, `rehab`). **Add phase-specific behavior via config, never via `if (phase === "phase2")` scattered through components.** Adding a phase (e.g. `rehab`, `docs/adr/0007`) is a new config entry plus its landing/routing/markdown-loop touch points — nothing forked.

---

## Data Model

### localStorage keys
| Key | Contents |
|---|---|
| `phase1-tracker-v1` | Phase 1 weight + comment entries |
| `phase1-types-v1` | Phase 1 BB/DB/BW type per exercise |
| `phase2-tracker-v1` | Phase 2 weight + comment entries |
| `phase2-types-v1` | Phase 2 types |
| `phase2-rpe-v1` | Phase 2 RPE per exercise per week: `{ "Monday||Back squat": { W1: "8.5" } }` |
| `phase2-favourites-v1` | Exercises pinned to Insights: `{ key: true }` |
| `phase2-reps-v1` | Per-week reps overrides for Insights 1RM (time/distance exercises) |
| `phase2-checkin-v1` | Achilles check-in scores `{ day: { week: 1–5 } }` — local-only, see `skills/workout-mode.md` |
| `rehab-tracker-v1` | Rehab weight + comment entries |
| `rehab-types-v1` | Rehab BB/DB/BW type per exercise |
| `rehab-rpe-v1` | Rehab RPE per exercise per week (same shape as `phase2-rpe-v1`) |
| `phase-tracker-last-phase` | Last opened phase — auto-reopen on load |
| `phase1_completed` / `phase2_completed` / `rehab_completed` | `"true"` when phase is frozen |
| `phase1-migration-done` | One-time localStorage→Supabase migration flag |
| `phase1-last-synced-v1` / `phase2-last-synced-v1` | ISO timestamp of last successful cloud sync/load — shown as LAST SYNC in the header |

localStorage is the offline cache; Supabase is the source of truth once logged in (ADR 0003, `skills/supabase.md`).

### Weight data shape
```js
{ "Day 1||Back Squat": { "W1": { weight: "100", comment: "felt strong" } } }
```

### Key convention
Always `"${day}||${exerciseName}"` — double pipe separator. Never change this format; it's used across storage, sync, and state lookups.

---

## Core Logic Rules

Pure functions live in `frontend/businessLogic.mjs` (bridged to `window.BusinessLogic`); `index.html` has thin delegating wrappers. **Never re-implement these inline** — see the `business-logic-change` skill before editing them, and run `npm test`.

### Previous week weight — `getPrevWeight(weights, day, exercise, currentWeek, weeks)`
Show the most recent previous week that has data — NOT the all-time max. W1 shows nothing. `getPrevRPE` mirrors this for RPE.

### Deload suggestion (ADR 0002)
`getBestWeight` = heaviest logged weight before the current week, **excluding deload weeks**. `calcDeloadWeight(pr)` = 55% of PR rounded to nearest 2.5kg. Shown as a tappable `↓ Nkg DELOAD` chip on deload weeks when no weight is logged yet.

### Weight suggestions (Phase 2, non-deload weeks)
Shown only when no weight is logged for the week, priority order:
1. **RPE-based**: previous week's RPE ≤ 7 → suggest prev weight + 2.5kg (green ↑); RPE ≥ 9.5 → suggest holding prev weight (amber =). RPE between → no chip.
2. **Static seed**: W1/W2 only, from `suggestedWeight.w1/w2`. Range values ("80–85") render but aren't tappable.
Tapping a chip fills the weight input.

### PR detection (Phase 2)
A logged weight strictly greater than every previously logged weight for that exercise (all prior weeks, deload included) shows a `PR` badge.

### Session summary (Phase 2)
When every working exercise of the active day is logged, a bottom sheet shows: volume (via `calcSessionVolume` = sets × reps × weight, BW excluded), avg RPE, exercise count, working sets. Dismissible; resets on day change; hidden while an input is focused.

### BW (bodyweight) type
- Disables and clears the weight input
- Still counts as "logged" for progress counters
- Persisted as `type: "bw"` with `weight: ""`

### Input validation
- Weight: accepts empty/`.`/numeric strings 0–500 only
- RPE: numeric 0–10 (see `RPEInput`)

### Save feedback
Show `[SAVED]` for 1200ms after any write. localStorage failures fail silently (`[SAVE FAILED]` badge only). Cloud sync errors DO surface: message text under the sync buttons in an `aria-live` region.

### Logged state
An exercise is logged if it has a weight value OR its type is `"bw"`.

### Phase completion
Complete when every non-deload week of every working (non-warm-up) exercise, excluding the optional day, is logged. END PHASE / EDIT LOG use the inline two-tap confirm pattern (no `window.confirm`).

---

## Component Structure
Keep everything in `index.html` (ADR 0001):
- `App` — session resolution, phase routing
- `PhaseLanding` — phase selector + magic-link login + markdown export
- `Tracker` — unified config-driven tracker (both phases)
- `TypeToggle`, `RPEInput` — small controls
- `Insights` + `MiniChart` — Phase 2 analysis screen (see `skills/phase2-insights.md`)

---

## Deployment
See `skills/deploy.md`. Short version: GitHub Pages, `main` branch root, replace `index.html`, no build.

---

## Anti-patterns
- ❌ Never add a build step, bundler, or app-level npm dependencies (test-only `package.json` is the exception)
- ❌ Never use external component libraries (MUI, shadcn, etc.) or Tailwind
- ❌ Never use separate CSS files — inline styles only
- ❌ Never show all-time best weight as "previous" — always the most recent logged week
- ❌ Never split UI into multiple HTML/JS files — single file is the constraint (pure-logic `.mjs` modules are the only exception)
- ❌ Never auto-sync to the cloud on keystroke — sync is always explicit user intent
- ❌ Never use `window.confirm`/`alert` for destructive flows — use the inline two-tap confirm
- ✅ `position: fixed` is permitted — app runs on GitHub Pages, not Claude artifacts
