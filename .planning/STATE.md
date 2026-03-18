---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-03-18T14:22:24.218Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 11
  completed_plans: 11
  percent: 100
---

# Project State: MoneyFlow UI/UX Redesign

**Last Updated:** 2026-03-18 (plan 04-03 execution)

## Project Reference

**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

**Mission:** Transform MoneyFlow from custom CSS chaos (2,127-line App.jsx monolith) to a modern, maintainable UI/UX with Tailwind v4, preserving all existing functionality while introducing light clean minimal design (Notion/Apple inspiration).

**Current Focus:** Phase 4 — Dashboard Redesign COMPLETE (Plans 01+02+03 done — Electron smoke test pending ✅)

## Current Position

**Active Phase:** Phase 4: Dashboard Redesign — COMPLETE (awaiting human smoke test)
**Active Plan:** Phase 4 Plan 03 (04-03 — COMPLETE, human smoke test pending)
**Status:** In progress
**Progress:** [██████████] 100%

## Performance Metrics

**Phases:**
- Total: 7
- Completed: 0
- In Progress: 1
- Not Started: 6

**Plans:**
- Total: 2 (Phase 1)
- Completed: 1
- In Progress: 0
- Not Started: 1

**Requirements Coverage:**
- Total v1 requirements: 47
- Mapped to phases: 47
- Coverage: 100% ✓

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-foundation-setup | P01 | 15m | 2 | 2 |
| 02-state-extraction | P01 | 15m | 2 | 4 |
| 02-state-extraction | P02 | 14m | 2 | 4 |
| Phase 02-state-extraction PP03 | 18m | 2 tasks | 3 files |
| 02-state-extraction | P04 | 15m | 1 | 3 |
| Phase 02-state-extraction PP04 | 15m | 1 tasks | 3 files |
| 03-navigation-layout | P01 | 12m | 2 | 7 |
| 03-navigation-layout | P02 | 18m | 2 | 6 |
| Phase 03-navigation-layout P02 | 18m | 2 tasks | 6 files |
| Phase 03-navigation-layout PP02 | 18m | 3 tasks | 6 files |
| Phase 04-dashboard-redesign P01 | 8m | 3 tasks | 5 files |
| Phase 04-dashboard-redesign P02 | 12m | 3 tasks | 3 files |
| Phase 04-dashboard-redesign P03 | 20m | 3 tasks | 3 files |

## Accumulated Context

