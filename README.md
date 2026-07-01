# Gym Tracker

Personal strength training tracker for a two-phase program. Logs weights, RPE, and exercise types per week. Phase 2 adds RPE-based weight suggestions, PR detection, and a session summary sheet.

**Live:** https://eeparodi.github.io/phase1-tracking/

**Stack:** Single `index.html` — no build step, no `package.json`. React 18 via CDN, Babel standalone for JSX, inline styles only. Supabase for cloud sync (magic-link auth), localStorage as offline cache.

See [`skills/app-conventions.md`](skills/app-conventions.md) for constraints and conventions, [`CLAUDE.md`](CLAUDE.md) for the AI-agent entry point, and [`docs/adr/`](docs/adr/) for the rationale behind key technical decisions.

**Tests:** business-rule logic (deload calc, weight/RPE progression, session volume) is covered by `frontend/businessLogic.test.mjs`. Run with `npm test`. This is test tooling only — it does not add a build step to the app itself.
