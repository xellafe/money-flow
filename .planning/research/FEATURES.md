# Feature Landscape — Auto-Update UX

**Milestone:** v1.1 Auto-Update (electron-updater + GitHub Releases)
**Domain:** Electron desktop auto-update UX patterns
**Researched:** 2026-04-03
**App stack:** React 19, Framer Motion, Tailwind CSS v4, Radix Dialog, Lucide icons
**Existing infra:** Toast (success/error, 3s auto-dismiss), SettingsView (section+button pattern), IPC bridge (invoke + webContents.send)

## Table Stakes

| Feature | Description |
|---------|-------------|
| Auto-check on startup | Silent check; show notification only if update found |
| Update available toast | Non-blocking, persistent until dismissed, shows version, "Installa e riavvia" CTA |
| SettingsView update section | Shows current version (`app.getVersion()`), last checked timestamp, "Controlla aggiornamenti" button |
| Manual check feedback | Loading spinner → found / already up-to-date / error |
| Install on user action | `autoUpdater.quitAndInstall()` only after user clicks CTA |
| No-update silent path | Startup check: if no update, do nothing (no toast) |
| Error handling | Network error, GitHub rate limit, bad release → show error state in Settings, never crash |

## Differentiators

| Feature | Description | Complexity |
|---------|-------------|------------|
| Download progress | Show % in Settings while downloading | Low — `download-progress` event available |
| Version number in toast | "Versione 2.1.0 disponibile" | Trivial |
| Portable target notice | If portable build detected, show "Scarica manualmente" link instead of auto-install | Medium |

## Anti-Features (Avoid)

- **Blocking modal** — never block app usage while checking/downloading
- **Auto-restart** without user consent (data loss risk if transactions unsaved)
- **Forced update** — user must always be able to dismiss
- **Check on every focus** — startup + manual only, not on every window focus
- **Verbose logs to UI** — keep debug output to console/log file, not visible in UI

## UX Flow

```
App startup
  └─ autoUpdater.checkForUpdates()
       ├─ update-available → show UpdateBanner (persistent, dismissible)
       │     └─ user clicks "Installa e riavvia" → autoUpdater.quitAndInstall()
       ├─ update-not-available → (silent, no UI)
       └─ error → (silent at startup; show error only in Settings if manual check)

Settings > Aggiornamenti section
  ├─ Shows: v{current} | Ultimo controllo: {timestamp}
  ├─ Button "Controlla aggiornamenti"
  │     ├─ loading state
  │     ├─ found → same UpdateBanner + "Versione X.Y.Z disponibile" in section
  │     ├─ up-to-date → "Sei già aggiornato" feedback
  │     └─ error → "Impossibile controllare gli aggiornamenti" with retry
  └─ If update already downloaded → show "Pronto per installare" + CTA
```
---

## Codebase Constraints Discovered

Before the feature list: critical integration constraints found in the source files that shape every UX decision.

### Toast.jsx — Requires Extension
The current `Toast` is **not suitable** for an update notification as-is:
```jsx
// Current: auto-dismisses after 3000ms, success/error only, no action button
const timer = setTimeout(onClose, 3000);
// Only renders Check or AlertCircle icon, static message text
```
The update notification needs:
- **No auto-dismiss** (or configurable `duration` prop) — user must act on it
- **Action button slot** — "Installa e riavvia" CTA inside the toast
- **`info` or `update` type** — visually distinct from success/error (e.g., blue/indigo accent with `Download` or `RefreshCw` icon from Lucide)

**Implementation path:** Extend `Toast` with optional `persistent` prop (skips `setTimeout`) + optional `action: { label, onClick }` prop. Backwards-compatible; existing callers unchanged. **Low complexity.**

### SettingsView.jsx — Section Pattern is Perfect
Current pattern: `<section>` with uppercase `<h3>` label + a `<button>` that opens a modal. The "Aggiornamenti" section **should NOT open a modal** — inline state display is the right UX here. Instead: version string, status text, and the check button all live inline within the section. No modal needed. Matches existing visual pattern exactly.

