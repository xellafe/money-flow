---
phase: 4
phase_name: Dashboard Redesign
status: draft
created: 2026-03-18
design_system: Tailwind v4 (no shadcn) — @theme CSS variables in src/index.css
---

# UI-SPEC — Phase 4: Dashboard Redesign

> **Answer to:** "What visual and interaction contracts does this phase need?"
> **Consumed by:** gsd-planner, gsd-executor, gsd-ui-checker, gsd-ui-auditor

---

## 1. Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | Tailwind v4 via `@tailwindcss/vite` | RESEARCH.md — locked decision |
| Component library | Radix UI primitives + Tailwind directly | STATE.md — no shadcn |
| Animation library | Framer Motion (installed) | STATE.md |
| Chart library | Recharts — `AreaChart`, `PieChart` (donut via `innerRadius`) | CONTEXT.md |
| Icon library | Lucide React | Existing codebase |
| Font | Inter Variable (Fontsource local bundle) | src/index.css |
| Design inspiration | Notion/Apple — light, clean, minimal | STATE.md |
| Dark mode | Out of scope for v1 | REQUIREMENTS.md |

---

## 2. Spacing Scale

8-point grid. All spacing values must be multiples of 4px.

| Token | px | Tailwind class | Usage |
|-------|----|---------------|-------|
| xs | 4px | `p-1` / `gap-1` | Icon internal padding |
| sm | 8px | `p-2` / `gap-2` | Tight inline gaps |
| md | 16px | `p-4` / `gap-4` | Between stat cards, chart inner sections |
| lg | 24px | `p-6` / `gap-6` | Card internal padding |
| xl | 32px | `p-8` / `gap-8` | Between major layout sections (stat row → chart row) |
| 2xl | 48px | `p-12` | Reserved — not used in this phase |
| 3xl | 64px | `p-16` | Reserved — not used in this phase |

**Phase-specific layout measurements:**
- Dashboard page padding: `p-6` (24px) top/sides, `pb-8` (32px) bottom
- Stat cards grid gap: `gap-4` (16px)
- Stat card → AreaChart gap: `mt-6` (24px)
- AreaChart → Donut row gap: `mt-6` (24px)
- AppHeader period selector internal gap: `gap-2` (8px) between arrows and label
- Period arrow touch target: minimum `w-8 h-8` (32px) — Electron desktop, no mobile concern
- Donut chart right column width: `max-w-sm` (384px) or `w-96`

---

## 3. Typography

**Font family:** `Inter Variable` — set globally in `html { font-family: var(--font-sans) }`.

### Sizes (4 declared)

| Size | px | Line-height | Usage |
|------|----|-------------|-------|
| `text-xs` | 12px | 1.5 (auto) | Chart axis tick labels, % change badge |
| `text-sm` | 14px | 1.5 | Stat card label ("Entrate"), period selector "Tutti" button, chart tooltip text |
| `text-2xl` | 24px | 1.2 | Stat card primary amount |
| `text-3xl` | 30px | 1.2 | Donut center total value |

### Weights (2 declared)

| Weight | Class | Usage |
|--------|-------|-------|
| 400 — Regular | `font-normal` | Axis labels, % change text, secondary labels |
| 600 — Semibold | `font-semibold` | Stat card amount, stat card label, period label ("Gennaio 2025"), donut center value |

### Mono
Not required in this phase — no code or data-table columns.

---

## 4. Color Contract

### 60 / 30 / 10 Split

| Role | Color | Token | Hex | Applied To |
|------|-------|-------|-----|------------|
| **60% Dominant** | Page background | `bg-gray-50` | `#f9fafb` | `DashboardView` root, all page surfaces |
| **60% Dominant** | Card surface | `bg-white` | `#ffffff` | All `.card` and stat card backgrounds |
| **30% Secondary** | Skeleton base | `bg-gray-100` | `#f3f4f6` | Skeleton loading placeholder base color |
| **30% Secondary** | Borders | `border-gray-200` | `#e5e7eb` | Card borders, AppHeader bottom border, chart separators |
| **30% Secondary** | Muted text | `text-gray-500` | `#6b7280` | Stat card labels, axis labels, secondary copy |
| **10% Accent** | Interactive primary | `bg-brand-500` / `text-brand-500` | `#3b82f6` | "Tutti" active button fill; focus rings on period arrows |

