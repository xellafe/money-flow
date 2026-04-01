# Phase 4: Dashboard Redesign - Research

**Researched:** 2026-03-18
**Domain:** React dashboard UI — Recharts, Framer Motion, Tailwind v4 CSS variables, skeleton loading
**Confidence:** HIGH (all findings verified against live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Stat Cards — Count:** 2 cards — Income and Expenses only (NO Balance card)
  > Overrides REQUIREMENTS.md DASH-01 which says "tre stat cards" — 2 cards is the authoritative decision
- **Stat Cards — Content:** Primary amount for selected period + % change vs previous period
- **Stat Cards — Layout:** Full-width horizontal, 2 cards side by side (equal width)
- **Stat Cards — Color:** Green tint for Income (`--color-income-500`), red tint for Expenses (`--color-expense-500`)
- **Charts — Selection:** AreaChart (trend) + Donut chart (category breakdown) — remove all other charts
- **Charts — Layout:** AreaChart full-width on top, Donut chart below aligned to the right
- **Cross-filtering:** Click on donut segment filters transactions via `dashboardCategoryFilter` in `useFilters`
- **Donut center text:** Shows total of selected category, or overall total when nothing selected
- **Period Selector — Location:** AppHeader — visible from every view context but only shown for dashboard view
- **Period Selector — Navigation:** Prev/Next month arrows with center label (e.g., "Gennaio 2025")
- **Period Selector — "All":** "Tutti" button clears month filter and shows all-time data (null/null)
- **Period Selector — State:** Uses `selectedMonth` / `selectedYear` from `useFilters`; null/null = "Tutti"
- **Skeleton — Style:** Shimmer pulse (animated gradient wave via `animate-pulse`)
- **Skeleton — Elements:** Stat cards + charts ONLY (NOT transaction list)
- **Skeleton — Trigger:** Show on component mount OR period change

### Claude's Discretion
_(No discretion areas specified — all decisions locked)_

### Deferred Ideas (OUT OF SCOPE)
- Balance card (Phase 5 enhancement)
- Budget progress bars in stat cards
- Quarter/Year granularity toggle
- BarChart drill-down
- Skeleton for transaction list
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Stat cards — 2 cards: Income + Expenses (user overrides spec's "tre") | `DashboardStatCard.jsx` with type='income'\|'expense'; stats.income + stats.expenses from useMemo |
| DASH-02 | Cards with semantic color (income green, expense red) | `--color-income-500`/`--color-expense-500` in @theme; `bg-income-50`, `border-income-500`, `text-income-500` are valid Tailwind v4 utilities |
| DASH-03 | Recharts charts themed with Tailwind CSS variables (no hardcoded hex) | `getChartColors()` utility via `getComputedStyle`; semantic stroke colors via resolved CSS vars |
| DASH-04 | Donut/pie chart for category breakdown with center metric | `<PieChart><Pie innerRadius={70}>` + absolute-positioned center overlay div |
| DASH-05 | Area/bar chart for monthly income vs expenses trend | `<AreaChart>` with `monthlyData` from stats useMemo (already has Entrate/Uscite per month) |
| DASH-06 | Period selector (month/year) — in AppHeader | Inline `PeriodSelector` in AppHeader; requires threading props through AppLayout |
| DASH-07 | Cross-filtering: click category in chart → filters transaction list | `onCategorySelect` calls `setDashboardCategoryFilter([name])` / `setDashboardCategoryFilter([])` |
| DASH-08 | Skeleton loading cards during app initialization | `useState(true)` isLoading + `useEffect` with 300ms setTimeout; `AnimatePresence` for fade-out |
</phase_requirements>

---

## Summary

Phase 4 redesigns the dashboard using components already wired in the existing codebase (Recharts, Framer Motion, Tailwind v4 CSS variables). The architecture is clear: create a `DashboardView` that composes stat cards, an area chart, and a donut chart — all fed by the existing `stats` useMemo in `App.jsx`. All data plumbing already exists; the work is entirely UI component creation + minor wiring in App.jsx/AppLayout/AppHeader.

The most significant technical challenge is the Recharts + CSS variable incompatibility: `fill`/`stroke` props must receive resolved hex values, not `var(--...)` strings. The solution is a `getChartColors()` utility that calls `getComputedStyle(document.documentElement)` once at component mount inside `useMemo`. This approach is confirmed by the existing `@theme` setup in `src/index.css` where CSS custom properties ARE accessible via `getComputedStyle`.

Three modifications to existing files are required beyond new component creation: (1) `src/index.css` — add `--color-chart-01..10` tokens, (2) `AppLayout.jsx` — thread period selector props to `AppHeader`, (3) `App.jsx` — wire `DashboardView` and fix the stats useMemo for null-year "Tutti" mode.

**Primary recommendation:** Create all dashboard components in `src/components/dashboard/` and `src/views/DashboardView.jsx`, then wire through AppLayout/App.jsx. The chart color and skeleton patterns are fully specified in the UI-SPEC — implement exactly as specified.

---

## Standard Stack

### Core (all already installed — no npm install needed for this phase)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| recharts | 3.7.0 | AreaChart + PieChart (donut) | `PieChart`, `Pie`, `Cell`, `Area`, `AreaChart`, `ResponsiveContainer`, `Tooltip`, `Legend`, `CartesianGrid`, `XAxis`, `YAxis` |
| framer-motion | 12.38.0 | AnimatePresence skeleton fade-out + mount animations | Already installed; `motion.div`, `AnimatePresence` |
| lucide-react | 0.563.0 | Icons: TrendingUp, TrendingDown, ChevronLeft, ChevronRight, PieChart | Already installed |
| tailwindcss | 4.2.1 | Utility classes — `animate-pulse`, `bg-income-50`, `border-income-500`, etc. | All color tokens in `@theme` |
| react | 19.2.0 | useState, useEffect, useMemo, useCallback | Already installed |

**No new dependencies required for this phase.** All libraries are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── views/
│   └── DashboardView.jsx          # Root layout — composes all dashboard sub-components
├── components/
│   └── dashboard/                 # NEW directory
│       ├── DashboardStatCard.jsx  # Income/Expense KPI card
│       ├── AreaChartCard.jsx      # Income vs Expenses trend chart
│       ├── DonutChartCard.jsx     # Category breakdown donut + cross-filter
│       ├── SkeletonStatCard.jsx   # Shimmer placeholder for stat cards
│       └── SkeletonChart.jsx      # Shimmer placeholder for charts
└── utils/
    └── chartColors.js             # getChartColors() — resolves CSS vars for Recharts
```

### Pattern 1: Recharts CSS Variable Resolution

**What:** Recharts `fill`/`stroke` props reject `var(--color-chart-01)` strings — they need actual hex values.

**Solution:** `getComputedStyle` read at component mount in `useMemo`.

```jsx
// src/utils/chartColors.js
const CHART_VAR_NAMES = [
  '--color-chart-01', '--color-chart-02', '--color-chart-03',
  '--color-chart-04', '--color-chart-05', '--color-chart-06',
  '--color-chart-07', '--color-chart-08', '--color-chart-09',
  '--color-chart-10',
];

export function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  return CHART_VAR_NAMES.map(v => style.getPropertyValue(v).trim());
}
```

```jsx
// Inside DonutChartCard.jsx
const chartColors = useMemo(() => getChartColors(), []); // run once at mount
// Use: <Cell fill={chartColors[index % chartColors.length]} />
```

**For semantic stroke colors (AreaChart):**
```jsx
// Hardcode resolved values from @theme tokens — these won't change without a design decision
const INCOME_COLOR = '#059669';  // --color-income-500
const EXPENSE_COLOR = '#f43f5e'; // --color-expense-500
// OR resolve via getComputedStyle:
const semanticColors = useMemo(() => ({
  income: getComputedStyle(document.documentElement).getPropertyValue('--color-income-500').trim(),
  expense: getComputedStyle(document.documentElement).getPropertyValue('--color-expense-500').trim(),
}), []);
```

**Confidence: HIGH** — Verified against Tailwind v4 `@theme` setup in `src/index.css`. CSS custom properties are set at `:root` level and are readable via `getComputedStyle(document.documentElement)`.

### Pattern 2: Recharts Resize Workaround (Electron)

**What:** Recharts `ResponsiveContainer` doesn't redraw on Electron window resize without intervention.

**Solution:** Force remount via `key` change on debounced resize event.

```jsx
// In AreaChartCard.jsx and DonutChartCard.jsx
const [chartKey, setChartKey] = useState(0);
useEffect(() => {
  let timeout;
  const handleResize = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => setChartKey(k => k + 1), 200);
  };
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(timeout);
  };
}, []);

