# phase2-insights.md

Phase 2 intelligence features: weight suggestions, PR detection, session summary, and the Insights screen. All live in `index.html`; the pure math lives in `frontend/businessLogic.mjs`.

---

## Suggestion chips (Tracker, Phase 2 only)
Rendered as dashed-border badges next to an exercise, only while its weight for the active week is empty and type isn't BW.

| Chip | Condition | Behavior |
|---|---|---|
| `↑ Nkg (RPE)` green | prev week RPE ≤ 7 and prev weight exists | prev weight + 2.5kg, tap to fill |
| `= Nkg HOLD` amber | prev week RPE ≥ 9.5 | hold prev weight, tap to fill |
| `↑ Nkg` amber | W1/W2 only, from `PROGRAM_P2[day][ex].suggestedWeight` | static seed; range values ("80–85") are display-only, not tappable |
| `↓ Nkg DELOAD` amber | deload week active | `calcDeloadWeight(getBestWeight(...))` = 55% of PR rounded to 2.5kg (ADR 0002) |

RPE-based suggestions take priority over static seeds. Deload weeks suppress the other chips.

## PR badge
`PR` shows when the logged weight is strictly greater than the max of all prior weeks' weights for that exercise (guarded so an unknown active week produces no comparison, not a broken one).

## Session summary bottom sheet
Appears when all working exercises of the active day are logged (and no input is focused). Stats: total volume (`calcSessionVolume`: sets × top-of-range reps × weight, BW/unweighted excluded), avg RPE (color-coded ≤7 green / ≤8.5 amber / else red), exercises logged, working sets. Uses the `slideUp` animation (disabled under `prefers-reduced-motion`).

---

## Insights screen (`Insights` component)
Reads Phase 2 localStorage directly (works without login):
- **What-if calculator**: weight/reps/sets → Epley e1RM and tonnage.
- **Exercise cards**: shown for favourited exercises (`phase2-favourites-v1`); if none favourited, all logged exercises. Star toggles live in the Tracker (★/☆, `aria-pressed`).
- Per card: best e1RM (deload weeks excluded), last session volume, `MiniChart` e1RM trend (deload points amber, excluded from the trend line), per-week weight×reps rows.

### 1RM formula
Epley: `e1RM = weight * (1 + reps / 30)`. Reps come from `parseRepsMeta(ex.reps)`:
- Takes the **top** of a rep range ("6–8" → 8)
- `/side`, `/leg`, `/arm` → volume ×2
- Time ("45s"), distance ("20m"), and quality cues ("Burn", "—") → no rep count; the user can type per-week reps overrides (stored in `phase2-reps-v1`) to enable e1RM/volume for those exercises.

---

## Rules when changing this area
- Suggestion thresholds (≤7, ≥9.5, +2.5kg) and the 55% deload rule are business rules — if they change, update this file, the relevant ADR, and `businessLogic.test.mjs` in the same change (see the `business-logic-change` skill).
- Insights must stay read-only over tracker data; the only thing it writes is `phase2-reps-v1`.
