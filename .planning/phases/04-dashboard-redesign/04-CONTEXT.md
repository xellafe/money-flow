# Phase 4 Context: Dashboard Redesign

## Phase Goal
Redesign the dashboard with modern stat cards, chart consolidation, period selector in AppHeader, chart cross-filtering, and skeleton loading — all using Tailwind v4 CSS variables (no hardcoded hex).

## Decisions

### Stat Cards
- **Count**: 2 cards — Income and Expenses only (no Balance card)
- **Content**: Primary amount for selected period + % change vs previous period
- **Layout**: Full-width horizontal, 2 cards side by side (equal width)
- **Color**: Light tint background — green tint for Income (`--color-income-500`), red tint for Expenses (`--color-expense-500`)
- **Interaction**: Show skeleton (shimmer) during initial load

### Charts
- **Selection**: AreaChart (trend over time) + Donut chart (category breakdown) — remove all other charts
- **Layout**: AreaChart full-width on top, Donut chart below aligned to the right
- **Cross-filtering**: Click on donut segment filters transactions via `dashboardCategoryFilter` in `useFilters`
- **Donut center text**: Shows total value of the selected category (or overall total when nothing is selected)
- **Skeleton**: Both charts show shimmer skeleton during load

### Period Selector
- **Location**: AppHeader — visible from every view (contextual to dashboard view only — hide on other views)
- **Navigation**: Previous/Next month arrows with center label (e.g., "Gennaio 2025")
- **"All" option**: A "Tutti" button to clear month filter and show all-time data
- **State**: Uses existing `selectedMonth` / `selectedYear` from `useFilters`; null/null = "Tutti"

### Skeleton Loading
- **Style**: Shimmer pulse (animated gradient wave)
- **Elements**: Stat cards + charts only (not the transaction list)
- **Trigger**: Show skeleton when component mounts or period changes

## Deferred Ideas
- Balance card (could be added as a Phase 5 enhancement)
- Budget progress bars in stat cards
- Quarter/Year granularity toggle
- BarChart drill-down
- Skeleton for transaction list

## Code Context

### Existing hooks & state
- `useFilters` → `selectedMonth`, `selectedYear`, `setMonth`, `setYear`, `dashboardCategoryFilter`, `setDashboardCategoryFilter`
- `useViewState` → `view` (for conditional AppHeader rendering)
- `stats` from `useMemo` in `App.jsx` → `income`, `expenses`, `balance`, `categoryData`, `monthlyData`, `dailyData`, `filtered`

### Design tokens (already in `src/index.css`)
- `--color-income-500: #059669`
- `--color-expense-500: #f43f5e`
- `--color-brand-500: #3b82f6`
- `--color-brand-600: #2563eb`

### Existing components
- `src/components/StatCard.jsx` — has `.stat-card`, `.stat-card.positive`, `.stat-card.negative` CSS classes
- `src/components/layout/AppHeader.jsx` — conditionally renders "Aggiungi transazione" button; period selector should be added here
- `COLORS` array in `src/constants/index.js` — hardcoded hex, must be migrated to CSS variables

### Recharts usage
- Currently imported: `AreaChart`, `BarChart`, `LineChart` (all from `recharts`)
- Target: keep `AreaChart`, add `PieChart` (for donut via `innerRadius`)
- Recharts uses inline `fill`/`stroke` props — must pass CSS variable values via `getComputedStyle` or define as JS constants that reference CSS vars

### Known risk
- Recharts `fill` prop requires actual color values (not CSS var strings like `var(--color-income-500)`)
- Workaround options: (1) `getComputedStyle(document.documentElement).getPropertyValue('--color-income-500')` at render, or (2) keep a `CHART_COLORS` map as JS constants that import from a shared tokens file
- Researcher should POC this and recommend approach
