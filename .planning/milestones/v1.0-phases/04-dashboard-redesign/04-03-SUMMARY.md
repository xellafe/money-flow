---
phase: 04-dashboard-redesign
plan: "03"
subsystem: dashboard-wiring
tags: [period-selector, app-header, app-layout, dashboard-view, null-year, useCallback]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [PeriodSelector, period-navigation, DashboardView-wired]
  affects: [src/components/layout/AppHeader.jsx, src/components/layout/AppLayout.jsx, src/App.jsx]
tech_stack:
  added: []
  patterns: [period-navigation-callbacks, prop-drilling, null-guard, rules-of-hooks]
key_files:
  created: []
  modified:
    - src/components/layout/AppHeader.jsx
    - src/components/layout/AppLayout.jsx
    - src/App.jsx
decisions:
  - "MONTHS_IT[selectedMonth] used directly — 0-indexed (0=January, 11=December), NOT selectedMonth-1"
  - "Period navigation handlers declared before isInitialized early return to comply with rules of hooks"
  - "dashboardTypeFilter removed from stats useMemo — new DashboardView uses DonutChartCard cross-filter instead of type filter toggle"
  - "Tutti mode (null/null) handled in prev/next month handlers by initializing to current year + Dec/Jan respectively"
  - "prevIncome/prevExpenses added to stats return — DashboardView computes % change from these"
metrics:
  duration: 20m
  completed: "2026-03-18"
  tasks: 3
  files: 3
---

# Phase 4 Plan 03: Dashboard Wiring Summary

**One-liner:** PeriodSelector in AppHeader (prev/next month + Tutti button), period props threaded through AppLayout, and DashboardView wired into App.jsx with null-year stats fix and prev-period % change computation.

## What Was Built

### AppHeader (`src/components/layout/AppHeader.jsx`)
- **PeriodSelector** visible only when `view === 'dashboard'`
- ChevronLeft/ChevronRight navigation arrows with `aria-label="Mese precedente"` / `"Mese successivo"`
- `MONTHS_IT[selectedMonth]` month label (0-indexed) with Framer Motion fade-in animation
- `Tutti` button with `aria-pressed={isTutti}` — blue (`bg-brand-500`) when active, outlined (`border-gray-200`) otherwise
- `isTutti = selectedMonth === null && selectedYear === null`

### AppLayout (`src/components/layout/AppLayout.jsx`)
- Added `selectedMonth`, `selectedYear`, `onPrevMonth`, `onNextMonth`, `onClearPeriod` to props
- All 5 period props forwarded to AppHeader
- JSDoc updated to document new props

### App.jsx (`src/App.jsx`)
- `import { DashboardView }` added
- `setSelectedMonth`, `setSelectedYear` now destructured from `useFilters`
- **Stats useMemo null-year fix:** `selectedYear !== null ? filter : [...transactions]` for both `filtered` and `monthlyFiltered`
- **prevPeriod stats:** `prevIncome` and `prevExpenses` computed for the month before `selectedMonth/selectedYear`; returns `null` when in "Tutti" mode
- **Period handlers:** `handlePrevMonth`, `handleNextMonth`, `handleClearPeriod` — declared before `if (!isInitialized)` early return (rules of hooks compliance)
- **AppLayout props** updated with 5 new period props
- **Dashboard JSX replaced** with `<DashboardView stats={stats} ... />` — ~400 lines of inline JSX removed
- `dashboardTypeFilter` removed from stats useMemo (not needed in new DashboardView)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add PeriodSelector to AppHeader | 2913cbe | AppHeader.jsx |
| 2 | Thread period selector props through AppLayout | cd26714 | AppLayout.jsx |
| 3 | Wire DashboardView and fix stats useMemo in App.jsx | ef67f6f | App.jsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Plans 04-01 and 04-02 not executed before 04-03**
- **Found during:** Initial file read — DashboardView.jsx missing, 04-01/04-02 summaries absent
- **Issue:** Plans 04-01 and 04-02 tasks were partially committed but 04-02 Task 3 (DashboardView) was untracked, and no summaries existed; 04-03 depends on both
- **Fix:** Verified 04-01 files (committed), committed DashboardView.jsx for 04-02, then proceeded with 04-03 tasks
- **Commit:** 969c999 (DashboardView commit)

**2. [Rule 1 - Bug] useCallback hooks called after early return**
- **Found during:** Task 3 ESLint verification
- **Issue:** Period navigation handlers (`handlePrevMonth`, `handleNextMonth`, `handleClearPeriod`) were initially placed after `if (!isInitialized) { return null; }`, violating React rules of hooks
- **Fix:** Moved all three `useCallback` declarations before the early return
- **Files modified:** src/App.jsx
- **Commit:** ef67f6f (included in task commit)

**3. [Rule 1 - Bug] dashboardTypeFilter referenced but removed from destructuring**
- **Found during:** Task 3 ESLint verification
- **Issue:** After removing inline dashboard JSX, `dashboardTypeFilter` was still used in stats useMemo but no longer destructured from useFilters
- **Fix:** Removed `dashboardTypeFilter` filtering from stats useMemo (new DashboardView uses DonutChartCard category cross-filter instead)
- **Files modified:** src/App.jsx
- **Commit:** ef67f6f (included in task commit)

## Verification

- `node node_modules/vite/bin/vite.js build` → ✅ exit 0 (2778 modules, 5.11s)
- `node node_modules/eslint/bin/eslint.js src/` → ✅ exit 0

## Self-Check: PASSED

Files verified:
- ✅ src/components/layout/AppHeader.jsx contains `import { MONTHS_IT } from '../../constants'`
- ✅ src/components/layout/AppHeader.jsx contains `onPrevMonth`
- ✅ src/components/layout/AppHeader.jsx contains `onNextMonth`
- ✅ src/components/layout/AppHeader.jsx contains `onClearPeriod`
- ✅ src/components/layout/AppHeader.jsx contains `MONTHS_IT[selectedMonth]`
- ✅ src/components/layout/AppHeader.jsx contains `view === 'dashboard'`
- ✅ src/components/layout/AppHeader.jsx contains `aria-label="Mese precedente"`
- ✅ src/components/layout/AppHeader.jsx contains `aria-pressed={isTutti}`
- ✅ src/components/layout/AppLayout.jsx contains `selectedMonth`, `selectedYear`, `onPrevMonth`, `onNextMonth`, `onClearPeriod`
- ✅ src/App.jsx contains `import { DashboardView } from './views/DashboardView'`
- ✅ src/App.jsx contains `selectedYear !== null` guard in stats useMemo
- ✅ src/App.jsx contains `handlePrevMonth`, `handleNextMonth`, `handleClearPeriod`
- ✅ src/App.jsx contains `prevIncome`, `prevExpenses` in stats useMemo
- ✅ src/App.jsx contains `<DashboardView` and `onCategoryFilterChange={setDashboardCategoryFilter}`

Commits verified:
- ✅ 2913cbe — AppHeader PeriodSelector
- ✅ cd26714 — AppLayout period props
- ✅ ef67f6f — App.jsx DashboardView wiring
