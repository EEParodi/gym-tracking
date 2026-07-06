# 0005 — Stay monolithic; close the Vite migration question

## Status
Accepted

## Context
A Vite migration ("monolith breakup") had been under consideration since the app crossed ADR 0001's original ~1,400-line watermark. Meanwhile the 2026-07 roadmap adds substantial scope: a PWA layer, workout mode (rest timer, wake lock, tendon check-in), a Phase 3 cross-phase analysis view, and an automated coach-review pipeline. The question was whether that scope justifies finally moving to a bundler.

## Decision
Stay monolithic. All new UI goes into `index.html`; all new heavy logic goes into pure `frontend/*.mjs` modules per ADR 0001's sanctioned exception (`businessLogic.mjs`, `rowConverters.mjs`, and now `analysis.mjs` follow this pattern). The Vite migration is explicitly rejected, not deferred.

Rationale:
- The projected growth (~2,200 lines of `index.html`) is well within what one developer with guard agents (`monolith-guard`, `design-consistency-reviewer`), ADRs, and unit-tested pure modules can navigate.
- Every roadmap item works without a bundler: PWA files are plain static assets (ADR 0006); analysis math is a pure module; the coach review runs in CI, not the browser.
- Babel-standalone parse cost at this size remains acceptable on the target device (mid-range Android).

Automation scripts under `scripts/*.mjs` (CI-only, zero npm dependencies) are also sanctioned — they are tooling, not app code, and keep `package.json` test-only.

## Consequences
- Concrete revisit triggers, any one of which re-opens this decision via a new ADR:
  1. `index.html` exceeds ~2,500 lines,
  2. a second regular contributor joins,
  3. the coaching-platform (multi-user) direction is revived.
- Until a trigger fires, proposals to add a bundler, `src/` tree, or app-level npm dependencies should be declined citing this ADR.
