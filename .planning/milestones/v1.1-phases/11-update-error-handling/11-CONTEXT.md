# Phase 11: Update Error Handling - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two silent error-swallowing bugs in the auto-update IPC bridge so that background startup check failures and mid-download failures reach the renderer and transition `useUpdateStatus` to `status='error'`.

**In scope:** Two targeted changes to `electron/main.cjs` only (and one small cleanup in the IPC handler).
**Out of scope:** Issue 3 (portable build publish config), Nyquist compliance, any new UI components.

This phase closes tech-debt Issues 1 & 2 from `.planning/v1.1-MILESTONE-AUDIT.md`.

</domain>

<decisions>
## Implementation Decisions

### Error Forwarding Authority (Bug 1 fix)
- **D-01:** `autoUpdater.on('error', ...)` becomes the **single source of truth** for forwarding errors to the renderer. Add `mainWindow.webContents.send('updater:error', err.message)` inside this handler (guarded by `!mainWindow.isDestroyed()`), matching the pattern of the other push-event handlers.
- **D-02:** Remove the `webContents.send('updater:error', err.message)` call from the `updater:check-for-updates` IPC handler (currently line 344–346 in main.cjs). The IPC handler still catches and logs the error, and still returns `{ success: false, error }` — it just no longer forwards to renderer (the event handler does that now).
- **D-03:** Rationale: without D-02, a manual check failure fires `updater:error` twice — once from the IPC handler catch block and once from the `autoUpdater.on('error', ...)` event. With D-01 + D-02, every error path (background startup check, mid-download, manual check) has exactly one forwarding point.

### `startDownload` Rejection (Bug 2 fix)
- **D-04:** In the `updater:start-download` IPC handler, replace `return { success: false, error: err.message }` with `throw err` (or `throw new Error(err.message)`). This causes `ipcRenderer.invoke('updater:start-download')` to reject, so the hook's `.catch()` on `startDownload()` fires as designed, transitioning to `status='error'`.
- **D-05:** No changes to `useUpdateStatus.js` — the existing `.catch()` block on line 31–34 already handles the rejection correctly once the IPC handler throws.

### Agent's Discretion
- Whether to `throw err` directly or `throw new Error(err.message)` in the start-download handler — either is fine
- Whether to add a log line in the updated `autoUpdater.on('error', ...)` handler before the webContents.send (current logging kept as-is is fine)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `electron/main.cjs` — Both fixes live here: `autoUpdater.on('error', ...)` (lines 72–76) and `updater:start-download` IPC handler (lines 351–358) and `updater:check-for-updates` IPC handler (lines 338–348)

### Context from prior phases
- `.planning/phases/09-update-infrastructure/09-CONTEXT.md` — IPC bridge shape, all push-event patterns
- `.planning/phases/10-update-ui/10-CONTEXT.md` — `useUpdateStatus` hook shape, existing `.catch()` on `startDownload()`

### Tech debt source
- `.planning/v1.1-MILESTONE-AUDIT.md` — Issue 1 (lines 104–114) and Issue 2 (lines 116–124) are the definitive problem statements for this phase

### Planning files
- `.planning/REQUIREMENTS.md` — UPD-09 (error state in Settings)
- `.planning/PROJECT.md` — Stack constraints (CJS in electron/, existing IPC patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `autoUpdater.on('update-available', ...)` handler (main.cjs lines 48–51): Template for the fixed `autoUpdater.on('error', ...)` handler — same guard pattern (`mainWindow && !mainWindow.isDestroyed()`)
- `window.electronAPI.updater.onUpdateError(cb)` in preload + `useUpdateStatus` `onUpdateError` listener: Already wired end-to-end, receives `updater:error` push events correctly — no preload or hook changes needed

### Established Patterns
- Push event guard: `if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.webContents.send(...) }`
- IPC handler throw: `throw err` inside an `ipcMain.handle` async handler causes the corresponding `ipcRenderer.invoke()` promise to reject

### Integration Points
- `autoUpdater.on('error', ...)` in `setupAutoUpdater()` — change from log-only to log + webContents.send
- `updater:check-for-updates` catch block — remove `webContents.send` line, keep log + return
- `updater:start-download` catch block — change `return { success: false, error }` to `throw err`

</code_context>

<specifics>
## Specific Ideas

- After the fix, the manual check error flow changes slightly: the `checkForUpdates()` catch in the IPC handler no longer calls `webContents.send`, but `autoUpdater.on('error', ...)` fires immediately after — so the renderer still receives exactly one `updater:error` event. The net behavior from the user's perspective is identical.
- The `updater:start-download` catch block can still log and re-throw — `log.error(...)` then `throw err` is the idiomatic pattern.

</specifics>

<deferred>
## Deferred Ideas

- Issue 3 (portable build publish config) — out of scope per ROADMAP.md; portable builds silently swallowing errors is documented as likely intentional design
- Nyquist compliance / test writing for Phases 9 & 10 — separate concern, not in this phase

</deferred>

---

*Phase: 11-update-error-handling*
*Context gathered: 2026-04-03*
