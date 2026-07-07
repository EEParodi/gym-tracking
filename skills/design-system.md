# design-system.md

Source of truth for UI styling. Derived from the live `UI` token object and `:root` CSS variables in `index.html` — if this file and the code disagree, the code wins and this file must be updated in the same change.

## Aesthetic Direction
Dark, high-contrast, industrial. Feels like a serious training tool — not a wellness app, not a fitness influencer product. Pure black background with a subtle dot-grid texture, monospace data, one red accent.

---

## Fonts
Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@400;700&family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

| Role | Font | Token | Notes |
|---|---|---|---|
| Display titles (PHASE 1, PHASES, INSIGHTS) | Doto (fallback Space Mono) | `UI.displayFont` | Large sizes (44–68px), `lineHeight 0.9`, `letterSpacing -0.06em` |
| Labels, buttons, badges, tabs, stats | Space Mono | `UI.mono` | 9–13px, bold 700, `letterSpacing 0.04–0.1em`, usually UPPERCASE |
| Body copy, exercise names, notes | Space Grotesk | `UI.sans` | 12–24px, weight 400–500 |

Never use Inter, Roboto, Arial, Barlow, or system-ui. (Barlow was the Phase 1 prototype font — retired.)

---

## Color Palette

Tokens exist twice and must stay in sync: CSS variables in `:root` and the `UI` object in the JSX.

| Token (`UI.*`) | CSS var | Hex | Usage |
|---|---|---|---|
| `black` | `--black` | `#000000` | Page background, input backgrounds |
| `surface` | `--surface` | `#111111` | Cards (logged), panels, bottom sheet |
| `raised` | `--surface-raised` | `#1A1A1A` | Raised surfaces |
| `border` | `--border` | `#222222` | Default borders |
| `borderVisible` | `--border-visible` | `#333333` | Interactive/hover borders |
| `disabled` | `--text-disabled` | `#666666` | Disabled text, placeholders, faint labels |
| `secondary` | `--text-secondary` | `#999999` | Secondary text |
| `primary` | `--text-primary` | `#E8E8E8` | Body text |
| `display` | `--text-display` | `#FFFFFF` | Headings, active/logged values |
| `accent` | `--accent` | `#D71921` | Red accent — active tab underline, PR-adjacent highlights, errors, INSIGHTS |
| `success` | `--success` | `#4A9E5C` | Save/sync ok, RPE ≤ 7, "+kg" suggestions |
| `warning` | `--warning` | `#D4A843` | Deload, favourites star, RPE 7–8.5, hold suggestions, confirm states |

Translucent variants used inline: `rgba(215,25,33,0.15)` (error bg), `rgba(74,158,92,0.08)` (up-suggestion bg), `rgba(212,168,67,0.08–0.12)` (deload/hold/PR bg), `rgba(212,168,67,0.5)` / `rgba(74,158,92,0.4)` (badge borders — PR, PLATEAU, suggestion chips). Translucent black scrim is always `rgba(0,0,0,0.94)`.

### Section accent colors
Each section gets a color dot and logged-card left border:
```js
const SECTION_COLORS = {
  "WARM UP": "#4b5563", "PLYO": "#7c3aed", "SQUAT": "#d97706",
  "HAMS": "#d97706", "HINGE": "#d97706", "UNI": "#d97706",
  "CALF": "#b45309", "CORE": "#059669", "PRESS": "#dc2626",
  "ROW": "#2563eb", "CHEST": "#db2777", "PULL": "#2563eb",
  "NECK": "#6b7280", "ARMS": "#7c3aed", "FINISHER": "#059669",
  "CARRY": "#0891b2",
};
```

### Background texture
The only sanctioned "gradient" is the body dot grid:
```css
background-image: radial-gradient(circle, rgba(51,51,51,0.18) 0.5px, transparent 0.5px);
background-size: 16px 16px;
```

---