// Usage:
<ResponsiveContainer key={chartKey} width="100%" height={300}>
```

**Confidence: HIGH** — Pattern documented in STATE.md as known risk mitigation for Phase 4.

### Pattern 3: Skeleton Loading with AnimatePresence

**What:** Show shimmer skeletons during load, then fade to content.

```jsx
// DashboardView.jsx — triggers on mount and period change
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  setIsLoading(true);
  const timer = setTimeout(() => setIsLoading(false), 300);
  return () => clearTimeout(timer);
}, [selectedMonth, selectedYear]);

// Component render:
<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <SkeletonStatCard />
    </motion.div>
  ) : (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <DashboardStatCard ... />
    </motion.div>
  )}
</AnimatePresence>
```

**Note:** `AnimatePresence mode="wait"` ensures exit animation completes before entering new content. This is the correct mode for skeleton-to-content transitions.

**Confidence: HIGH** — Framer Motion 12.x `AnimatePresence` API unchanged from v10+.

### Pattern 4: Period Selector Navigation (0-indexed months)

**⚠️ Critical:** `selectedMonth` in `useFilters` is **0-indexed** (0=January, 11=December), matching JavaScript's `getMonth()`. The UI-SPEC §5.3 has a bug: `MONTHS_IT[selectedMonth - 1]` is wrong — use `MONTHS_IT[selectedMonth]` instead.

```jsx
// Period navigation handlers — built in DashboardView, passed to AppHeader
const handlePrevMonth = useCallback(() => {
  if (selectedMonth === null || selectedYear === null) {
    // In "Tutti" mode — initialize to current year, December
    const currentYear = new Date().getFullYear();
    setSelectedYear(currentYear);
    setSelectedMonth(11); // December
    return;
  }
  if (selectedMonth === 0) {
    setSelectedYear(y => y - 1);
    setSelectedMonth(11); // December
  } else {
    setSelectedMonth(m => m - 1);
  }
}, [selectedMonth, selectedYear, setSelectedMonth, setSelectedYear]);

