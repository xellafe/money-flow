# Architecture: electron-updater Integration

**Project:** MoneyFlow — Auto-Update Feature
**Researched:** 2025
**Confidence:** HIGH (based on direct source inspection of existing codebase)

---

## Integration Points

### Where `autoUpdater` is initialized in `main.cjs`

**Location:** Inside `app.whenReady().then()`, immediately after `createWindow()`, guarded by `!isDev`.

```js
// electron/main.cjs — inside app.whenReady().then() block (~line 111)
app.whenReady().then(() => {
  // ... existing CSP setup ...
  createWindow();
  setupAutoUpdater();   // ← ADD HERE, after createWindow()
  // ... existing activate handler ...
});
```

**Why after `createWindow()`:** `setupAutoUpdater()` sends IPC events to `mainWindow`; that reference is assigned inside `createWindow()` and must exist before any events fire.

**Why NOT inside `createWindow()`:** `createWindow()` can be called again on macOS `activate` (line 113–118). autoUpdater should only be wired once per process lifecycle.

**Why guarded by `!isDev`:** `autoUpdater` throws in dev mode (no packaged app to compare versions). The existing `isDev` variable (line 15) is the correct guard.

### `setupAutoUpdater()` function — exact insertion point

Add the function **after** `createWindow()` definition (~line 87), **before** `app.whenReady()` (~line 90). Keeping it as a named function separates concerns and matches the existing style.

```js
// electron/main.cjs — new function, insert after createWindow() definition, before app.whenReady()

function setupAutoUpdater() {
  if (isDev) return;

  const { autoUpdater } = require('electron-updater');

  autoUpdater.autoDownload = true;          // silently download in background
  autoUpdater.autoInstallOnAppQuit = true;  // install when user quits normally

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes ?? null,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:download-progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update:downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update:error', {
      message: err.message,
    });
  });

  // Renderer-initiated actions
  ipcMain.handle('update:check', async () => {
    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true); // isSilent=false, isForceRunAfter=true
  });

  // Automatic background check on startup — delayed to let window render first
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Auto-update startup check failed:', err.message);
    });
  }, 3000);
}
```

**`require('electron-updater')` is lazy/inline** — scoped inside `setupAutoUpdater()` so it is never reached in dev mode and the module is not loaded unconditionally at process start.

---

## IPC Design

### Channel Registry

| Direction | Channel | Payload | IPC Pattern |
|-----------|---------|---------|-------------|
| main → renderer | `update:available` | `{ version: string, releaseNotes: string\|null }` | `webContents.send` |
| main → renderer | `update:not-available` | *(none)* | `webContents.send` |
| main → renderer | `update:download-progress` | `{ percent: number, bytesPerSecond: number, transferred: number, total: number }` | `webContents.send` |
| main → renderer | `update:downloaded` | `{ version: string }` | `webContents.send` |
| main → renderer | `update:error` | `{ message: string }` | `webContents.send` |
| renderer → main | `update:check` | *(none)* | `ipcMain.handle` / `ipcRenderer.invoke` |
| renderer → main | `update:install` | *(none)* | `ipcMain.handle` / `ipcRenderer.invoke` |

**Naming convention:** `update:` prefix matches the existing `google-drive:` namespace convention already in `main.cjs`. Colon-separated namespace is consistent throughout the codebase.

**Why `ipcMain.handle` for renderer→main:** Matches the pattern used for all `google-drive:*` handlers (lines 157–276 of `main.cjs`). Returns a Promise the renderer can await; surfaces errors as return values rather than thrown exceptions.

**Why `webContents.send` for main→renderer:** Matches the existing `request-backup-data` push event pattern (line 62 of `main.cjs`). Always use `mainWindow?.webContents.send(...)` with optional chaining — the window may be destroyed during the backup-close flow.

---

## New Files

### `src/hooks/useAutoUpdater.js`

New hook following the exact `useGoogleDrive.js` pattern:
- `useState` for status machine + data
- `useEffect` to register/cleanup event listeners
- `useCallback` for action methods
- `window.electronAPI?.updater` guard (same as `window.electronAPI?.googleDrive`)

