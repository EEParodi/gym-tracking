# supabase.md

## Status
⚠️ NOT YET IMPLEMENTED — documents the planned integration.
Update this file once the integration is live.

---

## Goal
Replace `localStorage` with Supabase for cross-device sync (phone ↔ PC).
Add Supabase Auth (magic link) for access control.

---

## Project setup
- Provider: supabase.com (free tier)
- Recommended region: `sa-east-1` (São Paulo — closest to Buenos Aires)

---

## Table schema

```sql
create table tracker_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

create unique index on tracker_data (user_id, key);
```

One row per exercise key per user. `key` follows the same `"Day 1||Back Squat"` convention as localStorage.

### Row-level security
```sql
alter table tracker_data enable row level security;

create policy "Users can only access their own data"
  on tracker_data for all
  using (auth.uid() = user_id);
```

---

## Auth flow — magic link

No password. On first load, if no active session, show a minimal email input. Supabase sends a one-click login link. Session is automatically persisted to localStorage by the Supabase client.

```js
// Send magic link
await supabase.auth.signInWithOtp({ email });

// Check session on app load
const { data: { session } } = await supabase.auth.getSession();
if (!session) showLoginScreen();
```

---

## Read / write pattern

### Load all data on mount
```js
const { data } = await supabase
  .from('tracker_data')
  .select('key, value');

const weights = {};
data.forEach(row => { weights[row.key] = row.value; });
```

### Upsert on each change
```js
await supabase
  .from('tracker_data')
  .upsert({
    user_id: session.user.id,
    key: `${day}||${exercise}`,
    value: updatedExerciseObject,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id, key' });
```

---

## CDN setup (no npm)
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

```js
const { createClient } = supabase;   // lowercase global
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## Environment variables
Since the repo is public, `SUPABASE_ANON_KEY` will be visible in source. This is acceptable — the anon key cannot bypass RLS. The data is protected at the database level by the policy above.

```js
const SUPABASE_URL      = "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

---

## Migration plan
1. On first successful Supabase login, read all existing `localStorage` data
2. Upsert every key/value pair to Supabase
3. Show a one-time "data migrated" confirmation
4. Keep localStorage as a read fallback for offline support (don't clear it)
5. Going forward: write to Supabase first, localStorage second

---

## Relationship to Google Sheets sync
Sheets sync stays as an **export/analysis layer** — not replaced by Supabase. Supabase = live working data. Sheets = historical log for analysis and charting.

---

## Gotchas
- Supabase JS v2 CDN global is `supabase` (lowercase) — `supabase.createClient()` not `Supabase.createClient()`
- Magic link emails can land in spam — warn user on first login attempt
- Free tier limits: 50k monthly active users, 500MB DB, 2GB bandwidth — fine for personal use
- `signInWithOtp` sends a new link every call — don't let users spam it; add a cooldown or disable the button after first send