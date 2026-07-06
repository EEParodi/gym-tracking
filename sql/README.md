# sql/

One-time setup scripts for the Supabase project. Run in the Supabase SQL editor.

- `create_tracker_data.sql` — Phase 1 table + indexes + RLS policy. Run first.
- `create_tracker_data_p2.sql` — Phase 2 table (adds `rpe numeric(3,1)`).
- `import_phase1_data.sql` — one-time historical load of pre-app Phase 1 data; already applied to the live project, kept for reference only.

Schema documentation lives in `skills/supabase.md`.
