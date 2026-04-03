# Domain Pitfalls: Adding electron-updater Auto-Update to Existing Windows Electron App

**Domain:** Electron desktop app (MoneyFlow) — Adding auto-update via electron-updater + GitHub Releases  
**Technology Stack:** Electron 34.5.8, electron-builder ^26, CommonJS main process (.cjs), Windows NSIS + Portable, no code signing  
**Researched:** 2026-04-03  
**Context:** v1.1 milestone — wiring electron-updater into an existing packaged app (v2.0.0) distributed on GitHub Releases  

> **NOTE:** Original v1.0 UI redesign pitfalls superseded by v1.1 milestone start. This file covers auto-update integration pitfalls specifically.

---

## Critical Pitfalls

Mistakes that cause silent failures, broken updates, or app-breaking regressions in production.

---

### Pitfall 1: Portable Target Silently Ignores Auto-Update

**What goes wrong:** electron-updater **does not support portable `.exe` targets** on Windows. If `autoUpdater.checkForUpdates()` is called when the app is running as a portable executable, the call either silently fails or throws a confusing error. Users running the portable build never receive updates — with no error message unless you check the log.

**Warning signs:**
- `error` event fired with message like `Cannot update a Portable app` or no event at all on portable
- `update-downloaded` event fires but `quitAndInstall()` does nothing
- Users on portable builds report the app never updates

**Root cause:** electron-updater's `NsisUpdater` targets the NSIS-installed app. Portable `.exe` has no installer mechanism. Official electron-updater README lists only "Windows (NSIS)" as supported — portable is omitted by design.

**Prevention:**
1. Detect whether the running app is portable by checking a known portable marker (e.g., an env var set by electron-builder, or detecting if `app.getPath('exe')` is in a temp/portable path)
2. **For portable builds: skip auto-update entirely** and instead show a manual "Download new version" link opening the GitHub releases page in the browser
3. In main process, guard update logic with a portable check:
   ```js
   // electron-builder sets this for portable builds
   const isPortable = process.env.PORTABLE_EXECUTABLE_DIR != null;
   if (!isPortable && app.isPackaged) {
     autoUpdater.checkForUpdates();
   }
   ```
4. In SettingsView, show different UI for portable users: "Running portable version — updates must be downloaded manually" with a link to GitHub releases

**Phase to address:** Phase 1 (core updater setup) — design the portable detection + branching from day one, not as an afterthought.

**Confidence:** HIGH — official electron-updater README explicitly lists "Windows (NSIS)" only; portable omission is intentional.

---

### Pitfall 2: autoUpdater Crashes in Dev Mode Without Guard

**What goes wrong:** Calling `autoUpdater.checkForUpdates()` in development (when `app.isPackaged === false`) throws an error: `Error: ENOENT: no such file or directory ... app-update.yml` or similar. The error propagates to an unhandled rejection or fires the `error` event, potentially crashing the startup flow.

**Warning signs:**
- Stack trace containing `app-update.yml` on first `npm run electron:dev`
- `autoUpdater.on('error', ...)` fires immediately with "no app-update.yml" on every app launch during dev
- IPC "update:error" event fires before any real update check

**Root cause:** electron-updater reads update metadata from `app-update.yml` inside the packed `app.asar`. This file doesn't exist in dev mode because there is no `.asar`. The `process.env.ELECTRON_DEV === 'true'` pattern the app uses is correct for guarding Vite, but `app.isPackaged` is the authoritative Electron signal.

**Prevention:**
1. **Always guard with `app.isPackaged`** before calling any autoUpdater method:
   ```js
   // In electron/main.cjs
   if (app.isPackaged) {
     autoUpdater.checkForUpdates();
   }
   ```
