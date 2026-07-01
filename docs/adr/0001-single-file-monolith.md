# 0001 — Single-file monolith, no build step

## Status
Accepted

## Context
This is a personal strength-training tracker, deployed via GitHub Pages with no CI/CD. An earlier version of `frontend/README.md` (see `git show d4da9d6:frontend/README.md`) proposed a Phase-2 modularization: a `src/` tree with separate `.jsx` components (`DaySelector.jsx`, `WeekTabs.jsx`, `ExerciseCard.jsx`, etc.), a dev-environment build step, and a `src/services/supabaseClient.js` data layer.

That plan was never executed. Instead, commit `4241755` merged the separate Phase 1 and Phase 2 trackers into one config-driven `Tracker` component inside `index.html`, driven by a `PHASE_CONFIG` object — reducing `index.html` from 1543 to 1149 lines without introducing a build step.

## Decision
Keep the entire UI in a single `index.html` file. No bundler, no `package.json` for the app, no `src/` tree. React 18 and Babel standalone are loaded via CDN; JSX is transpiled in-browser. Deploy by replacing `index.html` directly on `main`.

The one sanctioned exception: pure, non-UI logic (business rules, Supabase wrappers) may live in separate `.mjs` files loaded via native `<script type="module">` — no bundler required. `frontend/supabaseClient.mjs` established this pattern; `frontend/businessLogic.mjs` follows it for testability.

Rationale for staying single-file over modularizing:
- Zero deploy friction — GitHub Pages serves the file as-is, no build/CI to maintain for a personal app.
- A config-driven single component (`PHASE_CONFIG`) already captures the variation between phases that the `src/` plan was trying to solve, without the file-splitting overhead.
- `index.html` has since grown past the originally-noted "reconsider Vite if it exceeds ~1400 lines" threshold (now ~1565 lines), but the added complexity has been additive features (coach dashboard, invites), not disorganization — the config-driven structure is still legible.

## Consequences
- Any future agent or contributor must not reintroduce a `src/` component tree, JSX build step, or bundler without writing a new ADR that explicitly supersedes this one.
- `frontend/README.md` documents current architecture only; its earlier `src/`-tree proposal is noted there as superseded, not deleted from history.
- If `index.html` growth makes the config-driven single-file approach genuinely hard to navigate, re-open the Vite/modularization question via a new ADR rather than drifting back into an undocumented plan.