### Key Decisions Made

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-03-17 | Phase order: Foundation → State → Layout → Views → Modals → Polish | Research-backed dependency ordering; state extraction FIRST prevents localStorage data loss | ✓ Approved |
| 2026-03-17 | Tailwind CSS v4 (not v3) | Utility-first, native CSS variables, excellent Vite integration, no PostCSS needed | ✓ Approved |
| 2026-03-17 | NO shadcn/ui component library | Overhead for Electron not justified; use Radix UI primitives + Tailwind directly | ✓ Approved |
| 2026-03-17 | Extract 7 custom hooks before component refactoring | Establish stable data layer first; prevents race conditions and localStorage corruption | ✓ Approved |
| 2026-03-17 | Parallel execution: Phase 4 (Dashboard) + Phase 5 (Transactions) | Independent views after layout complete; different files, no conflicts | ✓ Approved |
| 2026-03-17 | Used @tailwindcss/vite plugin (no PostCSS config) for Tailwind v4 native Vite integration | No tailwind.config.js or postcss.config.js needed with v4 Vite plugin | ✓ Implemented |
| 2026-03-17 | Compat aliases in :root map old var names to @theme tokens | App.css has 57+ old var references; migration deferred to Phase 3+ | ✓ Implemented |
| 2026-03-17 | Electron CSP dev/prod split: isDev ternary gates 'unsafe-inline' to dev mode only; production CSP strict | Tailwind v4 HMR requires unsafe-inline in dev; production must be strict | ✓ Implemented |
| 2026-03-17 | All variable names preserved identically during hook extraction — zero JSX changes needed for useToast and useModals | Renamed variables would cascade through hundreds of JSX references; same names = safe extraction | ✓ Implemented |
| 2026-03-17 | useState setters from extracted hooks are stable references; exhaustive-deps warnings are benign | useState setters never change between renders; warnings are ESLint false positives for destructured returns | ✓ Accepted |
| 2026-03-17 | useFilters: eslint-disable for set-state-in-effect in page-reset and years-update effects | Same deferral pattern as pre-existing PayPalEnrichWizard error; effects are correct React patterns for derived state reset | ✓ Accepted |
| 2026-03-17 | useCategories: lazy localStorage initializers for categories + importProfiles | Reads state at mount time without useEffect anti-pattern; avoids double-render on load | ✓ Implemented |
| 2026-03-17 | useCategories recategorizeAll takes (transactions, categoryResolutions, setTransactions) as fn params | useCategories instantiated before useTransactionData; closure would capture stale/uninitialized state | ✓ Implemented |
| 2026-03-17 | XLSX import kept in App.jsx through Plan 02-03 — handleFile/handlePayPalFile still use it | Plan 02-03 incorrectly stated XLSX was hook-only; moves to useImport hook in Plan 02-04 | ✓ Auto-fixed |
| 2026-03-17 | useImportLogic constructor params: transactions/setTransactions/categories/importProfiles/setImportProfiles/showToast | Same dependency-injection pattern as useTransactionData and useCategories hooks | ✓ Implemented |
| 2026-03-17 | confirmCategoryConflicts deps fixed: added setCategoryResolutions, setTransactions, setCategoryConflicts | Stable useState setter refs — prevents React Compiler preserve-manual-memoization errors | ✓ Implemented |
| 2026-03-17 | useViewState: only view/setView destructured in App.jsx (not sidebarCollapsed/toggleSidebar) — added in Plan 03-02 | Unused-vars lint fails if destructured without consumers; sidebar props wired when Sidebar component is built | ✓ Implemented |
| 2026-03-18 | Removed exportData/exportBackup/importBackup/handlePayPalFile from App.jsx destructuring | Old header UI removed; features will re-surface in Settings view (Phase 6) | ✓ Auto-fixed |
| 2026-03-18 | Added eslint-plugin-react + react/jsx-uses-vars to eslint config | JSX variable tracking requires React ESLint plugin; motion/Icon falsely reported unused without it | ✓ Auto-fixed |
| 2026-03-18 | Phase 3 Navigation & Layout COMPLETE — all 13 Electron smoke test items passed | Sidebar/AppHeader/AppLayout/SettingsView verified in production Electron build | ✓ Approved |
| 2026-03-18 | Chart colors read at runtime via getComputedStyle — compatible with Tailwind v4 @theme CSS variables | CSS vars from @theme are resolved at runtime; getComputedStyle works correctly in Electron/browser | ✓ Implemented |
| 2026-03-18 | DashboardStatCard delegates loading state to SkeletonStatCard via isLoading prop | Single source of loading UI; avoids duplicate shimmer code; consistent skeleton appearance | ✓ Implemented |
| 2026-03-18 | DashboardView: eslint-disable set-state-in-effect on setIsLoading — same accepted pattern as useFilters; correct React pattern for derived state reset | setIsLoading(true) sync in effect is intentional for skeleton swap; pattern already accepted in codebase | ✓ Accepted |
| 2026-03-18 | DonutChartCard: chartColors resolved via useMemo(() => getChartColors(), []) at mount | Reads CSS vars once at mount, avoids per-render recompute; safe because CSS vars don't change at runtime | ✓ Implemented |
| 2026-03-18 | MONTHS_IT[selectedMonth] is 0-indexed (Jan=0, Dec=11) — NOT selectedMonth-1 | Months from JS Date.getMonth() are 0-indexed; MONTHS_IT array is 0-indexed; no offset needed | ✓ Implemented |
| 2026-03-18 | dashboardTypeFilter removed from stats useMemo — new DashboardView uses DonutChartCard cross-filter instead | New dashboard design dropped income/expense type toggle; category cross-filter via DonutChart handles filtering | ✓ Implemented |
| 2026-03-18 | Period navigation handlers declared before isInitialized early return — required for React rules of hooks | useCallback must be called unconditionally; moved above the early return guard | ✓ Auto-fixed |

### Todos

- [x] Plan Phase 1: Foundation & Setup ✓
- [x] Verify Tailwind v4 stability with Electron before starting Phase 1 ✓ (build passes)
- [x] Execute Plan 01-01: Tailwind v4 + design tokens + font setup ✓
- [x] Execute Plan 01-02: CSP / Electron security headers ✓
- [x] Execute Plan 02-01: Extract useToast + useModals hooks ✓
- [x] Execute Plan 02-02: Extract useFilters + useCategories hooks ✓
- [x] Execute Plan 02-03: Extract useTransactionData hook ✓
- [x] Execute Plan 02-04: Extract useImportLogic hook ✅ (human smoke test approved — all 6 hooks complete)
- [x] Execute Plan 03-01: Install framer-motion, create useViewState hook, migrate view/setView, add brand-600 token ✅
- [x] Execute Plan 03-02: Create Sidebar, AppHeader, AppLayout, SettingsView; integrate into App.jsx ✅ (human smoke test approved — all 13 items passed)
- [x] Execute Plan 04-01: Chart color tokens, chartColors utility, SkeletonStatCard, SkeletonChart, DashboardStatCard ✅
- [x] Execute Plan 04-02: AreaChartCard, DonutChartCard, DashboardView with skeleton loading ✅
- [ ] Execute Plan 04-03: Human Electron smoke test — awaiting user verification
- [ ] Test Radix Dialog + Framer Motion animations in Electron environment during Phase 6 planning

