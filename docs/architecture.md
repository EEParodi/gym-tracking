Architectural Overview
- Frontend: modular React app (planned) with a thin data layer that talks to Supabase for live data and to localStorage for offline support.
- Backend: Supabase Postgres with Table tracker_data, Row-Level Security (RLS) to isolate per-user data, and a simple auth model (email/password for now).
- Data flow: localStorage (offline) <-> Supabase (online) <-> Google Sheets (export/analysis path).

Core data model (live store):
- Table: tracker_data
- Columns (conceptual):
  - id (uuid, primary key)
  - user_id (uuid, references auth.users, RLS enforced)
  - key (text) —
  - value (jsonb) — stores per-entry info like { week, day, exercise, weight, comment, type }
  - updated_at (timestamp)

Notes:
- The initial migration plan stores per-week entries by composing key as day||exercise||week to maintain unique rows per (day/exercise/week).
- Sheets export remains an export/analysis path; Supabase is the primary source of truth during migration.

Migration readiness:
- Phase 1: implement migration script that reads localStorage phase1-tracker-v1 and phase1-types-v1 and upserts into tracker_data with per-week keys.
- Phase 2: fetch remote data upon login and hydrate local UI state from Supabase for multi-device parity.

Security considerations:
- Client-side keys are still in the repo as placeholders; production should replace with environment-based config. RLS enforces per-user data privacy on the server.

Future-proofing:
- A dedicated migration service and batch dedup logic will be introduced (sync_id) to prevent duplicate rows during repeated exports.
- A design-system-driven UI rewrite will align visuals with the new tokens.