### Semantic Colors (this phase only)

| Color | Token | Hex | Reserved Exclusively For |
|-------|-------|-----|--------------------------|
| Income green | `text-income-500` / `bg-income-50` | `#059669` / `#ecfdf5` | Income stat card amount text + tint background |
| Expense rose | `text-expense-500` / `bg-expense-50` | `#f43f5e` / `#fff1f2` | Expense stat card amount text + tint background |
| Income border | `border-income-500` | `#059669` | Income stat card left accent border (4px) |
| Expense border | `border-expense-500` | `#f43f5e` | Expense stat card left accent border (4px) |

### Chart Color Palette (10 discrete categories)

> ⚠️ **Recharts Color Resolution Strategy** — Recharts `fill`/`stroke` props require actual hex strings, not CSS `var()` strings. Use the following mandatory approach:

**Step 1:** Add 10 chart color tokens to `src/index.css` `@theme` block:
```css
@theme {
  /* Chart category colors (10 discrete) */
  --color-chart-01: #3b82f6;
  --color-chart-02: #10b981;
  --color-chart-03: #f59e0b;
  --color-chart-04: #ef4444;
  --color-chart-05: #8b5cf6;
  --color-chart-06: #ec4899;
  --color-chart-07: #06b6d4;
  --color-chart-08: #84cc16;
  --color-chart-09: #f97316;
  --color-chart-10: #6366f1;
}
```

**Step 2:** Create `src/utils/chartColors.js`:
```js
const CHART_VAR_NAMES = [
  '--color-chart-01', '--color-chart-02', '--color-chart-03',
  '--color-chart-04', '--color-chart-05', '--color-chart-06',
  '--color-chart-07', '--color-chart-08', '--color-chart-09',
  '--color-chart-10',
];

/** Reads chart color tokens from CSS at runtime. Call once per component mount. */
export function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  return CHART_VAR_NAMES.map(v => style.getPropertyValue(v).trim());
}
```

**Step 3:** Replace `COLORS` export in `src/constants/index.js` with:
```js
export { getChartColors as COLORS_FN }; // new pattern — see chartColors.js
// Keep old COLORS array for backward compat with non-chart consumers only:
export const COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'
];
```

**Step 4:** In chart components, call `getChartColors()` inside `useMemo(() => getChartColors(), [])`.

**Area chart specific colors:**
- Income area: stroke `income-500` (`#059669`), fill gradient income-50 → transparent
- Expenses area: stroke `expense-500` (`#f43f5e`), fill gradient expense-50 → transparent

---

## 5. Component Inventory

All new components for this phase. Existing `StatCard.jsx` is **replaced** by `DashboardStatCard.jsx` (old component preserved for later views if needed).

### 5.1 `DashboardView.jsx`
**Path:** `src/views/DashboardView.jsx`
**Role:** Root layout container for the dashboard — composes all sub-components.
**Props:** `{ stats, isLoading, selectedMonth, selectedYear, dashboardCategoryFilter, onCategoryFilterChange }`
**Layout:** Vertical flex column; padding `p-6`; gap `gap-6` between rows.

```
┌─────────────────────────────────────────────────────┐
│  [IncomeStatCard]        [ExpenseStatCard]           │  ← grid grid-cols-2 gap-4
├─────────────────────────────────────────────────────┤
│  [AreaChartCard — full width]                       │  ← mt-6
├─────────────────────────────────────────────────────┤
│  [spacer flex-1]          [DonutChartCard — w-96]   │  ← mt-6 flex items-start gap-6
└─────────────────────────────────────────────────────┘
```

### 5.2 `DashboardStatCard.jsx`
**Path:** `src/components/dashboard/DashboardStatCard.jsx`
**Role:** Displays a single financial KPI (Income or Expenses) with tint and % change.
**Props:** `{ type: 'income'|'expense', amount, percentChange, isLoading }`

