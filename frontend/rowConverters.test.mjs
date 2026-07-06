import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localStateToRows,
  rowsToLocalState,
  localStateToRowsP2,
  rowsToP2State,
} from "./rowConverters.mjs";

const USER = "user-123";

test("localStateToRows: explodes weeks into flat rows with meta", () => {
  const weights = {
    "Day 1||Back Squat": {
      W1: { weight: "100", comment: "felt strong" },
      W2: { weight: "102.5", comment: "" },
    },
  };
  const types = { "Day 1||Back Squat": "bb" };
  const meta = { "Day 1||Back Squat": { section: "SQUAT", sets: 4, reps: "6–8" } };

  const rows = localStateToRows(weights, types, USER, meta);
  assert.equal(rows.length, 2);
  const w1 = rows.find(r => r.week === "W1");
  assert.equal(w1.user_id, USER);
  assert.equal(w1.day, "Day 1");
  assert.equal(w1.exercise, "Back Squat");
  assert.equal(w1.section, "SQUAT");
  assert.equal(w1.sets, 4);
  assert.equal(w1.reps, "6–8");
  assert.equal(w1.weight, "100");
  assert.equal(w1.type, "bb");
  assert.equal(w1.notes, "felt strong");
});

test("localStateToRows: skips malformed keys without the || separator", () => {
  const rows = localStateToRows({ "BadKeyNoPipe": { W1: { weight: "50" } } }, {}, USER);
  assert.equal(rows.length, 0);
});

test("localStateToRows: empty state produces no rows", () => {
  assert.deepEqual(localStateToRows({}, {}, USER), []);
  assert.deepEqual(localStateToRows(undefined, undefined, USER), []);
});

test("rowsToLocalState: rebuilds keyed state and types", () => {
  const rows = [
    { day: "Day 1", exercise: "Back Squat", week: "W1", weight: "100", type: "bb", notes: "ok" },
    { day: "Day 1", exercise: "Back Squat", week: "W2", weight: "102.5", type: "bb", notes: "" },
  ];
  const { weights, types } = rowsToLocalState(rows);
  assert.deepEqual(weights["Day 1||Back Squat"].W1, { weight: "100", comment: "ok" });
  assert.deepEqual(weights["Day 1||Back Squat"].W2, { weight: "102.5", comment: "" });
  assert.equal(types["Day 1||Back Squat"], "bb");
});

test("rowsToLocalState: bw type blanks the weight", () => {
  const { weights, types } = rowsToLocalState([
    { day: "Day 1", exercise: "Dips", week: "W1", weight: "70", type: "bw", notes: "" },
  ]);
  assert.equal(weights["Day 1||Dips"].W1.weight, "");
  assert.equal(types["Day 1||Dips"], "bw");
});

test("rowsToLocalState: skips rows missing day/exercise/week", () => {
  const { weights } = rowsToLocalState([
    { exercise: "Back Squat", week: "W1", weight: "100" },
    { day: "Day 1", week: "W1", weight: "100" },
    { day: "Day 1", exercise: "Back Squat", weight: "100" },
    null,
  ]);
  assert.deepEqual(weights, {});
});

test("round trip: state → rows → state preserves weights, types, comments", () => {
  const weights = {
    "Day 1||Back Squat": { W1: { weight: "100", comment: "a" } },
    "Day 2||Push Press": { W3: { weight: "60", comment: "" } },
  };
  const types = { "Day 1||Back Squat": "bb" };
  const back = rowsToLocalState(localStateToRows(weights, types, USER));
  assert.deepEqual(back.weights, weights);
  assert.deepEqual(back.types, types);
});

test("localStateToRowsP2: carries rpe as number, null when unlogged", () => {
  const weights = { "Monday||Back squat": { W1: { weight: "150", comment: "" }, W2: { weight: "155", comment: "" } } };
  const rpeLog = { "Monday||Back squat": { W1: "8.5" } };
  const rows = localStateToRowsP2(weights, {}, rpeLog, USER);
  assert.equal(rows.find(r => r.week === "W1").rpe, 8.5);
  assert.equal(rows.find(r => r.week === "W2").rpe, null);
});

test("rowsToP2State: rebuilds rpeLog as strings, skips null rpe", () => {
  const { weights, rpeLog } = rowsToP2State([
    { day: "Monday", exercise: "Back squat", week: "W1", weight: "150", type: "", notes: "", rpe: 8.5 },
    { day: "Monday", exercise: "Back squat", week: "W2", weight: "155", type: "", notes: "", rpe: null },
  ]);
  assert.equal(weights["Monday||Back squat"].W1.weight, "150");
  assert.equal(rpeLog["Monday||Back squat"].W1, "8.5");
  assert.equal(rpeLog["Monday||Back squat"].W2, undefined);
});

test("P2 round trip preserves weights and rpe", () => {
  const weights = { "Monday||Back squat": { W1: { weight: "150", comment: "x" } } };
  const rpeLog = { "Monday||Back squat": { W1: "9" } };
  const back = rowsToP2State(localStateToRowsP2(weights, {}, rpeLog, USER));
  assert.deepEqual(back.weights, weights);
  assert.deepEqual(back.rpeLog, rpeLog);
});