2. **Do not rely solely on `ELECTRON_DEV`** env var for the updater guard — it can be missing in `electron:preview` mode (`vite build && electron .`), where the app is NOT packaged but ELECTRON_DEV is not set
3. To test update UI in dev without a real update: create `dev-app-update.yml` in project root (matching publish config) and set `autoUpdater.forceDevUpdateConfig = true` before calling `checkForUpdates()`
4. Always register `autoUpdater.on('error', ...)` before calling `checkForUpdates()` — unhandled errors in Electron 34 can terminate the app

**Phase to address:** Phase 1 — must be in the initial wiring before any testing.

**Confidence:** HIGH — documented behavior in electron-builder auto-update docs; `app.isPackaged` is the official guard.

---

### Pitfall 3: Missing or Misconfigured `publish` Field in electron-builder Config

**What goes wrong:** Without a `publish` field in `package.json`'s `build` config, electron-builder does NOT generate `latest.yml` during `electron:build`, and electron-updater cannot locate the update feed. The build succeeds with no errors, but updates never work in production — `autoUpdater.checkForUpdates()` fires an error or returns nothing.

**Warning signs:**
- `latest.yml` absent from `release/` output directory after `npm run electron:build`
- No `latest.yml` attached to GitHub release assets
- `autoUpdater` error: `Cannot find latest.yml in the latest release artifacts`

**Root cause:** Current `package.json` build config has no `publish` field. electron-builder only generates `latest.yml` and uploads assets when `publish` is configured.

**Prevention:**
1. Add `publish` to `package.json` build section **before running any release build**:
   ```json
   "build": {
     "publish": {
       "provider": "github",
       "owner": "<github-username>",
       "repo": "<repo-name>",
       "releaseType": "release"
     }
   }
   ```
2. Verify `latest.yml` appears in `release/` after `npm run electron:build`
3. For CI/CD publish (`GH_TOKEN` required), use `electron-builder --publish always`. For manual upload, use `--publish never` locally and upload `latest.yml` manually with the installer to the GitHub release
4. **Critical:** `latest.yml` must be attached to the GitHub release alongside the `.exe` installer — if only the installer is uploaded without `latest.yml`, users will never receive update notifications
5. The `owner` and `repo` values must exactly match the GitHub repository — typos cause silent 404 failures

**Phase to address:** Phase 1 (electron-builder config) and Phase 2 (first release workflow).

**Confidence:** HIGH — documented in electron-builder auto-update guide; verified `latest.yml` section.

---

### Pitfall 4: Code Signing — Windows Behavior Without Signing

**What goes wrong:** Windows Defender SmartScreen marks the downloaded NSIS installer as "unrecognized app" and shows a "Windows protected your PC" warning when the update installs. This happens on EVERY update for unsigned installers, creating friction and eroding user trust. On some enterprise systems, unsigned installers are blocked entirely. The auto-update mechanism itself (checking, downloading, `quitAndInstall()`) still works without signing.

**Warning signs:**
- Users report SmartScreen popup when app auto-updates
- Update installs correctly but user must click "Run anyway" — some users cancel
- On managed Windows machines: "This app has been blocked by your system administrator"

