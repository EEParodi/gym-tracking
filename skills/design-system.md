# design-system.md

## Aesthetic Direction
Dark, high-contrast, athletic. Feels like a serious training tool — not a wellness app, not a fitness influencer product. Industrial and functional with intentional typographic personality.

---

## Fonts
Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />
```

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / headers / labels / tabs | Barlow Condensed | 700 | letterSpacing 0.04–0.12em |
| Body / inputs / notes | Barlow | 400–600 | |

Never use Inter, Roboto, Arial, or system-ui. These fonts are part of the identity.

---

## Color Palette

### Base surfaces
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0d0d0d` | Page background |
| `surface` | `#161616` | Exercise cards |
| `surface-elevated` | `#111` | Header, week tabs, day selector bg |
| `surface-input` | `#0d0d0d` | Input fields, cue boxes |
| `border-default` | `#1f1f1f` | Default card border |
| `border-active` | `#2a2a2a` | Hover/interactive borders |
| `border-logged` | `#2a2a1a` | Card border when exercise is logged |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#f0f0f0` | Logged exercise names, primary content |
| `text-secondary` | `#aaa` | Unlogged exercise names |
| `text-muted` | `#888` | Notes input text |
| `text-faint` | `#555` | Badge labels, tab inactive |
| `text-dim` | `#444` | Cue toggle button |

### Accent colors
| Token | Hex | Usage |
|---|---|---|
| `amber` | `#f59e0b` | Primary accent — header title, active week tab, active day button, logged weight value, active tab underline |
| `amber-dark` | `#c8960a` | Deload banner text |
| `amber-border` | `#f59e0b66` | Weight input border when logged |
| `green` | `#22c55e` | Save confirmation, sync button |
| `indigo` | `#6366f1` | BW type active border |
| `indigo-light` | `#818cf8` | BW type active text |
| `indigo-border` | `#6366f133` | BW weight input border |
| `prev-weight-text` | `#8b8b3a` | Previous week weight badge text |
| `prev-weight-bg` | `#1f1e10` | Previous week weight badge bg |

### Section accent colors
Each section has a left-border accent and label color:
```js
const SECTION_COLORS = {
  "WARM UP":  "#4b5563",
  "PLYO":     "#7c3aed",
  "SQUAT":    "#d97706",
  "HAMS":     "#d97706",
  "HINGE":    "#d97706",
  "UNI":      "#d97706",
  "CALF":     "#b45309",
  "CORE":     "#059669",
  "PRESS":    "#dc2626",
  "ROW":      "#2563eb",
  "CHEST":    "#db2777",
  "PULL":     "#2563eb",
  "NECK":     "#6b7280",
  "ARMS":     "#7c3aed",
  "FINISHER": "#059669",
  "CARRY":    "#0891b2",
};
```

---

## Spacing & Layout

- Mobile-first, designed for ~390px viewport width
- Page padding: `0 16px` horizontal
- Sticky header: `padding: 16px 20px`
- Card padding: `12px 14px`
- Card gap: `8px` between cards in a section
- Section gap: `20px` margin-bottom
- Horizontal scroll containers (tabs, day selector): `overflowX: auto`, `gap: 8px`, no wrapping

---

## Component Patterns

### Cards (exercise)
```js
{
  background: "#161616",
  border: `1px solid ${isLogged ? "#2a2a1a" : "#1f1f1f"}`,
  borderRadius: 10,
  boxShadow: isLogged ? `0 0 0 1px ${sectionColor}22` : "none",
}
```
No drop shadows. The `boxShadow` glow is the only depth indicator — it uses the section color at 13% opacity.

### Section headers
3px wide left border in section color + condensed uppercase label:
```js
<div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
<span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", color }}>
  {section}
</span>
```

### Badges (sets/reps, RPE, prev weight)
```js
// Standard badge
{ fontSize: 11, color: "#555", background: "#1f1f1f", borderRadius: 4, padding: "2px 7px" }

// Previous weight badge
{ fontSize: 11, color: "#8b8b3a", background: "#1f1e10", borderRadius: 4, padding: "2px 7px" }
```

### Weight input
```js
{
  width: 72,
  background: isBW ? "#111" : "#0d0d0d",
  border: `1px solid ${wVal && !isBW ? "#f59e0b66" : isBW ? "#6366f133" : "#2a2a2a"}`,
  borderRadius: 6,
  padding: "6px 10px",
  color: isBW ? "#818cf8" : wVal ? "#f59e0b" : "#555",
  fontSize: 13,
  fontFamily: "'Barlow Condensed'",
  fontWeight: 600,
  textAlign: "center",
}
```

### Type toggle (BB / DB / BW)
Three small buttons. Active state uses green for BB/DB, indigo for BW:
```js
// Active BB or DB
{ background: "#1a2020", border: "1px solid #22c55e88", color: "#4ade80" }

// Active BW
{ background: "#1a1a2a", border: "1px solid #6366f1aa", color: "#818cf8" }

// Inactive
{ background: "#0d0d0d", border: "1px solid #2a2a2a", color: "#444" }
```

### Tab (week selector)
```js
// Active
{ color: "#f59e0b", borderBottom: "2px solid #f59e0b" }

// Inactive
{ color: "#555", borderBottom: "2px solid transparent" }
```

### Day selector button
```js
// Active
{ background: "#f59e0b", border: "1px solid #f59e0b", color: "#000" }

// Inactive
{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#888" }
```
Progress counter inside: `fontSize: 10, opacity: 0.7`

### Cue panel
Revealed on tap, left-bordered with section color:
```js
{
  padding: "8px 10px",
  background: "#0d0d0d",
  borderRadius: 6,
  borderLeft: `2px solid ${sectionColor}`,
  fontSize: 12,
  color: "#777",
  lineHeight: 1.5,
}
```

### Deload banner
```js
{
  background: "#1a1400",
  border: "1px solid #f59e0b33",
  borderRadius: 8,
  fontSize: 12,
  color: "#c8960a",
}
```

### Sync button states
```js
{
  idle:    { bg: "#1a2a1a", border: "#22c55e44", color: "#22c55e" },
  syncing: { bg: "#1a2a1a", border: "#22c55e44", color: "#22c55e66" },
  ok:      { bg: "#0a2a0a", border: "#22c55e",   color: "#22c55e" },
  empty:   { bg: "#2a1a1a", border: "#dc262644", color: "#dc2626" },
  error:   { bg: "#2a1a1a", border: "#dc262644", color: "#dc2626" },
}
```

---

## Motion & Interaction
- All interactive elements: `transition: "all 0.15s"` or `"all 0.2s"`
- No page transitions, no skeleton loaders — instant render
- No animations beyond CSS transitions on state changes
- Tap targets minimum 36px height for mobile usability

---

## Anti-patterns
- ❌ No gradients anywhere
- ❌ No drop shadows (only the `0 0 0 Npx` box-shadow glow technique)
- ❌ No light theme — this app is dark only
- ❌ No rounded pill shapes on single-sided borders
- ❌ Never use font sizes below 11px
- ❌ Never use font weights above 700
- ❌ No emoji in UI (use text labels or CSS shapes)