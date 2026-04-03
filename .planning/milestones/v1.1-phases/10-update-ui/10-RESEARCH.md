# Phase 10: Update UI - Research

**Researched:** 2026-04-03
**Domain:** React UI components, Electron IPC integration, Framer Motion animation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `autoDownload: false` — renderer calls `startDownload()` automatically in the `onUpdateAvailable` handler. No user action required to start download.
- **D-02:** `useUpdateStatus` hook in `src/hooks/useUpdateStatus.js` owns all update state. Shape: `{ status, version, progress, error, appVersion, isDismissed, checkForUpdates, installUpdate, dismissBanner }`. Status values: `'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error'`. `appVersion` fetched on mount via `window.electronAPI.getAppVersion()`.
- **D-03:** Hook exported from `src/hooks/index.js` barrel file.
- **D-04:** `UpdateBanner.jsx` lives in `src/components/`, exported from `src/components/index.js`.
- **D-05:** Visual style matches Toast: `bg-white border border-gray-200 shadow-lg rounded-xl`. Uses ArrowDownToLine (or Download) icon from Lucide React. Message: `'Aggiornamento disponibile — v{version}'` + `'Installa e riavvia'` + X dismiss button.
- **D-06:** Banner is dismissable. Dismissed state not persisted — resets on next app restart.
- **D-07:** Animation mirrors Toast. App.jsx wraps both Toast and UpdateBanner in shared `AnimatePresence`. `motion.div` with `initial: { opacity: 0, y: 20 }`.
- **D-09:** Toast and UpdateBanner stack in single inline flex container in App.jsx: `<div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3">`. No extra component needed.
- **D-10:** Phase 10 adds `ipcMain.handle('get-app-version', () => app.getVersion())` in `main.cjs` and `window.electronAPI.getAppVersion()` in `preload.cjs`.
- **D-11:** `SettingsView` receives a single `updateStatus` prop. New signature: `function SettingsView({ onShowCategoryManager, onShowSyncSettings, updateStatus })`.
- **D-12 through D-14:** Post-check states shown as text only, no progress bar. Progress as percentage text. See CONTEXT.md §Decisions for full state machine.

### Agent's Discretion

- Exact Tailwind classes for the Aggiornamenti section layout (follow existing section pattern)
- Exact Lucide icon: ArrowDownToLine vs Download — either works
- Whether `useUpdateStatus` initializes with `status: 'idle'` or triggers immediate check (should be idle)
- Internal IPC channel name for `get-app-version` (e.g., `'app:get-version'` if namespace convention exists)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPD-04 | Show non-blocking UpdateBanner in bottom-right when update is available, with version and "Installa e riavvia" button | UpdateBanner component, useUpdateStatus hook, shared notification container in App.jsx |
| UPD-05 | Banner visible only when download is completed (`status === 'ready'`) — not during download | `isDismissed` flag + status check in UpdateBanner visibility rule |
| UPD-07 | Settings screen shows "Aggiornamenti" section with current app version (`app.getVersion()` via IPC) | New `get-app-version` IPC handler in main.cjs + `getAppVersion` in preload.cjs |
| UPD-08 | "Controlla aggiornamenti" button with loading state during check | `useUpdateStatus.checkForUpdates()` sets `status: 'checking'`, button disabled |
| UPD-09 | Three post-check states displayed in Settings section | Status state machine in `useUpdateStatus` hook driving SettingsView rendering |
</phase_requirements>

---

## Summary

Phase 10 is purely a React/Electron renderer-side feature. The IPC bridge from Phase 9 is **already fully implemented** in `preload.cjs` (all 5 listener methods + 3 invoke methods). The only new Electron-side code needed is one IPC handler (`get-app-version`) in `main.cjs` and one bridge method (`getAppVersion`) in `preload.cjs`. Everything else is React component and hook work.

