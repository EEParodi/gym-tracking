---
name: preview-verify
description: Browser-verify changes to this app (index.html, sw.js, manifest.json, frontend/*.mjs) by delegating the whole Claude Preview workflow to a cheap haiku subagent instead of driving preview_* tools from the main session. Use this whenever a change needs checking in the running app — after editing index.html or any frontend module, when the user says "verify it", "check it in the browser", "test the change", or when a verification workflow would otherwise have the main model calling preview_start / preview_eval / preview_snapshot / preview_console_logs in a loop.
---

# preview-verify

Browser verification of this app is many cheap tool round-trips: start the server, reload, seed localStorage, probe the DOM, read the console, repeat. None of it needs frontier-model reasoning — what it needs is the repo-specific knowledge below. Delegating the loop to a haiku subagent cuts cost substantially while the main session stays free to act on the findings.

## Workflow

1. List the specific behaviors the change affects (e.g. "rest timer counts down", "Analysis view renders seeded data", "no console errors").
2. Spawn ONE Agent — `subagent_type: "general-purpose"`, **`model: "haiku"`** — using the prompt template below, filling in the checklist. Do not drive `preview_*` tools from the main session.
3. Read the subagent's report. If anything failed, fix the source in the main session, then spawn a **fresh** haiku verification (don't reuse the old agent — its page state is stale).
4. Relay the verification outcome (including failures verbatim) to the user.

Exception: skip delegation for a single trivial probe (one `preview_eval` call) — spawning costs more than it saves there.

## Subagent prompt template

```
Verify changes to the gym-tracking app in the running browser preview. Work directory: <repo root>.

Setup:
- Start the dev server with preview_start name "gym" (python http.server on :8123, defined in .claude/launch.json).
- The app is a single-file React app compiled in-browser by Babel — after any load or reload, wait ~2s before probing the DOM (use setTimeout inside preview_eval promises).

Checks to run (report PASS/FAIL each, with evidence):
<checklist — one line per behavior>

Then always:
- preview_console_logs with level "error". IMPORTANT: the buffer is cumulative across reloads — an error may predate the current load. To attribute an error, reload and re-trigger the behavior, then check whether NEW entries appear.
- Confirm window.BusinessLogic, window.AnalysisLogic, and window.supabase are defined after load.

Report format: one line per check "PASS/FAIL — <check> — <evidence>", then any console errors found, then a one-sentence overall verdict. Do not fix anything — report only.
```

## Repo-specific verification knowledge (include what's relevant in the checklist)

- **Auth bypass**: on localhost, type `dev` into the login email and click SEND LINK — marks Phase 1 complete and opens Phase 2. Or set `localStorage.phase1_completed = "true"` directly.
- **Direct routing**: set `localStorage["phase-tracker-last-phase"]` to `phase1` / `phase2` / `phase3` and reload to land in that view.
- **Seeding data**: localStorage keys are listed in `skills/app-conventions.md` (Data Model). Weight shape: `{"Day 1||Back Squat": {"W1": {"weight": "140", "comment": ""}}}` under `phase1-tracker-v1`; Phase 2 uses `phase2-tracker-v1` + `phase2-rpe-v1` with days Monday/Tuesday/Thursday/Friday and lowercase-ish names ("Back squat").
- **React inputs**: to simulate typing, use the native value setter + `dispatchEvent(new Event('input', {bubbles: true}))` — direct `.value =` doesn't reach React state.
- **Service worker**: intentionally does NOT register on localhost — `swRegistered: false` locally is a PASS, not a failure.
- **Screenshots**: `preview_screenshot` sometimes times out while the page is perfectly healthy — verify via `preview_eval` / `preview_snapshot` text probes; treat screenshots as optional proof, never as the pass/fail signal.
- **Timers**: the rest timer ticks every 250ms; sample the countdown at two points >1s apart to prove it's counting.
- **Module staleness**: after editing a `frontend/*.mjs` file, a plain reload can serve a cached module — verify freshness with `fetch(url, {cache: "reload"})` before concluding a fix didn't work.
- Stop the preview server (`preview_stop`) when verification is finished.
