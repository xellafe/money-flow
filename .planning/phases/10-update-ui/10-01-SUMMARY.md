---
plan: 10-01
phase: 10-update-ui
status: complete
completed: 2026-04-03
commits:
  - 88ab581
  - 48c50e0
---

## Summary

Created the foundation for update UI: IPC handler for `get-app-version` and the central `useUpdateStatus` hook.

## What Was Built

- **`electron/main.cjs`**: Added `ipcMain.handle('get-app-version', () => app.getVersion())` after the existing updater handlers.
- **`electron/preload.cjs`**: Exposed `getAppVersion: () => ipcRenderer.invoke('get-app-version')` in the `electronAPI` object with optional-chaining guard.
- **`src/hooks/useUpdateStatus.js`**: Central hook managing all update state — subscribes to all 5 IPC updater events, auto-starts downloads (D-01), exposes `checkForUpdates`, `installUpdate`, `dismissBanner`, and full state shape including `isInstalling`.
- **`src/hooks/index.js`**: Added barrel export for `useUpdateStatus`.

## Key Decisions

- Used optional chaining (`window.electronAPI?.getAppVersion?.()?.then(...)`) to safely handle non-Electron environments.
- `onUpdateAvailable` resets `isDismissed` to `false` so new version always shows banner.
- `checkForUpdates` resets `version` and `progress` to null/0 before calling IPC.
- `installUpdate` sets `isInstalling: true` before IPC call to prevent double-click.

## Self-Check: PASSED

All acceptance criteria met:
- ✓ `ipcMain.handle('get-app-version'` in main.cjs (line 366)
- ✓ `getAppVersion: () => ipcRenderer.invoke('get-app-version')` in preload.cjs (line 74)
- ✓ `useUpdateStatus` hook created with full state shape
- ✓ Barrel export in `src/hooks/index.js`

## key-files

created:
  - src/hooks/useUpdateStatus.js
modified:
  - electron/main.cjs
  - electron/preload.cjs
  - src/hooks/index.js
