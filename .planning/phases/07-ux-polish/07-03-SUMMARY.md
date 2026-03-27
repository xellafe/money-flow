---
phase: 07-ux-polish
plan: "03"
subsystem: app-wiring
tags: [page-transitions, animate-presence, framer-motion, modal-wiring, toast, css-cleanup, ux-polish]
dependency_graph:
  requires:
    - 07-01 (Toast.jsx, DashboardEmptyState, DashboardView hasTransactions/onImport)
    - 07-02 (AddTransactionModal, AppHeader always-visible button)
  provides:
    - page-transitions-animate-presence
    - add-transaction-modal-wired
    - animated-toast-exit
  affects:
    - src/App.jsx
    - src/App.css
    - src/hooks/useToast.js
    - src/components/transactions/TransactionRow.jsx
tech_stack:
  added: []
  patterns:
    - AnimatePresence mode="wait" with motion.div key={view} for page fade transitions
    - AnimatePresence wrapper for modal mount/unmount lifecycle
    - Toast keyed by stable id (Date.now() in showToast, not in render)
key_files:
  created: []
  modified:
    - src/App.jsx
    - src/App.css
    - src/hooks/useToast.js
    - src/components/transactions/TransactionRow.jsx
decisions:
  - "Page transitions: AnimatePresence mode='wait' + motion.div key={view}, 150ms opacity fade"
  - "Toast key stability: id moved to showToast (Date.now() at call time), not JSX render — prevents react-hooks/purity lint error"
  - "Drop-zone block removed — DashboardEmptyState (Plan 01) handles empty state; Google Drive restore surfaces via SyncSettings modal"
  - "addManualTransaction and showAddTransaction restored to App.jsx destructuring (were removed in Plan 05, needed by AddTransactionModal)"
metrics:
  duration: 15m
  completed_date: "2026-03-27"
  tasks_completed: 4
  files_modified: 4
requirements_satisfied:
  - UX-01
  - UX-06
  - UX-07
---

# Phase 07 Plan 03: App Wiring — Page Transitions, Modal/Toast AnimatePresence, CSS Cleanup

**One-liner:** App.jsx wired with AnimatePresence mode="wait" page transitions (150ms fade), AddTransactionModal connected with showAddTransaction/addManualTransaction, Toast wrapped in AnimatePresence for exit animation, legacy .toast CSS removed.

## What Was Built

### Task 1: Page Transitions with AnimatePresence (src/App.jsx)

- Added `motion` to framer-motion import
- Added `showAddTransaction` to `useModals()` destructuring
- Added `addManualTransaction` to `useTransactionData()` destructuring
- **Removed the entire drop-zone block** (~165 lines: drag-over handler + Google Drive restore UI) — now handled by `DashboardEmptyState` component
- Wrapped all three views (dashboard/transactions/settings) in `<AnimatePresence mode="wait">` + `<motion.div key={view}>` with 150ms opacity fade
- `DashboardView` now always rendered when `view === 'dashboard'` (removed `transactions.length > 0 &&` guard)
- Added `hasTransactions={transactions.length > 0}` and `onImport={() => document.getElementById('file-input')?.click()}` props to DashboardView

### Task 2: Wire Toast + AddTransactionModal with AnimatePresence (src/App.jsx)

- Imported `AddTransactionModal` from `./components/modals/AddTransactionModal`
- Added `<AnimatePresence>` block for `{showAddTransaction && <AddTransactionModal ...>}` with `newTransaction`, `setNewTransaction`, `onConfirm={addManualTransaction}`, `categories={Object.keys(categories)}` props
- Wrapped Toast in `<AnimatePresence mode="wait">` with `key={toast.id}` for proper re-mount on new messages

### Task 3: Remove Legacy .toast CSS (src/App.css)

- Removed `.toast`, `.toast.success`, `.toast.error` rule blocks (~24 lines)
- Toast component is now entirely Tailwind-styled via `motion.div` (done in Plan 01)

### Task 4: Cursor Pointer Audit

- **AppHeader.jsx**: All 5 interactive buttons already had `cursor-pointer transition-colors` ✓
- **Sidebar.jsx**: Nav items + toggle already had `cursor-pointer transition-colors duration-150` ✓
- **TransactionRow.jsx**: Added `cursor-pointer` to delete button (was missing explicit declaration)
- **DashboardStatCard.jsx**: `cursor-default` intentional — display-only card, not interactive

## Verification

- `npm run build` → exit 0 ✓ (2844 modules transformed)
- `npm run lint` → exit 0 ✓ (all 6 target files clean)
- All acceptance criteria verified via grep

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Unused imports caused lint failures after drop-zone removal**
- **Found during:** Task 1 verification (lint check)
- **Issue:** Removing the drop-zone block left ~14 unused imports: all recharts components, multiple lucide icons (`Upload`, `TrendingUp`, `TrendingDown`, `Download`, `FileSpreadsheet`, `X`, `Check`, `Loader2`, `Plus`, `ChevronDown`, `Cloud`), `StatCard`, `GoogleSignInButton`, `COLORS`, `ITEMS_PER_PAGE`
- **Fix:** Removed all unused imports from App.jsx; kept `DEFAULT_CATEGORIES`, `MONTHS_IT` (still used in stats calculation)
- **Files modified:** `src/App.jsx`
- **Commit:** 21da566

**2. [Rule 1 - Bug] `Date.now()` in JSX key violates react-hooks/purity**
- **Found during:** Task 2 lint check
- **Issue:** `key={toast.message + (toast.timestamp || Date.now())}` triggers `react-hooks/purity` error — impure function call during render
- **Fix:** Added `id: Date.now()` to `showToast()` in `useToast.js` (called at event time, not render time); used `key={toast.id}` in App.jsx
- **Files modified:** `src/hooks/useToast.js`, `src/App.jsx`
- **Commit:** 21da566

**3. [Rule 3 - Blocking] Unused destructured vars from useImportLogic**
- **Found during:** Task 1/lint check
- **Issue:** `dragOver`, `setDragOver`, `loading`, `onDrop` from `useImportLogic` destructuring were only used by the drop-zone block we removed
- **Fix:** Removed from destructuring in App.jsx
- **Files modified:** `src/App.jsx`
- **Commit:** 21da566

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | ef337ed | feat(07-03): add page transitions with AnimatePresence + wire DashboardView props |
| Task 2 | 958c07c | feat(07-03): wire AddTransactionModal and wrap Toast in AnimatePresence |
| Task 3 | 52bd7ac | fix(07-03): remove legacy .toast CSS rules from App.css |
| Task 4 | 37a81f8 | fix(07-03): add cursor-pointer to TransactionRow delete button |
| Deviations | 21da566 | fix(07-03): remove unused imports and fix Toast key purity |

## Self-Check

- `src/App.jsx` ✓ modified
- `src/App.css` ✓ modified
- `src/hooks/useToast.js` ✓ modified
- `src/components/transactions/TransactionRow.jsx` ✓ modified
- Commits ef337ed, 958c07c, 52bd7ac, 37a81f8, 21da566 ✓ present in git log
- Build exit 0 ✓
- Lint exit 0 ✓

## Self-Check: PASSED