**Visual spec:**
- Container: `bg-white rounded-xl border border-gray-200 shadow-sm p-6`
- Left accent border: `border-l-4 border-income-500` (Income) / `border-l-4 border-expense-500` (Expense)
- Background tint on hover: `hover:bg-income-50` (Income) / `hover:bg-expense-50` (Expense)
- Icon row: Lucide `TrendingUp` (green, size 18) / `TrendingDown` (rose, size 18) + label
- Label: `text-sm font-semibold text-gray-500` — "Entrate" / "Uscite"
- Amount: `text-2xl font-semibold text-income-500` / `text-expense-500` — formatted with `formatCurrency()`
- % change badge: `text-xs font-normal text-gray-500` — "+12% vs periodo precedente" (positive green) / "-8% vs periodo precedente" (negative rose)
- Hover: `hover:shadow-md hover:-translate-y-px transition-all duration-150`
- Skeleton: when `isLoading=true`, render skeleton variant (see §7)

### 5.3 `PeriodSelector` (inline in `AppHeader.jsx`)
**Path:** Inline addition to `src/components/layout/AppHeader.jsx`
**Role:** Month/year navigation — visible only when `view === 'dashboard'`.
**Props passed through:** `{ selectedMonth, selectedYear, onPrevMonth, onNextMonth, onClearPeriod }`

**Visual spec:**
- Container: `flex items-center gap-2` — positioned in AppHeader between title and right-side actions
- Prev arrow: `<button>` with `ChevronLeft` icon (size 16), `p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer` + `aria-label="Mese precedente"`
- Label: `text-sm font-semibold text-gray-700 min-w-[120px] text-center` — shows "Gennaio 2025" when month selected; shows nothing (hidden) when "Tutti" active
- Next arrow: same as prev but `ChevronRight`, `aria-label="Mese successivo"`
- "Tutti" button: 
  - Active (no month): `px-3 py-1 rounded-md text-sm font-semibold bg-brand-500 text-white cursor-pointer`
  - Inactive (month selected): `px-3 py-1 rounded-md text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-150`
- Month label format: Italian month names — `['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'][selectedMonth - 1] + ' ' + selectedYear`

### 5.4 `AreaChartCard.jsx`
**Path:** `src/components/dashboard/AreaChartCard.jsx`
**Role:** Full-width trend chart — Income vs Expenses over 12 months of selected year.
**Props:** `{ monthlyData, isLoading, selectedYear }`

**Visual spec:**
- Container: `bg-white rounded-xl border border-gray-200 shadow-sm p-6`
- Title: `text-sm font-semibold text-gray-700` — "Andamento {selectedYear}"
- Chart height: `300px` (fixed, no responsive — Electron desktop only)
- Chart: `<ResponsiveContainer width="100%" height={300}>`
- Income area: `stroke="#059669"` (income-500 resolved via `getChartColors` or hardcoded semantic), `fill` gradient ID `incomeGradient` — income-50 at 30% opacity top → transparent bottom
- Expense area: `stroke="#f43f5e"` (expense-500), `fill` gradient ID `expenseGradient` — expense-50 at 30% opacity → transparent
- Axes: `text-xs` font-size via `tick={{ fontSize: 12, fill: '#6b7280' }}` — gray-500
- Tooltip: custom `<CustomTooltip>` — white card, `shadow-md rounded-lg p-3`, shows month name + income + expense formatted
- Legend: `<Legend>` at bottom — "Entrate" (income-500 dot) / "Uscite" (expense-500 dot)
- Grid: `<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"` (gray-200)
- Skeleton: when `isLoading=true`, render `SkeletonChart` placeholder (see §7)
- Empty state: when all monthlyData income+expense = 0, show centered text "Nessun dato per questo periodo" in `text-sm text-gray-400`

### 5.5 `DonutChartCard.jsx`
**Path:** `src/components/dashboard/DonutChartCard.jsx`
**Role:** Category breakdown donut + center metric + cross-filter trigger.
**Props:** `{ categoryData, selectedCategory, onCategorySelect, isLoading }`
  - `selectedCategory: string|null` — category name or null for "all"
  - `onCategorySelect(categoryName: string|null)` — null to deselect

