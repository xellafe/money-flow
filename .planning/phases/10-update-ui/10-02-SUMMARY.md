---
plan: 10-02
phase: 10-update-ui
status: complete
completed: 2026-04-03
commits:
  - b6289f0
  - 544c911
  - cea3cbc
---

## Summary

Built the complete user-facing update UI: UpdateBanner component, shared notification container in App.jsx, and Aggiornamenti section in SettingsView.

## What Was Built

- **`src/components/UpdateBanner.jsx`**: Update notification banner matching Toast's visual style. Renders with framer-motion animations. Shows "Installa e riavvia" button with `disabled={isInstalling}` protection. No fixed positioning — parent container owns layout.
- **`src/components/index.js`**: Added `UpdateBanner` barrel export.
- **`src/components/Toast.jsx`**: Removed `fixed bottom-6 right-6 z-50` from className. Added comment documenting that positioning is owned by parent container.
- **`src/App.jsx`**: Added `UpdateBanner` import, `useUpdateStatus` to hooks import, `const updateStatus = useUpdateStatus()` call, shared `flex-col-reverse gap-3` notification container replacing single Toast `AnimatePresence`, and `updateStatus={updateStatus}` prop on SettingsView.
- **`src/views/SettingsView.jsx`**: Added `Loader2` import, `updateStatus = {}` default prop, and full Aggiornamenti section with 6-state machine (idle, checking, up-to-date, available/downloading, ready, error) guarded by `updateStatus.checkForUpdates &&`.

## Key Decisions

- Notification container uses `flex-col-reverse` so new items stack above existing ones naturally.
- Each notification (Toast, UpdateBanner) has its own `<AnimatePresence>` — no `mode="wait"` so both animate independently.
- UpdateBanner only renders when `status === 'ready' && !isDismissed`.
- SettingsView Aggiornamenti section guarded by `updateStatus.checkForUpdates &&` — safe for tests and isolation.
- Ready-state "Installa e riavvia" in Settings has `disabled={updateStatus.isInstalling}` matching the banner button.

## Self-Check: PASSED

All acceptance criteria met:
- ✓ UpdateBanner created with Toast-matching animations and `isInstalling` protection
- ✓ Toast className no longer has `fixed bottom-6 right-6 z-50`
- ✓ Toast has positioning comment
- ✓ App.jsx has shared `flex-col-reverse gap-3` notification container
- ✓ Two independent `<AnimatePresence>` blocks
- ✓ UpdateBanner renders only when `status === 'ready' && !isDismissed`
- ✓ `isInstalling={updateStatus.isInstalling}` passed to UpdateBanner
- ✓ SettingsView receives `updateStatus` with `= {}` default
- ✓ All 6 status states render correctly
- ✓ Ready-state install button in Settings has `disabled={updateStatus.isInstalling}`

## key-files

created:
  - src/components/UpdateBanner.jsx
modified:
  - src/components/index.js
  - src/components/Toast.jsx
  - src/App.jsx
  - src/views/SettingsView.jsx
