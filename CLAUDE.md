# CLAUDE.md

Agent-facing entry point for this repo. Read this first.

## Hard constraints

- **Single file:** all UI lives in `index.html`. No `src/` tree, no bundler, no `package.json` for the app itself (a `package.json` may exist solely for test tooling — see `docs/adr/0001-single-file-monolith.md`).
- **No build step:** React 18 + Babel standalone via CDN. Deploy is GitHub Pages, `main` branch, root directory — replace `index.html` directly.
- **No component libraries, no Tailwind, no separate CSS files** — inline styles only.
- **Do not reintroduce a `src/` component tree or bundler** without writing a new ADR that supersedes `docs/adr/0001-single-file-monolith.md`. A prior version of `frontend/README.md` proposed exactly that and was explicitly rejected — see that ADR before suggesting it again.
- The only sanctioned exception is extracting pure business-logic functions into `frontend/*.mjs` native ES modules (see `frontend/businessLogic.mjs` once added) for testability — same pattern as the existing `frontend/supabaseClient.mjs`.

## Where things live

| Topic | File |
|---|---|
| Conventions, data model, core logic rules | [`skills/app-conventions.md`](skills/app-conventions.md) |
| UI/color/typography spec | [`skills/design-system.md`](skills/design-system.md) |
| Supabase auth & database | [`skills/supabase.md`](skills/supabase.md) |
| CSV / Markdown export | [`skills/export.md`](skills/export.md) |
| Phase 2 suggestions, PRs, Insights | [`skills/phase2-insights.md`](skills/phase2-insights.md) |
| Shipping to GitHub Pages | [`skills/deploy.md`](skills/deploy.md) |
| Debugging cloud sync | [`skills/sync-troubleshooting.md`](skills/sync-troubleshooting.md) |
| Test patterns & extraction rules | [`skills/testing.md`](skills/testing.md) |
| Architecture overview | [`docs/architecture.md`](docs/architecture.md) |
| localStorage → Supabase migration | [`docs/migration.md`](docs/migration.md) |
| Frontend architecture & history | [`frontend/README.md`](frontend/README.md) |
| Why decisions were made | [`docs/adr/`](docs/adr/) |

## Business rules (see ADRs for rationale)

- Deload weeks (W5, W8) suggest 55% of all-time PR, rounded to nearest 2.5kg — `docs/adr/0002-deload-55-percent-rule.md`.
- Previous-week weight display looks back to the most recent week with data, never all-time best — `skills/app-conventions.md`.
- Storage is localStorage-first with Supabase as source of truth once logged in — `docs/adr/0003-localstorage-supabase-dual-storage.md`.
- Auth is magic-link only, no passwords — `docs/adr/0004-magic-link-only-auth.md`.

## Testing

Run `npm test` (== `node --test frontend/*.test.mjs`) before changing any function in `frontend/businessLogic.mjs`. `package.json` exists solely for this test script — it does not require or introduce a build step for the app itself.

## Local dev

`.claude/launch.json` defines a `gym` server: `python -m http.server 8123`. Use the Preview tools against that, not a bundler dev server.
