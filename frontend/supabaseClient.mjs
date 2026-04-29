// Supabase ES Module wrapper for Phase 1 Tracker
// Minimal login (email/password) and data migration from localStorage to Supabase.

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

export async function loginWithEmailPassword(email, password) {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { user: data?.user, session: data?.session, error };
}

export async function logout() {
  const client = getClient();
  return client.auth.signOut();
}

// Migrate localStorage data to Supabase for the given user_id
// Returns { migrated, error }
export async function migrateLocalToSupabase(userId) {
  if (!userId) {
    return { migrated: 0, error: new Error("Missing userId for migration") };
  }
  const client = getClient();
  const weights = JSON.parse(localStorage.getItem("phase1-tracker-v1") || "{}");
  const types = JSON.parse(localStorage.getItem("phase1-types-v1") || "{}");
  const rows = [];
  const now = new Date().toISOString();
  // Build per-week rows with a key that includes the week to avoid clobbering
  for (const dayKey of Object.keys(weights)) {
    const weekObj = weights[dayKey] || {};
    for (const [week, data] of Object.entries(weekObj)) {
      const [day, exercise] = dayKey.split("||");
      const newKey = `${dayKey}||${week}`;
      const value = {
        day,
        exercise,
        week,
        weight: data?.weight ?? "",
        comment: data?.comment ?? "",
        section: "",
        type: types[dayKey] ?? "",
      };
      rows.push({ user_id: userId, key: newKey, value, updated_at: now });
    }
  }
  if (rows.length === 0) {
    return { migrated: 0 };
  }
  // Upsert by user_id + key to keep per-week entries distinct
  const { data, error } = await client.from("tracker_data").upsert(rows, { onConflict: ["user_id","key"] });
  return { migrated: rows.length, data, error };
}

export async function fetchAllDataForUser(userId) {
  if (!userId) return { data: [], error: new Error("Missing userId") };
  const client = getClient();
  const { data, error } = await client.from("tracker_data").select("key, value").eq("user_id", userId);
  return { data, error };
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
  logout,
  migrateLocalToSupabase,
  fetchAllDataForUser,
  migrateLocalToSupabaseIfNeeded,
};

// expose a global for non-module consumers (like the current index.html script)
if (typeof window !== "undefined") {
  window.supabase = api;
}
