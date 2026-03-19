---
phase: 05-transaction-list-redesign
plan: "03"
subsystem: transactions-view
tags: [transactions, view, sorting, pagination, framer-motion, tailwind]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [TransactionsView]
  affects: [App.jsx]
tech_stack:
  added: []
  patterns:
    - 3-state sort toggle (ASC → DESC → reset)
    - AnimatePresence popLayout for row animations
    - Persistent hidden file input for import CTA
key_files:
  created:
    - src/views/TransactionsView.jsx
  modified:
    - src/App.jsx
decisions:
  - "Categoria sort removed per Decision A stacked layout — only Date + Importo sortable (TRNS-02)"
  - "Hidden file-input (id=file-input) added unconditionally in App.jsx — persists in DOM for empty state CTA"
  - "showAddTransaction and addManualTransaction removed from App.jsx — add transaction form removed with inline list; to resurface in future plan"
metrics:
  duration: 12m
  completed: "2026-03-19"
  tasks: 2
  files: 2
---

# Phase 5 Plan 03: TransactionsView Assembly Summary

**One-liner:** TransactionsView assembled with sortable sticky header, AnimatePresence pagination, and empty state; wired into App.jsx replacing ~100-line inline transaction list.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Create TransactionsView component | 529772b | ✅ |
| 2 | Wire TransactionsView into App.jsx | f1080e8 | ✅ |

## What Was Built

### TransactionsView (src/views/TransactionsView.jsx)
- **SortableHeader** sub-component: 3-state toggle (ASC → DESC → reset to date/desc), ChevronUp/ChevronDown/ArrowUpDown icons, aria-sort attribute
- **EmptyState** sub-component: two variants — `Inbox` icon (no transactions) vs `SearchX` icon (filtered to empty); primary/secondary CTA buttons
- **PaginationBar** sub-component: Italian locale number formatting (`toLocaleString('it-IT')`), hidden when ≤50 items
- **Sort logic**: `sortColumn === 'date'` and `sortColumn === 'amount'` only; Categoria sort intentionally absent per Decision A
- **AnimatePresence** `initial={false} mode="popLayout"` for row entry/exit animations
- **Sticky header**: `sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm`
- **Grid layout**: `grid grid-cols-[1fr_120px_40px]` matching stacked TransactionRow layout
- **Scroll container**: `flex-1 overflow-y-auto min-h-0` (min-h-0 critical for flex overflow)

### App.jsx Updates
- Added `import { TransactionsView } from './views/TransactionsView'`
- Added `sortColumn, setSortColumn, sortDirection, setSortDirection` to `useFilters` destructuring
- Replaced `{view === "transactions" && <div className="card card-fullheight">...</div>}` (~100 lines) with `<TransactionsView ...props />`
- Added persistent `<input id="file-input" type="file" style={{display:'none'}} ...>` for empty state import CTA
- Removed unused imports: `Search`, `Tag`, `Trash2`, `formatCurrency`
- Removed unused destructured vars: `showAddTransaction`, `addManualTransaction`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] No `id="file-input"` existed in App.jsx**
- **Found during:** Task 2
- **Issue:** Plan referenced `document.getElementById('file-input')?.click()` but no such element existed; the existing file input was inside the conditional `{transactions.length === 0 && ...}` drop zone (not in DOM when transactions present)
- **Fix:** Added a persistent hidden `<input id="file-input">` outside all conditionals, always in DOM
- **Files modified:** src/App.jsx
- **Commit:** f1080e8

**2. [Rule 1 - Bug] Unused vars from removed inline transaction form caused lint errors**
- **Found during:** Task 2
- **Issue:** Removing the inline transaction list also removed the add-transaction form, making `showAddTransaction`, `addManualTransaction`, `formatCurrency`, `Search`, `Tag`, `Trash2` unused
- **Fix:** Removed all unused destructured vars and imports; `setShowAddTransaction` kept (still used in AppLayout `onAddTransaction` prop and `useTransactionData` params)
- **Files modified:** src/App.jsx
- **Commit:** f1080e8

## Verification

- ✅ `npm run lint` (via `node node_modules/eslint/bin/eslint.js`) — exit 0
- ✅ `npm run build` (via `node node_modules/vite/bin/vite.js build`) — exit 0, 2785 modules transformed
- ⏳ Electron smoke test — pending human verification

## Self-Check: PASSED

- [x] `src/views/TransactionsView.jsx` exists: FOUND
- [x] Commit 529772b exists: FOUND
- [x] Commit f1080e8 exists: FOUND
