# workout-mode.md

In-gym features inside the `Tracker` component (`index.html`). All state is component-local; no new files.

## Rest timer
- Floating bar, fixed bottom-right, hidden while the session-summary sheet is showing.
- Presets: **2:00 / 3:00 / 4:00** — matches the user's real rest habits (2–4 min depending on effort). Don't add shorter presets without asking.
- Running state shows `M:SS` countdown (warning color) + cancel ✕. On finish: `navigator.vibrate([200,100,200])` (Android), bar flashes "REST OVER — GO" in accent for 4s.
- Implementation: `restEndsAt` timestamp + 250ms interval; remaining time derived, never decremented state.

## Screen wake lock
- Header toggle KEEP AWAKE / AWAKE ON (warning bg when active), rendered only when `"wakeLock" in navigator`.
- Re-acquires on `visibilitychange` (Android releases the sentinel when the tab hides); releases on toggle-off and effect cleanup.

## Achilles check-in (Phase 2 only)
- In the session-summary sheet: score 1 (fine) … 5 (pain), one per day+week session. Tap the active score again to clear it.
- Storage: localStorage `phase2-checkin-v1` as `{ [day]: { [week]: score } }`. **Local-only — not synced to Supabase** (no column; add one via a new SQL migration if this should roam).
- Colors: 1–2 success, 3 warning, 4–5 accent.
- History renders in Insights as a per-day card ("ACHILLES CHECK-INS") above the exercise cards.
- Rationale: Phase 2 cues require monitoring both Achilles post-surgery; this turns that cue into recorded data next to session volume.