const handleNextMonth = useCallback(() => {
  if (selectedMonth === null || selectedYear === null) {
    // In "Tutti" mode — initialize to current year, January
    const currentYear = new Date().getFullYear();
    setSelectedYear(currentYear);
    setSelectedMonth(0); // January
    return;
  }
  if (selectedMonth === 11) {
    setSelectedYear(y => y + 1);
    setSelectedMonth(0); // January
  } else {
    setSelectedMonth(m => m + 1);
  }
}, [selectedMonth, selectedYear, setSelectedMonth, setSelectedYear]);

const handleClearPeriod = useCallback(() => {
  setSelectedMonth(null);
  setSelectedYear(null);
}, [setSelectedMonth, setSelectedYear]);
```

**Period label** (use `MONTHS_IT` from `src/constants/index.js`):
```jsx
import { MONTHS_IT } from '../../constants';
// In PeriodSelector:
const label = selectedMonth !== null && selectedYear !== null
  ? `${MONTHS_IT[selectedMonth]} ${selectedYear}`
  : null; // hidden when Tutti is active
```

### Pattern 5: Donut Center Text (Absolute Overlay)

Recharts `<Label>` inside `<Pie>` has layout quirks. Use a positioned `div` overlay on the chart container instead:

```jsx
// DonutChartCard.jsx
<div className="relative">
  <PieChart width={240} height={240}>
    <Pie
      data={categoryData}
      cx={120}
      cy={120}
      innerRadius={70}
      outerRadius={100}
      paddingAngle={2}
      dataKey="value"
      onClick={(entry) => onCategorySelect(
        selectedCategory === entry.name ? null : entry.name
      )}
    >
      {categoryData.map((entry, i) => (
        <Cell
          key={entry.name}
          fill={chartColors[i % chartColors.length]}
          opacity={selectedCategory && selectedCategory !== entry.name ? 0.5 : 1}
          stroke={selectedCategory === entry.name ? '#1f2937' : 'none'}
          strokeWidth={selectedCategory === entry.name ? 2 : 0}
          style={{ cursor: 'pointer', transition: 'opacity 100ms' }}
          role="button"
          tabIndex={0}
          aria-label={`${entry.name}: ${formatCurrency(entry.value)}`}
          aria-pressed={selectedCategory === entry.name}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onCategorySelect(selectedCategory === entry.name ? null : entry.name);
            }
          }}
        />
      ))}
    </Pie>
    <Tooltip content={<CustomDonutTooltip />} />
  </PieChart>
  {/* Center text overlay */}
  <div
    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
    style={{ paddingBottom: '10px' }} /* slight visual correction */
    onClick={() => selectedCategory && onCategorySelect(null)}
  >
    <span className="text-3xl font-semibold text-gray-800">
      {formatCurrency(centerAmount)}
    </span>
    <span className="text-xs font-normal text-gray-500">
      {selectedCategory
        ? selectedCategory.substring(0, 16)
        : 'Totale uscite'
      }
    </span>
  </div>
