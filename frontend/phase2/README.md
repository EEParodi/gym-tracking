Phase 2: Frontend Modularization (Skeleton)

- Goals:
  - Break the monolithic single-file app into a small, testable React app structure under frontend/phase2.
  - Introduce a light data layer that can talk to Supabase and fallback to localStorage.
  - Provide a clean path for migrating existing code to Phase 2 with minimal disruption.

- Plan:
  1) Create src/ with AppPhase2.jsx and minimal components: LoginPanel.jsx, DaySelector.jsx, ExerciseCard.jsx, WeightInput.jsx, TypeToggle.jsx.
  2) Create services/supabaseClient.js to wrap the ES module and expose CRUD methods.
  3) Wire AppPhase2.jsx to consume the data layer and provide a basic working UI scaffold.
  4) Add a README with integration steps and a migration checklist.

- Acceptance: a runnable skeleton that can be gradually filled with real UI, while preserving existing functionality during Phase 1.
