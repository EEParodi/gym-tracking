# testing.md

How this repo tests code without a build step.

## Running
```
npm test        # == node --test frontend/*.test.mjs
```
The root `package.json` exists solely for this (`"type": "module"`, one script). Node's built-in `node:test` runner — no jest, no vitest, no devDependencies.

## What is tested
- `frontend/businessLogic.test.mjs` — pure business rules in `businessLogic.mjs`: `getPrevWeight`, `getBestWeight`, `calcDeloadWeight`, `getPrevRPE`, `calcSessionVolume`.
- `frontend/rowConverters.test.mjs` — localStorage-state ↔ Supabase-row converters in `rowConverters.mjs` (P1 + P2 variants, round-trip, BW blanking, malformed-row skipping).

Pattern:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcDeloadWeight } from "./businessLogic.mjs";

test("deload suggests 55% of PR rounded to 2.5kg", () => {
  assert.equal(calcDeloadWeight(100), 55);
});
```

## The purity rule
Functions in `frontend/*.mjs` business modules must be pure: **no `window`, `document`, `localStorage`, or React access.** All state comes in as arguments (note how `calcSessionVolume` takes `getVal`/`getType` accessors instead of reaching into state). This is what makes them testable under plain Node.

## When to extract a function out of index.html
Extract into `frontend/businessLogic.mjs` (the sanctioned ADR 0001 exception) when a function:
- encodes a business rule (progression math, completion rules, parsing like `parseRepsMeta`), and
- can be written without DOM/React dependencies.

Do NOT extract rendering logic, event handlers, or anything needing component state.

Extraction checklist (see also the `business-logic-change` skill):
1. Run `npm test` first — start green.
2. Move the function to `businessLogic.mjs`, export it, and add it to the `window.BusinessLogic` bridge object at the bottom of the module.
3. Replace the `index.html` implementation with a thin delegating wrapper (keep the JSDoc there — callers read it in place).
4. Add tests covering the rule and its edges (empty data, deload weeks, W1 boundaries).
5. `npm test` again; then load the app on :8123 — the module bridge is runtime-only, tests can't catch a missing `window.BusinessLogic` entry.

## Why converters live in their own module
`supabaseClient.mjs` imports supabase-js from a CDN URL, which Node cannot resolve — so anything imported from it is untestable. Pure logic that needs tests must live in a module with no CDN imports (`businessLogic.mjs`, `rowConverters.mjs`); `supabaseClient.mjs` imports and re-exports as needed.
