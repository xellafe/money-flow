# Phase 10: Update UI - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the user-facing update experience on top of the Phase 9 IPC bridge. Delivers two things:
1. **UpdateBanner** — a persistent, dismissable corner notification that appears (and only appears) when the download is `status === 'ready'`
2. **Settings → Aggiornamenti section** — current version display, "Controlla aggiornamenti" button with loading state, live progress text, and one of three post-check states ("Sei già aggiornato", "download N% completato", error + Riprova)

No changes to the Electron main process or IPC bridge — those are Phase 9 deliverables.

</domain>

<decisions>
## Implementation Decisions

### Download Trigger
- **D-01:** `autoDownload: false` (from Phase 9) means the renderer controls when download starts. The renderer calls `startDownload()` **automatically** in the `onUpdateAvailable` handler — no extra user action required. The user will see: checking → "Versione X.Y.Z disponibile — download N% completato" updating live → banner when `status === 'ready'`.

### State Architecture
- **D-02:** A new `useUpdateStatus` hook in `src/hooks/useUpdateStatus.js` owns all update state. It subscribes to all IPC events from `window.electronAPI.updater`, exposes the following shape:
  ```js
  { status, version, progress, error, appVersion, isDismissed,
    checkForUpdates, installUpdate, dismissBanner }
  ```
  - `status` values: `'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error'`
  - `appVersion` fetched on mount via `window.electronAPI.getAppVersion()` (new IPC handler — see D-08)
  - `isDismissed` flag owned by the hook; `dismissBanner()` sets it to `true`
- **D-03:** Hook exported from `src/hooks/index.js` barrel file — consistent with useTransactionData, useCategories, etc.

### UpdateBanner Component
- **D-04:** `UpdateBanner.jsx` lives in `src/components/` (same level as `Toast.jsx`), exported from `src/components/index.js` barrel.
- **D-05:** Visual style: matches Toast — `bg-white border border-gray-200 shadow-lg rounded-xl`. Uses **ArrowDownToLine** (or Download) icon from Lucide React. Message format: `'Aggiornamento disponibile — v{version}'` + `'Installa e riavvia'` button + X dismiss button.
- **D-06:** Banner is **dismissable** — clicking X closes it without installing. Dismissed state resets on next app restart (lives only in hook state, not persisted).
- **D-07:** Animation pattern mirrors Toast: App.jsx wraps both `Toast` and `UpdateBanner` in a shared `AnimatePresence`; `UpdateBanner` uses `motion.div` internally with same slide-up animation (`initial: { opacity: 0, y: 20 }`).

### Notification Stacking
- **D-08 (naming conflict — reassigning):** See IPC section below.
- **D-09:** Toast and UpdateBanner stack in a **single inline flex container** in App.jsx:
  ```jsx
  <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3">
    <AnimatePresence>{showToast && <Toast ... />}</AnimatePresence>
    <AnimatePresence>{showBanner && <UpdateBanner ... />}</AnimatePresence>
  </div>
  ```
  `flex-col-reverse` + `gap-3` stacks them naturally without manual offset math. No extra component needed.

### New IPC Handler (appVersion)
- **D-10:** Phase 10 adds `ipcMain.handle('get-app-version', () => app.getVersion())` in `main.cjs` and exposes `window.electronAPI.getAppVersion()` in `preload.cjs`. Follows existing `ipcMain.handle` + `ipcRenderer.invoke` pattern. Called once on `useUpdateStatus` mount.

### Settings Aggiornamenti Section
- **D-11:** `SettingsView` receives a single `updateStatus` prop (the full object from `useUpdateStatus`). Signature becomes:
  ```jsx
  function SettingsView({ onShowCategoryManager, onShowSyncSettings, updateStatus })
  ```
