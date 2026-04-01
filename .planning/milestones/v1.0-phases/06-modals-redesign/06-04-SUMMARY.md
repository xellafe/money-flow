---
phase: 06-modals-redesign
plan: "04"
subsystem: modals
tags: [modal, tailwind, framer-motion, radix-ui, animation, wizard]
dependency_graph:
  requires: [06-01-ModalShell-foundation]
  provides: [SyncSettings-migrated, PayPalEnrichWizard-migrated]
  affects: [App.jsx-AnimatePresence-wiring]
tech_stack:
  added: [AnimatePresence step animations]
  patterns: [ModalShell-wrapper, AnimatePresence-mode-wait, stepVariants-custom, anti-spam-ref]
key_files:
  modified:
    - src/components/modals/SyncSettings.jsx
    - src/components/modals/PayPalEnrichWizard.jsx
decisions:
  - "SyncSettings preserves confirmDelete (local drive-backup state) + currentOperation + isProcessingRef anti-spam pattern"
  - "PayPalEnrichWizard restructured as 3-step wizard: overview -> selection table -> confirmation"
  - "stepVariants use custom={direction} prop to reverse slide direction (1=forward, -1=back)"
  - "Lint warning at line ~200 (react-hooks/set-state-in-effect) preserved per plan - eslint-disable comment retained"
metrics:
  duration: 5m
  completed: "2026-03-19"
  tasks: 2
  files_modified: 2
---

# Phase 6 Plan 04: SyncSettings + PayPalEnrichWizard Migration Summary

**One-liner:** SyncSettings and PayPalEnrichWizard migrated to ModalShell with Tailwind styling; PayPalEnrichWizard adds 3-step AnimatePresence horizontal slide wizard with direction-aware transitions.

---

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Migrate SyncSettings to ModalShell | 196c765 | SyncSettings.jsx |
| 2 | Migrate PayPalEnrichWizard to ModalShell + AnimatePresence | 25e2d62 | PayPalEnrichWizard.jsx |

---

## What Was Built

### Task 1 — SyncSettings Migration

- Replaced `modal-overlay`/`modal` DOM structure with `<ModalShell title="Sincronizzazione Drive" onClose={onClose} size="lg">`
- Removed `X` close button (ModalShell provides it via Radix Dialog.Close)
- Replaced all `style={{...}}` inline styles with Tailwind utility classes
- **Preserved state:** `const [confirmDelete, setConfirmDelete]` (local Drive backup deletion confirm — distinct from App.jsx transaction confirmDelete), `currentOperation`, `isProcessingRef` anti-spam ref
- **Preserved handlers:** `handleUpload`, `handleDownload`, `handleDelete` (all async with anti-spam protection)
- Auth status: `bg-green-50` connected section with user email + disconnect button
- Not-authenticated: CloudOff + GoogleSignInButton OR loading state with cancel option
- Amber permissions warning (`bg-amber-50`) for missing Drive permissions
- Backup info card with `formatDate`/`formatSize` helpers
- Action buttons: upload (primary brand-600), download (secondary gray-100), delete (secondary with red text)
- Delete confirm inline panel: `bg-red-50` with Annulla/Conferma elimina
- Sync status display: green/red/gray color based on syncStatus
- Web version warning (`bg-amber-50`) for non-Electron environment

### Task 2 — PayPalEnrichWizard Migration

- Replaced `modal-overlay`/`modal-large` DOM structure with `<ModalShell title="Arricchisci transazioni PayPal" onClose={onCancel} size="lg">`
- Added `stepVariants` with enter/center/exit and `custom` direction for AnimatePresence
- Added `direction` state (1=forward, -1=back) and `step` state (1-3)
- Added `goNext()` and `goBack()` handlers that set direction before incrementing/decrementing step
- Wrapped all step content in `<AnimatePresence mode="wait" custom={direction}><motion.div key={step} custom={direction} variants={stepVariants}>`
- **Step 1 (Overview):** Count of validPayPalTransactions + matches found, or empty state with AlertCircle
- **Step 2 (Selection):** Full matches table — sticky thead, scrollable `max-h-80` tbody, checkbox rows, select all/deselect all controls, green-50 selected rows, red/green amount coloring
- **Step 3 (Confirmation):** Green-50/gray-50 summary card showing count, compact table of selected changes
- Footer: `Indietro` (disabled on step 1) | `Annulla` | `Continua` (steps 1-2) or `Applica modifiche` (step 3, disabled when selectedCount === 0)
- **Preserved:** `setSelectedMatches` in `useEffect` with `// eslint-disable-next-line react-hooks/set-state-in-effect` comment

---

## Deviations from Plan

**None** — plan executed exactly as written.

The PayPalEnrichWizard plan referenced `// Step N content` as placeholder comments for the 3-step structure. The content was designed to be pragmatic: overview stats -> selection table (existing functionality) -> confirmation summary. This is the natural wizard flow and fulfills all acceptance criteria.

---

## Acceptance Criteria Verification

### SyncSettings
- [x] `import { ModalShell } from '../ui'`
- [x] `<ModalShell title="Sincronizzazione Drive" onClose={onClose} size="lg">`
- [x] No `className="modal-overlay"`
- [x] `const [confirmDelete, setConfirmDelete]` preserved
- [x] `bg-green-50` (authenticated status)
- [x] `bg-red-50` (delete confirmation)
- [x] `animate-spin` (loading spinners)
- [x] `npm run build` exit 0

### PayPalEnrichWizard
- [x] `import { ModalShell } from '../ui'`
- [x] `import { AnimatePresence, motion } from 'framer-motion'`
- [x] `<ModalShell title="Arricchisci transazioni PayPal" onClose={onCancel} size="lg">`
- [x] `stepVariants` with enter/center/exit
- [x] `<AnimatePresence mode="wait"`
- [x] `custom={direction}`
- [x] No `className="modal-overlay"`
- [x] `setSelectedMatches` in useEffect (lint warning preserved)
- [x] `npm run build` exit 0

---

## Self-Check

### Files Exist
- [x] `src/components/modals/SyncSettings.jsx`
- [x] `src/components/modals/PayPalEnrichWizard.jsx`

### Commits Exist
- [x] 196c765 — feat(06-04): migrate SyncSettings to ModalShell
- [x] 25e2d62 — feat(06-04): migrate PayPalEnrichWizard to ModalShell with AnimatePresence

## Self-Check: PASSED