**Visual spec:**
- Container: `bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full max-w-sm`
- Title: `text-sm font-semibold text-gray-700` — "Spese per categoria"
- Chart height: `240px`
- Donut: `<PieChart>` with `<Pie innerRadius={70} outerRadius={100} paddingAngle={2}>`
- Segment colors: `getChartColors()` cycled via index
- Selected segment: `stroke="#1f2937"` (gray-900) `strokeWidth={2}` — ring highlight; non-selected segments get `opacity={0.5}`
- Hover: `opacity` transitions to 0.8 on hover, `cursor-pointer`
- Deselect: clicking the active segment again OR clicking the donut center → calls `onCategorySelect(null)`
- Center text (custom SVG label via `<Label>` or absolute-positioned div overlay):
  - Line 1: `text-3xl font-semibold text-gray-800` — `formatCurrency(centerAmount)`
  - Line 2: `text-xs font-normal text-gray-500` — category name (truncated to 16 chars) OR "Totale uscite" when nothing selected
- Tooltip: `<Tooltip>` custom — shows category name + formatted amount + count of transactions
- No legend (chart is self-labeled via tooltips + center)
- Skeleton: when `isLoading=true`, render `SkeletonChart` placeholder
- Empty state: when `categoryData.length === 0`, show centered: icon `PieChart` (Lucide, size 32, gray-300) + "Nessuna spesa per questo periodo" (`text-sm text-gray-400`)

### 5.6 `SkeletonStatCard.jsx`
**Path:** `src/components/dashboard/SkeletonStatCard.jsx`
**Role:** Shimmer placeholder for a stat card during load.

**Visual spec:**
- Same outer dimensions as `DashboardStatCard` — `rounded-xl border border-gray-200 p-6`
- Label placeholder: `h-3 w-20 rounded bg-gray-200 animate-pulse`
- Amount placeholder: `h-7 w-32 rounded bg-gray-200 animate-pulse mt-3`
- % badge placeholder: `h-3 w-24 rounded bg-gray-200 animate-pulse mt-2`
- Left border: `border-l-4 border-gray-200` (neutral — no semantic color during skeleton)
- Animation: Tailwind `animate-pulse` (Tailwind v4 built-in: opacity 0.5 → 1 at 2s ease-in-out)

### 5.7 `SkeletonChart.jsx`
**Path:** `src/components/dashboard/SkeletonChart.jsx`
**Role:** Shimmer placeholder for chart containers during load.
**Props:** `{ height?: number }` (defaults to 300 for area, 240 for donut)

**Visual spec:**
- Container: full width of parent, `height={height}px`
- Single rounded rectangle: `rounded-lg bg-gray-200 animate-pulse w-full h-full`
- No internal structure (pure shimmer block)

---

## 6. Interaction Contracts

### 6.1 Period Selector Interactions

| Interaction | Target | Behavior | Duration |
|-------------|--------|----------|----------|
| Click prev arrow | `ChevronLeft` button | Decrement month (wrap Dec→Jan, decrement year); triggers skeleton on stat cards + charts | immediate |
| Click next arrow | `ChevronRight` button | Increment month (wrap Jan→Dec, increment year); triggers skeleton | immediate |
| Click "Tutti" (inactive) | "Tutti" button | Sets `selectedMonth=null, selectedYear=null`; clears all period filters | immediate |
| Click "Tutti" (active) | "Tutti" button | No-op (already active) | — |
| Hover arrow | Arrow button | `bg-gray-100 text-gray-700` transition 150ms | 150ms |

### 6.2 Donut Chart Interactions

| Interaction | Target | Behavior | Duration |
|-------------|--------|----------|----------|
| Hover segment | Pie segment | Opacity 0.8, cursor-pointer, show tooltip | 100ms |
| Click segment (unselected) | Pie segment | `onCategorySelect(name)` — highlights segment, dims others, updates center text, dispatches `setDashboardCategoryFilter([name])` | immediate |
| Click segment (selected) | Pie segment | `onCategorySelect(null)` — clears filter, restores all opacities, resets center to total | immediate |
| Click center area | SVG center | `onCategorySelect(null)` if a category is selected | immediate |
| Keyboard Enter on segment | Pie segment | Same as click (add `tabIndex={0}` + `onKeyDown` handler for Enter/Space) | immediate |

### 6.3 Stat Card Interactions

| Interaction | Target | Behavior | Duration |
|-------------|--------|----------|----------|
| Hover | Card container | `shadow-md -translate-y-px` | 150ms |
| No click interaction | — | Stat cards are display-only in Phase 4 | — |

