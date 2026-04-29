Migration Plan: LocalStorage to Supabase

Overview
- Objective: Move live data storage to Supabase to enable cross-device access and multi-device editing.
- Scope: Phase 1 focuses on migrating existing localStorage data to Supabase using email/password auth with a minimal login UX.

Phases
1. Scaffolding
- Create Supabase project and define table tracker_data as described in architecture.md.
- Implement a migration script on the frontend that reads localStorage data and upserts into tracker_data with per-week keys.
- Add a simple login flow to authenticate users (email/password).

2. Migration Execution
- On first login, migrate localStorage data for the user to Supabase.
- After migration, hydrate local UI state from Supabase to support multi-device editing.
- Keep localStorage as an offline cache during the transition.

3. Validation & Rollout
- Validate data integrity by comparing local and remote snapshots after migration.
- Incrementally open access so multiple devices can read/write after login.
- Document any edge cases (e.g., non-existent data, BW entries).

Data model notes
- Each migrated row uses key: `${dayKey}||${week}` with value: { day, exercise, week, weight, comment, type, section }.
- Upsert uses conflict on (user_id, key) to ensure per-week uniqueness per user.

Rollout considerations
- Sheets export remains available as an export/analysis path; it is not the source of truth.
- Plan for deduplication and batch IDs (sync_id) in a future iteration to avoid duplicates on repeated exports.
