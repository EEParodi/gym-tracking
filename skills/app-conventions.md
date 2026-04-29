# app-conventions.md

## Project: Phase 1 Tracker
Personal gym tracking web app. Single HTML file, no build step, mobile-first (Android).

---

## Live URLs
| Resource | URL |
|---|---|
| App | https://eeparodi.github.io/phase1-tracking/ |
| Repo | https://github.com/eeparodi/phase1-tracking |
| Sheets Script | see `google-sheets-sync.md` |

---

## Stack
- **Single file**: everything in `index.html` — no bundler, no `package.json`, no node_modules
- **React 18** via CDN (`unpkg.com/react@18/umd/react.production.min.js`)
- **Babel standalone** via CDN for in-browser JSX
- **No TypeScript**, no component libraries, no CSS files — inline styles only
- All external scripts loaded via CDN allowlist: `unpkg.com`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`

---

## Program Structure

```js
const DAYS  = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5 (Optional)"];
const WEEKS = ["W1", "W2", "W3", "W4", "W5 (Deload)"];
```

Each exercise: `{ section, name, sets, reps, rpe, cue }`

Week 5 is always a deload — show a warning banner reminding to cut loads 40–50%.

---

## Data Model

### Storage keys
| Key | Contents |
|---|---|
| `"phase1-tracker-v1"` | All weight + comment entries |
| `"phase1-types-v1"` | BB / DB / BW type per exercise |

> Once Supabase is live, localStorage becomes an offline fallback only. See `supabase.md`.

### Weight data shape
```js
{
  "Day 1||Back Squat": {
    "W1": { weight: "100", comment: "felt strong" },
    "W2": { weight: "102.5", comment: "" },
  }
}
```

### Types data shape
```js
{
  "Day 1||Back Squat": "bb",        // "bb" | "db" | "bw" | null
  "Day 2||Incline DB Bench": "db",
}
```

### Key convention
Always `"${day}||${exerciseName}"` — double pipe separator. Never change this format; it's used across storage, sync, and state lookups.

---

## Core Logic Rules

### Previous week weight
Show the weight from the most recent previous week that has data — NOT the all-time max. W1 shows nothing. W2 shows W1, W3 shows the most recent of W1/W2 with data, etc.

```js
function getPrevWeight(weights, day, exercise, currentWeek) {
  const weekIdx = WEEKS.indexOf(currentWeek);
  if (weekIdx <= 0) return null;
  for (let i = weekIdx - 1; i >= 0; i--) {
    const w = weights[`${day}||${exercise}`]?.[WEEKS[i]]?.weight;
    if (w) return { weight: w, week: WEEKS[i] };
  }
  return null;
}
```

### BW (bodyweight) type
- Disables the weight input
- Clears stored weight for that exercise when BW is selected
- Still counts as "logged" for progress counters
- Synced to Sheets with `weight: ""` and `type: "bw"`

### Save feedback
Show `✓ saved` for 1200ms after any write. Never show errors to the user for localStorage failures — fail silently.

### Logged state
An exercise is considered logged if it has a weight value OR its type is `"bw"`.

---

## Component Structure
Keep everything in a single `App` component for now — no need to split into sub-components until the file exceeds ~600 lines or a piece of UI is reused 3+ times.

Exceptions already componentized:
- `TypeToggle` — the BB/DB/BW selector

---

## Deployment
- GitHub Pages, `main` branch, root directory
- Deploy by replacing `index.html` via GitHub UI or git push
- No CI/CD — manual deploy is fine for a personal app

---

## Anti-patterns
- ❌ Never add a build step or `package.json`
- ❌ Never use external component libraries (MUI, shadcn, etc.)
- ❌ Never use Tailwind
- ❌ Never use separate CSS files — inline styles only
- ❌ Never show all-time best weight — always show previous week specifically
- ❌ Never use `position: fixed` — breaks iframe rendering in Claude artifacts
- ❌ Never split into multiple HTML/JS files — single file is the constraint
- ❌ Never auto-sync to Sheets without user intent — sync is always manual
- Plan: add a controlled migration path to Supabase and modularize the frontend for backend-driven evolution.
- The interim approach uses localStorage as a fallback with a migration hook to Supabase when a user logs in.
