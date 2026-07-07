import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeExerciseName,
  matchExercisesAcrossPhases,
  buildE1rmSeries,
  detectPlateau,
  suggestPhaseSeed,
} from "./analysis.mjs";

test("normalizeExerciseName: case and whitespace insensitive", () => {
  assert.equal(normalizeExerciseName("Back Squat"), "back squat");
  assert.equal(normalizeExerciseName("  back   squat "), "back squat");
});

test("matchExercisesAcrossPhases: matches across casing, skips warm-ups", () => {
  const p1 = {
    "Day 1": [
      { section: "WARM UP", name: "Tibialis Raises", sets: 3, reps: "15" },
      { section: "SQUAT", name: "Back Squat", sets: 4, reps: "6–8" },
    ],
    "Day 2": [{ section: "PRESS", name: "Push Press", sets: 4, reps: "5–6" }],
  };
  const p2 = {
    "Monday": [
      { section: "WARM UP", name: "Tibialis raises", sets: 3, reps: "15" },
      { section: "SQUAT", name: "Back squat", sets: 4, reps: "5" },
    ],
    "Friday": [{ section: "PRESS", name: "Push press", sets: 5, reps: "4–5" }],
  };
  const matches = matchExercisesAcrossPhases(p1, p2);
  assert.equal(matches.length, 2);
  const squat = matches.find(m => m.name === "Back squat");
  assert.equal(squat.p1.key, "Day 1||Back Squat");
  assert.equal(squat.p2.key, "Monday||Back squat");
  assert.ok(!matches.some(m => normalizeExerciseName(m.name).includes("tibialis")), "warm-ups excluded");
});

test("buildE1rmSeries: e1rm only when weight and reps present", () => {
  const weights = { "Monday||Back squat": { W1: { weight: "150" }, W2: { weight: "" } } };
  const series = buildE1rmSeries({ weights, key: "Monday||Back squat", weeks: ["W1", "W2", "W5 (Deload)"], reps: 5 });
  assert.equal(series[0].e1rm, 150 * (1 + 5 / 30));
  assert.equal(series[1].e1rm, null);
  assert.equal(series[2].deload, true);
});

test("detectPlateau: flat e1RM at high RPE flags, easy RPE does not", () => {
  const series = [
    { week: "W1", e1rm: 170, deload: false },
    { week: "W2", e1rm: 171, deload: false },
    { week: "W3", e1rm: 170.5, deload: false },
  ];
  assert.equal(detectPlateau(series, { W1: "9", W2: "9", W3: "8.5" }), true);
  assert.equal(detectPlateau(series, { W1: "7", W2: "7", W3: "7" }), false, "flat but easy is not a plateau");
});

test("detectPlateau: rising e1RM is not a plateau; short series is not", () => {
  const rising = [
    { week: "W1", e1rm: 160, deload: false },
    { week: "W2", e1rm: 166, deload: false },
    { week: "W3", e1rm: 172, deload: false },
  ];
  assert.equal(detectPlateau(rising, { W1: "9", W2: "9", W3: "9" }), false);
  assert.equal(detectPlateau(rising.slice(0, 2), { W1: "9", W2: "9" }), false);
});

test("detectPlateau: ignores deload weeks", () => {
  const series = [
    { week: "W4", e1rm: 170, deload: false },
    { week: "W5 (Deload)", e1rm: 100, deload: true },
    { week: "W6", e1rm: 170, deload: false },
    { week: "W7", e1rm: 170.8, deload: false },
  ];
  assert.equal(detectPlateau(series, { W4: "9", W6: "9", W7: "9" }), true);
});

test("suggestPhaseSeed: RPE thresholds match tracker suggestions", () => {
  const series = [{ week: "W7", weight: 155, e1rm: 180, deload: false }];
  assert.deepEqual(suggestPhaseSeed(series, "6.5"), { w1: 157.5, note: "up" });
  assert.deepEqual(suggestPhaseSeed(series, "9.5"), { w1: 155, note: "hold" });
  assert.deepEqual(suggestPhaseSeed(series, "8"), { w1: 155, note: "keep" });
  assert.equal(suggestPhaseSeed([], "8"), null);
});

test("suggestPhaseSeed: skips deload week as the latest point", () => {
  const series = [
    { week: "W7", weight: 155, deload: false },
    { week: "W8 (Deload)", weight: 85, deload: true },
  ];
  assert.equal(suggestPhaseSeed(series, "7").w1, 157.5);
});