- **D-12:** Aggiornamenti section shows `updateStatus.appVersion` (current version) at all times.
- **D-13:** Post-check states (text-only, no progress bar):
  - `checking`: button disabled + loading spinner
  - `up-to-date`: "Sei già aggiornato" text
  - `downloading`: "Versione X.Y.Z disponibile — download **N%** completato" (N updates live from `updateStatus.progress`)
  - `ready`: "Aggiornamento pronto" + **"Installa e riavvia"** button (in addition to the banner)
  - `error`: "Impossibile controllare gli aggiornamenti" + error detail + **"Riprova"** link that calls `updateStatus.checkForUpdates()`
- **D-14:** Progress displayed as percentage text only — no progress bar. Consistent with text-heavy settings section and avoids adding a new component.

### Agent's Discretion
- Exact Tailwind classes for the Aggiornamenti section layout (follow existing section pattern: `<h3>` uppercase tracked heading + content)
- Exact Lucide icon: ArrowDownToLine vs Download — either works
- Whether `useUpdateStatus` initializes with `status: 'idle'` or triggers an immediate check on mount (should be idle — startup check handled by Phase 9 main process, not renderer hook)
- Internal IPC channel name for `get-app-version` (e.g., `'app:get-version'` if following a namespace convention exists)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Files
- `.planning/REQUIREMENTS.md` — UPD-04, UPD-05, UPD-07, UPD-08, UPD-09 (Phase 10 requirements)
- `.planning/PROJECT.md` — Stack constraints, Key Decisions table, design system principles (light clean minimal)
- `.planning/STATE.md` — v1.1 Architecture Decisions (isQuitting pattern, autoDownload: false rationale)

### Phase 9 Context (foundation this phase builds on)
- `.planning/phases/09-update-infrastructure/09-CONTEXT.md` — IPC bridge shape (D-09 through D-11), autoDownload: false decision (D-07), isQuitting guard (D-08)

### Existing Components (read before implementing)
- `src/components/Toast.jsx` — Visual style and animation pattern to replicate in UpdateBanner
- `src/views/SettingsView.jsx` — Section pattern to follow for Aggiornamenti section
- `electron/main.cjs` — Where to add get-app-version IPC handler
- `electron/preload.cjs` — Where to add getAppVersion() bridge method

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Toast.jsx` (src/components/): Visual template for UpdateBanner — same Framer Motion slide-up, same `bg-white border border-gray-200 shadow-lg rounded-xl` styling, same Lucide icon + X button pattern
- `src/hooks/index.js`: Barrel file to add `useUpdateStatus` export
- `src/components/index.js`: Barrel file to add `UpdateBanner` export
- `SettingsView.jsx`: Existing `<section>` + `<h3>` pattern — Aggiornamenti section follows identical structure

### Established Patterns
- **IPC handler**: `ipcMain.handle('channel', async () => {...})` in main.cjs + `ipcRenderer.invoke('channel')` in preload.cjs
- **Animation**: `motion.div` with `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: 20 }}` — matches Toast
- **Hook architecture**: 6-hook pattern (useTransactionData, useCategories, useFilters, useModals, useImportLogic, useToast) — useUpdateStatus is the 7th
- **IPC cleanup**: `on*` listeners return `() => ipcRenderer.removeListener(...)` — must be called in useEffect cleanup

### Integration Points
- `App.jsx`: Add `useUpdateStatus` call; refactor Toast/UpdateBanner into shared flex container; pass `updateStatus` to `SettingsView`
- `electron/main.cjs`: Add `ipcMain.handle('get-app-version', ...)` after existing handlers
- `electron/preload.cjs`: Add `getAppVersion: () => ipcRenderer.invoke('get-app-version')` to the electronAPI object

</code_context>

<specifics>
## Specific Ideas

- The `flex-col-reverse gap-3` stacking container in App.jsx means Toast appears below UpdateBanner visually (closer to the edge) — this is intentional since UpdateBanner is more persistent
- `dismissBanner()` only resets `isDismissed` — it does NOT change `status`. If user dismisses and goes to Settings, the section still shows the `ready` state with the "Installa e riavvia" button
- `useUpdateStatus` should subscribe to all 5 IPC events in a single `useEffect` with a combined cleanup (call all 5 cleanup functions on unmount)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-update-ui*
*Context gathered: 2026-04-03*
