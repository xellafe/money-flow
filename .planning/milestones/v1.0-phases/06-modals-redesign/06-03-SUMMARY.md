---
phase: 06-modals-redesign
plan: "03"
subsystem: modals
tags: [modal, tailwind, import-wizard, category-manager, settings-view]
dependency_graph:
  requires: [06-01]
  provides: [ImportWizard-ModalShell, CategoryManager-ModalShell, SettingsView-buttons]
  affects: [App.jsx, src/views/SettingsView.jsx]
tech_stack:
  added: []
  patterns: [ModalShell-wrapper, Tailwind-form-styling, amber-banner-for-state, grid-category-layout]
key_files:
  created: []
  modified:
    - src/components/modals/ImportWizard.jsx
    - src/components/modals/CategoryManager.jsx
    - src/views/SettingsView.jsx
decisions:
  - "CategoryManager recategorize button moved into amber banner (bg-amber-50) — cleaner UX, contextual action only shown when categories changed"
  - "AlertCircle import removed from CategoryManager — amber banner provides sufficient visual affordance without icon"
  - "SettingsView props are onShowCategoryManager / onShowSyncSettings — consistent with App.jsx useModals naming convention"
metrics:
  duration: 12m
  completed: "2026-03-19"
  tasks: 3
  files: 3
requirements: [MOD-05, MOD-06]
---

# Phase 6 Plan 03: ImportWizard + CategoryManager + SettingsView Buttons Summary

**One-liner:** Migrated ImportWizard and CategoryManager to ModalShell with Tailwind form/grid styling; extended SettingsView with two functional modal trigger buttons.

## What Was Built

### Task 1: ImportWizard → ModalShell (commit `6daf36d`)
- Replaced `<div className="modal-overlay">` wrapper with `<ModalShell title="Importa transazioni" onClose={onCancel} size="lg">`
- Removed `Settings` icon import and old `modal-title` h3 (ModalShell provides header)
- Styled all form fields with `space-y-4`, `focus:ring-brand-500`, `focus:border-brand-500`
- Styled selects with `bg-white rounded-lg border border-gray-200`
- Styled radio group with `flex gap-4 accent-brand-600`
- Styled preview table with `overflow-x-auto rounded-lg border border-gray-200`
- Footer buttons: secondary `bg-gray-100` + primary `bg-brand-600 disabled:opacity-50`
- Removed all `.wizard-form`, `.wizard-field`, `.modal-actions`, `.btn-cancel`, `.btn-primary` class names

### Task 2: CategoryManager → ModalShell (commit `e3e04f5`)
- Replaced `<div className="modal-overlay">` wrapper with `<ModalShell title="Gestione Categorie" onClose={onClose} size="lg">`
- Removed `AlertCircle` import — replaced with amber banner pattern for `categoriesChanged`
- Category grid: `grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`
- Category cards: `p-4 bg-gray-50 rounded-lg border border-gray-200`
- Keyword tags: `inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm`
- Amber recategorize banner: `p-4 bg-amber-50 border border-amber-200 rounded-lg`
- Removed `.categories-grid`, `.category-card`, `.keyword-tag`, `.btn-delete`, `.search-input`

### Task 3: SettingsView with modal buttons (commit `f69ae84`)
- Added `onShowCategoryManager` and `onShowSyncSettings` props
- Two labeled sections with `uppercase tracking-wider` headings
- "Gestione Categorie" → `onClick={onShowCategoryManager}`
- "Sincronizzazione Drive" → `onClick={onShowSyncSettings}`
- Secondary button style: `bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium`

## Verification

- **Build:** ✓ exit 0 (`node node_modules/vite/bin/vite.js build` — 2841 modules, 14.84s)
- **Lint:** ✓ exit 0 on all three modified files
- **Acceptance criteria:** All checklist items passed for all three tasks

## Deviations from Plan

None — plan executed exactly as written.

### Notes

- `amountType` radio value kept as `'split'` (not `'separate'`) — matches existing business logic in the component; plan copy "Entrate/Uscite separate" is display text only
- CategoryManager keyword-add button uses icon-only `<Plus>` to fit compact card layout — functionally equivalent to plan spec

## Commits

| Hash | Description |
|------|-------------|
| `6daf36d` | feat(06-03): migrate ImportWizard to ModalShell with Tailwind form styling |
| `e3e04f5` | feat(06-03): migrate CategoryManager to ModalShell with grid layout |
| `f69ae84` | feat(06-03): extend SettingsView with modal trigger buttons |

## Self-Check: PASSED

- [x] `src/components/modals/ImportWizard.jsx` — contains `ModalShell`, `focus:ring-brand-500`, `disabled:opacity-50`, no `modal-overlay`
- [x] `src/components/modals/CategoryManager.jsx` — contains `ModalShell`, `grid grid-cols-1 md:grid-cols-2 gap-4`, `focus:ring-brand-500`, no `categories-grid`
- [x] `src/views/SettingsView.jsx` — contains `onShowCategoryManager`, `onShowSyncSettings`, "Gestione Categorie", "Sincronizzazione Drive"
- [x] Commits `6daf36d`, `e3e04f5`, `f69ae84` — verified in git log
