# Phase 9: Update Infrastructure - Research

**Researched:** 2026-04-03
**Domain:** electron-updater / electron-builder GitHub publish / Electron IPC bridge
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** GitHub owner: `xellafe`, repo: `money-flow` — `publish` block in `package.json` uses `{ "provider": "github", "owner": "xellafe", "repo": "money-flow" }`
- **D-02:** Public repo — no runtime token required; `GH_TOKEN` only needed at publish time (CI or local release script), never hardcoded in source
- **D-03:** `publish` block scoped to `nsis` target only — portable exe silently skips auto-update (no `publish` block on the `portable` target)
- **D-04:** `allowPrerelease: false` — updater checks stable releases only (pre-release tags like `v2.x.x-beta.x` are ignored)
- **D-05:** `setupAutoUpdater()` called once inside `app.whenReady()`, after `createWindow()`, guarded by `!isDev`
- **D-06:** Startup check fires with a 3 s delay after `createWindow()` (matches UPD-02)
- **D-07:** `autoDownload: false` — download does NOT start automatically; renderer must call `startDownload()` explicitly
- **D-08:** `isQuitting = true` must be set before `autoUpdater.quitAndInstall()` to prevent the `before-quit` backup flow from conflicting
- **D-09:** Bridge exposed under `window.electronAPI.updater` (sub-namespace, consistent with `window.electronAPI.googleDrive`)
- **D-10:** 8 bridge methods: `checkForUpdates()`, `startDownload()`, `installUpdate()`, `onUpdateAvailable(cb)`, `onUpdateNotAvailable(cb)`, `onDownloadProgress(cb)`, `onUpdateDownloaded(cb)`, `onUpdateError(cb)`
- **D-11:** Each `on*` listener method returns a cleanup function — consistent with existing `onRequestBackupData` pattern in preload.cjs
- **D-12:** `electron-log` added to `dependencies`; `autoUpdater.logger = require('electron-log')` — persistent file logging in AppData

### Agent's Discretion
- Structure of `setupAutoUpdater()` internals — whether it's a separate function or inlined in `app.whenReady()`
- Whether to use `autoUpdater.checkForUpdatesAndNotify()` or manual event wiring — given `autoDownload: false` and explicit IPC events, manual event wiring is implied but planner confirms
- How portable build silently swallows errors — technically handled by absence of `publish` block on portable target; planner verifies this is sufficient

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPD-01 | Install `electron-updater` (dependency) and configure `electron-builder` with GitHub Releases provider (owner/repo in `publish` block of `package.json`) | Standard stack section covers install command and `package.json` publish config placement |
| UPD-02 | Main process initializes `autoUpdater` only in production (guarded by `isDev`) and fires automatic check at startup with 3 s delay after `createWindow()` | Architecture Patterns → autoUpdater Init Pattern covers guard and `setTimeout` approach |
| UPD-03 | Preload exposes `window.electronAPI.updater` namespace with `checkForUpdates()`, `installUpdate()`, and five `on*` listener methods with cleanup functions | Code Examples → Preload Bridge Pattern shows complete implementation based on existing `onRequestBackupData` template |
| UPD-06 | "Installa e riavvia" button can only reach `quitAndInstall()` via explicit renderer invocation; `isQuitting = true` is set before the call | Code Examples → installUpdate IPC Handler shows `isQuitting = true` guard; Common Pitfalls → isQuitting Guard explains why this is essential |
</phase_requirements>

---

## Summary

Phase 9 installs and wires `electron-updater` across three layers: `package.json` build config (publish provider), `electron/main.cjs` (autoUpdater initialization + IPC handlers), and `electron/preload.cjs` (contextBridge bridge methods). The codebase already has every required pattern in place — `isQuitting`, `isDev`, `ipcMain.handle`, `ipcRenderer.invoke`, and the `on*`-with-cleanup pattern from `onRequestBackupData`. This phase is essentially a faithful extension of existing patterns.

The only non-obvious complexity is the CI workflow conflict: the existing `release.yml` creates a GitHub Release via `softprops/action-gh-release` AFTER the electron-builder step, but when a `publish` block is added to the NSIS target and `GH_TOKEN` is present, electron-builder will also create/update the same release during `npm run electron:build`. The planner must decide which step owns release creation and update `release.yml` accordingly.

