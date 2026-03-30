---
phase: 08-v1-cleanup
plan: "01"
subsystem: codebase-cleanup
tags: [cleanup, dead-code, ux, documentation, tech-debt]
dependency_graph:
  requires: []
  provides: [clean-hooks, simplified-app-logic, barrel-imports, requirements-complete]
  affects: [useFilters, useModals, App.jsx, DashboardView, SettingsView, AddTransactionModal, REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: [barrel-import, dead-state-removal, null-guard-simplification]
key_files:
  created: []
  modified:
    - src/views/SettingsView.jsx
    - src/hooks/useFilters.js
    - src/hooks/useModals.js
    - src/App.jsx
    - src/views/DashboardView.jsx
    - src/components/modals/AddTransactionModal.jsx
    - .planning/REQUIREMENTS.md
decisions:
  - "selectedYear is always number (initialized to new Date().getFullYear(), never set to null) — all null guards removed"
  - "FOUND-11 closed via Electron runtime backup (backupDataRef + electronAPI.onRequestBackupData) satisfying data-safety intent"
  - "2 pre-existing selectedYear !== null occurrences in AreaChartCard.jsx and TransactionFilterBar.jsx deferred to v1.1 (out of scope)"
metrics:
  duration: "12m"
  completed: "2026-03-27"
  tasks: 2
  files: 7
---

# Phase 08 Plan 01: v1 Cleanup Summary

**One-liner:** Closed all 5 v1 tech-debt items: cursor-pointer on settings buttons, 4 dead state pairs removed from hooks, 7 selectedYear null guards eliminated from App.jsx, DashboardView period label simplified, AddTransactionModal barrel import normalized, and FOUND-11 requirement marked complete.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Code cleanup — cursor, dead state, null guards, barrel import | deca533 | SettingsView.jsx, useFilters.js, useModals.js, App.jsx, DashboardView.jsx, AddTransactionModal.jsx |
| 2 | Documentation closure — FOUND-11 checkbox + traceability | 610fc2f | .planning/REQUIREMENTS.md |

## What Was Built

### Task 1: Source Code Cleanup

**SettingsView.jsx (UX-06 gap):**
- Added `cursor-pointer` to both settings buttons (Gestione Categorie, Sincronizzazione Drive)

**useFilters.js:**
- Removed 3 dead `useState` pairs: `dashboardTypeFilter`, `expandedCategory`, `showCategoryPercentage`
- These state variables had no external consumers — verified via grep before editing

**useModals.js:**
- Removed 1 dead `useState` pair: `openDropdown`
- No external consumers confirmed

**App.jsx (7 locations):**
- Location 1: `stats` useMemo — `filtered` ternary collapsed to direct filter
- Location 2: `stats` useMemo — `monthlyFiltered` ternary collapsed to direct filter
- Location 3: Previous period guard — removed `&& selectedYear !== null` (always true)
- Location 4: `availableMonths` useMemo — `base` ternary collapsed to direct filter
- Location 5: `handlePrevYear` — removed `?? new Date().getFullYear()` null-coalescing
- Location 6: `handleNextYear` — removed `?? new Date().getFullYear()` null-coalescing
- Location 7: `handleSelectMonth` — removed `if (selectedYear === null)` dead branch; simplified deps array

**DashboardView.jsx:**
- JSDoc updated: `selectedYear: number|null` → `selectedYear: number`
- Period label: 3-branch ternary (`month+year / year / 'Tutti gli anni'`) simplified to 2-branch (month+year / year)

**AddTransactionModal.jsx:**
- Import changed from `import ModalShell from '../ui/ModalShell'` to `import { ModalShell } from '../ui'`
- Consistent with barrel export pattern established in Plan 06-01

### Task 2: REQUIREMENTS.md Closure

- FOUND-11 checkbox: `[ ]` → `[x]` with inline rationale referencing `backupDataRef` + `electronAPI.onRequestBackupData`
- FOUND-11 traceability table: `Pending` → `Complete`
- FOUND-04 traceability: already `Complete` — no change needed
- 47/47 v1 requirements now satisfied

## Deviations from Plan

None for targeted files — plan executed exactly as written.

**Deferred (out of scope):** 2 pre-existing `selectedYear !== null` patterns found in non-targeted files:
- `src/components/dashboard/AreaChartCard.jsx` line 63
- `src/components/transactions/TransactionFilterBar.jsx` line 73

These files are not in the plan's `files_modified` list. Logged to `deferred-items.md` per scope boundary rules.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vite build` | ✅ exit 0 (built in 3.91s) |
| `npx eslint` on all 6 source files | ✅ exit 0 |
| `cursor-pointer` count in SettingsView | ✅ 2 |
| `dashboardTypeFilter` in useFilters | ✅ 0 matches |
| `expandedCategory` in useFilters | ✅ 0 matches |
| `showCategoryPercentage` in useFilters | ✅ 0 matches |
| `openDropdown` in useModals | ✅ 0 matches |
| `selectedYear !== null` in App.jsx | ✅ 0 matches |
| `selectedYear === null` in App.jsx | ✅ 0 matches |
| `y ?? new Date` in App.jsx | ✅ 0 matches |
| `Tutti gli anni` in DashboardView | ✅ 0 matches |
| `selectedYear: number,` in DashboardView | ✅ 1 match |
| Barrel import in AddTransactionModal | ✅ `import { ModalShell } from '../ui'` |
| FOUND-11 `[x]` in REQUIREMENTS.md | ✅ Confirmed |
| FOUND-11 `Complete` in traceability | ✅ Confirmed |
| FOUND-04 `Complete` in traceability | ✅ Confirmed |

## Self-Check: PASSED

All committed files exist and are verified. Build passes. Lint passes. All acceptance criteria met.