### main.cjs — CSP Must Be Updated
The `connect-src` directive currently allows only:
```
'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://oauth2.googleapis.com
```
`electron-updater` downloads from GitHub Releases (`objects.githubusercontent.com`) and checks for updates at the GitHub API (`api.github.com`). **CSP will block update downloads in production** unless extended. This is a non-obvious blocker that must be addressed in the same phase as the updater setup.

### package.json — electron-updater Not Installed
`electron-updater` is absent from `dependencies`. It must be added (`npm install electron-updater`). Note: `electron-builder` (already present as devDep) and `electron-updater` are from the same team and work together via the `build.publish` config key.

### package.json — Portable Build Cannot Auto-Update
The build config specifies:
```json
"win": { "target": ["portable", "nsis"] }
```
`portable` EXE builds **do not support auto-update** — they run without installation and cannot overwrite themselves. Only `nsis` (installer) builds can self-update. The auto-update feature will only work for users who installed via the NSIS installer. This must be documented and the portable target should ideally be removed or deprioritized.

### IPC Pattern — Established, Easy to Follow
The existing Drive sync IPC uses `ipcMain.handle` (renderer-initiated request/response) and `mainWindow.webContents.send` (main-initiated push events). The update IPC bridge follows the identical pattern. Low risk.

---

## Table Stakes

Features that MUST exist for the auto-update feature to be functional and non-broken. Missing any of these = the feature is incomplete.

| Feature | Why Table Stakes | Complexity | Existing Dependency |
|---------|-----------------|------------|---------------------|
| **electron-updater installed + configured** | Nothing works without it. Needs `build.publish` pointing to GitHub Releases in `package.json` | Low | `electron-builder` already present |
| **Auto-check on startup (silent)** | Core contract: user opens app, update check happens. No user action needed. On success (up-to-date), completely silent. | Low | New `ipcMain` handler in `main.cjs` |
| **IPC bridge: 5 events wired up** | Renderer can't know update state without IPC. Events: `update-available`, `update-not-available`, `download-progress`, `update-downloaded`, `update-error`. Commands: `check-for-updates`, `install-update` | Medium | Follows existing Drive IPC pattern in `preload.cjs` |
| **Persistent update toast with CTA** | User must be told an update is ready and given one-tap path to install. Non-blocking = doesn't interrupt workflow, but stays visible until dismissed or acted on. | Medium | Requires Toast extension (persistent prop + action prop) |
| **Settings "Aggiornamenti" section: version display** | Users need to know what version they're on. "Versione attuale: v2.0.0" | Low | `app.getVersion()` via IPC, inline in SettingsView section |
| **Settings: manual check button** | Power-user escape hatch. When auto-check hasn't run or user wants confirmation. Matches UPD-05. | Low | New IPC command `check-for-updates` |
| **Settings: check status display (4 states)** | Button press must provide feedback. 4 states: `idle` → `checking` (spinner) → `found \| up-to-date \| error`. | Medium | Inline state in SettingsView section, no modal |
| **"Install and Restart" action** | The whole point. `autoUpdater.quitAndInstall()` called via IPC when user clicks. | Low | New IPC command `install-update` |
| **CSP updated for GitHub domains** | Without this, update downloads silently fail in production. `api.github.com` + `objects.githubusercontent.com` must be added to `connect-src`. | Low | Edit `main.cjs` CSP header string |

---

## Differentiators

Nice-to-have features that improve the UX without being blockers. All are optional for v1.1 MVP.

