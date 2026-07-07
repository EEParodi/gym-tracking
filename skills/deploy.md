# deploy.md

How this app ships. There is no build, no CI deploy pipeline, no bundler — deliberately (ADR 0001).

## Mechanism
- **GitHub Pages** serving the repo's `main` branch, root directory.
- Deploying = merging/pushing a new `index.html` (and `frontend/*.mjs` if changed) to `main`. Pages picks it up automatically within a minute or two.
- Live URL: https://eeparodi.github.io/phase1-tracking/

## Pre-deploy checklist
1. `npm test` — all `frontend/*.test.mjs` pass.
2. Serve locally: the `gym` launch config (`python -m http.server 8123`) and check `http://localhost:8123`:
   - Landing page renders, both phases open (use the `dev` email bypass on localhost for Phase 2).
   - Browser console clean — Babel standalone reports JSX syntax errors here, there is no compile step to catch them earlier.
3. Confirm `window.SUPABASE_URL` / `window.SUPABASE_ANON_KEY` in `index.html` are intact (the anon key is public by design — do not "clean it up").
4. If styles changed, run the `design-consistency-reviewer` agent; if files were added/moved, run `monolith-guard`.
5. After merge, hard-refresh the live URL (Pages caches aggressively) and log one value to verify Supabase round-trip.

## PWA (ADR 0006)
- `sw.js` uses network-first for own code, so normal deploys are picked up without action.
- If you change the cached CDN assets (React/Babel/supabase-js URLs, fonts) or the icons, bump `CACHE_VERSION` in `sw.js` so installed clients drop the old cache.
- The service worker does NOT register on localhost — test SW behavior only on the live Pages URL (or temporarily remove the hostname guard).
- New `frontend/*.mjs` files must be added to the `APP_SHELL` list in `sw.js` for offline boot.

## Gotchas
- **Everything on `main` root is live** — never push half-finished work to `main`; use a branch + PR.
- CDN pins: React 18 and Babel 7.23.10 are version-pinned via unpkg; supabase-js is pinned to major v2 (`@supabase/supabase-js@2/+esm`) — patch/minor updates flow automatically, a breaking v3 cannot land silently.
- `frontend/*.mjs` are loaded as native ES modules — they must be deployed alongside `index.html`; a rename breaks the live site with no build error.
- The Supabase magic-link `emailRedirectTo` uses the current origin+path, so links sent from localhost redirect to localhost — expected.
