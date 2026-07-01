// Pure business-logic functions, extracted from index.html for unit testing.
// No bundler required — loaded as a native ES module, same pattern as supabaseClient.mjs.
// See docs/adr/0001-single-file-monolith.md for why this is the only sanctioned extraction.

/**
 * Most recent previous week's weight for an exercise — never the all-time best.
 * W1 returns null; W2 returns W1 (if logged); W3 returns the most recent of W1/W2 with data, etc.
 * @returns {{weight: string, week: string} | null}
 */
export function getPrevWeight(weights, day, exercise, currentWeek, weeks) {
  const weekIdx = weeks.indexOf(currentWeek);
  if (weekIdx <= 0) return null;
  for (let i = weekIdx - 1; i >= 0; i--) {
    const w = weights[`${day}||${exercise}`]?.[weeks[i]]?.weight;
    if (w) return { weight: w, week: weeks[i] };
  }
  return null;
}

/**
 * All-time best (heaviest) logged weight for an exercise before currentWeek, excluding deload weeks.
 * Used as the PR basis for deload suggestions — see calcDeloadWeight and docs/adr/0002.
 * @returns {number | null}
 */
export function getBestWeight(weights, day, exercise, currentWeek, weeks) {
  const weekIdx = weeks.indexOf(currentWeek);
  let best = null;
  for (let i = 0; i < weekIdx; i++) {
    if (weeks[i].includes("Deload")) continue;
    const w = parseFloat(weights[`${day}||${exercise}`]?.[weeks[i]]?.weight);
    if (!isNaN(w) && (best === null || w > best)) best = w;
  }
  return best;
}

/**
 * Deload week suggestion: 55% of PR, rounded to the nearest 2.5kg plate increment.
 * Business rule — see docs/adr/0002-deload-55-percent-rule.md.
 * @param {number} prWeight - all-time best weight, from getBestWeight()
 * @returns {number}
 */
export function calcDeloadWeight(prWeight) {
  const target = prWeight * 0.55;
  return Math.round(target / 2.5) * 2.5;
}

/**
 * Most recent previous week's logged RPE for an exercise (mirrors getPrevWeight).
 * @returns {{rpe: string, week: string} | null}
 */
export function getPrevRPE(rpeLog, day, exercise, currentWeek, weeks) {
  const weekIdx = weeks.indexOf(currentWeek);
  if (weekIdx <= 0) return null;
  for (let i = weekIdx - 1; i >= 0; i--) {
    const r = rpeLog[`${day}||${exercise}`]?.[weeks[i]];
    if (r !== undefined && r !== "") return { rpe: r, week: weeks[i] };
  }
  return null;
}

/**
 * Session volume = sets * reps * weight, summed across working exercises logged this session.
 * BW-type and unweighted exercises don't contribute.
 * @param {Array<{name: string, sets: string|number, reps: string|number}>} workingExercises
 * @param {(day: string, name: string, field: string) => string} getVal
 * @param {(day: string, name: string) => string} getType
 * @param {string} activeDay
 * @returns {number}
 */
export function calcSessionVolume(workingExercises, getVal, getType, activeDay) {
  return workingExercises.reduce((total, ex) => {
    const wv = getVal(activeDay, ex.name, "weight");
    if (!wv || getType(activeDay, ex.name) === "bw") return total;
    return total + (parseInt(ex.sets) || 0) * (parseInt(ex.reps) || 0) * parseFloat(wv);
  }, 0);
}

// Expose a global for the non-module Babel/JSX script in index.html.
if (typeof window !== "undefined") {
  window.BusinessLogic = {
    getPrevWeight,
    getBestWeight,
    calcDeloadWeight,
    getPrevRPE,
    calcSessionVolume,
  };
}