| Feature | Value Proposition | Complexity | Recommendation |
|---------|-------------------|------------|----------------|
| **Download progress in Settings section** | "Downloading 2.1 MB / 8.4 MB (25%)" — reassures user update is happening. Uses `download-progress` IPC event. Small progress bar under the button. | Medium | **Include** — `download-progress` event is emitted by electron-updater for free; showing a `<div>` progress bar is trivial. High perceived quality gain for low effort. |
| **Version number in update toast** | "v2.1.0 disponibile" vs just "Aggiornamento disponibile" — gives context | Low | **Include** — the `update-available` event payload includes `version`. One string interpolation. |
| **Download progress in toast** | Animated toast updates to show download % | High | **Defer** — requires mutable toast state (Toast is currently stateless/immutable after render). Adds complexity without proportional value. The Settings section progress bar is sufficient. |
| **Release notes link / changelog snippet** | Show what changed in the new version | High | **Defer** — requires fetching and parsing GitHub release notes, markdown rendering. Not worth the complexity in v1.1. |
| **"Dismiss / remind me later"** | User can acknowledge toast without installing | Low | **Optional** — trivial to add a "Più tardi" secondary button that just closes the toast. Adds user control. |
| **Startup check delay** | Wait 5-10s after app ready before checking, to not slow perceived startup | Low | **Include** — wrap `checkForUpdates()` in a `setTimeout(5000)` in `app.whenReady`. Prevents startup jank on slow connections. |
| **Error message differentiation** | "Nessuna connessione" vs "GitHub non raggiungibile" vs "Rate limit superato" — different messages for different failure modes | Medium | **Optional** — parse the error code/message from electron-updater's error event. Adds polish but not critical. A single fallback message is acceptable for v1.1. |

---

## Anti-Features

Patterns to explicitly avoid. Each has a concrete "instead" recommendation.

| Anti-Feature | Why Avoid | Instead |
|--------------|-----------|---------|
| **Blocking modal / dialog on update available** | Interrupts the user mid-task in a finance app. Jarring. Feels like nagware. The user might be in the middle of categorizing transactions. | Non-blocking persistent toast (bottom-right, same position as existing toasts) |
| **Auto-install without consent** | Silent restart will corrupt any in-progress work (transaction editing, import flow). Unexpected for a personal finance tool. | Always require explicit "Installa e riavvia" click. `autoDownload: true` is fine (download silently), but `quitAndInstall()` must be user-triggered. |
| **Forced update screen (app blocked until updated)** | Extreme anti-pattern for a personal desktop app. No justification exists for a single-user local tool. | Soft notification only. User can dismiss and use the app forever on the old version. |
| **Checking on every focus/resume event** | Hammers the GitHub API, triggers rate limiting (60 req/hour unauthenticated), causes 403 errors. Annoying if multiple windows/monitors. | Check once at startup (with 5s delay). Manual check in Settings on demand. No more. |
| **Showing "up to date" toast on startup** | Noisy. User doesn't care that nothing changed. Successful check → silent. | Only surface notifications when there IS an update, or when user explicitly triggered a manual check (then show result). |
| **Progress modal during download** | A heavy Radix Dialog just to show a progress bar is over-engineering. Blocks interaction. | Download silently in background. Show progress inline in Settings section only if user is already there. Toast fires only when download is complete. |
| **Full release notes rendered in-app** | Requires markdown parser, GitHub API call, layout for arbitrary content. V1.1 is about plumbing, not a changelog browser. | If needed, a "Vedi novità" link that opens GitHub Releases page in default browser via `shell.openExternal()`. One line of code. |
| **Removing portable build target** | Portable users exist and would lose their build format | Keep `portable` target but document that auto-update only works on NSIS-installed builds. Portable users see no update UI (guard with `electron-updater` `autoUpdater.isUpdaterActive()` check). |

---

## UX Flow

### Flow 1: Startup Auto-Check (Happy Path — Update Available)

