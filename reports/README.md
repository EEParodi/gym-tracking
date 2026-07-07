# reports/

Weekly Claude-generated coach reviews land here as `coach-review-YYYY-Www.md`, written by `.github/workflows/coach-review.yml` (Mondays 06:00 UTC, or run manually via workflow_dispatch).

## One-time setup (required before the first review)
Add two repository secrets under **Settings → Secrets and variables → Actions**:

1. `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings → API → `service_role` key. This bypasses RLS to read your training rows server-side. **Never put this key anywhere in the app** — it belongs only in CI secrets.
2. `ANTHROPIC_API_KEY` — from https://console.anthropic.com/ (uses `claude-sonnet-5`, ~1 short call per week).

Until both secrets exist, the workflow runs and skips gracefully (green, no report).

## Local dry run
```
node scripts/coachReview.mjs --dry-run
```
Prints the week's digest without calling the API or writing a file (needs `SUPABASE_SERVICE_ROLE_KEY` in the environment; without it, it soft-skips).
