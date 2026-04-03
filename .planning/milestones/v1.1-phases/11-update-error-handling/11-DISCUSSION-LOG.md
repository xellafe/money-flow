# Phase 11: Update Error Handling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 11-update-error-handling
**Areas discussed:** Error forwarding authority, startDownload rejection strategy

---

## Error Forwarding Authority

| Option | Description | Selected |
|--------|-------------|----------|
| Single source of truth | Forward ONLY from `autoUpdater.on('error', ...)`, remove forwarding from IPC handler to avoid double-events on manual check failure | ✓ |
| Forward from both places | Double-fire is idempotent, accept it | |
| Flag-based suppression | Keep IPC handler forwarding, add a flag to suppress event handler when IPC already handled it | |

**User's choice:** Single source of truth — forward ONLY from `autoUpdater.on('error', ...)`, remove forwarding from the IPC handler
**Notes:** Manual check errors currently send `updater:error` twice (from IPC handler catch + event handler). Consolidating to the event handler only gives a single forwarding point for all error paths (background, mid-download, manual).

---

## startDownload Rejection Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fix A: Throw in IPC handler | 1-line change in main.cjs — `throw err` instead of `return { success: false }`. Hook's `.catch()` fires as designed. | ✓ |
| Fix B: Inspect return value in hook | Check `res?.success` in `useUpdateStatus.js`, set `status='error'` if false. No main.cjs change needed. | |

**User's choice:** Fix A — throw in IPC handler
**Notes:** Keeps changes minimal and in one file (main.cjs). The existing `.catch()` in `useUpdateStatus.js` line 31–34 already handles rejection correctly — no hook changes needed.

---

## Agent's Discretion

- Whether to `throw err` directly or `throw new Error(err.message)`
- Whether to add a log line before `webContents.send` in the updated error handler

## Deferred Ideas

- Issue 3 (portable build publish config) — explicitly out of scope per ROADMAP phase description
- Nyquist compliance for prior phases — separate concern
