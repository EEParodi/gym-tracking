// Supabase ES Module wrapper for Phase 1 Tracker
// Auth helpers plus localStorage <-> Supabase row hydration for Phase 1.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Prefer runtime-provided values to avoid hard-coding secrets in source.
const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) || "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || "REPLACE_WITH_ANON_KEY";

let _sb = null;

function getClient() {
  if (!_sb) {
    _sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sb;
}

export function initClient(url = SUPABASE_URL, anonKey = SUPABASE_ANON_KEY) {
  // Allow overriding in tests or future env wiring
  if (!_sb) {
    _sb = createClient(url, anonKey);
  }
  return _sb;
}

export async function signupWithEmail(email, password) {
  const client = getClient();
  return client.auth.signUp({ email, password });
}

export async function sendMagicLink(email) {
  const client = getClient();
  return client.auth.signInWithOtp({ email });
}

export async function getSession() {
  const client = getClient();
  const { data, error } = await client.auth.getSession();
  return { session: data?.session ?? null, error };
}

export async function getCurrentUser() {
  const client = getClient();
  const { data, error } = await client.auth.getUser();
  return { user: data?.user ?? null, error };
}

export async function loginWithEmailPassword(email, password) {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { user: data?.user, session: data?.session, error };
}

export async function logout() {
  const client = getClient();
  return client.auth.signOut();
}

function localStateToRows(weights, types, userId, metaByKey = {}) {
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

function rowsToLocalState(rows) {
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

export function localStorageStateToRows({ weights, types, userId, metaByKey }) {
  return localStateToRows(weights, types, userId, metaByKey);
}

export function rowsToTrackerState(rows) {
  return rowsToLocalState(rows);
}

// Migrate localStorage data to Supabase for the given user_id.
// Returns { migrated, error }
export async function migrateLocalToSupabase(userId) {
  if (!userId) {
    return { migrated: 0, error: new Error("Missing userId for migration") };
  }
  const client = getClient();
  const weights = JSON.parse(localStorage.getItem("phase1-tracker-v1") || "{}");
  const types = JSON.parse(localStorage.getItem("phase1-types-v1") || "{}");
  const rows = localStateToRows(weights, types, userId);
  if (rows.length === 0) {
    return { migrated: 0 };
  }
  const { data, error } = await client.from("tracker_data").upsert(rows, { onConflict: "user_id,day,exercise,week" });
  return { migrated: rows.length, data, error };
}

export async function fetchAllDataForUser(userId) {
  if (!userId) return { data: [], error: new Error("Missing userId") };
  const client = getClient();
  const { data, error } = await client.from("tracker_data").select("date, week, day, section, exercise, sets, reps, weight, type, notes, updated_at").eq("user_id", userId).order("updated_at", { ascending: true });
  return { data, error };
}

export async function hydrateTrackerStateFromSupabase(userId) {
  const { data, error } = await fetchAllDataForUser(userId);
  if (error) return { weights: {}, types: {}, error };
  return { ...rowsToLocalState(data), error: null };
}

export async function upsertTrackerStateToSupabase({ userId, weights, types, metaByKey }) {
  if (!userId) return { data: null, error: new Error("Missing userId") };
  const client = getClient();
  const rows = localStateToRows(weights, types, userId, metaByKey);
  if (!rows.length) return { data: [], error: null };
  return client.from("tracker_data").upsert(rows, { onConflict: "user_id,day,exercise,week" });
}

// Convenience: migrate localStorage if needed and return status
export async function migrateLocalToSupabaseIfNeeded(userId) {
  const flag = localStorage.getItem("phase1-migration-done");
  if (flag) {
    return { migrated: 0, reason: "already-done" };
  }
  const res = await migrateLocalToSupabase(userId);
  if (res?.migrated > 0 && !res?.error) localStorage.setItem("phase1-migration-done", "true");
  return res;
}

export const api = {
  initClient,
  loginWithEmailPassword,
  signupWithEmail,
  sendMagicLink,
  getSession,
  getCurrentUser,
  logout,
  migrateLocalToSupabase,
  fetchAllDataForUser,
  hydrateTrackerStateFromSupabase,
  upsertTrackerStateToSupabase,
  localStorageStateToRows,
  rowsToTrackerState,
  migrateLocalToSupabaseIfNeeded,
};

// expose a global for non-module consumers (like the current index.html script)
if (typeof window !== "undefined") {
  window.supabase = api;
}