The pattern set by `Toast.jsx` is the direct template for `UpdateBanner`. The critical codebase surgery is in `App.jsx`: the current Toast has its own `fixed bottom-6 right-6 z-50` positioning baked into its className (line 23 of Toast.jsx), and the existing `AnimatePresence` for Toast uses `mode="wait"`. Both of these must be refactored to create the shared notification stack container.

**Primary recommendation:** Build `useUpdateStatus` hook first (it's the foundation everything else depends on), then build `UpdateBanner`, then wire both into App.jsx (including Toast className surgery), then add the Aggiornamenti section to SettingsView, and finally add the IPC `get-app-version` additions.

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Already In Use |
|---------|---------|---------|----------------|
| React | 18.x | UI components, hooks, state | Yes — all components |
| Framer Motion | 11.x | AnimatePresence, motion.div animations | Yes — Toast.jsx, App.jsx page transitions |
| Lucide React | latest | ArrowDownToLine, X, Loader2 icons | Yes — Toast.jsx uses Check, AlertCircle, X |
| Tailwind CSS v4 | 4.x | Utility classes | Yes — entire app |

**No new package installations required for this phase.**

---

## Architecture Patterns

### Recommended File Map

```
src/
├── hooks/
│   ├── useUpdateStatus.js     ← CREATE (new hook)
│   └── index.js               ← EDIT (add export)
├── components/
│   ├── UpdateBanner.jsx       ← CREATE (new component)
│   └── index.js               ← EDIT (add export)
├── views/
│   └── SettingsView.jsx       ← EDIT (add updateStatus prop + Aggiornamenti section)
└── App.jsx                    ← EDIT (hook, container refactor, prop passing)
electron/
├── main.cjs                   ← EDIT (add get-app-version handler)
└── preload.cjs                ← EDIT (add getAppVersion bridge method)
```

### Pattern 1: useUpdateStatus Hook Architecture

**What:** Central hook owning all update state. Subscribes to 5 IPC events in a single `useEffect`, returns unified state + action functions.

**Key IPC event → state transitions:**
- `onUpdateAvailable(info)` → `status: 'available'`, `version: info.version`, then auto-calls `startDownload()`
- `onDownloadProgress(progress)` → `status: 'downloading'`, `progress: Math.round(progress.percent)` (**note: `progress.percent` not `progress`**)
- `onUpdateDownloaded(info)` → `status: 'ready'`
- `onUpdateNotAvailable()` → `status: 'up-to-date'`
- `onUpdateError(message)` → `status: 'error'`, `error: message`

**Example:**
```javascript
// src/hooks/useUpdateStatus.js
import { useState, useEffect, useCallback } from 'react';

export function useUpdateStatus() {
  const [status, setStatus] = useState('idle');
  const [version, setVersion] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [appVersion, setAppVersion] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch app version once on mount
  useEffect(() => {
    window.electronAPI.getAppVersion().then(setAppVersion);
  }, []);

  // Subscribe to all 5 IPC events — combined cleanup
  useEffect(() => {
    const cleanups = [
      window.electronAPI.updater.onUpdateAvailable((info) => {
        setStatus('available');
        setVersion(info.version);
        // D-01: auto-start download
        window.electronAPI.updater.startDownload();
      }),
      window.electronAPI.updater.onDownloadProgress((prog) => {
        setStatus('downloading');
        setProgress(Math.round(prog.percent)); // prog is {percent, bytesPerSecond, transferred, total}
      }),
      window.electronAPI.updater.onUpdateDownloaded(() => {
        setStatus('ready');
      }),
      window.electronAPI.updater.onUpdateNotAvailable(() => {
        setStatus('up-to-date');
      }),
      window.electronAPI.updater.onUpdateError((message) => {
        setStatus('error');
        setError(message);
      }),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    await window.electronAPI.updater.checkForUpdates();
    // Result handled by event listeners above
  }, []);

  const installUpdate = useCallback(() => {
    window.electronAPI.updater.installUpdate();
  }, []);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true); // Does NOT change status — Settings still shows 'ready' state
  }, []);

  return { status, version, progress, error, appVersion, isDismissed,
           checkForUpdates, installUpdate, dismissBanner };
}
```

### Pattern 2: UpdateBanner Component

**What:** Visual notification, not fixed-positioned (parent container owns position). Render only when `status === 'ready' && !isDismissed`.

```jsx
// src/components/UpdateBanner.jsx
import { motion } from 'framer-motion';
import { ArrowDownToLine, X } from 'lucide-react';

export default function UpdateBanner({ version, onInstall, onDismiss }) {
  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      <ArrowDownToLine size={18} className="text-blue-500 shrink-0" />
      <div className="flex flex-col flex-1 gap-0.5">
        <span className="text-sm text-gray-800">Aggiornamento disponibile — v{version}</span>
        <button
          onClick={onInstall}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
        >
          Installa e riavvia
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        aria-label="Chiudi notifica aggiornamento"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
```

### Pattern 3: Shared Notification Stack in App.jsx

**What:** Single fixed container replaces Toast's own fixed positioning. Both notifications are co-located children.

```jsx
{/* Shared notification stack — bottom-right corner */}
<div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3">
  <AnimatePresence>
    {toast && (
      <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
    )}
  </AnimatePresence>
  <AnimatePresence>
    {updateStatus.status === 'ready' && !updateStatus.isDismissed && (
      <UpdateBanner
        key="update-banner"
        version={updateStatus.version}
        onInstall={updateStatus.installUpdate}
        onDismiss={updateStatus.dismissBanner}
      />
    )}
  </AnimatePresence>
</div>
```

**Note:** `flex-col-reverse` means Toast (lower in DOM) renders at bottom edge; UpdateBanner stacks above it visually.

### Pattern 4: IPC Channel Naming Convention

**What:** Existing main.cjs uses `'google-drive:*'` and `'updater:*'` namespace prefixes. The new `get-app-version` handler should follow this or use a simple name.

**Observed convention:** Top-level utility handlers in main.cjs don't use namespaces (`'backup-data-for-close'`). For consistency with the existing short-form handlers, `'get-app-version'` is appropriate. This is agent's discretion.

```javascript
// electron/main.cjs — add after existing handlers
ipcMain.handle('get-app-version', () => app.getVersion());

// electron/preload.cjs — add to electronAPI object
getAppVersion: () => ipcRenderer.invoke('get-app-version'),
```

### Anti-Patterns to Avoid

- **Forgetting Toast className surgery:** Toast.jsx line 23 has `fixed bottom-6 right-6 z-50` baked into its own className. If the shared container is added without removing those classes from Toast, Toast will have double-positioning and appear outside the stack.
- **Using `mode="wait"` on shared container AnimatePresence:** The current Toast AnimatePresence in App.jsx uses `mode="wait"` (line 554). This must NOT be carried over to the new shared container — each notification should animate independently.
- **Setting progress directly from event:** The electron-updater progress event provides an object `{ percent, bytesPerSecond, transferred, total }`. Using `setProgress(progress)` instead of `setProgress(Math.round(progress.percent))` will display `[object Object]%` in the UI.
- **Calling `dismissBanner()` to change status:** Dismiss only sets `isDismissed = true`. Status remains `'ready'`. Settings section must still show the `ready` state with "Installa e riavvia" button after banner is dismissed.
- **Not guard-testing `window.electronAPI.getAppVersion`:** This method doesn't exist in preload.cjs yet. The hook's mount `useEffect` must call it after D-10 additions. Running in dev without the IPC handler will throw.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation / entry-exit transitions | Custom CSS transitions with JS toggle | Framer Motion `AnimatePresence` + `motion.div` | Already in codebase, identical pattern to Toast |
| Progress bar visual | Custom `<div>` width-animated element | Text-only: `{N}% completato` | Decision D-14 — text-only is locked |
| IPC listener lifecycle | Manual addEventListener/removeEventListener | Preload cleanup functions (each `on*` returns cleanup fn) | Phase 9 bridge already handles this |

---

## Common Pitfalls

### Pitfall 1: Toast Double-Positioning After Container Migration
**What goes wrong:** Toast appears in wrong position (bottom-right of `fixed` container *and* also fixed itself), or exits to wrong position.
**Why it happens:** `Toast.jsx` line 23 has `className="fixed bottom-6 right-6 z-50 bg-white ..."`. When moved inside the fixed container, these positioning classes conflict.
**How to avoid:** Remove `fixed bottom-6 right-6 z-50` from Toast's `className` in the same commit that adds the container. New Toast root: `bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]`.
**Warning signs:** Toast appears floating in wrong position; exit animation goes to wrong corner.

### Pitfall 2: AnimatePresence `mode="wait"` Breaks Simultaneous Notifications
**What goes wrong:** When a toast fires while the UpdateBanner is showing, the toast waits for UpdateBanner to exit first (or vice versa), instead of both showing simultaneously.
**Why it happens:** Current Toast `AnimatePresence` at App.jsx line 554 uses `mode="wait"`. The new shared container must use two independent `AnimatePresence` wrappers, each without `mode="wait"`.
**How to avoid:** Each notification gets its own `<AnimatePresence>` with no mode. Do NOT wrap both in a single `AnimatePresence`.
**Warning signs:** Only one notification visible at a time; second notification doesn't appear until first exits.

### Pitfall 3: Progress Object Shape Mismatch
**What goes wrong:** Progress displays as `NaN%` or `[object Object]%`.
**Why it happens:** electron-updater's `download-progress` event fires with `{ percent, bytesPerSecond, transferred, total }`, not a raw number. The preload passes this object directly to the callback.
**How to avoid:** In `onDownloadProgress` handler: `setProgress(Math.round(prog.percent))`.
**Warning signs:** Progress text shows `NaN%` or doesn't update.

### Pitfall 4: `getAppVersion` Not Yet In Preload
**What goes wrong:** `TypeError: window.electronAPI.getAppVersion is not a function` on app load.
**Why it happens:** D-10 additions to `preload.cjs` and `main.cjs` are part of this phase's deliverables — they don't exist yet.
**How to avoid:** Implement the IPC additions before (or in the same wave as) the hook that calls them. The hook's `useEffect` for `appVersion` depends on this.
**Warning signs:** Console error on mount; `appVersion` stays as empty string.

### Pitfall 5: Startup IPC Event Race Condition
**What goes wrong:** If Phase 9's startup check fires `update-available` before React mounts and the `useEffect` listeners register, the event is missed.
**Why it happens:** Phase 9 delays the startup check by 3 seconds (`setTimeout(..., 3000)` in main.cjs line 79). React renders in well under 1 second. This race is effectively eliminated by the delay.
**How to avoid:** No action needed — the 3-second delay in Phase 9 ensures listeners are registered before any startup check event fires.
**Warning signs:** Would only manifest as silent miss on startup check in production; very unlikely given 3s delay.

### Pitfall 6: `available` Status Not Transitioning to `downloading`
**What goes wrong:** Status briefly shows `available` but never transitions to `downloading`.
**Why it happens:** D-01 requires `startDownload()` to be called automatically inside the `onUpdateAvailable` callback. If the hook author forgets this, the app sits in `available` state indefinitely (and electron-updater never fires `download-progress`).
**How to avoid:** The `onUpdateAvailable` handler must call `window.electronAPI.updater.startDownload()` as part of its body.
**Warning signs:** Status stuck on `available`; no progress updates; download never completes.

---

## Code Examples

### Existing Toast className (MUST be modified)
```jsx
// Current Toast.jsx line 23 — BEFORE
className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]"

// AFTER (remove fixed positioning — container owns it)
className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]"
```

### Existing AnimatePresence for Toast in App.jsx (MUST be refactored)
```jsx
// Current App.jsx lines 553–563 — BEFORE
<AnimatePresence mode="wait">
  {toast && (
    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  )}
</AnimatePresence>

// AFTER — Toast moves into shared container, separate AnimatePresence, no mode="wait"
<div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3">
  <AnimatePresence>
    {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
  </AnimatePresence>
  <AnimatePresence>
    {updateStatus.status === 'ready' && !updateStatus.isDismissed && (
      <UpdateBanner key="update-banner" version={updateStatus.version}
        onInstall={updateStatus.installUpdate} onDismiss={updateStatus.dismissBanner} />
    )}
  </AnimatePresence>
</div>
```

### SettingsView Aggiornamenti section — state machine rendering
```jsx
// Checking state
{updateStatus.status === 'checking' && (
  <button disabled className="... disabled:opacity-50 disabled:cursor-not-allowed">
    <Loader2 size={14} className="animate-spin inline-block mr-1" aria-hidden="true" />
    Controlla aggiornamenti
  </button>
)}

// Up-to-date state
{updateStatus.status === 'up-to-date' && (
  <>
    <p className="text-sm text-gray-500 mb-3">Sei già aggiornato</p>
    <button onClick={updateStatus.checkForUpdates} className="...">Controlla aggiornamenti</button>
  </>
)}

// Downloading state
{updateStatus.status === 'downloading' && (
  <p role="status" aria-live="polite" className="text-sm text-gray-600">
    Versione {updateStatus.version} disponibile —{' '}
    download <span className="font-semibold">{updateStatus.progress}%</span> completato
  </p>
)}

// Ready state
{updateStatus.status === 'ready' && (
  <>
    <p className="text-sm text-gray-500 mb-3">Aggiornamento pronto</p>
    <button onClick={updateStatus.installUpdate}
      className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer">
      Installa e riavvia
    </button>
  </>
)}

// Error state
{updateStatus.status === 'error' && (
  <>
    <p className="text-sm text-red-500 mb-1">Impossibile controllare gli aggiornamenti</p>
    <p className="text-sm text-gray-500 mb-3">{updateStatus.error}</p>
    <button onClick={updateStatus.checkForUpdates} className="...">Controlla aggiornamenti</button>
  </>
)}
```

### IPC additions (main.cjs + preload.cjs)
```javascript
// electron/main.cjs — add after existing IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());

// electron/preload.cjs — add to electronAPI object (top level, not inside updater namespace)
getAppVersion: () => ipcRenderer.invoke('get-app-version'),
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Toast has own fixed positioning | Shared container owns positioning | Toast.jsx className must be edited; container added to App.jsx |
| Single AnimatePresence for Toast | Two independent AnimatePresence wrappers | Both notifications can animate simultaneously |
| SettingsView has 2 props | SettingsView gets `updateStatus` as 3rd prop | App.jsx call site must pass the new prop |

---

## Environment Availability

Step 2.6: SKIPPED — This phase adds React components and hooks. All dependencies (Framer Motion, Lucide React, Tailwind, Electron IPC) are already installed and verified in the existing codebase. No new external tools, services, or CLIs are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No test framework detected |
| Config file | None found |
| Quick run command | N/A — no test runner installed |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPD-04 | UpdateBanner renders when status=ready && !isDismissed | manual-only | N/A | N/A |
| UPD-05 | Banner absent during downloading / checking / error | manual-only | N/A | N/A |
| UPD-07 | Settings shows appVersion from IPC | manual-only | N/A | N/A |
| UPD-08 | Button disables during checking, re-enables after | manual-only | N/A | N/A |
| UPD-09 | Three post-check states render correctly | manual-only | N/A | N/A |

### Sampling Rate

No automated test suite exists. Validation is manual smoke testing against success criteria:
1. Run app in dev with mocked `window.electronAPI.updater.*`
2. Or run packaged app against a real GitHub release

### Wave 0 Gaps

No test framework — manual validation only. The success criteria in the phase description serve as the test checklist:
- [ ] Settings Aggiornamenti shows `app.getVersion()` value
- [ ] "Controlla aggiornamenti" enters disabled/spinner state on click
- [ ] "Sei già aggiornato" / progress text / error message each display correctly
- [ ] Banner appears only when `status === 'ready'`
- [ ] "Installa e riavvia" triggers quit-and-install
- [ ] Dismiss X hides banner but Settings section retains `ready` state

---

## Key Discovery: What Phase 9 Already Delivered

Before planning tasks, implementors MUST know what is already done vs. what this phase adds:

| Item | Status | Location |
|------|--------|----------|
| `window.electronAPI.updater.checkForUpdates()` | ✅ Done (Phase 9) | `preload.cjs` line 38 |
| `window.electronAPI.updater.startDownload()` | ✅ Done (Phase 9) | `preload.cjs` line 39 |
| `window.electronAPI.updater.installUpdate()` | ✅ Done (Phase 9) | `preload.cjs` line 40 |
| `window.electronAPI.updater.onUpdateAvailable()` | ✅ Done (Phase 9) | `preload.cjs` line 43 |
| `window.electronAPI.updater.onUpdateNotAvailable()` | ✅ Done (Phase 9) | `preload.cjs` line 49 |
| `window.electronAPI.updater.onDownloadProgress()` | ✅ Done (Phase 9) | `preload.cjs` line 53 |
| `window.electronAPI.updater.onUpdateDownloaded()` | ✅ Done (Phase 9) | `preload.cjs` line 57 |
| `window.electronAPI.updater.onUpdateError()` | ✅ Done (Phase 9) | `preload.cjs` line 63 |
| `ipcMain.handle('updater:check-for-updates')` | ✅ Done (Phase 9) | `main.cjs` line 338 |
| `ipcMain.handle('updater:start-download')` | ✅ Done (Phase 9) | `main.cjs` line 351 |
| `ipcMain.handle('updater:install-update')` | ✅ Done (Phase 9) | `main.cjs` line 361 |
| `window.electronAPI.getAppVersion()` | ❌ **Phase 10 adds this** | `preload.cjs` — not yet present |
| `ipcMain.handle('get-app-version')` | ❌ **Phase 10 adds this** | `main.cjs` — not yet present |
| `useUpdateStatus` hook | ❌ **Phase 10 creates this** | `src/hooks/useUpdateStatus.js` |
| `UpdateBanner` component | ❌ **Phase 10 creates this** | `src/components/UpdateBanner.jsx` |
| SettingsView Aggiornamenti section | ❌ **Phase 10 adds this** | `src/views/SettingsView.jsx` |

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `electron/preload.cjs` — full IPC bridge shape verified
- Direct code inspection: `electron/main.cjs` — existing IPC handler patterns, updater handlers
- Direct code inspection: `src/components/Toast.jsx` — exact className and animation to replicate
- Direct code inspection: `src/App.jsx` — current Toast integration (AnimatePresence mode="wait", lines 553–563)
- Direct code inspection: `src/views/SettingsView.jsx` — section heading pattern, button classes
- Direct code inspection: `src/hooks/index.js` — barrel export pattern
- Direct code inspection: `src/components/index.js` — barrel export pattern
- `.planning/phases/10-update-ui/10-CONTEXT.md` — all implementation decisions
- `.planning/phases/10-update-ui/10-UI-SPEC.md` — complete visual and interaction contract

### Secondary (MEDIUM confidence)

- electron-updater download-progress event shape (`{ percent, bytesPerSecond, transferred, total }`) — confirmed by existing main.cjs handler which forwards the full `progress` object: `mainWindow.webContents.send('updater:download-progress', progress)` line 62

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by direct file inspection
- Architecture: HIGH — patterns sourced from existing codebase, CONTEXT.md, and UI-SPEC.md
- Pitfalls: HIGH — identified from direct code inspection (Toast positioning, AnimatePresence mode, progress object shape)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable stack)
