// Pure converters between the app's localStorage state shape and Supabase rows.
// No window/document/localStorage access — unit tested in rowConverters.test.mjs.
// State shape: { "Day 1||Back Squat": { W1: { weight: "100", comment: "" } } }
// Row shape: one flat record per (user, day, exercise, week).

export function localStateToRows(weights, types, userId, metaByKey = {}) {
  const rows = [];
  const today = new Date().toISOString().split("T")[0];

  for (const [dayKey, weekMap] of Object.entries(weights || {})) {
    const [day, exercise] = dayKey.split("||");
    if (!day || !exercise) continue;

    for (const [week, data] of Object.entries(weekMap || {})) {
      const meta = metaByKey[dayKey] || {};
      rows.push({
        user_id: userId,
        date: today,
        week,
        day,
        section: meta.section ?? data?.section ?? "",
        exercise,
        sets: Number.isFinite(Number(meta.sets ?? data?.sets)) ? Number(meta.sets ?? data?.sets) : 0,
        reps: String(meta.reps ?? data?.reps ?? ""),
        weight: String(data?.weight ?? ""),
        type: String(types?.[dayKey] ?? data?.type ?? ""),
        notes: String(data?.comment ?? data?.notes ?? ""),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return rows;
}

export function rowsToLocalState(rows) {
  const weights = {};
  const types = {};

  for (const row of rows || []) {
    if (!row?.day || !row?.exercise || !row?.week) continue;
    const key = `${row.day}||${row.exercise}`;
    if (!weights[key]) weights[key] = {};
    weights[key][row.week] = {
      weight: row.type === "bw" ? "" : String(row.weight ?? ""),
      comment: String(row.notes ?? ""),
    };
    if (row.type) types[key] = row.type;
  }

  return { weights, types };
}

// === Phase 2 variants (add rpe) ===

export function localStateToRowsP2(weights, types, rpeLog, userId, metaByKey = {}) {
  const rows = [];
  const today = new Date().toISOString().split("T")[0];
  for (const [dayKey, weekMap] of Object.entries(weights || {})) {
    const [day, exercise] = dayKey.split("||");
    if (!day || !exercise) continue;
    for (const [week, data] of Object.entries(weekMap || {})) {
      const meta = metaByKey[dayKey] || {};
      const rpeVal = rpeLog?.[dayKey]?.[week];
      rows.push({
        user_id: userId,
        date: today,
        week, day,
        section: meta.section ?? data?.section ?? "",
        exercise,
        sets: Number.isFinite(Number(meta.sets ?? data?.sets)) ? Number(meta.sets ?? data?.sets) : 0,
        reps: String(meta.reps ?? data?.reps ?? ""),
        weight: String(data?.weight ?? ""),
        rpe: rpeVal ? parseFloat(rpeVal) : null,
        type: String(types?.[dayKey] ?? data?.type ?? ""),
        notes: String(data?.comment ?? data?.notes ?? ""),
        updated_at: new Date().toISOString(),
      });
    }
  }
  return rows;
}

export function rowsToP2State(rows) {
  const weights = {};
  const types = {};
  const rpeLog = {};
  for (const row of rows || []) {
    if (!row?.day || !row?.exercise || !row?.week) continue;
    const key = `${row.day}||${row.exercise}`;
    if (!weights[key]) weights[key] = {};
    weights[key][row.week] = {
      weight: row.type === "bw" ? "" : String(row.weight ?? ""),
      comment: String(row.notes ?? ""),
    };
    if (row.type) types[key] = row.type;
    if (row.rpe != null) {
      if (!rpeLog[key]) rpeLog[key] = {};
      rpeLog[key][row.week] = String(row.rpe);
    }
  }
  return { weights, types, rpeLog };
}
