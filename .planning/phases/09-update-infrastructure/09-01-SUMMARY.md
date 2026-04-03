---
phase: 09-update-infrastructure
plan: 01
subsystem: infra
tags: [electron-updater, electron-log, auto-update, ipc, preload]

# Dependency graph
requires: []
provides:
  - electron-updater + electron-log installed as runtime dependencies
  - nsis publish block with github/xellafe/money-flow provider
  - CI workflow updated to let electron-builder own GitHub Release creation
  - setupAutoUpdater() function with all event handlers in main.cjs
  - 3 IPC handlers (check-for-updates, start-download, install-update)
  - Production-only guard and 3s startup delay for auto-update check
  - window.electronAPI.updater bridge with 8 methods in preload.cjs
affects: [phase-10-update-ui]

# Tech tracking
tech-stack:
  added: [electron-updater, electron-log]
  patterns: [autoUpdater event→IPC push, preload cleanup function pattern for on* listeners]

key-files:
  created: []
  modified:
    - package.json
    - .github/workflows/release.yml
    - electron/main.cjs
    - electron/preload.cjs

key-decisions:
  - "autoDownload=false: renderer must explicitly call startDownload (D-07)"
  - "setupAutoUpdater called inside !isDev guard — never runs in dev (D-05)"
  - "3s setTimeout delay for startup check to avoid blocking app load (D-06)"
  - "isQuitting=true set before quitAndInstall to skip backup flow (D-08)"
  - "publish block scoped to nsis only — portable target has no publish (D-03)"
  - "softprops/action-gh-release removed — electron-builder owns GitHub Release"

patterns-established:
  - "Updater on* listeners in preload return cleanup functions: () => ipcRenderer.removeListener(channel, handler)"
  - "Push events guarded: if (mainWindow && !mainWindow.isDestroyed()) before webContents.send"

requirements-completed: [UPD-01, UPD-02, UPD-03, UPD-06]

# Metrics
duration: 15min
completed: 2026-04-03
---

# Phase 09: Update Infrastructure Summary

**electron-updater wired end-to-end: IPC bridge in preload, autoUpdater with event handlers in main, GitHub publish configured in CI — Phase 10 UI can call window.electronAPI.updater without any further main process changes**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `electron-updater` and `electron-log` installed as runtime dependencies
- `nsis` publish block configured with `github/xellafe/money-flow` provider
- CI workflow updated: removed `softprops/action-gh-release`, electron-builder now owns GitHub Release publish, `latest.yml` added to upload-artifact path
- `setupAutoUpdater()` function added with all 5 event handlers (update-available, update-not-available, download-progress, update-downloaded, error), prod-only guard, 3s startup delay
- 3 IPC handlers: `updater:check-for-updates`, `updater:start-download`, `updater:install-update` — registered at module top-level
- `window.electronAPI.updater` bridge exposed in preload with 8 methods (3 invoke, 5 on*), each on* returns cleanup function

## Task Commits

1. **Task 1: Install dependencies and configure GitHub publish** - `e6bdc6c` (feat)
2. **Task 2: Wire autoUpdater in main process with IPC handlers** - `278e5b1` (feat)
3. **Task 3: Add updater bridge to preload with cleanup functions** - `1d4ba4b` (feat)

## Files Created/Modified
- `package.json` - Added electron-updater + electron-log dependencies, nsis publish block
- `.github/workflows/release.yml` - Removed softprops step, added latest.yml to upload-artifact
- `electron/main.cjs` - Added setupAutoUpdater(), 3 IPC handlers, prod-only guard
- `electron/preload.cjs` - Added updater sub-namespace with 8 bridge methods

## Decisions Made
- `autoDownload = false`: renderer controls download timing (D-07)
- `allowPrerelease = false`: stable releases only (D-04)
- Publish block scoped to `nsis` only — portable target intentionally excluded (D-03)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- Phase 10 (Update UI) can call `window.electronAPI.updater.checkForUpdates()`, listen for update events, and trigger download/install without any further main process changes.
- `release/latest.yml` will be produced by `npm run electron:build` once GH_TOKEN is set at CI time.

---
*Phase: 09-update-infrastructure*
*Completed: 2026-04-03*