```js
// src/hooks/useAutoUpdater.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing auto-update lifecycle.
 * Only active in Electron (window.electronAPI.updater must exist).
 */
export function useAutoUpdater() {
  const [status, setStatus] = useState('idle');
  // 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error' | 'not-available'
  const [updateInfo, setUpdateInfo] = useState(null);  // { version, releaseNotes }
  const [progress, setProgress] = useState(null);      // { percent, bytesPerSecond, transferred, total }
  const [error, setError] = useState(null);

  const isElectron = !!window.electronAPI?.updater;

  useEffect(() => {
    if (!isElectron) return;
    const api = window.electronAPI.updater;

    const cleanupAvailable    = api.onUpdateAvailable((info) => {
      setStatus('available'); setUpdateInfo(info); setError(null);
    });
    const cleanupNotAvailable = api.onUpdateNotAvailable(() => setStatus('not-available'));
    const cleanupProgress     = api.onDownloadProgress((prog) => {
      setStatus('downloading'); setProgress(prog);
    });
    const cleanupDownloaded   = api.onUpdateDownloaded((info) => {
      setStatus('ready'); setUpdateInfo(info); setProgress(null);
    });
    const cleanupError        = api.onUpdateError((err) => {
      setStatus('error'); setError(err.message);
    });

    return () => {
      cleanupAvailable();
      cleanupNotAvailable();
      cleanupProgress();
      cleanupDownloaded();
      cleanupError();
    };
  }, [isElectron]);

  const checkForUpdates = useCallback(async () => {
    if (!isElectron) return;
    setStatus('checking');
    setError(null);
    const result = await window.electronAPI.updater.checkForUpdates();
    if (!result.success) {
      setStatus('error');
      setError(result.error);
    }
  }, [isElectron]);

  const installUpdate = useCallback(() => {
    if (!isElectron) return;
    window.electronAPI.updater.installUpdate();
  }, [isElectron]);

  return { status, updateInfo, progress, error, isElectron, checkForUpdates, installUpdate };
}
```

### `src/components/UpdateBanner.jsx`

Non-intrusive sticky banner rendered at App root level, visible only when `status === 'ready'`. Follows placement pattern of the existing `<Toast>` component.

```jsx
// src/components/UpdateBanner.jsx
export function UpdateBanner({ version, onInstall }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
      <span className="text-sm font-medium">
        Aggiornamento {version} pronto
      </span>
      <button
        onClick={onInstall}
        className="bg-white text-blue-600 rounded px-3 py-1 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
      >
        Installa e riavvia
      </button>
    </div>
  );
}
```

---

## Modified Files

### `electron/main.cjs`

| Change | Location | Detail |
|--------|----------|--------|
| Add `setupAutoUpdater()` function | After `createWindow()` (~line 87), before `app.whenReady()` (~line 90) | Full function as shown above |
| Call `setupAutoUpdater()` | Inside `app.whenReady().then()`, one line after `createWindow()` call (~line 112) | `setupAutoUpdater();` |
| Extend `connect-src` in CSP | Lines 98–108, the `connect-src` directive | Add GitHub domains (see Pitfalls section) |

No changes to existing `ipcMain` handlers — additions are fully inside `setupAutoUpdater()`.

### `electron/preload.cjs`

Add `updater` namespace inside the existing `contextBridge.exposeInMainWorld('electronAPI', { ... })` object. Insert after `sendBackupDataForClose` (line 32), before the closing `}` of the object.

```js
// electron/preload.cjs — add inside electronAPI object, after sendBackupDataForClose

  updater: {
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    installUpdate:   () => ipcRenderer.invoke('update:install'),

    onUpdateAvailable: (cb) => {
      const handler = (_, info) => cb(info);
      ipcRenderer.on('update:available', handler);
      return () => ipcRenderer.removeListener('update:available', handler);
    },
    onUpdateNotAvailable: (cb) => {
      const handler = () => cb();
      ipcRenderer.on('update:not-available', handler);
      return () => ipcRenderer.removeListener('update:not-available', handler);
    },
    onDownloadProgress: (cb) => {
      const handler = (_, progress) => cb(progress);
      ipcRenderer.on('update:download-progress', handler);
      return () => ipcRenderer.removeListener('update:download-progress', handler);
    },
    onUpdateDownloaded: (cb) => {
      const handler = (_, info) => cb(info);
      ipcRenderer.on('update:downloaded', handler);
      return () => ipcRenderer.removeListener('update:downloaded', handler);
    },
    onUpdateError: (cb) => {
      const handler = (_, err) => cb(err);
      ipcRenderer.on('update:error', handler);
      return () => ipcRenderer.removeListener('update:error', handler);
    },
  },
```

