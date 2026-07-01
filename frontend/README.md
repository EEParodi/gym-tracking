# Frontend Architecture

- **Single file:** everything UI-related lives in `index.html` (config-driven `Tracker` component, driven by `PHASE_CONFIG`). No `src/` tree, no bundler.
- **Data layer:** `frontend/supabaseClient.mjs` — a native ES module (`<script type="module">`), wrapping Supabase calls. No build step required to load it.
- **Auth:** magic-link only via Supabase (`sendMagicLink`). No email/password.
- **Storage:** localStorage as offline cache, Supabase Postgres as source of truth when logged in. See [`../docs/architecture.md`](../docs/architecture.md).

## Superseded plan

An earlier version of this file proposed a `src/` component tree (`DaySelector.jsx`, `WeekTabs.jsx`, etc.), a bundler-based dev build, and email/password login. That plan was superseded by commit `4241755`, which merged Phase 1 and Phase 2 into a single config-driven `Tracker` component and kept the app single-file. See [`../docs/adr/0001-single-file-monolith.md`](../docs/adr/0001-single-file-monolith.md) for the rationale, and `git show d4da9d6:frontend/README.md` for the original text.

Do not reintroduce a `src/` tree or bundler without a new ADR superseding `0001`.