```
App launches
  └── main.cjs: app.whenReady()
        └── createWindow()
        └── setTimeout(5000) → autoUpdater.checkForUpdates()
              └── electron-updater: finds new version
              └── autoDownload: true → download starts silently
              └── [download-progress events firing, renderer optionally listening]
              └── update-downloaded event fires
              └── main.cjs: mainWindow.webContents.send('update-downloaded', { version })
                    └── renderer: receives via preload onUpdateDownloaded()
                    └── renderer: shows persistent UpdateToast
                          ┌── Icon: Download (Lucide, blue)
                          ├── Text: "MoneyFlow v2.1.0 è pronto"
                          ├── CTA button: "Installa e riavvia"  → ipcRenderer.invoke('install-update')
                          └── X dismiss button → closes toast, update deferred to next launch
```

**Key decisions:**
- Fire toast only on `update-downloaded` (not `update-available`) — user can act immediately without waiting
- Toast is **persistent** (no auto-dismiss timer)
- Download happens silently, no progress shown unless user goes to Settings

---

### Flow 2: Startup Auto-Check (Happy Path — Already Up to Date)

```
App launches
  └── setTimeout(5000) → autoUpdater.checkForUpdates()
        └── electron-updater: no update found
        └── update-not-available fires
        └── [nothing shown to user — completely silent]
```

**No toast, no notification. Zero UX noise.**

---

### Flow 3: Startup Auto-Check (Error — Network / Rate Limit)

```
App launches
  └── setTimeout(5000) → autoUpdater.checkForUpdates()
        └── electron-updater: error (no network / 403 rate limit / server down)
        └── error event fires
        └── main.cjs: catches error, logs to console only
        └── [nothing shown to user — silent failure on startup]
```

**On startup errors: silent.** The user didn't ask to check; informing them of a background check failure adds noise. They can always use the manual check in Settings if they care.

---

### Flow 4: Manual Check in Settings (All States)

```
User navigates to Settings → "Aggiornamenti" section visible:
  ┌── "Versione attuale: v2.0.0"
  └── [Button: "Controlla aggiornamenti"] [state: idle]

User clicks button:
  └── ipcRenderer.invoke('check-for-updates')
  └── Button state → "checking" (spinner, disabled)
  └── Status text: "Controllo in corso..."

  Case A — Update available (already downloading):
    └── download-progress events update inline progress bar (optional differentiator)
    └── update-downloaded fires
    └── Button state → "found"
    └── Status text: "v2.1.0 disponibile ✓"
    └── New button appears: [Installa e riavvia] (primary blue style)

  Case B — Already up to date:
    └── update-not-available fires
    └── Button state → "up-to-date"
    └── Status text: "Sei aggiornato ✓" (with green Check icon, Lucide)
    └── Button resets to idle after 3000ms

  Case C — Error (no network):
    └── update-error fires with { message }
    └── Button state → "error"
    └── Status text: "Impossibile verificare: nessuna connessione" (red AlertCircle icon)
    └── Button resets to idle after 5000ms (allows retry)
```

---

### Flow 5: User Deferred Update (Restart Needed)

```
User dismissed toast (clicked X)
  └── Toast closes
  └── Update package stays downloaded on disk (electron-updater keeps it)
  └── On next app launch: update-downloaded fires immediately (no re-download)
  └── UpdateToast appears again
```

**electron-updater automatically re-fires `update-downloaded` on next launch if a downloaded update is pending.** No extra code needed for this flow.

---

## IPC Contract

Complete specification for the IPC bridge (UPD-06).

### Renderer → Main (commands via `ipcRenderer.invoke`)

| Channel | Payload | Response |
|---------|---------|----------|
| `updater:check` | none | `{ triggered: true }` |
| `updater:install` | none | never returns (app restarts) |
| `updater:get-version` | none | `{ version: string }` |

### Main → Renderer (events via `webContents.send` + `ipcRenderer.on`)

| Channel | Payload | When |
|---------|---------|------|
| `updater:available` | `{ version: string }` | New version found, download starting |
| `updater:not-available` | `{ version: string }` | Already on latest version |
| `updater:progress` | `{ percent: number, bytesPerSecond: number, transferred: number, total: number }` | During download |
| `updater:downloaded` | `{ version: string }` | Download complete, ready to install |
| `updater:error` | `{ message: string, code?: string }` | Any failure |

