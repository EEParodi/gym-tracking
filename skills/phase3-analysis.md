# phase3-analysis.md

Phase 3 is a **read-only cross-phase review layer** — no logging UI. The `Analysis` component in `index.html` renders it; all math lives in `frontend/analysis.mjs` (pure, tested in `analysis.test.mjs`).

## Unlock
Phase 3 opens from the landing page once Phase 1 is complete (same gate as Phase 2). It reads localStorage only (`phase1-tracker-v1`, `phase2-tracker-v1`, `phase2-rpe-v1`) — works offline and logged out.

## What it shows (per exercise shared by both phases)
- **Exercise matching**: `matchExercisesAcrossPhases(PROGRAM, PROGRAM_P2)` — names differ in casing between phases ("Back Squat" vs "Back squat"), so matching goes through `normalizeExerciseName` (lowercase, collapsed whitespace). Warm-ups excluded.
- **e1RM trend chart**: `buildE1rmSeries` per phase (Epley, top-of-range reps from `parseRepsMeta`), concatenated P1→P2 into one `MiniChart`. Deload points render in warning color.
- **P1 best / P2 best / % change** (deloads excluded from bests).
- **PLATEAU badge** — `detectPlateau`: last 3 non-deload e1RMs within 2% of each other AND average logged RPE ≥ 8.5 over those weeks. Thresholds are exported consts (`PLATEAU_WINDOW`, `PLATEAU_E1RM_TOLERANCE`, `PLATEAU_MIN_AVG_RPE`) — change them there, nowhere else.
- **NEXT W1 SEED** — `suggestPhaseSeed`: latest non-deload weight adjusted by the same RPE thresholds the tracker uses (≤7 → +2.5kg "up", ≥9.5 → "hold", else "keep"). Keep these aligned with `skills/phase2-insights.md`.
- **EXPORT (.md)** — markdown report of all cards (Blob download pattern).

## Rules when changing this area
- The analysis must stay read-only over tracker data.
- Plateau/seed thresholds are business rules — if changed, update this file, `analysis.test.mjs`, and consider an ADR (pattern: ADR 0002).
- New analysis math goes in `analysis.mjs` with tests, never inline in the component.
