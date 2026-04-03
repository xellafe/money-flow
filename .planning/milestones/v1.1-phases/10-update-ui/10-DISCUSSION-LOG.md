# Phase 10: Update UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 10-update-ui
**Areas discussed:** Download trigger, Banner design & Toast co-existence, State architecture, Settings section UX depth, SettingsView prop signature, App.jsx wiring (banner dismissed flag), Hook file placement, Component file placement, appVersion IPC, AnimatePresence wrapping, Notification container, UpdateBanner barrel export, Toast/Banner stacking, Progress display format

---

## Download Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-trigger (on update-available) | Renderer calls startDownload() immediately in onUpdateAvailable handler. No extra user click. | ✓ |
| User-triggered from Settings | Settings shows "Scarica" button after update-available event. User clicks to start download. | |
| Auto-trigger only on manual check | Startup check notifies only; manual check triggers download if found. | |

**User's choice:** Auto-trigger — renderer calls `startDownload()` automatically in `onUpdateAvailable` handler.
**Notes:** User confirmed no extra click needed. Flow: check → "found vX.Y.Z, downloading..." live in Settings → banner when ready.

---

## Banner Design & Toast Co-existence

### Visual style

| Option | Description | Selected |
|--------|-------------|----------|
| Same style as Toast | bg-white, border, shadow-lg, rounded-xl — consistent visual language | ✓ |
| Visually distinct | bg-blue-50 border-blue-200 to differentiate from transient toasts | |
| Agent's discretion | Whatever looks cleanest at implementation time | |

**User's choice:** Same style as Toast.

### Dismissability

| Option | Description | Selected |
|--------|-------------|----------|
| Persistent (no X) | Banner stays until user clicks "Installa e riavvia" | |
| Dismissable (has X) | User can close without installing; doesn't reappear until next restart | ✓ |

**User's choice:** Dismissable with X button.

### Icon

| Option | Description | Selected |
|--------|-------------|----------|
| ArrowDownToLine / Download (Lucide) | Signals "update ready to install" | ✓ |
| Info icon | Neutral informational tone | |

**User's choice:** ArrowDownToLine or Download icon from Lucide React.

### Message copy

| Option | Description | Selected |
|--------|-------------|----------|
| 'Aggiornamento disponibile — v{version}' | Recommended default | ✓ |
| 'Nuova versione {version} disponibile' | Alternative wording | |
| Agent decides copy | Open | |

**User's choice:** `'Aggiornamento disponibile — v{version}'` + `'Installa e riavvia'` button.

---

## State Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| New useUpdateStatus hook | Follows 6-hook architecture. Owns all IPC subscriptions and update state. | ✓ |
| Inline in App.jsx | Simpler but adds ~60 lines to lean App.jsx | |
| Agent's discretion | Planner picks pattern | |

**User's choice:** New `useUpdateStatus` hook in `src/hooks/useUpdateStatus.js`.

---

## Settings Section UX Depth

### Live progress

| Option | Description | Selected |
|--------|-------------|----------|
| Live progress N% text | "Versione X.Y.Z disponibile — download 47% completato" updates in real-time | ✓ |
| Static "download in corso..." | Simpler, no reactive progress state | |

**User's choice:** Live N% text updates.

### Error retry

| Option | Description | Selected |
|--------|-------------|----------|
| Dismissable with 'Riprova' link | Error + inline retry that calls checkForUpdates() | ✓ |
| Static error only | Error message, user clicks main button to retry | |

**User's choice:** 'Riprova' link inline.

### 'Installa e riavvia' in Settings when ready

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — in Settings AND banner | Consistent with UPD-09 intent | ✓ |
| No — banner only | Settings shows "Aggiornamento pronto per l'installazione" text | |

**User's choice:** Yes — 'Installa e riavvia' appears in both Settings section and banner when `status === 'ready'`.

---

## SettingsView Prop Signature

| Option | Description | Selected |
|--------|-------------|----------|
| updateStatus object prop | Single { updateStatus } object with all state + actions | ✓ |
| 6 individual props | status, version, progress, error, checkForUpdates, installUpdate separately | |

**User's choice:** `updateStatus` object prop wrapping all state and actions.

---

## App.jsx Wiring (Banner Dismissed Flag)

| Option | Description | Selected |
|--------|-------------|----------|
| useUpdateStatus owns dismissed flag | Hook exposes isDismissed + dismissBanner(). App.jsx renders banner when status==='ready' && !isDismissed | ✓ |
| App.jsx owns dismissed flag | Local useState in App.jsx | |

**User's choice:** Hook owns `isDismissed` and `dismissBanner()`.

---

## Hook File Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Export from src/hooks/index.js barrel | Consistent with all other hooks | ✓ |
| Direct import only | Skip barrel | |

**User's choice:** Yes, export from barrel.

---

## Component File Placement

| Option | Description | Selected |
|--------|-------------|----------|
| src/components/ (same level as Toast.jsx) | Follows existing pattern | ✓ |
| src/components/update/ subfolder | Future-proofing, adds indirection | |

**User's choice:** `src/components/UpdateBanner.jsx`.

---

## appVersion IPC

| Option | Description | Selected |
|--------|-------------|----------|
| Add getAppVersion IPC in main.cjs + preload.cjs | Clean IPC pattern, uses app.getVersion() | ✓ |
| Import package.json in renderer | Avoids IPC but reads build artifact not live Electron version | |

**User's choice:** Add `ipcMain.handle('get-app-version', () => app.getVersion())` + `window.electronAPI.getAppVersion()`.
**Notes:** Confirmed getVersion() IPC does NOT exist yet in main.cjs (grep found no matches). Phase 10 adds it.

---

## AnimatePresence Wrapping

| Option | Description | Selected |
|--------|-------------|----------|
| App.jsx wraps in AnimatePresence | Consistent with Toast pattern in App.jsx | ✓ |
| UpdateBanner handles own animation internally | Self-contained but inconsistent | |

**User's choice:** AnimatePresence in App.jsx, motion.div inside UpdateBanner.

---

## Notification Container

| Option | Description | Selected |
|--------|-------------|----------|
| Inline flex wrapper in App.jsx | Single div with flex-col-reverse gap-3 — no extra component | ✓ |
| Named NotificationStack component | Cleaner for future expansion | |

**User's choice:** Inline in App.jsx.

---

## UpdateBanner Barrel Export

| Option | Description | Selected |
|--------|-------------|----------|
| Export from src/components/index.js | Consistent with Toast, StatCard pattern | ✓ |
| Direct import only | Skip barrel | |

**User's choice:** Export from barrel.

---

## Toast/Banner Stacking

| Option | Description | Selected |
|--------|-------------|----------|
| CSS gap via flex-col-reverse container | Fixed container wrapping both, gap-3. No manual offset math | ✓ |
| Manual offset | Toast at bottom-6, banner at bottom-20 — brittle | |

**User's choice:** Single `fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3` container.

---

## Progress Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Percentage text only | "download 47% completato" — simple, no extra component | ✓ |
| Progress bar | Thin bar below text — more visual, no existing component | |

**User's choice:** Percentage text only.

---

## Agent's Discretion

- Exact Tailwind classes for Aggiornamenti section layout
- Exact Lucide icon: ArrowDownToLine vs Download
- `useUpdateStatus` initial status value (idle, not auto-checking)
- IPC channel name for get-app-version

## Deferred Ideas

None.
