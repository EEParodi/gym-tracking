Frontend Modularization Plan (Phase 2)
- Goal: gradually split the single-file app into modular components and a data layer.
- Current: UI lives in index.html with Babel; data layer is being introduced via frontend/supabaseClient.mjs.
- Plan:
  1) Create a src/ tree with components: DaySelector.jsx, WeekTabs.jsx, ExerciseCard.jsx, WeightInput.jsx, TypeToggle.jsx, App.jsx.
  2) Introduce a simple data layer in src/services/supabaseClient.js that wraps Supabase calls.
  3) Wire App.jsx to use the data layer for read/write; keep localStorage as an offline fallback during migration.
  4) Add a minimal login screen (email/password) and migration trigger to supabaseClient.mjs for now.
- Acceptance: app builds in a dev environment and UI behavior remains consistent during the interim.
