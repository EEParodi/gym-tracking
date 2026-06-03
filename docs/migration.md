## Migration: localStorage → Supabase

### Status

| Phase | Migration | Notes |
|---|---|---|
| Phase 1 | **Done** — `migrateLocalToSupabaseIfNeeded` ships in `index.html` | Runs once on first login if Supabase is empty |
| Phase 2 | No migration needed | Phase 2 data was entered after Supabase was live |

---

### How Phase 1 migration works

On first login, the cloud sync effect checks whether `tracker_data` has any rows for the user. If empty, it calls `migrateLocalToSupabaseIfNeeded(userId)`, which reads `phase1-tracker-v1` and `phase1-types-v1` from localStorage and upserts them into `tracker_data`.

After migration it re-fetches from Supabase and hydrates local state, so localStorage becomes a cache rather than the source of truth.

---

### Data model (live)

**Table:** `tracker_data` (Phase 1), `tracker_data_p2` (Phase 2)

**Columns:** `id` (uuid pk), `user_id` (uuid, RLS), `day` (text), `exercise` (text), `week` (text), `weight` (text), `comment` (text), `type` (text), `section` (text), `sets` (text), `reps` (text), `updated_at` (timestamp). Phase 2 adds `rpe` (text).

**Upsert conflict key:** `(user_id, day, exercise, week)` — not `(user_id, key)`. Each row is one exercise/week combination, not a composite key string.

---

### Auth

Magic-link only (`sendMagicLink`). No email/password flow exists. On localhost, entering `dev` as the email bypasses auth and sets `phase1_completed = true` for development.
