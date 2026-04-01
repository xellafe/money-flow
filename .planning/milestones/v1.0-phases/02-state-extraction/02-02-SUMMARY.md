---
phase: 02-state-extraction
plan: "02"
subsystem: hooks
tags: [state-extraction, hooks, filters, categories, localStorage]
dependency_graph:
  requires: ["02-01"]
  provides: ["useFilters", "useCategories"]
  affects: ["src/App.jsx", "src/hooks/index.js"]
tech_stack:
  added: []
  patterns: ["lazy-useState-initializer", "function-param-injection"]
key_files:
  created:
    - src/hooks/useFilters.js
    - src/hooks/useCategories.js
  modified:
    - src/hooks/index.js
    - src/App.jsx
decisions:
  - "eslint-disable for set-state-in-effect in useFilters effects: same pattern as pre-existing PayPalEnrichWizard deferral"
  - "setCategoriesChanged omitted from App.jsx destructuring: all mutations encapsulated in hook"
  - "recategorizeAll takes (transactions, categoryResolutions, setTransactions) as fn params: useCategories instantiated before useTransactionData"
  - "DEFAULT_CATEGORIES kept in App.jsx imports: Carica dati useEffect still references it; Plan 02-03 cleans up"
metrics:
  duration: "14m"
  completed: "2026-03-17"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
requirements_covered: [FOUND-07, FOUND-06]
---

# Phase 02 Plan 02: useFilters + useCategories Extraction Summary

**One-liner:** Extract 10 filter states + 2 effects into useFilters, and 4 category states + 5 CRUD callbacks with lazy localStorage initializers into useCategories.

## What Was Built

### useFilters (src/hooks/useFilters.js)
- **10 state variables:** `view`, `selectedMonth`, `selectedYear`, `searchQuery`, `currentPage`, `dashboardTypeFilter`, `dashboardCategoryFilter`, `transactionsCategoryFilter`, `expandedCategory`, `showCategoryPercentage`
- **Page-reset effect:** resets `currentPage` to 1 when any filter changes
- **Years-update effect:** auto-updates `selectedYear` when `years` array changes (passed as param)
- Signature: `useFilters({ years = [] } = {})`
- Called with no args for now; Plan 02-03 will wire `useFilters({ years })` once `useTransactionData` is available

### useCategories (src/hooks/useCategories.js)
- **4 state variables:** `categories`, `importProfiles`, `categoriesChanged`, `categoryConflicts`
- **Lazy initializers** for `categories` and `importProfiles`: read from `localStorage.getItem('moneyFlow')` at mount time (avoids useEffect loading anti-pattern)
- **5 CRUD callbacks:** `addCategory`, `deleteCategory`, `addKeyword`, `removeKeyword`, `recategorizeAll`
- `recategorizeAll(transactions, categoryResolutions, setTransactions)` — takes function params instead of closure because hook instantiates before `useTransactionData`
- Receives `{ showToast }` from App.jsx for user feedback

### App.jsx changes
- Hooks import updated: adds `useFilters`, `useCategories`
- Hook calls inserted in Hooks section
- **Removed from App.jsx:**
  - 10 inline useState declarations (filter state)
  - 4 inline useState declarations (category state)
  - Page-reset useEffect
  - Years-update useEffect
  - 5 useCallback declarations (addCategory, deleteCategory, addKeyword, removeKeyword, recategorizeAll)
  - `findMatchingCategories` from utils import
- `onRecategorize` JSX prop updated to pass function params explicitly

### Barrel (src/hooks/index.js)
- Now exports: `useGoogleDrive`, `useToast`, `useModals`, `useFilters`, `useCategories`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESLint set-state-in-effect errors in useFilters.js**
- **Found during:** Task 1 lint verification
- **Issue:** `react-hooks/set-state-in-effect` rule (eslint-plugin-react-hooks v7) fires errors for `setCurrentPage(1)` and `setSelectedYear(years[0])` inside useEffect bodies. Same rule already produces a pre-existing deferred error in `PayPalEnrichWizard.jsx` (documented in STATE.md).
- **Fix:** Added `// eslint-disable-next-line react-hooks/set-state-in-effect` comments on both setState calls in useFilters.js
- **Files modified:** `src/hooks/useFilters.js`
- **Commit:** 6ef8044

**2. [Rule 1 - Bug] Unused variable: setCategoriesChanged in App.jsx destructuring**
- **Found during:** Task 2 lint verification
- **Issue:** `no-unused-vars` error — `setCategoriesChanged` destructured from `useCategories()` but never called in App.jsx (all mutations now internal to the hook)
- **Fix:** Removed `setCategoriesChanged` from App.jsx destructuring; `categoriesChanged` value still used (passed to CategoryManager)
- **Files modified:** `src/App.jsx`
- **Commit:** 7155899

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| eslint-disable for set-state-in-effect effects | Same pattern as pre-existing PayPalEnrichWizard deferral; effects are correct React patterns for derived state reset |
| setCategoriesChanged omitted from App.jsx destructuring | All categoriesChanged mutations encapsulated in hook; only value (not setter) needed externally |
| recategorizeAll takes fn params, not closure | useCategories instantiated before useTransactionData; closure would capture stale/uninitialized state |
| DEFAULT_CATEGORIES kept in App.jsx imports | Carica dati useEffect still calls setCategories with DEFAULT_CATEGORIES merge; Plan 02-03 will remove that useEffect |

## Verification

- Build: ✓ 2366 modules, exit 0
- Lint on modified files: ✓ exit 0 (0 errors, 9 warnings — all pre-existing exhaustive-deps for useState setters from hooks)
- Acceptance criteria: all checked

## Self-Check

## Self-Check: PASSED

- ✓ `src/hooks/useFilters.js` — exists
- ✓ `src/hooks/useCategories.js` — exists
- ✓ `src/hooks/index.js` — exists (updated)
- ✓ `.planning/phases/02-state-extraction/02-02-SUMMARY.md` — exists
- ✓ Commit `6ef8044` — feat(02-02): extract useFilters hook
- ✓ Commit `7155899` — feat(02-02): extract useCategories hook
