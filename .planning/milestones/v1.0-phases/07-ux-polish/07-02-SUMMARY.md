---
phase: 07-ux-polish
plan: "02"
subsystem: modals-ux
tags: [modal, add-transaction, header, ux, form]
dependency_graph:
  requires: [ModalShell, useModals, useTransactionData]
  provides: [AddTransactionModal, always-visible-aggiungi-button]
  affects: [App.jsx]
tech_stack:
  added: []
  patterns: [ModalShell wrapper, controlled-form, disabled-submit-validation]
key_files:
  created:
    - src/components/modals/AddTransactionModal.jsx
  modified:
    - src/components/layout/AppHeader.jsx
decisions:
  - "AddTransactionModal: onConfirm() takes no args — addManualTransaction reads newTransaction state directly"
  - "AppHeader Aggiungi button unconditional — visible on dashboard, transactions, settings"
  - "Button style upgraded to bg-brand-600/hover:bg-brand-700 per CONTEXT.md Decision B"
metrics:
  duration: 8m
  completed_date: "2026-03-26"
  tasks: 2
  files: 2
---

# Phase 07 Plan 02: AddTransactionModal + AppHeader Always-Visible Button Summary

**One-liner:** AddTransactionModal with 4-field form (ModalShell size=sm) + AppHeader Aggiungi button unconditional on all views.

## What Was Built

### AddTransactionModal (`src/components/modals/AddTransactionModal.jsx`)
New modal component for manually creating transactions:
- Wraps `ModalShell` with `title="Nuova transazione"` and `size="sm"` (max-w-md)
- 4 form fields: `date` (defaults to today via useEffect), `importo` (text with `inputMode="decimal"`), `descrizione` (required), `categoria` (select)
- `isValid` gates the primary button: `disabled={!isValid}` — true only when `description.trim().length > 0`
- Categories sorted alphabetically with "Altro" forced to end via `localeCompare('it')`
- Form `onSubmit` calls `onConfirm()` — `addManualTransaction` reads `newTransaction` state directly, no args needed
- Primary button: `bg-brand-600 hover:bg-brand-700` / Cancel: `bg-gray-100 hover:bg-gray-200`

### AppHeader update (`src/components/layout/AppHeader.jsx`)
- **Removed** `{view === 'transactions' && (...)}` conditional wrapper around Aggiungi button
- Button now renders unconditionally on all views (dashboard, transactions, settings)
- Label shortened: "Aggiungi transazione" → "Aggiungi"
- Style updated: `bg-brand-500 hover:bg-brand-600` → `bg-brand-600 hover:bg-brand-700`
- Added `aria-label="Aggiungi transazione"` for accessibility
- Period selector row (`dashboard || transactions` guard) left intact — only affects date filter UI

## Verification

- `npm run build` (via `node node_modules/vite/bin/vite.js build`) exits 0 — 2843 modules transformed, no errors
- All acceptance criteria verified via grep

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | e2560f5 | feat(07-02): create AddTransactionModal component |
| Task 2 | 70a66a4 | feat(07-02): make AppHeader Aggiungi button always visible on all views |

## Next Step

Plan 07-03: Wire AddTransactionModal into App.jsx with AnimatePresence, connect `showAddTransaction` / `setNewTransaction` / `addManualTransaction`.

## Self-Check: PASSED

- `src/components/modals/AddTransactionModal.jsx` ✓ exists
- `src/components/layout/AppHeader.jsx` ✓ updated (no conditional around button)
- Commits e2560f5 and 70a66a4 ✓ present in git log
- Build exit 0 ✓