The portable build's silent error behavior requires no special code: because the `portable` target has no `publish` block, electron-builder does not embed a feed URL, and `autoUpdater.checkForUpdates()` will emit an `error` event immediately. The error event handler in `setupAutoUpdater()` should log to `electron-log` but **not** forward to the renderer — achieving the "silent swallow" requirement.

**Primary recommendation:** Use manual event wiring (not `checkForUpdatesAndNotify()`) because `autoDownload: false` requires discrete IPC events; implement `setupAutoUpdater()` as a named function called from `app.whenReady()`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| electron-updater | **6.8.3** (npm registry, 2025) | Checks GitHub Releases feed, downloads update, triggers install | Official electron-builder companion; only updater with full `electron-builder` integration |
| electron-log | **5.4.3** (npm registry, 2025) | Persistent file logging to `%APPDATA%\MoneyFlow\logs\` | Recommended by electron-updater docs; zero-config when assigned to `autoUpdater.logger` |
| electron-builder | **26.8.1** (already installed) | Build toolchain — generates `latest.yml` when `publish` block is present | Already in project; generates update feed metadata as build artifact |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| electron-builder GitHub provider | built-in to electron-builder | Reads `GH_TOKEN` env var, publishes `latest.yml` + installer to GitHub Release assets | Only at publish time (CI), not at runtime |

**Installation:**
```bash
npm install electron-updater electron-log
```

> **Both go in `dependencies` (not `devDependencies`)** — they run inside the packaged app at runtime.

**Version verification (confirmed against npm registry):**
- `electron-updater`: 6.8.3 (latest stable)
- `electron-log`: 5.4.3 (latest stable)

---

## Architecture Patterns

### Recommended File Changes (4 files total)
```
package.json                   # Add dependencies + publish block in nsis target
electron/
├── main.cjs                   # Add require, setupAutoUpdater(), ipcMain handlers
└── preload.cjs                # Add updater sub-namespace to contextBridge
.github/
└── workflows/
    └── release.yml            # Resolve publish conflict (see Pitfall 3)
```

### Pattern 1: package.json — publish block scoped to NSIS only

The `publish` key placed **inside** the `nsis` target object causes electron-builder to embed GitHub provider metadata only in the NSIS installer. The `portable` target has no `publish` key → no embedded feed URL → electron-updater cannot contact GitHub → emits `error` event silently.

```json
// In package.json "build" section:
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "MoneyFlow",
  "publish": [
    {
      "provider": "github",
      "owner": "xellafe",
      "repo": "money-flow"
    }
  ]
}
// "portable" target has NO "publish" key — intentional
```

> **What `npm run electron:build` produces:** `release/latest.yml` — a YAML file containing version, file hashes, and size. This is what `electron-updater` fetches at runtime to detect new versions. Presence of this file is the success criterion 1 proof.

### Pattern 2: autoUpdater Initialization in main.cjs

```javascript
// At top of main.cjs — CJS require syntax (NOT import)
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Named function called from app.whenReady()
function setupAutoUpdater() {
  // Assign logger — writes to %APPDATA%\MoneyFlow\logs\main.log
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  // Core config
  autoUpdater.autoDownload = false;     // D-07: renderer must call startDownload()
  autoUpdater.allowPrerelease = false;  // D-04: stable releases only

  // Push events → renderer
  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-not-available', info);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:download-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-downloaded', info);
    }
  });

  // Error handler: log always, forward to renderer only if mainWindow exists
  // Portable builds emit error here (no feed URL) — mainWindow guard
  // prevents crashing, electron-log captures it silently
  autoUpdater.on('error', (err) => {
    log.error('autoUpdater error:', err.message);
    // NOTE: Do NOT conditionally forward to renderer here.
    // The IPC handler 'updater:check-for-updates' catches errors from
    // checkForUpdates() promise rejection and sends 'updater:error' itself.
    // This handler only fires for unexpected/background errors.
  });

  // Startup check — 3 s delay (D-06)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Startup checkForUpdates failed:', err.message);
    });
  }, 3000);
}
```

Call site in `app.whenReady()`:
```javascript
app.whenReady().then(() => {
  // ... CSP setup ...
  createWindow();

  if (!isDev) {
    setupAutoUpdater();  // D-05: prod-only guard
  }

  // ... activate handler ...
});
```

### Pattern 3: IPC Handlers in main.cjs

```javascript
// --- Updater IPC Handlers ---