### preload.cjs additions (follow existing pattern)

```js
updater: {
  check: () => ipcRenderer.invoke('updater:check'),
  install: () => ipcRenderer.invoke('updater:install'),
  getVersion: () => ipcRenderer.invoke('updater:get-version'),
  onAvailable: (cb) => { ... ipcRenderer.on('updater:available', ...) },
  onNotAvailable: (cb) => { ... },
  onProgress: (cb) => { ... },
  onDownloaded: (cb) => { ... },
  onError: (cb) => { ... },
}
```

---

## Component Inventory

| Component | Action | Notes |
|-----------|--------|-------|
| `Toast.jsx` | **Extend** | Add `persistent?: boolean` prop (skips setTimeout), `action?: { label, onClick }` prop (renders CTA button inside toast), `type: 'update'` (blue/indigo, Download icon). Backwards-compatible. |
| `SettingsView.jsx` | **Extend** | Add "Aggiornamenti" section. New props: `currentVersion`, `updateStatus`, `updateVersion`, `downloadProgress`, `onCheckUpdates`, `onInstallUpdate`. Inline state display, no modal. |
| `useToast.js` (hook in App.jsx) | **Extend** | Add `showUpdateToast(version)` method. Needs to support persistent toast without auto-clear. |
| `electron/main.cjs` | **Extend** | Add `autoUpdater` setup block, 5 IPC handlers, startup check with setTimeout. |
| `electron/preload.cjs` | **Extend** | Add `window.electronAPI.updater` namespace with 3 invoke commands + 5 event listeners. |
| `electron/main.cjs` CSP | **Edit** | Add `https://api.github.com https://objects.githubusercontent.com` to `connect-src`. |

No new components need to be created. All changes are additive extensions to existing files.

---

## Feature Dependency Graph

```
electron-updater installed + build.publish config     ← prerequisite for everything
         │
         ├── main.cjs: autoUpdater setup + startup check
         │         │
         │         └── IPC bridge (main.cjs handlers + preload.cjs)
         │                   │
         │                   ├── Toast.jsx extension (persistent + action)
         │                   │         └── UpdateToast shown on update-downloaded
         │                   │
         │                   └── SettingsView.jsx extension (version + manual check + status)
         │
         └── CSP update (connect-src: github domains)     ← must ship with above
```

**Linear dependency — each layer requires the one above. No parallelism possible.**

---

## Complexity Summary

| Feature | Complexity | Estimated scope |
|---------|------------|-----------------|
| Install electron-updater + build.publish config | Low | 5-10 lines package.json |
| CSP update for GitHub domains | Low | 1 line in main.cjs |
| main.cjs: autoUpdater setup + startup check + IPC handlers | Medium | ~60 lines |
| preload.cjs: updater namespace | Low | ~25 lines |
| Toast.jsx: persistent + action props | Low | ~15 lines delta |
| SettingsView.jsx: Aggiornamenti section | Medium | ~60 lines new JSX + state |
| useToast / App.jsx: showUpdateToast integration | Low | ~10 lines |
| **Total** | **Medium** | **~175 lines net new** |

---

## Sources

- electron-updater documentation: https://www.electron.build/auto-update
- Electron IPC contextBridge pattern: existing codebase `electron/preload.cjs`
- electron-builder build config: existing codebase `package.json` build key
- Toast component analysis: existing codebase `src/components/Toast.jsx`
- SettingsView pattern analysis: existing codebase `src/views/SettingsView.jsx`
- CSP constraint analysis: existing codebase `electron/main.cjs` lines 93-109
- Portable vs NSIS auto-update limitation: electron-builder known behavior (confidence: HIGH — well-documented)
- GitHub API rate limit (60 req/hour unauthenticated): GitHub docs (confidence: HIGH)

