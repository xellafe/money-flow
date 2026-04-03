# Roadmap: MoneyFlow UI/UX Redesign

**Created:** 2026-03-17
**Last Updated:** 2026-04-03 (v1.1 roadmap added)

## Milestones

- `✅` **v1.0 MVP** — Phases 1–8 (shipped 2026-03-30)
- `🔄` **v1.1 Auto-Update** — Phases 9–10 (active)

## Phases

<details>
<summary>`✅` v1.0 MVP (Phases 1–8) — SHIPPED 2026-03-30</summary>

- [x] Phase 1: Foundation & Setup (2/2 plans) — completed 2026-03-17
- [x] Phase 2: State Extraction (4/4 plans) — completed 2026-03-17
- [x] Phase 3: Navigation & Layout (2/2 plans) — completed 2026-03-18
- [x] Phase 4: Dashboard Redesign (4/4 plans) — completed 2026-03-18
- [x] Phase 5: Transaction List Redesign (4/4 plans) — completed 2026-03-19
- [x] Phase 6: Modals Redesign (5/5 plans) — completed 2026-03-19
- [x] Phase 7: UX Polish (3/3 plans) — completed 2026-03-27
- [x] Phase 8: v1.0 Cleanup (1/1 plan) — completed 2026-03-30

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

# Roadmap — MoneyFlow v1.1 Auto-Update

## Phases

- [ ] **Phase 9: Update Infrastructure** — Install electron-updater, wire main process, expose IPC bridge to renderer
- [ ] **Phase 10: Update UI** — UpdateBanner, Settings Aggiornamenti section, manual check, post-check feedback

## Phase Details

### Phase 9: Update Infrastructure
**Goal**: autoUpdater is installed, initialised in the main process with a prod-only guard, and fully reachable from the renderer via a typed IPC bridge — no UI yet, but every layer is independently verifiable
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: UPD-01, UPD-02, UPD-03, UPD-06
**Success Criteria** (what must be TRUE):
  1. `npm run electron:build` produces `latest.yml` in the `release/` folder — proves the GitHub publish config is correct and electron-builder knows the provider
  2. In DevTools console of a running dev/packaged build, `typeof window.electronAPI.updater.checkForUpdates === 'function'` returns `true` and all 7 bridge methods (`checkForUpdates`, `installUpdate`, `onUpdateAvailable`, `onUpdateNotAvailable`, `onDownloadProgress`, `onUpdateDownloaded`, `onUpdateError`) are callable
  3. In a packaged NSIS build, the background startup check fires after ~3 s without crashing; portable build silently swallows updater errors without forwarding them to the renderer
  4. Clicking "Installa e riavvia" can only reach `quitAndInstall()` via explicit renderer invocation — `isQuitting = true` is set before the call, preventing the `before-quit` backup flow from conflicting
**Plans:** 1 plan

Plans:
- [x] 09-01-PLAN.md — Install electron-updater, configure GitHub publish, wire main process + IPC bridge

### Phase 10: Update UI
**Goal**: Users can see and act on available updates — automatic notification in the corner when a download is ready, and full manual control from the Settings screen
**Depends on**: Phase 9
**Requirements**: UPD-04, UPD-05, UPD-07, UPD-08, UPD-09
**Success Criteria** (what must be TRUE):
  1. Settings → Aggiornamenti section shows the current app version (sourced from `app.getVersion()` via IPC) and a "Controlla aggiornamenti" button at all times
  2. Clicking "Controlla aggiornamenti" puts the button in a loading/disabled state during the check; once resolved the section shows exactly one of: "Sei già aggiornato", "Versione X.Y.Z disponibile — download N% completato", or "Impossibile controllare gli aggiornamenti" with the error detail
  3. A blue banner appears in the bottom-right corner only after the download completes (`status === 'ready'`); the banner is absent while the download is still in progress or when no update is available
  4. Clicking "Installa e riavvia" (banner or Settings) triggers quit-and-install — the app never restarts automatically without this explicit user action
**Plans**: 2 plans

Plans:
- [ ] 10-01-PLAN.md — IPC handler + useUpdateStatus hook (foundation)
- [ ] 10-02-PLAN.md — UpdateBanner component + App.jsx wiring + SettingsView Aggiornamenti section

**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. Update Infrastructure | 0/1 | Planned | — |
| 10. Update UI | 0/2 | Planned | — |