</div>
```

**Note:** For `pointer-events-none` on overlay + click on center: remove `pointer-events-none` and add the click handler there instead. Or make only the center area clickable (inner circle radius < 70px).

### Pattern 6: Stats useMemo — Null Year Fix

**Critical:** When `selectedYear === null` (Tutti mode), the current stats useMemo returns empty data because `getFullYear() === null` is always false. Must add a guard:

```jsx
// In App.jsx stats useMemo — EXISTING code to MODIFY:
// BEFORE:
let filtered = transactions.filter(
  (t) => new Date(t.date).getFullYear() === selectedYear,
);
// AFTER:
let filtered = selectedYear !== null
  ? transactions.filter((t) => new Date(t.date).getFullYear() === selectedYear)
  : [...transactions];

// Similarly for monthlyFiltered:
let monthlyFiltered = selectedYear !== null
  ? transactions.filter((t) => new Date(t.date).getFullYear() === selectedYear)
  : [...transactions];
```

**Also:** AreaChart title "Andamento {selectedYear}" — when selectedYear is null, show "Andamento (tutti gli anni)" or abbreviate to just "Andamento".

### Pattern 7: AppLayout Prop Threading

`AppLayout.jsx` must pass period selector props down to `AppHeader`. Add these props:

```jsx
// AppLayout.jsx — new signature:
export function AppLayout({
  view, setView, collapsed, onToggle, onAddTransaction,
  // NEW period selector props:
  selectedMonth, selectedYear,
  onPrevMonth, onNextMonth, onClearPeriod,
  children
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar ... />
      <motion.div ...>
        <AppHeader
          view={view}
          onAddTransaction={onAddTransaction}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onClearPeriod={onClearPeriod}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </motion.div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **CSS vars in Recharts props:** `fill="var(--color-chart-01)"` — Recharts ignores `var()` strings in SVG attributes. Always resolve via `getComputedStyle`.
- **No debounce on resize:** Directly calling `setChartKey` in resize handler causes rapid remounts and flicker. Always debounce 200ms.
- **`MONTHS_IT[selectedMonth - 1]`:** Off-by-one bug (selectedMonth is 0-indexed). Use `MONTHS_IT[selectedMonth]`.
- **Using `selectedYear === null` as "current year":** It means "Tutti" (all time), not current year. Keep the null contract.
- **Skeleton without minimum display time:** Without 300ms setTimeout, skeleton flashes too briefly on fast hardware, creating a jarring visual. Always use the minimum.
- **Direct `setDashboardCategoryFilter(name)`:** The filter is an array type. Use `setDashboardCategoryFilter([name])` to set, `setDashboardCategoryFilter([])` to clear.
- **Forgetting to update useMemo deps:** The stats useMemo dependency array must include all consumed state. Already correct — do not accidentally remove `selectedYear` from deps.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart resize in Electron | Custom ResizeObserver + dimension tracking | `key={chartKey}` debounced remount | Recharts `ResponsiveContainer` handles layout internally when remounted |
| CSS var resolution | Build-time token injection | `getComputedStyle()` at render | Theme tokens live at runtime in CSS; build-time injection misses dynamic theme changes |
| Skeleton shimmer animation | Custom CSS keyframes | Tailwind `animate-pulse` | Already available in Tailwind v4; consistent with design system |
| Italian month names | New constant | `MONTHS_IT` from `src/constants/index.js` | Already defined: `['Gennaio', 'Febbraio', ...]` |
| Currency formatting | Custom formatter | `formatCurrency` from `src/utils/index.js` | Already uses `Intl.NumberFormat('it-IT', { currency: 'EUR' })` |
| Smooth skeleton→content transition | CSS class toggle | `AnimatePresence` + `motion.div` with `exit` | Framer Motion installed, handles cross-fade cleanly |

---

## Common Pitfalls

### Pitfall 1: Recharts Swallows CSS Variables
**What goes wrong:** `<Area stroke="var(--color-income-500)" />` renders with no color or black stroke.
**Why it happens:** SVG attributes don't support CSS `var()` in all environments; Recharts converts props to SVG attributes directly.
**How to avoid:** Always call `getChartColors()` or resolve with `getComputedStyle` before passing to Recharts props.
**Warning signs:** Charts render in black/default color despite correct token values.

### Pitfall 2: selectedMonth Off-by-One (UI-SPEC Bug)
**What goes wrong:** Period label shows "Febbraio" when January is selected; month navigation wraps at wrong boundary.
**Why it happens:** UI-SPEC §5.3 incorrectly uses `MONTHS_IT[selectedMonth - 1]` but `selectedMonth` is 0-indexed (0=Jan, 11=Dec) per `getMonth()` usage in stats useMemo.
**How to avoid:** Use `MONTHS_IT[selectedMonth]` (not `-1`). Navigation wraps at 0 (prev) and 11 (next).
**Warning signs:** January displays "undefined" in period label; December wraps to next year a month early.

### Pitfall 3: Tutti Mode Shows Empty Dashboard
**What goes wrong:** Clicking "Tutti" shows €0,00 for all stats.
**Why it happens:** Stats useMemo filters `getFullYear() === selectedYear` — when `selectedYear === null`, this always returns false.
**How to avoid:** Add null guard: `selectedYear !== null ? filter by year : use all transactions`.
**Warning signs:** Clicking "Tutti" immediately empties all cards.

### Pitfall 4: AnimatePresence Mode Wrong
**What goes wrong:** Old skeleton and new content briefly overlap during transition, causing layout shift.
**Why it happens:** Default `AnimatePresence` allows exit and enter to happen simultaneously.
**How to avoid:** Use `<AnimatePresence mode="wait">` so exit completes before enter starts.
**Warning signs:** Double-rendering of skeleton + content simultaneously.

### Pitfall 5: Donut center text not centered
**What goes wrong:** Absolute center overlay misaligns at different card widths.
**Why it happens:** PieChart uses fixed pixel dimensions; if container is narrower, cx/cy need adjustment.
**How to avoid:** Set `width` and `height` explicitly on `<PieChart>` (e.g., `width={240} height={240}`) and use `cx={120} cy={120}`. Wrap in fixed `w-60 h-60` container.

### Pitfall 6: dashboardCategoryFilter Not Cleared on Period Change
**What goes wrong:** Switching periods keeps old category filter active, showing misleading cross-filtered data.
**Why it happens:** No automatic cleanup.
**How to avoid:** In `DashboardView`'s `useEffect` for period change (the one that triggers skeleton), also call `onCategoryFilterChange(null)` to reset.

---

## Code Examples

### AreaChart with dual areas and gradient fill

```jsx
// Source: Recharts 3.x API + UI-SPEC §5.4
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const INCOME_COLOR = '#059669'; // --color-income-500
const EXPENSE_COLOR = '#f43f5e'; // --color-expense-500

function AreaChartCard({ monthlyData, isLoading, selectedYear }) {
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    let timeout;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setChartKey(k => k + 1), 200);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(timeout); };
  }, []);

  if (isLoading) return <SkeletonChart height={300} />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">
        {selectedYear ? `Andamento ${selectedYear}` : 'Andamento'}
      </p>
      <ResponsiveContainer key={chartKey} width="100%" height={300}
        aria-label={`Grafico andamento entrate e uscite ${selectedYear ?? ''}`}>
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
              <stop offset="95%" stopColor={INCOME_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={EXPENSE_COLOR} stopOpacity={0.3} />
              <stop offset="95%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip content={<CustomAreaTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="Entrate"
            stroke={INCOME_COLOR} fill="url(#incomeGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="Uscite"
            stroke={EXPENSE_COLOR} fill="url(#expenseGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Skeleton stat card (shimmer)

```jsx
// Source: UI-SPEC §5.6 + Tailwind v4 animate-pulse
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-gray-200"
      aria-busy="true" aria-label="Caricamento statistiche">
      <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
      <div className="h-7 w-32 rounded bg-gray-200 animate-pulse mt-3" />
      <div className="h-3 w-24 rounded bg-gray-200 animate-pulse mt-2" />
    </div>
  );
}
```

### PeriodSelector (inline AppHeader)

```jsx
// Conditional on view === 'dashboard'
{view === 'dashboard' && (
  <div className="flex items-center gap-2">
    <button
      onClick={onPrevMonth}
      className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2"
      aria-label="Mese precedente"
    >
      <ChevronLeft size={16} />
    </button>

    {selectedMonth !== null && selectedYear !== null && (
      <motion.span
        key={`${selectedMonth}-${selectedYear}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="text-sm font-semibold text-gray-700 min-w-[120px] text-center"
      >
        {MONTHS_IT[selectedMonth]} {selectedYear}
      </motion.span>
    )}

    <button
      onClick={onNextMonth}
      className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2"
      aria-label="Mese successivo"
    >
      <ChevronRight size={16} />
    </button>

    <button
      onClick={onClearPeriod}
      aria-pressed={selectedMonth === null && selectedYear === null}
      className={
        selectedMonth === null && selectedYear === null
          ? 'px-3 py-1 rounded-md text-sm font-semibold bg-brand-500 text-white cursor-pointer'
          : 'px-3 py-1 rounded-md text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-150'
      }
    >
      Tutti
    </button>
  </div>
)}
```

### % change computation (stat card)

```jsx
// Compute previous period stats for percent change
// In App.jsx useMemo or DashboardView useMemo:
function getPrevPeriodStats(transactions, selectedMonth, selectedYear) {
  if (selectedMonth === null || selectedYear === null) return null; // no comparison for "Tutti"
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });
  const prevIncome = prevTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return { prevIncome, prevExpenses };
}

// Percent change formula:
function calcChange(current, previous) {
  if (previous === 0) return null; // "Nessun confronto disponibile"
  return ((current - previous) / previous) * 100;
}
```

---

## Existing Assets to Reuse

| Asset | Location | Usage |
|-------|----------|-------|
| `formatCurrency` | `src/utils/index.js` | Format all monetary values in stat cards, donut center, tooltips |
| `MONTHS_IT` | `src/constants/index.js` | Period label in PeriodSelector — `MONTHS_IT[selectedMonth]` (0-indexed!) |
| `stats.income` / `stats.expenses` | App.jsx useMemo return | Stat card amounts |
| `stats.categoryData` | App.jsx useMemo return | Donut chart data (has `.name`, `.value`, `.count`) |
| `stats.monthlyData` | App.jsx useMemo return | AreaChart data (has `.name`, `.Entrate`, `.Uscite` per month) |
| `selectedMonth`, `selectedYear` | useFilters hook | Period selector state |
| `setSelectedMonth`, `setSelectedYear` | useFilters hook | Period navigation handlers |
| `dashboardCategoryFilter`, `setDashboardCategoryFilter` | useFilters hook | Donut cross-filter |
| `--color-income-500/50` | src/index.css @theme | Stat card + AreaChart income colors |
| `--color-expense-500/50` | src/index.css @theme | Stat card + AreaChart expense colors |
| `--color-brand-500/600` | src/index.css @theme | "Tutti" active button |

---

## Files to Create / Modify

| File | Action | Key Changes |
|------|--------|-------------|
| `src/views/DashboardView.jsx` | CREATE | Root layout, isLoading state, composes all sub-components |
| `src/components/dashboard/DashboardStatCard.jsx` | CREATE | type='income'\|'expense', amount, percentChange, isLoading |
| `src/components/dashboard/AreaChartCard.jsx` | CREATE | monthlyData, selectedYear, isLoading, chartKey resize |
| `src/components/dashboard/DonutChartCard.jsx` | CREATE | categoryData, selectedCategory, onCategorySelect, isLoading |
| `src/components/dashboard/SkeletonStatCard.jsx` | CREATE | animate-pulse shimmer blocks |
| `src/components/dashboard/SkeletonChart.jsx` | CREATE | animate-pulse full-height block, height prop |
| `src/utils/chartColors.js` | CREATE | getChartColors() via getComputedStyle |
| `src/index.css` | MODIFY | Add `--color-chart-01..10` to `@theme` block |
| `src/components/layout/AppHeader.jsx` | MODIFY | Add PeriodSelector inline; new props: selectedMonth, selectedYear, onPrevMonth, onNextMonth, onClearPeriod |
| `src/components/layout/AppLayout.jsx` | MODIFY | Thread period selector props from App.jsx → AppHeader |
| `src/App.jsx` | MODIFY | Wire DashboardView; fix stats useMemo null-year guard; add period nav handlers; pass new props to AppLayout |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `COLORS` array with hardcoded hex in constants | `getChartColors()` resolving from CSS vars at runtime | Charts respect design tokens; easy theme updates |
| Existing StatCard with CSS class names (`.stat-card.positive`) | `DashboardStatCard` with Tailwind utilities + semantic borders | Consistent with Tailwind v4 design system |
| No period selector (all-time data only) | Month/year navigation in AppHeader | Users can analyze specific months |
| No cross-filtering | Donut click → `dashboardCategoryFilter` | Transaction list filtered by chart interaction |
| No skeleton loading | AnimatePresence + shimmer | Professional loading experience |

---

## Open Questions

1. **% change computation location**
   - What we know: Previous period stats need to be computed (prevIncome, prevExpenses).
   - What's unclear: Should this live in App.jsx's stats useMemo (cleanest, single source) or inside DashboardView as a local useMemo?
   - Recommendation: Add to App.jsx stats useMemo return object as `prevIncome`/`prevExpenses` — keeps data computation centralized.

2. **AreaChart in "Tutti" mode (null year)**
   - What we know: monthlyData aggregates by month within a selected year. When year=null, all 12 months would aggregate across all years.
   - What's unclear: Should monthlyData show monthly aggregates across ALL years, or should the AreaChart be hidden in "Tutti" mode?
   - Recommendation: Show all-time monthly aggregates (Jan across all years, Feb across all years, etc.) — consistent with the data model. Show "Andamento (tutti gli anni)" as title.

3. **DonutChartCard: pointer-events-none on center overlay**
   - What we know: Center overlay needs `pointer-events-none` to not block chart clicks, but also needs to handle "click center to deselect".
   - What's unclear: Should clicking on center donut area (inner hole in SVG) deselect, or only via Recharts `onClick`?
   - Recommendation: Add an SVG `<circle>` at the inner radius as a transparent click target for deselect, rather than a div overlay. This avoids z-index conflicts.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — no vitest/jest in devDependencies |
| Config file | None |
| Quick run command | `node node_modules/vite/bin/vite.js build && node node_modules/eslint/bin/eslint.js src/` |
| Full suite command | Same (build + lint) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | 2 stat cards render with income/expense data | Manual smoke | Electron visual check | ❌ |
| DASH-02 | Green/red semantic colors applied correctly | Manual smoke | Electron visual check | ❌ |
| DASH-03 | Chart colors resolve from CSS vars (not black/default) | Manual smoke | Electron visual check | ❌ |
| DASH-04 | Donut chart renders with center text | Manual smoke | Electron visual check | ❌ |
| DASH-05 | Area chart renders income vs expenses trend | Manual smoke | Electron visual check | ❌ |
| DASH-06 | Period selector visible in AppHeader for dashboard view | Manual smoke | Electron visual check | ❌ |
| DASH-07 | Donut click filters transaction list | Manual smoke | Electron interaction test | ❌ |
| DASH-08 | Skeleton appears on mount and period change (300ms) | Manual smoke | Electron visual check | ❌ |
| Build gate | `vite build` exits 0, no lint errors | Automated | `node node_modules/vite/bin/vite.js build` | ✅ (infrastructure exists) |

### Sampling Rate
- **Per task commit:** `node node_modules/vite/bin/vite.js build` (verify no broken imports/compilation)
- **Per wave merge:** Build + lint (`node node_modules/eslint/bin/eslint.js src/`)
- **Phase gate:** Build ✓ + Lint ✓ + Electron smoke test (all 8 DASH requirements visually verified)

### Wave 0 Gaps
- No vitest installed — recommend NOT installing for this phase (UI-only work validates via build + smoke test)
- Core utility `getChartColors()` COULD have a unit test (verifies array length = 10, values non-empty), but requires jsdom setup for `getComputedStyle`. Optional.
- [ ] Consider: `npm install -D vitest jsdom @vitest/coverage-v8` if unit testing getChartColors() is desired — but build+lint gate is sufficient for this visual phase.

---

## Sources

### Primary (HIGH confidence)
- Live codebase — `src/index.css`, `src/hooks/useFilters.js`, `src/App.jsx`, `src/constants/index.js`, `src/utils/index.js`, `src/components/layout/AppHeader.jsx`, `src/components/layout/AppLayout.jsx` — directly inspected
- `package.json` — verified installed versions: recharts@3.7.0, framer-motion@12.38.0, lucide-react@0.563.0, tailwindcss@4.2.1
- `.planning/phases/04-dashboard-redesign/04-UI-SPEC.md` — visual spec inspected
- `.planning/phases/04-dashboard-redesign/04-CONTEXT.md` — user decisions inspected

### Secondary (MEDIUM confidence)
- STATE.md — known Recharts resize risk + mitigation pattern documented by prior researcher
- REQUIREMENTS.md — DASH-01..08 scope definition

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified in package.json
- Architecture patterns: HIGH — patterns verified against live codebase structure and Tailwind v4 @theme setup
- Pitfalls: HIGH — selectedMonth indexing bug verified by inspecting useFilters.js + App.jsx useMemo; null-year bug verified by reading stats filter logic
- Recharts CSS var solution: HIGH — confirmed CSS vars are accessible via getComputedStyle in @theme; confirmed Recharts v3 uses SVG attribute props

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable libraries; Recharts 3.x and Framer Motion 12.x APIs are stable)
