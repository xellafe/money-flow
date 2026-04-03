# Milestones

## v1.1 Auto-Update (Shipped: 2026-04-03)

**Phases completed:** 3 phases (9–11), 4 plans, ~8 tasks

**Key accomplishments:**

- Integrated `electron-updater` + `electron-log` with GitHub Releases as update provider; CI workflow updated to let electron-builder own GitHub Release creation
- Built full IPC bridge (main ↔ renderer): `setupAutoUpdater()` with 5 push-event handlers, 3 IPC handlers (`check-for-updates`, `start-download`, `install-update`), and 8-method `window.electronAPI.updater` preload API
- Implemented `useUpdateStatus` hook managing all update state; built `UpdateBanner` component and full Aggiornamenti section in SettingsView with version display, status states, and manual check button
- Fixed silent error swallowing: `autoUpdater.on('error')` now forwards to renderer; `updater:start-download` rejects on error — UI correctly shows error state instead of freezing in `'idle'` or `'downloading'`

---

## v1.0 MVP (Shipped: 2026-03-30)

**Phases completed:** 8 phases, 25 plans, 16 tasks

**Key accomplishments:**

- (none recorded)

---
