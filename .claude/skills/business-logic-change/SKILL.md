---
name: business-logic-change
description: Use when adding or editing any function in the repo's pure logic modules — frontend/businessLogic.mjs (weight lookback, deload calc, RPE, volume, epley, reps parsing), frontend/analysis.mjs (cross-phase matching, plateau, seeds), or frontend/rowConverters.mjs — enforces the repo's test-before-change rule and keeps business rules in sync with their ADRs.
---

# Changing business logic

The pure, testable business rules live in three modules, each with a matching
`*.test.mjs`: `frontend/businessLogic.mjs` (weight lookback, deload, RPE,
volume, `epley`, `parseRepsMeta`), `frontend/analysis.mjs` (cross-phase
matching, e1RM series, plateau detection, phase seeds), and
`frontend/rowConverters.mjs` (Supabase row shapes). The same rules below apply
to all of them. The browser modules are exported both as native ES functions
and as window globals (`window.BusinessLogic`, `window.AnalysisLogic`) for the
in-browser Babel script in `index.html` — keep both export paths working, and
never name a window bridge the same as a React component (Babel hoists
top-level components onto `window` and will clobber it).

## Before editing

1. Run `npm test` (`node --test frontend/*.test.mjs`) to see the current baseline pass.
2. Read the module's matching test file (`frontend/<module>.test.mjs`) to find the existing test(s) covering the function you're about to touch.

## While editing

- Keep every function pure: no `window`, `document`, `localStorage`, or React state access inside these modules (the `window` bridge assignment at the bottom is the sole exception). If a function needs those, it belongs in `index.html`, not here.
- If you're touching `calcDeloadWeight` or `getBestWeight`, re-read [`docs/adr/0002-deload-55-percent-rule.md`](../../../docs/adr/0002-deload-55-percent-rule.md) first — the 55% figure, the 2.5kg rounding, and the "exclude other deload weeks from PR" rule are documented decisions, not incidental code. Same for the plateau/seed thresholds in `analysis.mjs` (documented in `skills/phase3-analysis.md`). If your change alters any documented number or rule, update the ADR/skill doc in the same change, not as a follow-up.
- Update or add the matching case in the module's test file in the same edit — don't leave a function changed with stale test coverage.

## After editing

Run `npm test` again and confirm it passes before considering the change done. If it's not runnable in this environment, say so explicitly rather than assuming it passes.
