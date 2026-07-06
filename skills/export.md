# export.md

How data leaves the app. Two client-side download paths exist — there is **no** live Google Sheets integration.

> Historical note: an Apps Script "Sync to Sheets" feature existed in early Phase 1 and was removed once Supabase became the source of truth. The old `skills/google-sheets-sync.md` doc and implementation are in git history if it's ever revived.

---

## CSV export (`exportCsv` in `Tracker`, `index.html`)
- Visible only when the phase is marked **completed** (EXPORT CSV button in the header).
- Columns: `Exercise, Section, Week, Day, Weight, Type, [RPE — Phase 2 only], Comment`.
- Includes only logged entries: a weight value exists OR type is `bw`.
- All text fields go through `escapeCsv` (wraps in quotes, doubles embedded quotes). Weight and RPE are written raw.
- Filename: `${phaseKey}_export_${YYYY-MM-DD}.csv` (e.g. `phase2_export_2026-07-06.csv`).
- Download via `Blob` + temporary `<a>` element + `URL.revokeObjectURL`.

## Markdown export (`exportProgressMarkdown`, `index.html`)
- Triggered from the landing page (EXPORT PROGRESS (.md) button) — works across **both** phases in one file.
- `generateProgressMarkdown()` builds: `# Training Progress` header → per phase (`## PHASE N — ACTIVE|COMPLETE`) → per day (`### Day`) → warm-up list, then each logged working exercise with per-week lines (`W2 · 155kg · RPE 8`).
- Reads directly from localStorage (all phase keys), not from React state — safe to call from the landing page.
- BW-type exercises with no weight render as `— BW`.
- Alerts and aborts if nothing is logged anywhere.

---

## Conventions when touching export code
- New columns go at the end (spreadsheet consumers may reference positions).
- Anything user-typed (exercise names are program-controlled, but comments are not) must be CSV-escaped.
- Keep exports read-only — they must never mutate localStorage or state.
- Google Sheets consumption is manual: user imports the CSV into Sheets themselves.