**Pattern match:** Exactly mirrors `onRequestBackupData` (lines 25–29 of preload.cjs): `ipcRenderer.on`, return a cleanup function. Event handlers use `(_, payload) => cb(payload)` because `ipcRenderer` always passes `event` as first arg.

### `src/hooks/index.js`

Add one line at the end:

```js
export { useAutoUpdater } from './useAutoUpdater';
```

### `src/views/SettingsView.jsx`

The component currently accepts two callback props (`onShowCategoryManager`, `onShowSyncSettings`). Add update-related props and a new "Aggiornamenti" section, keeping the same prop-injection pattern (no internal state):

```jsx
export function SettingsView({
  onShowCategoryManager,
  onShowSyncSettings,
  // New props:
  onCheckForUpdates,   // () => void
  onInstallUpdate,     // () => void
  updateStatus,        // 'idle'|'checking'|'available'|'downloading'|'ready'|'error'|'not-available'
  updateVersion,       // string | null
  updateProgress,      // { percent: number } | null
}) {
  // ... existing JSX unchanged ...
  // Add new <section> after "Sincronizzazione":
}
```

### `src/App.jsx`

Three additions, all near the existing `useGoogleDrive` call (~line 100):

1. **Import** `useAutoUpdater` from `'./hooks'` and `UpdateBanner` from `'./components/UpdateBanner'`
2. **Call hook** alongside existing hook calls:
   ```js
   const { status: updateStatus, updateInfo, progress: updateProgress,
           checkForUpdates, installUpdate } = useAutoUpdater();
   ```
3. **Pass props to `SettingsView`** when rendered:
   ```jsx
   <SettingsView
     onShowCategoryManager={...}
     onShowSyncSettings={...}
     onCheckForUpdates={checkForUpdates}
     onInstallUpdate={installUpdate}
     updateStatus={updateStatus}
     updateVersion={updateInfo?.version ?? null}
     updateProgress={updateProgress}
   />
   ```
4. **Render `UpdateBanner`** adjacent to existing `<Toast>`:
   ```jsx
   {updateStatus === 'ready' && (
     <UpdateBanner version={updateInfo.version} onInstall={installUpdate} />
   )}
   ```

### `package.json`

Two changes:

**1. Add `electron-updater` to `dependencies`** (NOT devDependencies — runs inside packaged app):
```json
"dependencies": {
  "electron-updater": "^6.3.9",
  ...
}
```

**2. Add `publish` to `build` config** (required — without this, autoUpdater throws "Cannot find latest.yml"):
```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",
    "repo": "money-flow"
  },
  ...
}
```
Alternative providers: `generic` (self-hosted server), `s3`. GitHub Releases is lowest-friction for a personal app — electron-builder generates `latest.yml` automatically and attaches it to GitHub releases.

---

## Build Order

Dependencies are strictly sequential: main process → preload bridge → hook → UI components → App wiring.

### Phase 1 — Main Process (`electron/main.cjs` + `package.json`)

**Goal:** `autoUpdater` initializes, emits IPC events, and is reachable from the renderer. No UI yet.

1. `npm install electron-updater` (adds to `dependencies`)
2. Add `publish` config to `package.json`
3. Extend `connect-src` in CSP for GitHub domains
4. Add `setupAutoUpdater()` function to `main.cjs`
5. Call `setupAutoUpdater()` inside `app.whenReady()`
6. Smoke-test: `npm run electron:build` → verify `latest.yml` appears in `release/`

**Verification gate:** `latest.yml` must be generated. This proves electron-builder knows the publish provider and electron-updater can parse it.