## Spacing & Layout
- Mobile-first, ~390px viewport
- Page padding: `0 16px` horizontal
- Sticky header: `padding: 20px 16px 18px`, `background: rgba(0,0,0,0.94)`, `zIndex: 10`
- Card padding: `13px 14px` (exercise cards); stat/insight cards (Insights, Analysis) use flat `14px`; card gap `8px`; section gap `32px`
- Border radius: 4 (buttons/inputs/badges), 6 (cards), 3 (small badges)
- Horizontal scroll containers (tabs, day selector): `overflowX: auto`, no wrapping

---

## Component Patterns

### Exercise cards
```js
{
  background: isLogged ? UI.surface : "rgba(17,17,17,0.78)",
  border: `1px solid ${isLogged ? UI.borderVisible : UI.border}`,
  borderLeft: `2px solid ${isLogged ? sectionColor : UI.border}`,
  borderRadius: 6,
}
```
The 2px left border in section color is the "logged" signal. No box shadows.

### Badges (sets×reps, RPE, prev weight, suggestions)
```js
// Standard
{ fontFamily: UI.mono, fontSize: 10, color: UI.disabled, background: UI.black,
  border: `1px solid ${UI.border}`, borderRadius: 3, padding: "3px 6px" }
// Prev weight: color UI.warning, border UI.borderVisible
// Suggestion chips: dashed border, translucent bg, success (↑) or warning (hold/deload)
```

### Buttons (mono action buttons)
```js
{ background: UI.black, border: `1px solid ${UI.borderVisible}`, borderRadius: 4,
  padding: "7px 10px", color: UI.secondary, fontFamily: UI.mono, fontWeight: 700,
  fontSize: 11, letterSpacing: "0.08em", cursor: "pointer" }
```
Primary/destructive variant: solid `UI.accent` bg with `UI.black` text. Active toggle state: `UI.display` bg with `UI.black` text. Sanctioned exception: the KEEP AWAKE wake-lock toggle uses `UI.warning` bg when active — the amber is a deliberate caution cue (screen stays on, battery drains), not the standard toggle-active state; don't copy it for ordinary toggles.

### Inline confirm pattern
Destructive actions (END PHASE, EDIT LOG) never use `window.confirm`. First tap swaps the label to `TAP AGAIN TO CONFIRM` with `UI.warning` background, auto-reverting after 3s; second tap executes.

### Week tabs
Active: `color: UI.display`, `borderBottom: 1px solid ${UI.accent}`. Inactive: `color: UI.disabled`, transparent border. `aria-pressed` reflects the active tab.

### Sync/import button states
Defined as state→style maps (`syncStyles`, `importStyles`) with labels like SYNC CLOUD / SYNCING / SAVED CLOUD / NO DATA / NOT LOGGED IN / SYNC ERROR. Errors use `rgba(215,25,33,0.15)` bg + `UI.accent`. Error detail text renders below the buttons in `UI.secondary` inside an `aria-live="polite"` region.

---

## Motion & Interaction
- Standard transition token: `UI.ease` = `all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)`
- One keyframe animation: `slideUp` (session summary bottom sheet)
- `@media (prefers-reduced-motion: reduce)` disables all animation/transitions — keep this rule intact
- Focus: global `button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` — do not add `outline: none` to interactive elements
- Tap targets minimum ~36px height

---

## Accessibility conventions
- Icon-only buttons (★/☆ favourite, ✕ dismiss) carry `aria-label`
- Toggle buttons (type toggle, week tabs, favourite) carry `aria-pressed`
- Decorative elements (section color dots) carry `aria-hidden="true"`
- Collapsible section headers carry `aria-expanded`
- Status text that changes asynchronously (sync errors, loading) lives in an `aria-live="polite"` container

---

## Anti-patterns
- ❌ No gradients (single exception: the body dot-grid `radial-gradient` texture)
- ❌ No box/drop shadows at all
- ❌ No light theme — dark only
- ❌ Never use font sizes below 8px (9–11px is the standard label range)
- ❌ No emoji in UI. Plain unicode glyphs are fine and in use: ★ ☆ ✕ ↑ ↓ ← → ▲ ▼
- ❌ Never hardcode a new hex — use `UI.*` tokens or `SECTION_COLORS`; if a new color is genuinely needed, add it to both the `UI` object and `:root`, and document it here
