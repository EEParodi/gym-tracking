import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPrevWeight,
  getBestWeight,
  calcDeloadWeight,
  getPrevRPE,
  calcSessionVolume,
} from "./businessLogic.mjs";

const WEEKS = ["W1", "W2", "W3", "W4", "W5 (Deload)"];

test("getPrevWeight: W1 has no previous week", () => {
  assert.equal(getPrevWeight({}, "Day 1", "Back Squat", "W1", WEEKS), null);
});

test("getPrevWeight: returns most recent previous week with data, skipping empty weeks", () => {
  const weights = {
    "Day 1||Back Squat": { W1: { weight: "100" }, W3: { weight: "110" } },
  };
  assert.deepEqual(getPrevWeight(weights, "Day 1", "Back Squat", "W4", WEEKS), { weight: "110", week: "W3" });
});

test("getPrevWeight: falls back further back when nearest week is empty", () => {
  const weights = {
    "Day 1||Back Squat": { W1: { weight: "100" } },
  };
  assert.deepEqual(getPrevWeight(weights, "Day 1", "Back Squat", "W3", WEEKS), { weight: "100", week: "W1" });
});

test("getBestWeight: excludes deload weeks from PR calculation", () => {
  const weights = {
    "Day 1||Back Squat": { W1: { weight: "100" }, W2: { weight: "120" }, "W5 (Deload)": { weight: "60" } },
  };
  assert.equal(getBestWeight(weights, "Day 1", "Back Squat", "W5 (Deload)", WEEKS), 120);
});

test("getBestWeight: returns null when nothing logged yet", () => {
  assert.equal(getBestWeight({}, "Day 1", "Back Squat", "W3", WEEKS), null);
});

test("calcDeloadWeight: 55% of PR, rounded to nearest 2.5kg", () => {
  assert.equal(calcDeloadWeight(100), 55);
  assert.equal(calcDeloadWeight(150), 82.5);
  assert.equal(calcDeloadWeight(103), 57.5); // 103*0.55=56.65 -> /2.5=22.66 -> round=23 -> 57.5
});

test("calcDeloadWeight: rounding edge case at exact midpoint", () => {
  // 90 * 0.55 = 49.5 -> nearest 2.5 multiple is 48.75->50? verify actual formula behavior
  assert.equal(calcDeloadWeight(90), 50);
});

test("getPrevRPE: mirrors getPrevWeight lookback", () => {
  const rpeLog = { "Day 1||Back Squat": { W1: "8", W2: "" } };
  assert.deepEqual(getPrevRPE(rpeLog, "Day 1", "Back Squat", "W3", WEEKS), { rpe: "8", week: "W1" });
});

test("getPrevRPE: treats empty string as not logged", () => {
  const rpeLog = { "Day 1||Back Squat": { W2: "" } };
  assert.equal(getPrevRPE(rpeLog, "Day 1", "Back Squat", "W3", WEEKS), null);
});

test("calcSessionVolume: sums sets * reps * weight for logged, non-BW exercises", () => {
  const exercises = [
    { name: "Back Squat", sets: "4", reps: "5" },
    { name: "Bench", sets: "3", reps: "8" },
  ];
  const getVal = (day, name, field) => (name === "Back Squat" ? "100" : "50");
  const getType = () => "bb";
  assert.equal(calcSessionVolume(exercises, getVal, getType, "Day 1"), 4 * 5 * 100 + 3 * 8 * 50);
});

test("calcSessionVolume: excludes BW-type and unweighted exercises", () => {
  const exercises = [
    { name: "Pull-ups", sets: "3", reps: "10" },
    { name: "Bench", sets: "3", reps: "8" },
  ];
  const getVal = (day, name) => (name === "Bench" ? "50" : "");
  const getType = (day, name) => (name === "Pull-ups" ? "bw" : "bb");
  assert.equal(calcSessionVolume(exercises, getVal, getType, "Day 1"), 3 * 8 * 50);
});