### Known Blockers

None.

### Deferred Issues

- **Pre-existing lint error:** `src/components/modals/PayPalEnrichWizard.jsx` line 200 — `react-hooks/set-state-in-effect`. Unrelated to CSS/Tailwind work. See `deferred-items.md`.
- **useCallback exhaustive-deps warnings in App.jsx** (5 warnings): setters from useModals are stable useState refs. Warnings surface after extraction because ESLint can't prove stability for destructured hook returns. Benign — exit 0, no errors.

### Active Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| CSP blocks Tailwind JIT during development | High | Keep `'unsafe-inline'` in CSP during dev; test production builds early | Phase 1 |
| localStorage data loss during refactoring | Critical | Backup localStorage before refactoring (FOUND-11); extract localStorage logic to dedicated hook FIRST | Phase 2 |
| Recharts doesn't redraw on Electron window resize | Medium | ✅ MITIGATED: debounced key remount in AreaChartCard + DonutChartCard (200ms timeout → setChartKey) | Phase 4 |
| React 19 concurrent rendering breaks import callbacks | Medium | Use `useTransition` for non-urgent updates; wrap critical mutations in `flushSync` | Phase 2 |

### Research Insights

**From SUMMARY.md:**
- Clear path: state extraction → component boundaries → incremental CSS migration
- Stack: Tailwind v4 + Radix UI primitives + Framer Motion (no full component library)
- Critical risks documented: CSP conflicts, localStorage loss, Recharts resize, React 19 concurrency, accessibility regressions
- Estimated timeline: 11-13 days with parallel work after hooks stabilize

**Research flags for deeper investigation:**
- **Phase 4 (Dashboard):** Test Recharts + Tailwind CSS variable integration (POC needed)
- **Phase 6 (Modals):** Verify Radix Dialog + Framer Motion animation compatibility in Electron (CSP check)

## Session Continuity

### Last Session Summary
- Plan 04-03 COMPLETE (awaiting Electron smoke test): PeriodSelector in AppHeader + AppLayout prop threading + DashboardView wired in App.jsx
- AppHeader: ChevronLeft/Right + MONTHS_IT[selectedMonth] label + Tutti button (aria-pressed, blue when active)
- AppLayout: 5 period props forwarded to AppHeader
- App.jsx: DashboardView replaces ~400 lines inline dashboard JSX; stats useMemo null-year fix; prevIncome/prevExpenses added; 3 period handlers
- Auto-fixed: hooks called before early return, dashboardTypeFilter removed from useMemo
- Build: ✓ 2778 modules exit 0; Lint: ✓ exit 0

### Next Session Context
**Immediate next action:** Human Electron smoke test for full Phase 4 Dashboard Redesign (see 04-03-PLAN.md Task 4 checklist)

**What to know:**
- Phase 4 Plans 01+02+03 all done — smoke test is the final gate
- DashboardView renders: 2 stat cards (income/expense with % change) + AreaChart + DonutChart
- Period selector in AppHeader: prev/next arrows + month label + Tutti button
- Stats null-year mode: selectedYear=null shows ALL transactions (Tutti mode)
- Cross-filter: DonutChart segments → sets dashboardCategoryFilter array → filters stats

### Environment State
- Working directory: `D:\Generale\budget-tracker`
- Git repository: 8 commits in phase-2 work
- Key files:
  - `src/hooks/useToast.js` — extracted: toast state + showToast callback
  - `src/hooks/useModals.js` — extracted: 9 modal/form state variables
  - `src/hooks/useFilters.js` — extracted: 10 filter states + 2 effects
  - `src/hooks/useCategories.js` — extracted: lazy localStorage init + 5 CRUD callbacks
  - `src/hooks/useTransactionData.js` — NEW: lazy localStorage init + years memo + Electron backup + 8 callbacks
  - `src/hooks/index.js` — Updated: exports all 6 hooks
  - `src/App.jsx` — Modified: calls all 5 hooks; ~268 lines removed; XLSX+allProfiles+handleFile still remain

### Recent Changes
- **2026-03-17:** Plan 02-03 executed — useTransactionData extracted (commits ca802bb, e7e5c08)
- **2026-03-17:** Plan 02-02 executed — useFilters + useCategories extracted (commits 6ef8044, 7155899)
- **2026-03-17:** Plan 02-01 executed — useToast + useModals extracted (commits 9aac86c, 7c86edc)
- **2026-03-17:** Plan 01-02 executed — Electron CSP hardened, Google Fonts CDN removed, Phase 1 verified (commit 2823f84)
- **2026-03-17:** Plan 01-01 executed — Tailwind v4 + design tokens + Inter Variable font (commits 89a3022, 9249d6e)

---

*State tracking initialized: 2026-03-17*