### 6.4 Area Chart Interactions

| Interaction | Target | Behavior | Duration |
|-------------|--------|----------|----------|
| Hover data point | Chart area | Recharts default tooltip visible, crosshair line shown | immediate (Recharts built-in) |
| No click interaction | — | AreaChart is display-only in Phase 4 | — |

### 6.5 Skeleton Loading Trigger

- **Mount:** `DashboardView` shows skeleton for stat cards + charts on first render while `stats` computes.
- **Period change:** When `selectedMonth` or `selectedYear` changes, set local `isLoading=true` for **minimum 300ms** (prevent flash for instant computations), then `false`.
- **Minimum display:** Use `setTimeout(300ms)` to ensure skeleton is visible — prevents jarring flicker on fast hardware.
- Implementation pattern: `const [isLoading, setIsLoading] = useState(true)` + `useEffect([selectedMonth, selectedYear])` resets to true then uses setTimeout to set false.

---

## 7. Copywriting Contract

### Labels

| Element | Text | Notes |
|---------|------|-------|
| Income stat card label | `Entrate` | Semibold, gray-500 |
| Expense stat card label | `Uscite` | Semibold, gray-500 |
| % change — positive | `+{n}% vs periodo precedente` | xs, gray-500 |
| % change — negative | `{n}% vs periodo precedente` (negative includes sign) | xs, gray-500 |
| % change — no previous data | `Nessun confronto disponibile` | xs, gray-400 |
| Period label | `Gennaio 2025` (Italian month + year) | sm, semibold, gray-700 |
| "All" button | `Tutti` | sm, semibold |
| Area chart title | `Andamento {selectedYear}` | sm, semibold, gray-700 |
| Donut chart title | `Spese per categoria` | sm, semibold, gray-700 |
| Donut center — no selection | `Totale uscite` (below amount) | xs, gray-500 |
| Donut center — category selected | `{categoryName}` truncated to 16 chars (below amount) | xs, gray-500 |

### Empty States

| State | Heading | Sub-copy | CTA |
|-------|---------|----------|-----|
| No transactions at all | — (handled at App level, not Dashboard) | — | — |
| Selected period has no data (area chart) | _no heading_ | `Nessun dato per questo periodo` | — |
| Selected period has no expenses (donut) | _no heading_ | `Nessuna spesa per questo periodo` | — |
| Selected period has no income | Stat card shows `€0,00` | % change row hidden | — |

> Note: Global "no transactions" empty state (icon + "Importa transazioni" CTA) is a Phase 7 UX Polish concern, not Phase 4.

### Destructive Actions

None in this phase. Period selection and category filter are reversible with no confirmation required.

---

## 8. Accessibility Contract

| Element | Requirement |
|---------|-------------|
| Period prev/next arrows | `aria-label="Mese precedente"` / `aria-label="Mese successivo"` |
| "Tutti" button | `aria-pressed="true/false"` to reflect active state |
| Skeleton cards | `aria-busy="true"` on container; `aria-label="Caricamento statistiche"` |
| Skeleton charts | `aria-hidden="true"` (decorative placeholder) |
| AreaChart SVG | `aria-label="Grafico andamento entrate e uscite {year}"` on `<ResponsiveContainer>` wrapper |
| DonutChart SVG | `aria-label="Grafico spese per categoria"` on wrapper |
| Donut segments | `role="button"` + `tabIndex={0}` + `aria-label="{categoryName}: {formattedAmount}"` |
| Donut selected segment | `aria-pressed="true"` on selected segment |
| Color independence | Category names always appear in tooltip — color is never the sole identifier |
| Focus ring | `focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2` on all interactive elements |

---

## 9. Animation Contract (Framer Motion)

| Element | Animation | Spec |
|---------|-----------|------|
| DashboardView mount | `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` | duration 200ms, ease "easeOut" |
| Stat cards mount | Stagger children: `staggerChildren: 0.05` | Each card: `initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}`, 150ms |
| Skeleton → content transition | Animate out skeleton with `exit={{ opacity: 0 }}` via `AnimatePresence` | 150ms fade |
| Period selector label change | `key={selectedMonth + selectedYear}` on label element — React remount triggers Framer re-animation | `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`, 100ms |
| Donut segment selection | CSS transition on Recharts SVG `opacity` — **not** Framer Motion (Recharts manages SVG) | 100ms CSS transition |

