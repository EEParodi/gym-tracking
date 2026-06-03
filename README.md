# Gym Tracker

Personal strength training tracker for a two-phase program. Logs weights, RPE, and exercise types per week. Phase 2 adds RPE-based weight suggestions, PR detection, and a session summary sheet.

**Live:** https://eeparodi.github.io/phase1-tracking/

**Stack:** Single `index.html` — no build step, no `package.json`. React 18 via CDN, Babel standalone for JSX, inline styles only. Supabase for cloud sync (magic-link auth), localStorage as offline cache.

See [`skills/app-conventions.md`](skills/app-conventions.md) for constraints and conventions.
