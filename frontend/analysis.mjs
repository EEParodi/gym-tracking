// Pure cross-phase analysis functions for the Phase 3 view.
// Same sanctioned-extraction pattern as businessLogic.mjs (ADR 0001/0005).
// Thresholds are exported consts so tests, docs and UI reference one source.

import { epley } from "./businessLogic.mjs";

export const PLATEAU_WINDOW = 3;           // last N non-deload sessions considered
export const PLATEAU_E1RM_TOLERANCE = 0.02; // e1RM spread ≤2% counts as flat
export const PLATEAU_MIN_AVG_RPE = 8.5;    // flat only matters when effort is high
export const SEED_RPE_EASY = 7;            // last RPE ≤ this → seed +2.5kg
export const SEED_RPE_MAXED = 9.5;         // last RPE ≥ this → seed = hold

export function normalizeExerciseName(name) {
  return String(name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Match working (non-warm-up) exercises that appear in both phase programs.
 * Names differ in casing across phases ("Back Squat" vs "Back squat") —
 * matching is via normalizeExerciseName.
 * @returns {Array<{name, p1: {name, day, key, reps, sets}, p2: {name, day, key, reps, sets}}>}
 */
export function matchExercisesAcrossPhases(program1, program2) {
  const index1 = {};
  for (const [day, list] of Object.entries(program1 || {})) {
    for (const ex of list || []) {
      if (ex.section === "WARM UP") continue;
      const norm = normalizeExerciseName(ex.name);
      if (!index1[norm]) index1[norm] = { name: ex.name, day, key: `${day}||${ex.name}`, reps: ex.reps, sets: ex.sets };
    }
  }
  const matches = [];
  const seen = new Set();
  for (const [day, list] of Object.entries(program2 || {})) {
    for (const ex of list || []) {
      if (ex.section === "WARM UP") continue;
      const norm = normalizeExerciseName(ex.name);
      if (index1[norm] && !seen.has(norm)) {
        seen.add(norm);
        matches.push({
          name: ex.name,
          p1: index1[norm],
          p2: { name: ex.name, day, key: `${day}||${ex.name}`, reps: ex.reps, sets: ex.sets },
        });
      }
    }
  }
  return matches;
}

/**
 * Per-week e1RM series for one exercise.
 * @param {{weights: object, key: string, weeks: string[], reps: number|null}} args
 * @returns {Array<{week, weight: number|null, e1rm: number|null, deload: boolean}>}
 */
export function buildE1rmSeries({ weights, key, weeks, reps }) {
  return (weeks || []).map(week => {
    const raw = parseFloat(weights?.[key]?.[week]?.weight);
    const weight = isNaN(raw) || raw <= 0 ? null : raw;
    const deload = week.includes("Deload");
    const e1rm = weight != null && reps > 0 ? epley(weight, reps) : null;
    return { week, weight, e1rm, deload };
  });
}

/**
 * Plateau: last PLATEAU_WINDOW non-deload e1RMs within PLATEAU_E1RM_TOLERANCE
 * of each other while average logged RPE ≥ PLATEAU_MIN_AVG_RPE.
 * @param {Array<{week, e1rm, deload}>} series
 * @param {Record<string, string|number>} rpeByWeek
 * @returns {boolean}
 */
export function detectPlateau(series, rpeByWeek = {}) {
  const pts = (series || []).filter(p => !p.deload && p.e1rm != null);
  if (pts.length < PLATEAU_WINDOW) return false;
  const last = pts.slice(-PLATEAU_WINDOW);
  const values = last.map(p => p.e1rm);
  const spread = (Math.max(...values) - Math.min(...values)) / Math.max(...values);
  if (spread > PLATEAU_E1RM_TOLERANCE) return false;
  const rpes = last.map(p => parseFloat(rpeByWeek[p.week])).filter(r => !isNaN(r));
  if (!rpes.length) return false;
  const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length;
  return avg >= PLATEAU_MIN_AVG_RPE;
}

/**
 * Next-phase W1 seed from the latest non-deload logged weight, using the same
 * RPE thresholds as the in-tracker suggestions (skills/phase2-insights.md).
 * @returns {{w1: number, note: "up"|"hold"|"keep"} | null}
 */
export function suggestPhaseSeed(series, lastRpe) {
  const pts = (series || []).filter(p => !p.deload && p.weight != null);
  if (!pts.length) return null;
  const lastWeight = pts[pts.length - 1].weight;
  const r = parseFloat(lastRpe);
  if (!isNaN(r) && r <= SEED_RPE_EASY) return { w1: lastWeight + 2.5, note: "up" };
  if (!isNaN(r) && r >= SEED_RPE_MAXED) return { w1: lastWeight, note: "hold" };
  return { w1: lastWeight, note: "keep" };
}

// Expose a global for the non-module Babel/JSX script in index.html.
// Named AnalysisLogic (not Analysis) — Babel's top-level `function Analysis`
// component declaration becomes window.Analysis and would clobber this.
if (typeof window !== "undefined") {
  window.AnalysisLogic = {
    normalizeExerciseName,
    matchExercisesAcrossPhases,
    buildE1rmSeries,
    detectPlateau,
    suggestPhaseSeed,
    PLATEAU_WINDOW,
    PLATEAU_E1RM_TOLERANCE,
    PLATEAU_MIN_AVG_RPE,
    SEED_RPE_EASY,
    SEED_RPE_MAXED,
  };
}
