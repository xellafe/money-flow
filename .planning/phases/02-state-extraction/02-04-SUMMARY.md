---
phase: 02-state-extraction
plan: "04"
subsystem: hooks
tags: [hook-extraction, import-logic, file-parsing, wizard, drag-drop, conflict-resolution]
dependency_graph:
  requires: [02-01, 02-02, 02-03]
  provides: [useImportLogic hook, complete hook barrel]
  affects: [src/App.jsx, src/hooks/index.js]
tech_stack:
  added: []
  patterns: [named-export hook, plain-object return, lazy constructor params]
key_files:
  created:
    - src/hooks/useImportLogic.js
  modified:
    - src/hooks/index.js
    - src/App.jsx
decisions:
  - "useImportLogic receives transactions/setTransactions/categories/importProfiles/setImportProfiles/showToast as constructor params — same pattern as useTransactionData and useCategories"
  - "confirmCategoryConflicts kept in App.jsx (cross-hook orchestration — needs setCategoryResolutions from useTransactionData AND setCategoryConflicts from useCategories)"
  - "confirmCategoryConflicts deps array fixed: added setCategoryResolutions, setTransactions, setCategoryConflicts (stable useState setters — no re-creation overhead)"
  - "isInitialized eslint-disable-next-line react-hooks/set-state-in-effect: gates first render frame, same accepted pattern as useFilters"
metrics:
  duration: "~15m"
  completed: "2026-03-17"
  tasks_completed: 1
  files_modified: 3
---

# Phase 2 Plan 04: Extract useImportLogic Hook — Summary

**One-liner:** useImportLogic extracted with XLSX parsing, profile auto-detect, wizard flow, conflict resolution, PayPal enrichment, and drag-drop — App.jsx reduced to pure orchestration (1603 lines).

## What Was Built

### `src/hooks/useImportLogic.js` (created)

The final and most complex hook extracted from App.jsx. Encapsulates all file import logic:

**State (5 variables):**
- `wizardData` — data passed to ImportWizard when profile can't be auto-detected
- `importConflicts` — pending conflict resolution state
- `paypalData` — PayPal CSV rows awaiting enrichment
- `dragOver` — drag-and-drop hover state
- `loading` — file parsing in-progress indicator

**Memo (1):**
- `allProfiles` — merges `BUILTIN_IMPORT_PROFILES` + custom `importProfiles`

**Callbacks (9):**
- `detectProfile` — auto-detect import format from column names
- `processRowsWithProfile` — parse XLSX rows using a profile, assigns categories via `categorize()`
- `processImportedTransactions` — dedup + conflict detection against existing transactions
- `handleFile` — main file handler (XLSX/CSV), tries multiple header rows, triggers wizard or direct import
- `handlePayPalFile` — reads PayPal CSV export, validates format
- `applyPayPalEnrichment` — applies PayPal descriptions to matched transactions
- `handleConflictResolve` — merges/replaces/adds transactions after conflict resolution
- `handleWizardConfirm` — saves new custom profile + imports via wizard-confirmed profile
- `onDrop` — drag-and-drop event handler

**Constructor params:** `{ transactions, setTransactions, categories, importProfiles, setImportProfiles, showToast }`

### `src/hooks/index.js` (updated)

Barrel now exports all 7 hooks:
```js
export { useGoogleDrive } from './useGoogleDrive';
export { useToast } from './useToast';
export { useModals } from './useModals';
export { useFilters } from './useFilters';
export { useCategories } from './useCategories';
export { useTransactionData } from './useTransactionData';
export { useImportLogic } from './useImportLogic';
```

### `src/App.jsx` (updated)

- Removed: `import * as XLSX from "xlsx"` — moved to useImportLogic
- Removed: `BUILTIN_IMPORT_PROFILES` from constants import — moved to useImportLogic
- Removed: `parseDate`, `parseAmount`, `categorize` from utils import — moved to useImportLogic
- Removed: 5 useState declarations (dragOver, loading, wizardData, importConflicts, paypalData)
- Removed: `allProfiles` useMemo + 9 callbacks (~307 lines of extracted logic)
- Added: `useImportLogic({...})` hook call with destructured return
- Fixed: `confirmCategoryConflicts` deps array (added missing stable setters)
- Added: `eslint-disable-next-line react-hooks/set-state-in-effect` on `setIsInitialized` effect
- **Line count: 1810 → 1603** (-207 lines)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed confirmCategoryConflicts missing deps causing preserve-manual-memoization errors**
- **Found during:** Task 1 lint run
- **Issue:** `confirmCategoryConflicts` had `[showToast]` deps but uses `setCategoryResolutions`, `setTransactions`, `setCategoryConflicts` — caused 3 React Compiler errors
- **Fix:** Added the three stable useState setter refs to deps array
- **Files modified:** src/App.jsx
- **Commit:** e0dbd4d

**2. [Rule 2 - Pre-existing] Added eslint-disable for setIsInitialized set-state-in-effect**
- **Found during:** Task 1 lint run
- **Issue:** `setIsInitialized(true)` in useEffect triggered `react-hooks/set-state-in-effect` error
- **Fix:** Added `// eslint-disable-next-line react-hooks/set-state-in-effect` — same accepted pattern as useFilters
- **Files modified:** src/App.jsx
- **Commit:** e0dbd4d

## Verification Results

- Build: ✓ 2368 modules, exit 0
- Lint: ✓ exit 0 (no errors, no warnings on modified files)
- App.jsx line count: 1603 (down from 1810)
- All 7 hooks exported from barrel

## Checkpoint Status

Task 2 (`checkpoint:human-verify`) is pending. Smoke test required before plan is marked complete.

## Self-Check: PASSED

- `src/hooks/useImportLogic.js` — FOUND
- `src/hooks/index.js` — FOUND (7 exports)
- `src/App.jsx` — FOUND (1603 lines, no XLSX import, no allProfiles useMemo)
- Commit e0dbd4d — FOUND
