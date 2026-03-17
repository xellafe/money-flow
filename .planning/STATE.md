---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-03-17T14:24:08.432Z"
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 6
  completed_plans: 3
  percent: 50
---

# Project State: MoneyFlow UI/UX Redesign

**Last Updated:** 2026-03-17 (plan 02-01 execution)

## Project Reference

**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

**Mission:** Transform MoneyFlow from custom CSS chaos (2,127-line App.jsx monolith) to a modern, maintainable UI/UX with Tailwind v4, preserving all existing functionality while introducing light clean minimal design (Notion/Apple inspiration).

**Current Focus:** Phase 2 — State Extraction (extract 7 custom hooks from App.jsx monolith)

## Current Position

**Active Phase:** Phase 2: State Extraction (in progress — 02-01 complete)
**Active Plan:** Phase 2 Plan 02 (02-02 — next)
**Status:** In progress
**Progress:** [█████░░░░░] 50%

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

### Todos

- [x] Plan Phase 1: Foundation & Setup ✓
- [x] Verify Tailwind v4 stability with Electron before starting Phase 1 ✓ (build passes)
- [x] Execute Plan 01-01: Tailwind v4 + design tokens + font setup ✓
- [x] Execute Plan 01-02: CSP / Electron security headers ✓
- [x] Execute Plan 02-01: Extract useToast + useModals hooks ✓
- [ ] Create localStorage backup hook implementation during Phase 2
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
- Plan 02-01 executed: useToast and useModals hooks extracted from App.jsx monolith
- src/hooks/useToast.js created: useState + useCallback showToast, returns { toast, setToast, showToast }
- src/hooks/useModals.js created: 9 modal/form state variables, pure state bag, zero logic
- src/hooks/index.js: barrel now exports all three hooks (useGoogleDrive, useToast, useModals)
- App.jsx: 10 inline useState declarations + 1 showToast useCallback removed; hook calls added
- Build passes (2364 modules, exit 0); lint exits 0 on modified files

### Next Session Context
**Immediate next action:** Execute Plan 02-02 — next hook extraction (useFilters, useTransactions, or useLocalStorage)

**What to know:**
- Phase 2 Plan 01 complete: useToast + useModals extracted (commits 9aac86c, 7c86edc)
- Hook extraction pattern established: named export function, returns plain object, barrel export
- Variable name preservation strategy confirmed: zero JSX changes needed when names are identical
- App.jsx still has ~5 more hooks to extract (useLocalStorage, useFilters, useTransactions, useImport, useCategories)
- Pre-existing exhaustive-deps warnings (5) in App.jsx for useModals setters — benign, accepted

### Environment State
- Working directory: `D:\Generale\budget-tracker`
- Git repository: 4 commits in phase-2 work
- Key files:
  - `src/hooks/useToast.js` — NEW: toast state + showToast callback
  - `src/hooks/useModals.js` — NEW: 9 modal/form state variables
  - `src/hooks/index.js` — Updated: exports useGoogleDrive, useToast, useModals
  - `src/App.jsx` — Modified: calls useToast() and useModals(), inline states removed

### Recent Changes
- **2026-03-17:** Plan 02-01 executed — useToast + useModals extracted (commits 9aac86c, 7c86edc)
- **2026-03-17:** Plan 01-02 executed — Electron CSP hardened, Google Fonts CDN removed, Phase 1 verified (commit 2823f84)
- **2026-03-17:** Plan 01-01 executed — Tailwind v4 + design tokens + Inter Variable font (commits 89a3022, 9249d6e)
- **2026-03-17:** Roadmap created with 7 phases
- **2026-03-17:** STATE.md initialized

---

*State tracking initialized: 2026-03-17*