> Note: Page-level view transition (fade 150ms) is already handled by Phase 3's `AppLayout`. Dashboard mounts inside that wrapper — only internal elements need their own Framer animations.

---

## 10. Layout Grid

```
AppLayout (flex h-screen)
├── Sidebar (240px | 64px collapsed)
└── main (flex-1 flex-col overflow-hidden)
    ├── AppHeader (h-14, shrink-0)
    │   ├── "Dashboard" title (h1, text-lg font-semibold)
    │   ├── PeriodSelector (flex gap-2) ← NEW in this phase
    │   └── [no right-side CTA for dashboard view]
    └── DashboardView (flex-1 overflow-y-auto p-6)
        ├── Row 1: grid grid-cols-2 gap-4
        │   ├── DashboardStatCard (type=income)
        │   └── DashboardStatCard (type=expense)
        ├── Row 2: mt-6 w-full
        │   └── AreaChartCard (full width)
        └── Row 3: mt-6 flex justify-end
            └── DonutChartCard (max-w-sm)
```

---

## 11. Recharts Resize Workaround

> From STATE.md known risk: "Recharts doesn't redraw on Electron window resize"

**Mandatory pattern for both chart components:**
```jsx
const [chartKey, setChartKey] = useState(0);
useEffect(() => {
  const handleResize = debounce(() => setChartKey(k => k + 1), 200);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
// Use: <ResponsiveContainer key={chartKey} ...>
```
Force remount via `key` change on debounced resize. Debounce: 200ms.

---

## 12. File Map (New Files This Phase)

| File | Type | Action |
|------|------|--------|
| `src/views/DashboardView.jsx` | React component | CREATE |
| `src/components/dashboard/DashboardStatCard.jsx` | React component | CREATE |
| `src/components/dashboard/AreaChartCard.jsx` | React component | CREATE |
| `src/components/dashboard/DonutChartCard.jsx` | React component | CREATE |
| `src/components/dashboard/SkeletonStatCard.jsx` | React component | CREATE |
| `src/components/dashboard/SkeletonChart.jsx` | React component | CREATE |
| `src/utils/chartColors.js` | Utility | CREATE |
| `src/index.css` | Design tokens | MODIFY — add `--color-chart-01..10` to `@theme` |
| `src/components/layout/AppHeader.jsx` | Layout component | MODIFY — add `PeriodSelector` inline |
| `src/App.jsx` | Orchestration | MODIFY — wire `DashboardView`, pass stats + filter props |

---

## 13. Pre-Population Audit

| Decision | Source | Pre-populated? |
|----------|--------|----------------|
| 2 stat cards (Income + Expenses), no Balance | CONTEXT.md | ✅ |
| Green tint Income / Red tint Expense | CONTEXT.md | ✅ |
| AreaChart full-width top, Donut below right | CONTEXT.md | ✅ |
| Period selector in AppHeader | CONTEXT.md | ✅ |
| Skeleton shimmer on stat cards + charts | CONTEXT.md | ✅ |
| Donut click → dashboardCategoryFilter | CONTEXT.md | ✅ |
| Donut center = selected category total or overall | CONTEXT.md | ✅ |
| No shadcn — Tailwind + Radix directly | STATE.md | ✅ |
| Framer Motion installed | STATE.md | ✅ |
| Recharts resize risk + workaround | STATE.md | ✅ |
| CSS var tokens: income/expense/brand palette | src/index.css | ✅ |
| COLORS array in constants must migrate to CSS vars | CONTEXT.md | ✅ (§4 chart colors) |
| Italian locale (labels, month names) | CONTEXT.md + codebase | ✅ |
| Dark mode out of scope | REQUIREMENTS.md | ✅ |
| 8-point spacing scale | Default — Tailwind standard | ✅ |
| Inter Variable font | src/index.css | ✅ |
| 150ms hover transitions | REQUIREMENTS.md UX-01 | ✅ |

---

*UI-SPEC drafted: 2026-03-18*
*Status: draft — awaiting gsd-ui-checker validation*