**Root cause:** `signAndEditExecutable: false` in the current config disables signing. electron-updater does perform code signature validation on Windows (unlike macOS, Windows does NOT require signing to function — it's optional validation). Since the app is unsigned, signature validation is skipped but SmartScreen warnings still fire from Windows itself.

**Prevention:**
1. **Short-term (this milestone):** This is a known limitation of the `signAndEditExecutable: false` setup. Document it in the app's release notes. Ensure the auto-update UX tells users "Click 'More info' → 'Run anyway' if Windows shows a warning."
2. **Medium-term:** If user complaints increase, obtain a code signing certificate (EV or OV) — OV certificates require ~$200-400/year, EV certificates ($400-600/year) bypass SmartScreen reputation building
3. **Do NOT** set `verifyUpdateCodeSignature: false` explicitly — this is already the default behavior when no signing is configured; setting it manually is not needed and may cause confusion

**Phase to address:** Phase 1 — decide early that SmartScreen warnings are an accepted limitation for v1.1. Document for future milestone.

**Confidence:** MEDIUM — behavior based on official docs ("Code signature validation on Windows") + well-known SmartScreen behavior; specific interaction with `signAndEditExecutable: false` extrapolated from docs.

---

### Pitfall 5: GitHub API Rate Limiting on Unauthenticated Update Checks

**What goes wrong:** GitHub's API has a rate limit of **60 requests/hour for unauthenticated requests**. electron-updater uses up to 3 API requests per update check. This means a maximum of ~20 update checks/hour per IP before GitHub returns HTTP 403. If the app checks for updates on every window focus, or if multiple users share a NAT IP, rate limits will be hit and `autoUpdater.on('error', ...)` fires with a 403 error.

**Warning signs:**
- `error` event with "API rate limit exceeded" or HTTP 403
- Update checks fail intermittently, especially in offices or shared networks
- Works fine individually but fails when multiple instances run

**Root cause:** No GitHub token configured. The official electron-builder docs state: "The GitHub API currently has a rate limit of 5000 requests per user per hour. An update check uses up to 3 requests per check." — 5000 is the **authenticated** limit; unauthenticated is 60/hour.

**Prevention:**
1. **Check for updates only on startup** (once per app launch), not on window focus or periodic intervals — this gives worst-case 1 check per app session
2. **Optionally configure a GitHub token** via `autoUpdater.addAuthHeader('Bearer <token>')` or the `GH_TOKEN` env var for authenticated requests (5000/hour limit) — a public read-only token (no scopes) is safe to bundle for public repos
3. Handle rate limit errors gracefully: catch the 403, show no error to the user (treat as "no update available"), log internally
4. Do NOT add a periodic background update check (e.g., setInterval every 30 min) — this multiplies request load

**Phase to address:** Phase 1 (startup check implementation) and Phase 2 (manual check in SettingsView — add explicit rate-limit-aware error handling).

**Confidence:** HIGH — rate limits documented by GitHub and referenced in electron-builder docs.

---

### Pitfall 6: IPC Listener Accumulation in the React Renderer

**What goes wrong:** In React components (e.g., `SettingsView`), calling `window.electronAPI.onUpdateAvailable(callback)` inside `useEffect` without returning a cleanup function causes the listener to pile up on every component re-mount. Each navigation to/from the settings page adds another listener. After several navigations, a single update event fires the callback N times, causing N toasts, N state updates, or N "install" prompts.

**Warning signs:**
- Toast notification appears multiple times for a single update event
- Console log shows update callback firing 2x, 3x, 4x after navigating Settings
- React state update warnings about unmounted components

**Root cause:** The existing IPC pattern in this project uses `ipcMain.handle()` (fire-and-forget handles that are safe). But in the renderer, `ipcRenderer.on(channel, listener)` accumulates listeners unless explicitly removed. There is no existing cleanup pattern in the current `useToast`/`useModals` hooks for IPC listeners.

**Prevention:**
1. **Always return a cleanup in `useEffect`** when registering IPC listeners:
   ```js
   useEffect(() => {
     const unsubscribe = window.electronAPI.onUpdateAvailable((info) => {
       showUpdateToast(info);
     });
     return () => unsubscribe(); // remove listener on unmount
   }, []);
   ```
2. **Expose `removeListener` in preload** so renderer can unsubscribe:
   ```js
   // preload.cjs
   onUpdateAvailable: (cb) => {
     ipcRenderer.on('update:available', (_, info) => cb(info));
     return () => ipcRenderer.removeAllListeners('update:available');
   }
   ```
3. **Use `ipcRenderer.once()`** for one-shot events (e.g., `update-downloaded`) where you only need to know it happened once per session
4. For update state that spans the whole app session (not tied to component lifecycle), **manage it in a top-level React context** or in `App.jsx` (which is never unmounted), not inside `SettingsView`

**Phase to address:** Phase 2 (IPC bridge implementation) — design the preload API with cleanup from the start.

**Confidence:** HIGH — standard React/IPC pattern issue; matches existing `ipcRenderer.on` behavior in Electron.

---

### Pitfall 7: `quitAndInstall()` Conflicts with Google Drive Backup-on-Close

**What goes wrong:** The existing `mainWindow.on('close', ...)` handler in `main.cjs` intercepts window close to trigger Google Drive backup when authenticated (`isQuitting` guard on lines 53–70). When `autoUpdater.quitAndInstall()` is called, it calls `app.quit()` which fires the `close` event on `mainWindow`. If `isQuitting` is still `false` at that point, the handler calls `e.preventDefault()` and requests backup data — blocking the update installation indefinitely. The app never quits, the update never installs.

**Warning signs:**
- Clicking "Install and restart" in the update toast appears to do nothing
- App keeps running after user confirms restart
- Google Drive backup upload is triggered unexpectedly during update

**Root cause:** `quitAndInstall()` → `app.quit()` → `mainWindow.close` event → `isQuitting === false` → `e.preventDefault()` → close blocked. The `isQuitting` flag is only set in the existing flow when closing naturally while authenticated.

**Prevention:**
1. **Set `isQuitting = true` before calling `quitAndInstall()`**:
   ```js
   ipcMain.handle('update:install', () => {
     isQuitting = true; // prevent backup-on-close from blocking
     autoUpdater.quitAndInstall(false, true); // isSilent=false, isForceRunAfter=true
   });
   ```
2. Consider whether backup should run before installing the update — if yes, trigger backup first, then set `isQuitting = true`, then call `quitAndInstall()` in the backup completion callback
3. Add this interaction explicitly to Phase 1 integration checklist

**Phase to address:** Phase 1 — this is an existing system interaction that must be handled in the initial wiring, not discovered later.

**Confidence:** HIGH — direct code reading of `main.cjs` confirms the `e.preventDefault()` logic; conflict is deterministic.

---

### Pitfall 8: `electron-updater` Installed as devDependency Instead of Dependency

**What goes wrong:** If `electron-updater` is added to `devDependencies` instead of `dependencies`, it is excluded from the packaged app bundle. The production build throws `Error: Cannot find module 'electron-updater'` at runtime, crashing the main process. This error is only visible in production (packaged), not in dev mode.

**Warning signs:**
- `require('electron-updater')` throws MODULE_NOT_FOUND in packaged app
- Works perfectly in `npm run electron:dev`, breaks in `npm run electron:build` + run
- No error during build, only at runtime

**Root cause:** electron-builder packages files listed in `"files"` config + all `dependencies`. `devDependencies` are NOT included in the final package. `electron-updater` must be a runtime dependency.

**Prevention:**
```bash
npm install electron-updater   # NOT --save-dev
```
Verify in `package.json` that `electron-updater` appears under `"dependencies"`, not `"devDependencies"`.

**Phase to address:** Phase 1 (installation step).

**Confidence:** HIGH — standard electron-builder packaging behavior.

---

### Pitfall 9: Silent Failures Without a Logger Configured

**What goes wrong:** By default, electron-updater logs nothing. Update check failures, download errors, and version mismatches produce no output visible in production. When users report "updates don't work," there is no diagnostic information available to debug the issue.

**Warning signs:**
- Update doesn't work but no errors appear in any log
- `autoUpdater.on('error', ...)` handler was not registered
- Packaged app logs are empty on update-related issues

**Root cause:** `autoUpdater.logger` is `null` by default. The `error` event is the only feedback mechanism, and if it's not registered before calling `checkForUpdates()`, errors are silently swallowed.

**Prevention:**
1. Set a logger immediately on import:
   ```js
   const { autoUpdater } = require('electron-updater');
   autoUpdater.logger = require('electron-log');  // if electron-log is installed
   autoUpdater.logger.transports.file.level = 'info';
   // OR use console for simplicity:
   autoUpdater.logger = console;
   ```
2. **Always register `autoUpdater.on('error', handler)` before any `checkForUpdates()` call** — unhandled errors in Electron 34 can crash the main process
3. `electron-log` writes to `%APPDATA%\MoneyFlow\logs\` automatically — useful for user-reported bugs

**Phase to address:** Phase 1 — logging must be configured before any update logic is wired.

**Confidence:** HIGH — documented default behavior; electron-log is the standard companion.

---

### Pitfall 10: `type: "module"` in package.json Breaks require() in New Main Process Files

**What goes wrong:** `package.json` has `"type": "module"`, which makes Node.js treat all `.js` files as ES modules. If a new file is added to `electron/` with a `.js` extension (e.g., `updateManager.js`), it cannot use `require()` — the CommonJS pattern used throughout `main.cjs` and `googleDrive.cjs`. The error is: `ReferenceError: require is not defined in ES module scope`.

**Warning signs:**
- Any new `.js` file added to `electron/` that uses `require()` fails immediately
- Works fine in existing `.cjs` files but breaks in newly created `.js` files

**Root cause:** `package.json` `"type": "module"` + `.js` extension = ESM. The project already correctly uses `.cjs` for main process files, but this must be maintained consistently.

**Prevention:**
1. **All new electron main process files must use `.cjs` extension** — enforce as a project rule
2. Create update logic in `electron/updater.cjs` (not `updater.js`)
3. Add a comment at the top of `electron/main.cjs`: `// All electron/ files must use .cjs extension (package.json type:module)`

**Phase to address:** Phase 1 — naming convention must be established before creating any new files.

**Confidence:** HIGH — directly observable from `package.json` + existing file naming pattern.

---

### Pitfall 11: Blocking Update Dialogs in the Main Process

**What goes wrong:** Using `dialog.showMessageBoxSync()` or `dialog.showMessageBox().then()` in `autoUpdater` event handlers blocks the Electron main process event loop during the dialog. This freezes the entire app UI, including Google Drive operations and IPC responses. More critically: it is not the design intended by UPD-03 (non-blocking toast).

**Warning signs:**
- App becomes unresponsive while update dialog is open
- Google Drive backup triggered during update dialog hangs
- Entire app freezes if dialog fires during a Drive sync

**Prevention:**
1. **Never use `dialog.showMessageBoxSync()`** in update handlers — it blocks the event loop
2. Always send IPC events to the renderer and let React handle the update UX:
   ```js
   autoUpdater.on('update-available', (info) => {
     mainWindow.webContents.send('update:available', info);
   });
   ```
3. The renderer shows a non-blocking toast (UPD-03) with an "Install and Restart" button that sends `update:install` back via IPC

**Phase to address:** Phase 2 (IPC bridge + renderer UX) — architecture decision that must be stated explicitly.

**Confidence:** HIGH — well-known Electron pattern; aligns with stated UPD-03 requirement.

---

## Moderate Pitfalls

---

### Pitfall 12: CSP Does NOT Block electron-updater (But Renderer CSP May Need Update)

**What goes wrong (misconception):** Developers sometimes assume the strict CSP in `main.cjs` will block electron-updater from reaching GitHub. It won't — electron-updater runs in the **main process (Node.js)**, not in the renderer. CSP only applies to web content loaded in `BrowserWindow`. However, if any update-related UI in the renderer makes direct `fetch()` calls to GitHub (anti-pattern), those would be blocked by the current CSP.

**Prevention:**
1. **No action needed for electron-updater** — main process network calls are not subject to renderer CSP
2. Do NOT make `fetch()` calls to GitHub from the renderer for update checks — route everything through IPC to the main process
3. If `electron-log` is used and configured to send logs to a remote endpoint, the CSP `connect-src` would need updating — but this is not required for basic auto-update

**Phase to address:** Phase 1 — no action required, but developers should be aware to avoid unnecessary CSP changes.

**Confidence:** HIGH — confirmed from Electron architecture; CSP is renderer-only.

---

### Pitfall 13: Version Tag Format Mismatch Between package.json and GitHub Tags

**What goes wrong:** electron-updater checks the GitHub releases API for the latest release with a tag matching the version format. If `package.json` version is `2.0.0` but the GitHub tag is `v2.0.0` (with prefix `v`), the version comparison may fail or behave unexpectedly.

**Warning signs:**
- Auto-updater always reports "update available" even after updating
- `latest.yml` version field doesn't match GitHub tag
- `checkForUpdates()` resolves but `updateInfo.version` seems wrong

**Prevention:**
1. The existing `release:patch/minor/major` scripts use `npm version` which creates tags like `v2.0.0` (with `v` prefix) — this is the GitHub convention
2. electron-builder handles the `v` prefix stripping automatically when comparing — **no action needed** as long as all releases use the same tag format consistently
3. Verify: first release after adding electron-updater should be tested end-to-end before shipping

**Phase to address:** Phase 2 (first release test).

**Confidence:** MEDIUM — electron-builder handles `v` prefix; specific behavior in edge cases needs end-to-end testing.

---

### Pitfall 14: `latest.yml` Checksum Mismatch After Manual File Edits

**What goes wrong:** If anyone manually edits the NSIS installer `.exe` after `electron:build` (e.g., re-signing, post-processing), the SHA512 checksum in `latest.yml` no longer matches the file. electron-updater validates the checksum after download and rejects the file with: `Error: sha512 checksum mismatch`.

**Prevention:**
1. Never manually modify release artifacts after building — generate a fresh build if changes are needed
2. If re-signing post-build becomes necessary in the future, regenerate `latest.yml` checksum accordingly
3. Not relevant for current `signAndEditExecutable: false` setup

**Phase to address:** Phase 2 (release process documentation).

**Confidence:** HIGH — documented electron-updater behavior.

---

## Phase-Specific Warnings Summary

| Phase | Topic | Pitfall | Mitigation |
|-------|-------|---------|------------|
| Phase 1: Core Wiring | Install electron-updater | Installed as devDep | Use `npm install electron-updater` (no --save-dev) |
| Phase 1: Core Wiring | Portable detection | Auto-update on portable crashes | Guard with `PORTABLE_EXECUTABLE_DIR` check |
| Phase 1: Core Wiring | Dev mode guard | Crashes on `checkForUpdates()` in dev | `if (app.isPackaged)` guard required |
| Phase 1: Core Wiring | electron-builder config | No `latest.yml` generated | Add `publish.github` config before first build |
| Phase 1: Core Wiring | quitAndInstall + Drive backup | Update install blocked by backup handler | Set `isQuitting = true` before `quitAndInstall()` |
| Phase 1: Core Wiring | File naming | `require()` fails in `.js` files | All new electron files must use `.cjs` extension |
| Phase 1: Core Wiring | Logging | Silent failures in production | Configure `autoUpdater.logger` + register `error` handler |
| Phase 2: IPC Bridge | Renderer listeners | IPC listener accumulation | useEffect cleanup + `removeAllListeners` in preload |
| Phase 2: IPC Bridge | Update dialogs | Blocking `dialog.showMessageBoxSync()` | Always use IPC → renderer toast (UPD-03 pattern) |
| Phase 2: IPC Bridge | GitHub rate limits | 403 from GitHub API | One check per startup; handle 403 gracefully |
| Phase 2: Release | latest.yml upload | Missing from GitHub release | Verify `latest.yml` in release assets before announcing |
| Phase 2: Release | Version tag format | Tag/version mismatch | End-to-end test first update cycle before v1.1 ship |

---

## Sources

- electron-updater official README: https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater (HIGH confidence)
- electron-builder Auto Update guide: https://www.electron.build/auto-update (HIGH confidence)
- GitHub API rate limits: https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api (HIGH confidence)
- MoneyFlow `electron/main.cjs` — direct code inspection (HIGH confidence, project-specific)
- MoneyFlow `package.json` build config — direct code inspection (HIGH confidence, project-specific)