ipcMain.handle('updater:check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (err) {
    log.error('checkForUpdates error:', err.message);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:error', err.message);
    }
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:start-download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    log.error('downloadUpdate error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:install-update', async () => {
  isQuitting = true;          // D-08: prevents backup flow in 'close' handler
  autoUpdater.quitAndInstall();
});
```

### Pattern 4: Preload Bridge — updater sub-namespace

Template from existing `onRequestBackupData` (preload.cjs lines 25–30):
```javascript
onRequestBackupData: (callback) => {
  const handler = () => callback();
  ipcRenderer.on('request-backup-data', handler);
  return () => ipcRenderer.removeListener('request-backup-data', handler);
},
```

Applied to `updater` namespace:
```javascript
// Add to contextBridge.exposeInMainWorld('electronAPI', { ... }):
updater: {
  // Invoke (renderer → main, awaited)
  checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
  startDownload:   () => ipcRenderer.invoke('updater:start-download'),
  installUpdate:   () => ipcRenderer.invoke('updater:install-update'),

  // Listener methods — each returns a cleanup function (D-11)
  onUpdateAvailable: (cb) => {
    const handler = (_, info) => cb(info);
    ipcRenderer.on('updater:update-available', handler);
    return () => ipcRenderer.removeListener('updater:update-available', handler);
  },
  onUpdateNotAvailable: (cb) => {
    const handler = (_, info) => cb(info);
    ipcRenderer.on('updater:update-not-available', handler);
    return () => ipcRenderer.removeListener('updater:update-not-available', handler);
  },
  onDownloadProgress: (cb) => {
    const handler = (_, progress) => cb(progress);
    ipcRenderer.on('updater:download-progress', handler);
    return () => ipcRenderer.removeListener('updater:download-progress', handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = (_, info) => cb(info);
    ipcRenderer.on('updater:update-downloaded', handler);
    return () => ipcRenderer.removeListener('updater:update-downloaded', handler);
  },
  onUpdateError: (cb) => {
    const handler = (_, message) => cb(message);
    ipcRenderer.on('updater:error', handler);
    return () => ipcRenderer.removeListener('updater:error', handler);
  },
},
```

### Anti-Patterns to Avoid
- **`checkForUpdatesAndNotify()`:** Auto-shows a native OS notification. Bypasses the IPC bridge entirely. Use manual event wiring instead (gives Phase 10 full control over UI).
- **`autoDownload: true`:** Download begins silently without user consent. Violates the UX design of showing "update available" state before consuming bandwidth.
- **`publish` block at top-level `build`:** Would apply to both NSIS and portable targets, causing updater errors on portable builds to reach users.
- **CJS/ESM mismatch:** `electron/` uses CJS modules — use `require('electron-updater')` NOT `import { autoUpdater } from 'electron-updater'`.
- **Registering IPC handlers inside `setupAutoUpdater()`:** Keep IPC handlers in the top-level module scope (consistent with all existing handlers in main.cjs) so they're registered before `app.whenReady()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub Releases feed parsing | Custom fetch + semver comparison | `electron-updater` | Handles semver comparison, partial downloads, hash verification, differential updates |
| Update file hash verification | Manual SHA-512 check | `electron-updater` | Built-in — verifies downloaded file integrity before install |
| Download progress reporting | Manual XHR with progress events | `electron-updater` `download-progress` event | Returns `{ bytesPerSecond, percent, transferred, total }` object |
| Windows NSIS silent install | Custom installer flags | `autoUpdater.quitAndInstall()` | electron-updater knows the correct NSIS silent install flags |
| Persistent log file in AppData | Custom fs.appendFile | `electron-log` assigned to `autoUpdater.logger` | Auto-resolves platform AppData path, handles rotation |

**Key insight:** electron-updater handles all the complexity of Windows installer invocation silently. `quitAndInstall()` correctly invokes the downloaded NSIS installer with appropriate flags.

---

## Common Pitfalls

### Pitfall 1: `electron-updater` in `devDependencies`
**What goes wrong:** Package is excluded from the packaged app (`asar`). `require('electron-updater')` throws `MODULE_NOT_FOUND` at runtime in production.
**Why it happens:** Looks like a dev tool because it's used during development. It's not — it runs inside the packaged app.
**How to avoid:** Always in `dependencies`. Confirmed: `electron-log` same rule.
**Warning signs:** App crashes at startup in packaged build with MODULE_NOT_FOUND.

### Pitfall 2: `mainWindow` null in autoUpdater event handlers
**What goes wrong:** autoUpdater events (especially `update-downloaded`) can fire after the window is closed or before it finishes loading. `mainWindow.webContents.send()` throws on a destroyed window.
**Why it happens:** autoUpdater runs independently of the window lifecycle.
**How to avoid:** Always guard with `if (mainWindow && !mainWindow.isDestroyed())` before calling `webContents.send()`. This pattern is already used implicitly in the existing backup flow.
**Warning signs:** Uncaught error `Cannot read properties of null` in the main process log.

### Pitfall 3: CI Workflow Publish Conflict
**What goes wrong:** When `GH_TOKEN` is set AND the `nsis` publish block is configured, `npm run electron:build` with default `onTagOrDraft` publish mode will create/update the GitHub Release AND upload files (including `latest.yml`) to it. The subsequent `softprops/action-gh-release` step in `release.yml` then tries to create the same release again.
**Why it happens:** electron-builder defaults to publishing when a `GH_TOKEN` is present and building on a tag. The existing workflow was written before the publish config existed.
**How to avoid:** **Two options:**
  - **Option A (recommended):** Remove the `softprops/action-gh-release` step from `release.yml` and let electron-builder own the full publish (installer + `latest.yml`). Update the "Upload artifacts" step or remove it too since electron-builder uploads directly to the release.
  - **Option B:** Keep softprops, but add `--publish never` to `electron:build` command in CI via env var `EP_DRAFT=true` — then `latest.yml` won't be published to GitHub; updater won't work until manually published.
  - **Recommendation:** Option A — simplest, consistent, electron-builder was designed to own the full GitHub release publishing pipeline.
**Warning signs:** CI log shows "Release already exists" or duplicate files on the GitHub release.

### Pitfall 4: `isQuitting` guard scope
**What goes wrong:** If `installUpdate()` IPC handler is placed in `setupAutoUpdater()` (inside the `!isDev` guard), it's never registered in dev mode. DevTools testing of `window.electronAPI.updater.installUpdate()` silently returns `undefined`.
**Why it happens:** IPC handlers inside `setupAutoUpdater()` are only registered when `!isDev` is true.
**How to avoid:** Register IPC handlers at module top-level, OUTSIDE `setupAutoUpdater()`, consistent with all existing handlers in main.cjs. `setupAutoUpdater()` only contains autoUpdater configuration + event listeners.
**Warning signs:** `ipcRenderer.invoke('updater:install-update')` never resolves in dev mode.

### Pitfall 5: Portable build error reaches renderer
**What goes wrong:** On a portable build with no publish block, `autoUpdater.checkForUpdates()` rejects immediately. If the error is forwarded to the renderer via `updater:error`, the renderer tries to update the UI in a context where updates aren't supported.
**Why it happens:** The error handler calls `mainWindow.webContents.send('updater:error', ...)` unconditionally.
**How to avoid:** Two layers of protection:
  1. The startup `setTimeout` check wraps `checkForUpdates()` in `.catch()` that only logs — never forwards to renderer
  2. The `updater:check-for-updates` IPC handler (renderer-triggered) DOES forward errors — but this is only callable from Phase 10 UI (Settings) which is only built for NSIS users
  Net effect: portable builds get silent errors. No code change needed beyond the `.catch()` pattern shown above.
**Warning signs:** Portable users see an "update check failed" error on startup.

### Pitfall 6: `autoUpdater.quitAndInstall()` and backup flow race
**What goes wrong:** `mainWindow.on('close')` checks `if (isQuitting) return` to skip the Google Drive backup flow. But `quitAndInstall()` triggers a close before `isQuitting` is set to true if called without the guard. The app tries to do a Drive backup during an update install, potentially hanging.
**Why it happens:** `autoUpdater.quitAndInstall()` calls `app.quit()` internally, which triggers `window-all-closed` and then `close` events.
**How to avoid:** Always `isQuitting = true` BEFORE `autoUpdater.quitAndInstall()`. The existing `isQuitting` variable in main.cjs (line 11) is reused — no new variable needed.
**Warning signs:** App hangs for 10 seconds (the backup timeout) before updating.

---

## Code Examples

### Complete IPC Channel Reference

| Bridge Method | IPC Type | Channel | Direction |
|--------------|----------|---------|-----------|
| `checkForUpdates()` | handle/invoke | `updater:check-for-updates` | renderer → main → returns |
| `startDownload()` | handle/invoke | `updater:start-download` | renderer → main → returns |
| `installUpdate()` | handle/invoke | `updater:install-update` | renderer → main (no return) |
| `onUpdateAvailable(cb)` | on/send | `updater:update-available` | main → renderer (push) |
| `onUpdateNotAvailable(cb)` | on/send | `updater:update-not-available` | main → renderer (push) |
| `onDownloadProgress(cb)` | on/send | `updater:download-progress` | main → renderer (push) |
| `onUpdateDownloaded(cb)` | on/send | `updater:update-downloaded` | main → renderer (push) |
| `onUpdateError(cb)` | on/send | `updater:error` | main → renderer (push) |

### DevTools Verification Commands (Success Criterion 2)
```javascript
// Run in DevTools Console to verify bridge is wired:
typeof window.electronAPI.updater.checkForUpdates === 'function'   // → true
typeof window.electronAPI.updater.startDownload === 'function'     // → true
typeof window.electronAPI.updater.installUpdate === 'function'     // → true
typeof window.electronAPI.updater.onUpdateAvailable === 'function' // → true
typeof window.electronAPI.updater.onUpdateNotAvailable === 'function' // → true
typeof window.electronAPI.updater.onDownloadProgress === 'function' // → true
typeof window.electronAPI.updater.onUpdateDownloaded === 'function' // → true
typeof window.electronAPI.updater.onUpdateError === 'function'     // → true

// All 8 must be true
```

### Build Verification Command (Success Criterion 1)
```powershell
npm run electron:build
# Then verify:
Test-Path ".\release\latest.yml"   # Must be $true
Get-Content ".\release\latest.yml" # Should show version, sha512, size
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `autoUpdater.checkForUpdatesAndNotify()` | Manual event wiring + IPC push | N/A — both are valid | Manual wiring gives full UI control; required for `autoDownload: false` |
| Global `publish` block in `build` | Per-target `publish` in `nsis` | electron-builder v20+ | Enables portable builds to skip updater cleanly |

**Not applicable / still current:**
- `contextBridge.exposeInMainWorld` is still the correct contextIsolation API
- `ipcMain.handle` + `ipcRenderer.invoke` for request/response is still best practice
- `ipcRenderer.removeListener` (not `removeAllListeners`) for targeted cleanup

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | (in use, project running) | — |
| electron-builder | `npm run electron:build` | ✓ | 26.8.1 | — |
| electron | Runtime | ✓ | 34.5.8 | — |
| electron-updater | UPD-01 | ✗ (not installed) | — | Must install via `npm install electron-updater` |
| electron-log | D-12 logging | ✗ (not installed) | — | Must install via `npm install electron-log` |
| GH_TOKEN env var | `electron-builder` publish | CI: ✓ (as `GITHUB_TOKEN` secret) | — | Local: not needed for `latest.yml` generation; only needed for upload |

**Missing dependencies with no fallback:**
- `electron-updater` — must be installed (no alternative that integrates with electron-builder)
- `electron-log` — must be installed (console.log is not acceptable per D-12)

**Note on GH_TOKEN:** Already present in `release.yml` as `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. No new secret required. Local builds generate `latest.yml` without a token.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in project — no jest.config, vitest.config, or test directory in src/ |
| Config file | None — Wave 0 must decide on framework if automated tests are needed |
| Quick run command | N/A — no test runner configured |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPD-01 | `npm run electron:build` produces `latest.yml` in `release/` | smoke (build) | `npm run electron:build && Test-Path .\release\latest.yml` | ❌ Wave 0 |
| UPD-02 | autoUpdater fires 3 s startup check (prod only) | manual | Run packaged NSIS build, check electron-log file | manual-only |
| UPD-03 | `window.electronAPI.updater.*` all 8 methods are functions | smoke (DevTools) | DevTools console snippet (see Code Examples) | manual-only |
| UPD-06 | `isQuitting = true` set before `quitAndInstall()` | code review | N/A — verifiable by reading the IPC handler | code review |

> **Manual-only justification:** UPD-02 and UPD-06 require a packaged build with a live GitHub Release to test end-to-end. No mock infrastructure exists and setting one up exceeds the phase scope. Code review and the electron-log file are the verification mechanisms.

### Sampling Rate
- **Per task commit:** Build check — `npm run electron:build` verifies `latest.yml` present; DevTools bridge check
- **Per wave merge:** Same as above (no automated suite)
- **Phase gate:** All 4 success criteria verified before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No test framework installed — for this phase, success criteria are verified via build output and DevTools inspection (see above). No test file needed.
- [ ] If a smoke test is desired: `scripts/verify-bridge.js` — a Node script that uses `electron --inspect` to verify preload exports (LOW priority, not blocking)

*(For this phase, "Wave 0 gaps" resolve to: no new test infrastructure required. Verification is build-output inspection + DevTools manual check.)*

---

## CI Workflow Impact

The existing `release.yml` workflow was written before a `publish` block existed. Adding the publish block triggers a conflict that must be resolved:

**Current flow:**
1. `npm run electron:build` with `GH_TOKEN` → builds NSIS + portable exe
2. `Upload artifacts` → uploads to Actions artifacts
3. `Create Release` (softprops) → creates GitHub Release, uploads `.exe` files

**After Phase 9 publish block is added:**
1. `npm run electron:build` with `GH_TOKEN` → builds NSIS + portable exe + `latest.yml`; electron-builder (default: `onTagOrDraft`) ALSO creates GitHub Release and uploads files because `GH_TOKEN` is present and we're building on a tag
2. `Upload artifacts` → redundant (files already on GitHub Release)
3. `Create Release` (softprops) → tries to create the same release again → conflict

**Recommended resolution (Option A):**
```yaml
# Remove steps 2 and 3 from release.yml
# electron-builder with publish block handles the full release pipeline
# The workflow becomes: checkout → install → create credentials → build+publish
```

The `release.yml` update is a task for the plan.

---

## Open Questions

1. **`autoUpdater.quitAndInstall()` parameters**
   - What we know: Signature is `quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean)`
   - What's unclear: Whether `isSilent = true` (no UI during install) is desired — the NSIS installer was configured with `oneClick: false` which suggests the user expects to see it
   - Recommendation: Call `autoUpdater.quitAndInstall()` with no arguments (defaults: `isSilent = true` on Windows for background install); acceptable since user explicitly clicked "Installa e riavvia"

2. **`latest.yml` in `release/` root vs subdirectory**
   - What we know: electron-builder with `directories.output: release` places build artifacts in `release/`. NSIS builds go to `release/*.exe` and `release/latest.yml`.
   - What's unclear: Whether electron-builder 26.x puts `latest.yml` in `release/` or `release/win-unpacked/`
   - Recommendation: Verify with `npm run electron:build` and `ls release/` — the success criterion is explicitly checking `release/latest.yml`

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `electron/main.cjs` and `electron/preload.cjs` — existing patterns confirmed
- `package.json` inspection — confirmed electron-builder 26.8.1, Electron 34.5.8
- `npm view electron-updater version` — confirmed 6.8.3
- `npm view electron-log version` — confirmed 5.4.3
- `.github/workflows/release.yml` — CI workflow conflict identified from direct inspection

### Secondary (MEDIUM confidence)
- electron-builder documentation pattern for per-target publish scoping (nsis-level publish key)
- electron-updater CJS API: `require('electron-updater').autoUpdater`, `autoUpdater.on('update-available', ...)`, `autoUpdater.checkForUpdates()`, `autoUpdater.downloadUpdate()`

### Tertiary (LOW confidence — needs validation)
- Whether `latest.yml` lands in `release/` root vs a subdirectory with electron-builder 26.8.1 (verify with actual build)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry confirms versions; library choices are locked decisions
- Architecture: HIGH — all patterns derived from existing code in main.cjs and preload.cjs
- Pitfalls: HIGH — isQuitting race and CI conflict identified from direct code/workflow inspection
- `latest.yml` output path: MEDIUM — needs validation with actual build

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable ecosystem — electron-updater API is stable across minor versions)
