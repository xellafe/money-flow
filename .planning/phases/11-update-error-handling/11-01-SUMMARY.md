---
plan: 11-01
phase: 11-update-error-handling
status: complete
started: 2026-04-03T15:47:12Z
completed: 2026-04-03T16:10:00Z
tasks-total: 2
tasks-complete: 2
commits:
  - f23a064
  - 81c2ca5
---

# Plan 11-01 Summary: Fix Error Forwarding in Auto-Update IPC Bridge

## What Was Built

Fixed two silent error-swallowing bugs in `electron/main.cjs` so that auto-update errors now reach the renderer and transition `useUpdateStatus` to `status='error'`.

## Tasks Completed

### Task 1: Bug 1 fix — autoUpdater.on('error') as single forwarding point (D-01 + D-02)
**Commit:** f23a064

Two atomic edits:
- **D-01:** Added `if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.webContents.send('updater:error', err.message); }` inside `autoUpdater.on('error', ...)` — now forwards all updater errors (background check, mid-download) to the renderer
- **D-02:** Removed the `webContents.send('updater:error', ...)` call from the `updater:check-for-updates` catch block — eliminates the double-fire that would have occurred on manual check failures (electron-updater both emits the `error` event AND rejects the promise for the same failure)

### Task 2: Bug 2 fix — updater:start-download rejects on error (D-04)
**Commit:** 81c2ca5

- Replaced `return { success: false, error: err.message }` with `throw err` in the `updater:start-download` `ipcMain.handle` catch block
- `ipcRenderer.invoke()` now rejects its promise, causing `useUpdateStatus`'s existing `.catch()` to fire and set `status='error'`
- `log.error` line preserved before the throw

## Files Modified

- `electron/main.cjs` — 3 hunks changed, 5 lines removed, 5 lines added

## Verification

All 3 phase success criteria verified via automated script:
- **SC-11-01 (error forwarding):** PASS — `autoUpdater.on('error')` sends guarded `webContents.send('updater:error', err.message)`
- **SC-11-02 (start-download rejects):** PASS — catch block uses `throw err` not `return { success: false }`
- **SC-11-03 (single forwarding point):** PASS — exactly 1 `webContents.send('updater:error')` in entire file

## Self-Check: PASSED

key-files:
  modified:
    - electron/main.cjs

No deviations from plan. D-05 honored — `useUpdateStatus.js` untouched.