---

### Phase 2 — Preload Bridge (`electron/preload.cjs`)

**Goal:** `window.electronAPI.updater` is available in renderer with all seven methods.

1. Add `updater` namespace to `contextBridge.exposeInMainWorld`
2. Run `npm run electron:dev`
3. Open DevTools console, verify: `typeof window.electronAPI.updater.checkForUpdates === 'function'`

**Verification gate:** All five `on*` methods and two invoke methods are accessible. Use DevTools to confirm before writing any React code.

---

### Phase 3 — React Hook (`src/hooks/useAutoUpdater.js`)

**Goal:** Encapsulated state machine that drives all UI updates.

1. Create `src/hooks/useAutoUpdater.js`
2. Export from `src/hooks/index.js`
3. Temporary integration test: import in App.jsx, log `status` to console, trigger `checkForUpdates()` from browser console via temporary window exposure, confirm state transitions log correctly

**Verification gate:** Status transitions `idle → checking → not-available` (or `available`) are observable. Fix the hook before building UI.

---

### Phase 4 — UI Components

**Goal:** Visible feedback surfaces that are pure functions of state.

1. Create `src/components/UpdateBanner.jsx`
2. Extend `src/views/SettingsView.jsx` with "Aggiornamenti" section
   - "Controlla aggiornamenti" button
   - Progress indicator during download
   - "Installa e riavvia" button when ready
   - Error message when `status === 'error'`

**Why before App wiring:** Components can be built and styled in isolation using static mock props before they are connected to live state.

---

### Phase 5 — App Integration (`src/App.jsx`)

**Goal:** Hook state flows through the component tree to all surfaces.

1. Import `useAutoUpdater` and `UpdateBanner`
2. Call hook, destructure return values
3. Pass update props to `SettingsView`
4. Render `UpdateBanner` conditionally
5. Remove any temporary debug code from Phase 3

**Verification gate:** Full flow test — start the installed (`nsis`) build, see automatic check on startup, use Settings → Aggiornamenti button to trigger manual check, observe banner when update is downloaded.

---

## Critical Constraints and Pitfalls

### ⚠️ CRITICAL: Portable builds do NOT support auto-update

`electron-updater` cannot update a running portable `.exe` (it would need to overwrite itself). Only the `nsis` installer target supports the update flow. The `portable` target in `package.json` will either silently do nothing or throw an error.

**Decision required before Phase 1:** Keep `portable` + `nsis` but suppress update UI for portable installs, or drop `portable`. Detection at runtime:
```js
// autoUpdater throws with a message containing "NSIS" or "portable" for portable builds
autoUpdater.on('error', (err) => {
  if (err.message.toLowerCase().includes('nsis') ||
      err.message.toLowerCase().includes('portable')) {
    return; // suppress — this is a portable build, update not supported
  }
  mainWindow?.webContents.send('update:error', { message: err.message });
});
```

### ⚠️ CSP blocks update server requests

The existing `connect-src` in `main.cjs` (lines 98–108) does not include GitHub URLs. electron-updater makes HTTPS requests to GitHub to fetch `latest.yml` and the installer. Without adding these to CSP, requests will be blocked in production.

**Fix for GitHub provider** — extend `connect-src` directive:
```
connect-src 'self' http://localhost:* ws://localhost:* 
  https://www.googleapis.com https://oauth2.googleapis.com
  https://github.com https://objects.githubusercontent.com https://api.github.com
```

### ⚠️ `electron-updater` must be in `dependencies`

The packaged app does not have `devDependencies`. If placed in `devDependencies`, the production build throws `Cannot find module 'electron-updater'`.

### ⚠️ `mainWindow` optional chaining is mandatory

The `mainWindow` reference is module-level and can be `null` (before `createWindow()`) or refer to a destroyed window (during the backup-close flow in `main.cjs` lines 53–70). Always use `mainWindow?.webContents.send(...)`.

### ⚠️ `publish` config is required at build time

`electron-builder` generates `latest.yml` only when `publish` is configured. This file is what electron-updater fetches to compare version numbers. Missing `publish` → no `latest.yml` → autoUpdater throws on first check.
