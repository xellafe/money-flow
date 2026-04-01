---
phase: 06-modals-redesign
plan: "05"
subsystem: App.jsx
tags: [framer-motion, AnimatePresence, modals, exit-animations, SettingsView]
dependency_graph:
  requires: [06-01, 06-02, 06-03, 06-04]
  provides: [modal-exit-animations, settings-modal-triggers]
  affects: [src/App.jsx]
tech_stack:
  added: []
  patterns: [AnimatePresence-wrapper-per-modal, conditional-key-prop, settings-prop-threading]
key_files:
  created: []
  modified:
    - src/App.jsx
decisions:
  - "AnimatePresence wraps each modal conditional individually (not a single root wrapper) — each modal has its own lifecycle control"
  - "SettingsView receives onShowCategoryManager/onShowSyncSettings as arrow functions calling setters directly"
metrics:
  duration: 5m
  completed: "2026-03-19"
  tasks: 3
  files: 1
requirements: [MOD-01, MOD-02]
---

# Phase 6 Plan 05: AnimatePresence Wiring + SettingsView Props Summary

**One-liner:** Wired AnimatePresence around all 7 modal conditionals in App.jsx and connected SettingsView buttons to modal state via onShowCategoryManager/onShowSyncSettings props.

## What Was Built

App.jsx now has:
- `import { AnimatePresence } from 'framer-motion'` at the top
- 7 individual `<AnimatePresence>` wrappers — one per modal conditional render
- Each modal has a unique `key` prop for AnimatePresence tracking
- `<SettingsView>` receives `onShowCategoryManager` and `onShowSyncSettings` props

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add AnimatePresence import | a94e600 | src/App.jsx |
| 2 | Wrap all 7 modals with AnimatePresence | d7cb2db | src/App.jsx |
| 3 | Pass modal trigger props to SettingsView | 94da142 | src/App.jsx |

## Modal AnimatePresence Keys

| Modal | Condition | Key |
|-------|-----------|-----|
| CategoryManager | showCategoryManager | category-manager |
| SyncSettings | showSyncSettings | sync-settings |
| PayPalEnrichWizard | paypalData | paypal-enrich-wizard |
| ConfirmModal | confirmDelete | confirm-modal |
| ImportWizard | wizardData | import-wizard |
| ConflictResolver | importConflicts | conflict-resolver |
| CategoryConflictResolver | categoryConflicts | category-conflict-resolver |

## Verification

- ✅ Build: `vite build` exits 0 (2841 modules transformed)
- ✅ Lint: `eslint src/App.jsx` exits 0 (no errors)
- ✅ AnimatePresence count: 7 wrappers confirmed
- ✅ SettingsView props: onShowCategoryManager + onShowSyncSettings present

## Deviations from Plan

None — plan executed exactly as written.

## Phase 6 Completion

All 7 modals now have:
- ✅ ModalShell wrapper (Plans 02-04: Radix Dialog + Framer Motion enter animation)
- ✅ AnimatePresence for exit animations (this plan: plays 150ms exit before unmount)
- ✅ Consistent Tailwind styling
- ✅ Radix a11y (focus trap, ESC, backdrop click)
- ✅ SettingsView buttons wired to CategoryManager + SyncSettings modals

## Self-Check: PASSED

- [x] `src/App.jsx` modified with AnimatePresence import + 7 wrappers + SettingsView props
- [x] Commit a94e600 exists (AnimatePresence import)
- [x] Commit d7cb2db exists (7 AnimatePresence wrappers)
- [x] Commit 94da142 exists (SettingsView props)
