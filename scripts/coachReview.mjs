// Weekly coach review: pulls the last 7 days of Phase 2 logs from Supabase,
// asks Claude for a short coaching summary, writes reports/coach-review-YYYY-Www.md.
// Zero npm dependencies — Node 20+ global fetch only (ADR 0005).
//
// Env (GitHub Actions secrets — see reports/README.md):
//   SUPABASE_SERVICE_ROLE_KEY  read access bypassing RLS (server-side only, never ship to the app)
//   ANTHROPIC_API_KEY          Claude API key
//   SUPABASE_URL               optional override; defaults to the project URL
//
// Flags: --dry-run  build and print the digest, skip the API call and file write.

import { writeFileSync, mkdirSync } from "node:fs";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gehcmkgtdisltlmljmhm.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DRY_RUN = process.argv.includes("--dry-run");

function isoWeekLabel(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function fetchWeekRows() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/tracker_data_p2?select=day,exercise,week,weight,rpe,type,section,updated_at&updated_at=gte.${since}&order=updated_at.asc`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function buildDigest(rows) {
  const byDay = {};
  for (const r of rows) {
    if (!r.weight && r.type !== "bw") continue;
    (byDay[`${r.day} ${r.week}`] ||= []).push(r);
  }
  const lines = [];
  for (const [session, list] of Object.entries(byDay)) {
    lines.push(`${session}:`);
    for (const r of list) {
      lines.push(`  - ${r.exercise}: ${r.type === "bw" ? "BW" : `${r.weight}kg`}${r.rpe != null ? ` @ RPE ${r.rpe}` : ""}`);
    }
  }
  return lines.join("\n");
}

async function askClaude(digest) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `You are a strength coach reviewing one athlete's training week. Program context: Phase 2 of a strength block, 4 days (Mon squat, Tue press/row, Thu hinge, Fri push press/pull), RPE-based progression (add 2.5kg when RPE ≤ 7, hold at RPE ≥ 9.5), athlete is post-bilateral-Achilles-surgery so calf/tibialis work and landing quality matter.\n\nThis week's log:\n${digest}\n\nWrite a concise markdown review (max ~350 words): 1) what went well, 2) RPE drift or lifts trending toward failure, 3) anything skipped or under-logged, 4) concrete targets for next week per main lift. Be direct, no fluff.`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("\n") || "";
}

async function main() {
  if (!SERVICE_KEY || (!DRY_RUN && !ANTHROPIC_KEY)) {
    console.log("Secrets not configured (SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY) — skipping coach review. See reports/README.md.");
    return; // soft skip, exit 0 so the scheduled workflow stays green
  }

  const rows = await fetchWeekRows();
  if (!rows.length) {
    console.log("No Phase 2 rows logged in the last 7 days — nothing to review.");
    return;
  }
  const digest = buildDigest(rows);
  console.log(`Digest (${rows.length} rows):\n${digest}\n`);

  if (DRY_RUN) {
    console.log("--dry-run: skipping Claude call and report write.");
    return;
  }

  const review = await askClaude(digest);
  const week = isoWeekLabel();
  mkdirSync("reports", { recursive: true });
  const path = `reports/coach-review-${week}.md`;
  writeFileSync(path, `# Coach Review — ${week}\n\n${review}\n`, "utf8");
  console.log(`Wrote ${path}`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
