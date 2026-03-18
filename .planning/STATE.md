---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-03-18T10:16:03.971Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 8
  completed_plans: 7
  percent: 88
---

# Project State: MoneyFlow UI/UX Redesign

**Last Updated:** 2026-03-17 (plan 02-04 execution)

## Project Reference

**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

**Mission:** Transform MoneyFlow from custom CSS chaos (2,127-line App.jsx monolith) to a modern, maintainable UI/UX with Tailwind v4, preserving all existing functionality while introducing light clean minimal design (Notion/Apple inspiration).

**Current Focus:** Phase 3 — Navigation Layout IN PROGRESS (Plan 01 complete: framer-motion, useViewState, brand-600)

## Current Position

**Active Phase:** Phase 3: Navigation Layout — IN PROGRESS (Plan 01 complete)
**Active Plan:** Phase 3 Plan 01 (03-01 — COMPLETE)
**Status:** Ready for 03-02
**Progress:** [█████████░] 88%

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
| Phase 03-navigation-layout PP01 | 12m | 2 tasks | 7 files |

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
| 2026-03-17 | Empty catch blocks in useViewState use /* ignore */ comment per project no-empty rule convention | Consistent with defensive localStorage access pattern; no-empty lint rule requires comment in empty catch | ✓ Implemented |

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
- [ ] Test Recharts + Tailwind CSS variable integration proof-of-concept during Phase 5 planning
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
| Recharts doesn't redraw on Electron window resize | Medium | Force remount on debounced resize; add Electron-specific resize handler | Phase 4 |
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
- Plan 02-04 COMPLETE: useImportLogic hook extracted + human smoke test approved (all 13 checks passed)
- All 6 hooks extracted from App.jsx: useToast, useModals, useFilters, useCategories, useTransactionData, useImportLogic
- Phase 2 (State Extraction) is now COMPLETE
- src/App.jsx reduced from 2127 → 1603 lines; pure orchestration file
- Build: ✓ 2368 modules, exit 0; Lint: ✓ exit 0

### Next Session Context
**Immediate next action:** Begin Phase 3 (Layout & Navigation)

**What to know:**
- Phase 2 Plans 01 + 02 + 03 + 04 (Task 1) complete: 6 hooks extracted (useToast, useModals, useFilters, useCategories, useTransactionData, useImportLogic)
- Hook extraction pattern established: named export, returns plain object, barrel export
- App.jsx reduced from 2127 → 1603 lines; now orchestration-only
- All 7 hooks in barrel: useGoogleDrive + 6 new
- Smoke test must pass before plan is marked complete

**What to know:**
- Phase 2 Plans 01 + 02 + 03 complete: 5 hooks extracted (useToast, useModals, useFilters, useCategories, useTransactionData)
- Hook extraction pattern established: named export, returns plain object, barrel export
- Variable name preservation strategy: zero JSX changes needed when names are identical
- App.jsx still has 1 more hook to extract (useImport in Plan 02-04)
- XLSX import still in App.jsx — handleFile/handlePayPalFile use it; will move with useImport
- Pre-existing exhaustive-deps warnings (5) in App.jsx — benign, accepted

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
