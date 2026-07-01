---
name: business-logic-change
description: Use when adding or editing any function in frontend/businessLogic.mjs (weight lookback, deload calc, RPE, volume, etc.) — enforces the repo's test-before-change rule and keeps business rules in sync with their ADRs.
---

# Changing business logic

`frontend/businessLogic.mjs` holds the app's pure, testable business rules
(`getPrevWeight`, `getBestWeight`, `calcDeloadWeight`, `getPrevRPE`,
`calcSessionVolume`). It's exported both as native ES module functions and as
`window.BusinessLogic` for the in-browser Babel script in `index.html` — keep
both export paths working.

## Before editing

1. Run `npm test` (`node --test frontend/*.test.mjs`) to see the current baseline pass.
2. Read `frontend/businessLogic.test.mjs` to find the existing test(s) covering the function you're about to touch.

## While editing

- Keep every function pure: no `window`, `document`, `localStorage`, or React state access inside `businessLogic.mjs`. If a function needs those, it belongs in `index.html`, not here.
- If you're touching `calcDeloadWeight` or `getBestWeight`, re-read [`docs/adr/0002-deload-55-percent-rule.md`](../../../docs/adr/0002-deload-55-percent-rule.md) first — the 55% figure, the 2.5kg rounding, and the "exclude other deload weeks from PR" rule are documented decisions, not incidental code. If your change alters any of those numbers or the exclusion rule, update the ADR in the same change, not as a follow-up.
- Update or add the matching case in `frontend/businessLogic.test.mjs` in the same edit — don't leave a function changed with stale test coverage.

## After editing

Run `npm test` again and confirm it passes before considering the change done. If it's not runnable in this environment, say so explicitly rather than assuming it passes.
