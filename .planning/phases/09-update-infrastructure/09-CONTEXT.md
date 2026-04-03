# Phase 9: Update Infrastructure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Install `electron-updater`, configure `electron-builder` with GitHub Releases as the publish provider, initialize `autoUpdater` in the main process (prod-only, with a 3 s startup delay), and expose a typed IPC bridge under `window.electronAPI.updater` to the renderer. No UI is built in this phase — every layer must be independently verifiable.

</domain>

<decisions>
## Implementation Decisions

### GitHub Publish Config
- **D-01:** GitHub owner: `xellafe`, repo: `money-flow` — `publish` block in `package.json` uses `{ "provider": "github", "owner": "xellafe", "repo": "money-flow" }`
- **D-02:** Public repo — no runtime token required; `GH_TOKEN` only needed at publish time (CI or local release script), never hardcoded in source
- **D-03:** `publish` block scoped to `nsis` target only — portable exe silently skips auto-update (no `publish` block on the `portable` target)
- **D-04:** `allowPrerelease: false` — updater checks stable releases only (pre-release tags like `v2.x.x-beta.x` are ignored)

### autoUpdater Initialization
- **D-05:** `setupAutoUpdater()` called once inside `app.whenReady()`, after `createWindow()`, guarded by `!isDev`
- **D-06:** Startup check fires with a 3 s delay after `createWindow()` (matches UPD-02)
- **D-07:** `autoDownload: false` — download does NOT start automatically when an update is found; the renderer must explicitly call `startDownload()` to begin the download
- **D-08:** `isQuitting = true` must be set before `autoUpdater.quitAndInstall()` to prevent the existing `before-quit` backup flow from conflicting (existing `isQuitting` variable in main.cjs is reused)

### IPC Bridge Shape
- **D-09:** Bridge exposed under `window.electronAPI.updater` (sub-namespace, consistent with `window.electronAPI.googleDrive`)
- **D-10:** 8 bridge methods (ROADMAP listed 7 — `startDownload` is added due to `autoDownload: false`):
  - `checkForUpdates()` — triggers update check
  - `startDownload()` — explicitly starts download after update-available notification
  - `installUpdate()` — calls `quitAndInstall()` after `isQuitting = true`
  - `onUpdateAvailable(cb)` → returns cleanup function
  - `onUpdateNotAvailable(cb)` → returns cleanup function
  - `onDownloadProgress(cb)` → returns cleanup function
  - `onUpdateDownloaded(cb)` → returns cleanup function
  - `onUpdateError(cb)` → returns cleanup function
- **D-11:** Each `on*` listener method returns a cleanup function to remove that specific listener — consistent with existing `onRequestBackupData` pattern in preload.cjs

### Logging
- **D-12:** `electron-log` added to `dependencies`; `autoUpdater.logger = require('electron-log')` — logs updater events to a persistent file in AppData for production debugging

### Agent's Discretion
- Structure of `setupAutoUpdater()` internals — whether it's a separate function or inlined in `app.whenReady()`; the planner decides
- Whether to use `autoUpdater.checkForUpdatesAndNotify()` or manual event wiring — given `autoDownload: false` and explicit IPC events, manual event wiring is implied but planner confirms
- How portable build silently swallows errors — technically handled by absence of `publish` block on portable target; planner verifies this is sufficient

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in project planning files.

### Planning Files
- `.planning/REQUIREMENTS.md` — UPD-01, UPD-02, UPD-03, UPD-06 (Phase 9 requirements)
- `.planning/PROJECT.md` — Stack constraints (Electron 34.5.8, CJS modules in electron/), Key Decisions table
- `.planning/STATE.md` — v1.1 Architecture Decisions section (backup-close flow, CSP, isQuitting pattern)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `electron/main.cjs`: `isQuitting` variable (line 11) — reused for updater `quitAndInstall()` guard; `isDev` guard (line 15) — reused as prod check for `setupAutoUpdater()`
- `electron/preload.cjs`: `contextBridge.exposeInMainWorld('electronAPI', {...})` — `updater` sub-namespace appended to the existing object; `onRequestBackupData` cleanup pattern (lines 26–30) is the template for all `on*` updater methods

### Established Patterns
- **IPC request/response**: `ipcMain.handle('channel', async () => {...})` + `ipcRenderer.invoke('channel')` in preload
- **IPC push events**: `mainWindow.webContents.send('channel')` in main + `ipcRenderer.on('channel', handler)` in preload, returning `() => ipcRenderer.removeListener(...)` as cleanup
- **Namespacing**: sub-objects under `window.electronAPI` (e.g. `googleDrive`) — `updater` follows same structure

### Integration Points
- `app.whenReady()` block in main.cjs — `setupAutoUpdater()` call added after `createWindow()`
- `isQuitting` in main.cjs — must be set to `true` in the `installUpdate` IPC handler before calling `quitAndInstall()`
- CSP stays unchanged — electron-updater runs in main process (Node.js), not renderer

</code_context>

<specifics>
## Specific Ideas

- The 3 s startup delay for auto-check aligns with letting the window finish loading before any update notifications could potentially reach the renderer
- `autoDownload: false` enables the Settings screen (Phase 10) to show "Versione X.Y.Z disponibile" state before the download starts, giving the user a beat before bandwidth is consumed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-update-infrastructure*
*Context gathered: 2026-04-03*
