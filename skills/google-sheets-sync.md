# google-sheets-sync.md

## Overview
Manual sync between the app and a Google Sheet via a Google Apps Script Web App.
- `IMPORT SHEET` reads existing rows from Sheets and hydrates the tracker.
- `SYNC SHEETS` writes all logged app data across all days and weeks to Sheets.

---

## Apps Script Web App

### Deployed URL
```
https://script.google.com/macros/s/AKfycbwScpvqFwaYR9HvtiJgwHsY7j3DI-LNwN2Z1vs58wiQpSp2ID4l3wnUB8FNT0voGXo2/exec
```

### Script source
```js
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const callback = e && e.parameter && e.parameter.callback;
  if (values.length <= 1) {
    return respond({ rows: [] }, callback);
  }

  const headers = values[0].map(header => String(header).trim());
  const rows = values.slice(1).map(valuesRow => {
    const row = {};
    headers.forEach((header, index) => {
      row[header.toLowerCase()] = valuesRow[index];
    });
    return row;
  });

  return respond({ rows }, callback);
}

function respond(payload, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Week", "Day", "Section", "Exercise", "Sets", "Reps", "Weight", "Type", "Notes"]);
  }
  const data = JSON.parse(e.postData.contents);
  data.rows.forEach(row => {
    sheet.appendRow([
      row.date, row.week, row.day, row.section,
      row.exercise, row.sets, row.reps, row.weight, row.type, row.notes
    ]);
  });
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", added: data.rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Deployment settings
- Execute as: Me
- Who has access: Anyone
- Must create a **new deployment** (not re-deploy existing) after script changes — this generates a new URL. Update `SHEETS_URL` in `index.html` accordingly.

---

## Fetch call in the app
Writes use `mode: "no-cors"` because Apps Script redirects break standard CORS. We can't read the response body, but the write succeeds.

Reads use JSONP so GitHub Pages can read Apps Script output without CORS headers:

```js
const callbackName = "sheetImport_...";
script.src = `${SHEETS_URL}?callback=${callbackName}`;
```

```js
await fetch(SHEETS_URL, {
  method: "POST",
  mode: "no-cors",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rows }),
});
```

### Row payload shape
```js
{
  date: "2026-01-15",   // new Date().toISOString().split("T")[0]
  week: "W2",
  day: "Day 1",
  section: "SQUAT",
  exercise: "Back Squat",
  sets: 4,
  reps: "6–8",
  weight: "100",        // empty string if BW
  type: "bb",           // "bb" | "db" | "bw" | ""
  notes: "felt strong"
}
```

---

## What gets synced
All logged entries across ALL days and ALL weeks — not just the current view. Only exercises with a weight value or BW type are included. Empty exercises are skipped.

## What gets imported
All rows returned by the Sheet are converted into app state:
- `weights["${day}||${exercise}"][week] = { weight, comment }`
- `types["${day}||${exercise}"] = type`
- `type: "bw"` clears the imported weight for that exercise/week.

Import replaces the current local tracker snapshot with the Sheet snapshot and writes it to `localStorage`.

---

## Sync button states
| State | Label | Resets after |
|---|---|---|
| `idle` | ↑ Sync to Sheets | — |
| `syncing` | Syncing... | — |
| `ok` | ✓ Synced! | 3s |
| `empty` | Nothing logged yet | 2.5s |
| `error` | Sync failed | 3s |

---

## Known issues & gotchas
- **Duplicate rows**: sync appends every time — syncing twice creates duplicate rows. No deduplication yet. Future fix: add a `sync_id` per batch.
- **No response confirmation**: `no-cors` means we can't read the Apps Script response. Success is assumed if no network error is thrown. State is set to `ok` optimistically.
- **Import overwrites local state**: `IMPORT SHEET` treats Sheets as the source of truth for the current import.
- **URL changes on new deployment**: if the Apps Script is re-deployed, update `SHEETS_URL` in `index.html`.
- **Execution limit**: Apps Script has a 30s limit — not a concern for this data volume.

---

## Future improvements
- Add `sync_id` (timestamp + random string) to each batch so Sheets can filter duplicates with a formula
- Show "last synced at [time]" in the app UI
- Once Supabase is live, Sheets sync becomes an export/analysis layer only — not the primary storage
