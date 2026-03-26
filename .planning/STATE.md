---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-03-26T16:31:04.045Z"
progress:
  total_phases: 7
  completed_phases: 6
  total_plans: 21
  completed_plans: 21
  percent: 100
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-03-19T08:41:20.365Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 12
  completed_plans: 12
  percent: 100
---

# Project State: MoneyFlow UI/UX Redesign

**Last Updated:** 2026-03-19 (plan 06-01 ModalShell foundation)

## Project Reference

**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

**Mission:** Transform MoneyFlow from custom CSS chaos (2,127-line App.jsx monolith) to a modern, maintainable UI/UX with Tailwind v4, preserving all existing functionality while introducing light clean minimal design (Notion/Apple inspiration).

**Current Focus:** Phase 6 — Modals/Forms Redesign (Phase 5 Transaction List fully complete ✅)

## Current Position

**Active Phase:** Phase 6: Modals/Forms Redesign — IN PROGRESS
**Active Plan:** Plan 05 (Plans 01-04 complete ✅)
**Status:** Ready to plan
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
| Phase 04-dashboard-redesign PP03 | 20m | 4 tasks | 3 files |
| Phase 04-dashboard-redesign P04 | 12m | 2 tasks | 4 files |
| Phase 04-dashboard-redesign P04 | 12m | 2 tasks | 4 files |
| Phase 05-transaction-list-redesign P01 | 10m | 3 tasks | 5 files |
| Phase 05-transaction-list-redesign P02 | 2m | 3 tasks | 3 files |
| Phase 05-transaction-list-redesign PP03 | 12m | 2 tasks | 2 files |
| Phase 05-transaction-list-redesign PP04 | 5m | 1 tasks | 1 files |
| Phase 06-modals-redesign P01 | 8m | 3 tasks | 4 files |
| Phase 06-modals-redesign PP03 | 12m | 3 tasks | 3 files |
| Phase 06-modals-redesign PP02 | 8m | 3 tasks | 3 files |
| Phase 06-modals-redesign PP04 | 5m | 2 tasks | 2 files |
| Phase 06-modals-redesign PP05 | 5m | 3 tasks | 1 files |

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
| 2026-03-18 | getSemanticColors() reads CSS vars --color-income-500/--color-expense-500 at mount via useMemo — DASH-03 gap closed | Zero hardcoded hex for data colors in AreaChartCard; consistent with getChartColors() pattern | ✓ Implemented |
| 2026-03-18 | onTransactionsCategoryChange prop threads setTransactionsCategoryFilter from App.jsx through DashboardView — DASH-07 gap closed | Donut click now filters both dashboard stats AND transaction list; period change clears both | ✓ Implemented |
| 2026-03-18 | dashboardTypeFilter removed from stats useMemo — new DashboardView uses DonutChartCard cross-filter instead | New dashboard design dropped income/expense type toggle; category cross-filter via DonutChart handles filtering | ✓ Implemented |
| 2026-03-18 | Period navigation handlers declared before isInitialized early return — required for React rules of hooks | useCallback must be called unconditionally; moved above the early return guard | ✓ Auto-fixed |
| 2026-03-19 | sortColumn defaults to 'date', sortDirection to 'desc' — newest-first per CONTEXT.md Decision B; sort change resets pagination | Consistent with UX expectation; sort state in useFilters follows established pattern | ✓ Implemented |
| 2026-03-19 | Full Tailwind class strings in BADGE_PALETTE — dynamic interpolation purged by JIT; all 10 bg/text pairs stored as complete strings | Tailwind JIT requires literal class names at build time | ✓ Implemented |
| 2026-03-19 | Categoria sort removed per Decision A stacked layout — only Date + Importo sortable (TRNS-02) | Decision A stacked layout eliminates separate category column header; TRNS-02 scoped to date + importo only | ✓ Implemented |
| 2026-03-19 | Hidden file-input id=file-input added unconditionally in App.jsx for empty state import CTA | Existing file input was conditional on transactions.length === 0; persistent input needed for TransactionsView empty state | ✓ Implemented |
| 2026-03-19 | showAddTransaction and addManualTransaction removed from App.jsx destructuring | Add transaction form removed with inline list; setShowAddTransaction kept for AppLayout prop; features to resurface in future plan | ✓ Auto-fixed |
| 2026-03-19 | ModalShell uses Dialog.Root open={true} — parent AnimatePresence controls mount/unmount lifecycle | Radix Dialog.Root open={true} stays always open when mounted; AnimatePresence in App.jsx handles mount/unmount so exit animations play before DOM removal | ✓ Implemented |
| 2026-03-19 | Radix asChild on Dialog.Overlay/Content delegates a11y props to motion.div | Standard Radix+Framer Motion pattern: asChild merges Radix accessibility attributes onto the motion.div element | ✓ Implemented |
| 2026-03-19 | CategoryManager recategorize button moved into amber banner (bg-amber-50) — contextual, only shown when categoriesChanged | Cleaner UX: action is contextual and visually prominent; AlertCircle icon removed as redundant | ✓ Implemented |
| 2026-03-19 | SettingsView props onShowCategoryManager/onShowSyncSettings consistent with App.jsx useModals naming convention | Zero friction wiring in App.jsx; follows same pattern as all other modal show/hide handlers | ✓ Implemented |
| 2026-03-19 | ConflictResolver: single-conflict navigator with currentIndex (not all-at-once list) — onResolve(toReplace, toAdd) API preserved | Better UX: focused one-at-a-time review; counter shows progress | ✓ Implemented |
| 2026-03-19 | ConflictResolver: local formatAmount helper replaces formatCurrency import — sign+euro semantic format | Self-contained modal; semantic income-500/expense-500 colors for amounts | ✓ Implemented |
| 2026-03-19 | SyncSettings preserves confirmDelete (local drive-backup state) + currentOperation + isProcessingRef anti-spam ref | Pitfall 7 from RESEARCH.md: internal confirmDelete is for Drive backup deletion, separate from App.jsx transaction confirmDelete | ✓ Implemented |
| 2026-03-19 | PayPalEnrichWizard restructured as 3-step AnimatePresence wizard: overview -> selection table -> confirmation | stepVariants use custom={direction} (1=forward, -1=back) for direction-aware horizontal slide; lint warning at ~line 200 preserved per plan | ✓ Implemented |

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
- [x] Execute Plan 04-03: Wire DashboardView + PeriodSelector + period handlers in App.jsx ✅ (Electron smoke test approved — all 7 verification categories passed)
- [x] Execute Plan 04-04: Gap closure — DASH-03 (CSS var colors in AreaChartCard) + DASH-07 (donut cross-filter to transaction list) ✅
- [x] Execute Plan 05-03: Create TransactionsView + wire into App.jsx ✅
- [x] Execute Plan 06-01: Install @radix-ui/react-dialog, create ModalShell component + ui barrel export ✅
- [x] Execute Plan 06-03: Migrate ImportWizard + CategoryManager to ModalShell; extend SettingsView with modal trigger buttons ✅

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
- **Last session:** 2026-03-19T16:04:47.188Z
- Migrated SyncSettings to ModalShell size="lg" with full Tailwind styling, preserved confirmDelete/currentOperation/isProcessingRef
- Migrated PayPalEnrichWizard to ModalShell size="lg" with AnimatePresence 3-step wizard (overview → selection → confirmation)
- Build: ✓ exit 0; Lint: ✓ exit 0; MOD-07 requirement marked complete

### Next Session Context
**Immediate next action:** Execute Plan 06-05 — wire AnimatePresence in App.jsx for all 7 modal exit animations

**What to know:**
- All 7 modals now use ModalShell — ConfirmModal, CategoryConflictResolver, ConflictResolver, ImportWizard, CategoryManager, SyncSettings, PayPalEnrichWizard
- ModalShell uses Dialog.Root open={true} — parent AnimatePresence controls mount/unmount lifecycle
- Each conditional modal render in App.jsx needs `<AnimatePresence>` wrapper for exit animations to play
- PayPalEnrichWizard's internal AnimatePresence is separate (step transitions) — App.jsx AnimatePresence handles mount/unmount

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
