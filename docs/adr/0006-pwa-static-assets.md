# 0006 — PWA static assets are sanctioned

## Status
Accepted

## Context
The app is used mid-workout on Android, often with poor connectivity. The architecture is already offline-first (localStorage cache, manual cloud sync — ADR 0003), but the page itself still requires network to boot. A Progressive Web App layer (installable, offline-booting) closes that gap. ADR 0001 restricts files outside `index.html` to pure-logic `.mjs` modules, so the PWA files need explicit sanction.

## Decision
Add three kinds of plain static assets, none of which introduce a build step:
- `manifest.json` — install metadata (standalone display, black theme).
- `sw.js` — service worker. Caching strategy is deliberate: **network-first** for `index.html` and `frontend/*.mjs` so deploys are never served stale, **cache-first** for immutable CDN scripts/fonts and icons. Cache name is versioned (`tracker-vN`); old caches are deleted on activate.
- `icons/` — PNG app icons (192/512).

The service worker registration in `index.html` skips localhost so local dev via `python -m http.server` never fights a stale cache.

## Consequences
- These files are exempt from the "pure-logic `.mjs` only" rule; `monolith-guard` treats `manifest.json`, `sw.js`, `icons/**`, and `scripts/**` (CI tooling, per ADR 0005) as allowed.
- When shipping changes to cached CDN assets, bump the cache version constant in `sw.js` (see `skills/deploy.md`).
- `sw.js` must remain dependency-free vanilla JS — it is not transpiled.
