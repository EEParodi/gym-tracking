# 0002 — Deload weeks suggest 55% of PR

## Status
Accepted

## Context
Weeks 5 and 8 are programmed deload weeks (`skills/app-conventions.md`). Athletes need a suggested working weight for those weeks that's meaningfully lighter than their working sets, without requiring manual calculation.

## Decision
`calcDeloadWeight(prWeight)` (`index.html`, ~line 267) computes the deload suggestion as 55% of the athlete's all-time PR (excluding other deload weeks — see `getBestWeight`, ~line 256), rounded to the nearest 2.5kg plate increment:

```js
function calcDeloadWeight(prWeight) {
  const target = prWeight * 0.55;
  return Math.round(target / 2.5) * 2.5;
}
```

55% sits within the commonly recommended 40–60% deload intensity range for strength programs, and rounding to 2.5kg matches standard plate increments so the suggestion is immediately loadable without further math.

## Consequences
- The 55% figure and 2.5kg rounding are business rules, not incidental code — any change to either should update this ADR and be covered by `frontend/businessLogic.test.mjs`.
- `getBestWeight` deliberately excludes deload weeks from the PR calculation so deload suggestions don't compound against a previously-reduced deload weight.
