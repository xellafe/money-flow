# Phase 11: Update Error Handling - Research

**Researched:** 2026-04-03
**Domain:** Electron IPC error propagation — autoUpdater event forwarding + ipcMain.handle rejection
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `autoUpdater.on('error', ...)` becomes the **single source of truth** for forwarding errors to the renderer. Add `mainWindow.webContents.send('updater:error', err.message)` inside this handler (guarded by `!mainWindow.isDestroyed()`), matching the pattern of the other push-event handlers.

**D-02:** Remove the `webContents.send('updater:error', err.message)` call from the `updater:check-for-updates` IPC handler (currently lines 344–346 in main.cjs). The IPC handler still catches and logs the error, and still returns `{ success: false, error }` — it just no longer forwards to renderer (the event handler does that now).

**D-03:** Rationale: without D-02, a manual check failure fires `updater:error` twice — once from the IPC handler catch block and once from the `autoUpdater.on('error', ...)` event. With D-01 + D-02, every error path has exactly one forwarding point.

**D-04:** In the `updater:start-download` IPC handler, replace `return { success: false, error: err.message }` with `throw err` (or `throw new Error(err.message)`). This causes `ipcRenderer.invoke('updater:start-download')` to reject, so the hook's `.catch()` on `startDownload()` fires as designed.

**D-05:** No changes to `useUpdateStatus.js` — the existing `.catch()` block on line 31–34 already handles the rejection correctly once the IPC handler throws.

### Agent's Discretion

- Whether to `throw err` directly or `throw new Error(err.message)` in the start-download handler — either is fine
- Whether to add a log line in the updated `autoUpdater.on('error', ...)` handler before the webContents.send (current logging kept as-is is fine)

### Deferred Ideas (OUT OF SCOPE)

- Issue 3 (portable build publish config) — out of scope per ROADMAP.md
- Nyquist compliance / test writing for Phases 9 & 10 — separate concern, not in this phase

</user_constraints>

---

## Summary

Phase 11 is a **surgical 3-hunk edit** in `electron/main.cjs` only — no renderer changes, no new files. Two silent error-swallowing bugs were introduced during Phase 9 and are now being fixed:

**Bug 1 (`autoUpdater.on('error')` — lines 72–76):** The event handler only logs; it never calls `webContents.send`. Background startup check failures and mid-download failures are invisible to the renderer. The renderer stays frozen on `status='idle'` (startup) or `status='downloading'` (mid-download) indefinitely. The fix: add a guarded `webContents.send('updater:error', err.message)` to this handler, mirroring the 4 existing push-event handlers on lines 48–70.

**Bug 2 (`updater:start-download` — lines 351–358):** The IPC handler catches `downloadUpdate()` errors and resolves (`return { success: false }`) instead of rejecting. `ipcRenderer.invoke()` resolves, so the hook's `.catch()` on `startDownload()` (line 31–34 of `useUpdateStatus.js`) never fires. The fix: `throw err` so the invoke rejects.

**Coupling constraint:** D-02 requires removing the existing `webContents.send` from the `updater:check-for-updates` catch block (lines 344–346) at the same time as D-01, to prevent double-fire on manual check failures (electron-updater emits the `error` event AND the `checkForUpdates()` promise rejects for the same failure).

**Primary recommendation:** Apply all three hunks atomically in a single commit — they are coupled (D-01 + D-02 must land together, D-04 is independent but small enough to bundle).

---

## Current Code State (electron/main.cjs)

### Section 1 — `autoUpdater.on('error', ...)` — Lines 72–76 ⚠️ BUG 1

```js
// Line 72-73 (comment reveals original design intent — will need updating)
// Error handler: log always, do NOT forward to renderer here
// The IPC handler catches errors from checkForUpdates() and forwards them
autoUpdater.on('error', (err) => {
  log.error('autoUpdater error:', err.message);  // line 75 — log-only
  // ❌ NO webContents.send here — background/download errors never reach renderer
});
```

**What's wrong:** Three failure scenarios arrive here but are swallowed:
1. Background startup `checkForUpdates()` fails (network error at app launch)
2. `downloadUpdate()` throws mid-download (e.g., disk full, network drop)
3. Any other autoUpdater lifecycle error

The comment on lines 72–73 explicitly documents the original design rationale — these must be updated as part of the fix.

### Section 2 — `updater:check-for-updates` catch block — Lines 342–348 ⚠️ NEEDS CLEANUP (D-02)

```js
ipcMain.handle('updater:check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (err) {
    log.error('checkForUpdates error:', err.message);  // line 343
    if (mainWindow && !mainWindow.isDestroyed()) {     // line 344
      mainWindow.webContents.send('updater:error', err.message);  // line 345 — ❌ REMOVE
    }                                                             // line 346
    return { success: false, error: err.message };    // line 347 — ✅ KEEP
  }
});
```

**Current state:** This is currently the *only* code path that forwards errors to the renderer — but it only covers manual check failures. After D-01 adds forwarding to the event handler, this `webContents.send` becomes a double-fire source and must be removed (D-02). The `log.error` and `return { success: false, error }` stay.

**Why double-fire happens:** When `checkForUpdates()` throws, electron-updater:
1. Emits `autoUpdater.on('error', err)` (event)
2. Rejects the `checkForUpdates()` promise (propagates to the IPC handler catch block)

Both happen for the same error, so with D-01 applied but D-02 not applied, the renderer would receive `updater:error` twice.

### Section 3 — `updater:start-download` catch block — Lines 351–358 ⚠️ BUG 2

```js
ipcMain.handle('updater:start-download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    log.error('downloadUpdate error:', err.message);  // line 356 — ✅ KEEP
    return { success: false, error: err.message };    // line 357 — ❌ REPLACE with throw
  }
});
```

**What's wrong:** `ipcMain.handle` async handlers that `return` a value always **resolve** the corresponding `ipcRenderer.invoke()` promise — even if the returned value signals failure. Only `throw` causes the `invoke()` to reject. Because the hook calls `.catch()` on the promise, it needs a rejection, not a resolution with `{ success: false }`.

---

## IPC Push-Event Pattern (Template for the Fix)

**Source:** `electron/main.cjs` lines 48–70 — all 4 working push-event handlers

```js
// Exact template — every push-event handler uses this guard
autoUpdater.on('update-available', (info) => {      // line 48
  if (mainWindow && !mainWindow.isDestroyed()) {    // line 49 — guard
    mainWindow.webContents.send('updater:update-available', info);  // line 50
  }
});

autoUpdater.on('update-not-available', (info) => {  // line 54
  if (mainWindow && !mainWindow.isDestroyed()) {    // line 55
    mainWindow.webContents.send('updater:update-not-available', info);
  }
});

autoUpdater.on('download-progress', (progress) => { // line 60
  if (mainWindow && !mainWindow.isDestroyed()) {    // line 61
    mainWindow.webContents.send('updater:download-progress', progress);
  }
});

autoUpdater.on('update-downloaded', (info) => {     // line 66
  if (mainWindow && !mainWindow.isDestroyed()) {    // line 67
    mainWindow.webContents.send('updater:update-downloaded', info);
  }
});
```

**Fixed `autoUpdater.on('error', ...)` follows this exact pattern:**
```js
autoUpdater.on('error', (err) => {
  log.error('autoUpdater error:', err.message);     // keep existing log
  if (mainWindow && !mainWindow.isDestroyed()) {    // add guard
    mainWindow.webContents.send('updater:error', err.message);  // add send
  }
});
```

**Fixed `updater:start-download` catch block:**
```js
} catch (err) {
  log.error('downloadUpdate error:', err.message);  // keep log
  throw err;                                         // replace return with throw
}
```

**Fixed `updater:check-for-updates` catch block (D-02 — remove 3 lines):**
```js
} catch (err) {
  log.error('checkForUpdates error:', err.message);  // keep
  // DELETE: if (mainWindow && !mainWindow.isDestroyed()) {
  // DELETE:   mainWindow.webContents.send('updater:error', err.message);
  // DELETE: }
  return { success: false, error: err.message };     // keep
}
```

---

## Hook Wiring Confirmation

**Source:** `src/hooks/useUpdateStatus.js`

### `.catch()` on `startDownload()` — Lines 31–34 ✅ ALREADY WIRED

```js
window.electronAPI.updater.startDownload().catch((err) => {  // line 31
  setStatus('error');                                          // line 32
  setError(err?.message ?? 'Download non avviato');           // line 33
});                                                            // line 34
```

**Confirmed:** This `.catch()` is correctly wired to transition to `status='error'`. It is called inside the `onUpdateAvailable` handler (line 26), which auto-starts the download when an update is found. The only reason it has never fired is that the IPC handler resolves instead of rejects (Bug 2). Once D-04 makes the handler throw, this fires immediately.

### `onUpdateError` listener — Lines 47–50 ✅ ALREADY WIRED

```js
window.electronAPI.updater.onUpdateError((message) => {  // line 47
  setStatus('error');                                      // line 48
  setError(message);                                       // line 49
}),                                                        // line 50
```

**Confirmed:** This listener is already subscribed and correctly transitions state. It fires whenever `webContents.send('updater:error', ...)` is called from main. Once D-01 adds the send to `autoUpdater.on('error', ...)`, background/download failures reach this handler.

### `checkForUpdates()` catch — Lines 62–65 ✅ ALREADY WIRED

```js
} catch (err) {           // line 62
  setStatus('error');     // line 63
  setError(err?.message ?? 'Errore sconosciuto');  // line 64
}                         // line 65
```

**Confirmed:** Manual check errors are also handled here if `checkForUpdates()` IPC call throws. (It currently doesn't throw because the IPC handler always returns `{ success: false }` rather than re-throwing — but this path is a belt-and-suspenders catch for the renderer side.)

---

## Standard Stack

### Core (no new dependencies — this phase is edit-only)

| Component | File | Role |
|-----------|------|------|
| `electron-updater` | `electron/main.cjs` (already imported line 5) | autoUpdater event emitter |
| `electron-log` | `electron/main.cjs` (already imported line 6) | Logging in main process |
| `ipcMain.handle` | Electron built-in | Async IPC handler — throws cause invoke() rejection |
| `webContents.send` | Electron built-in | One-way push event to renderer |

**No new packages required.** This phase is a pure code edit.

---

## Architecture Patterns

### Pattern 1: ipcMain.handle throw → ipcRenderer.invoke rejection

**What:** In Electron, `ipcMain.handle(channel, async handler)` wraps the returned promise. If the handler `throws` (or returns a rejected promise), the `ipcRenderer.invoke(channel)` promise on the renderer side **rejects** with the same error. If the handler `return`s any value (including `{ success: false }`), `invoke()` **resolves**.

**Source:** Electron docs on `ipcMain.handle` — "If handler returns a rejected Promise, the error will be forwarded to the renderer process."

**Consequence for Bug 2:** The hook calls `.catch()` which only fires on rejection. The current `return { success: false }` resolves the promise, so `.catch()` is bypassed. `throw err` fixes this.

### Pattern 2: autoUpdater error event vs. promise rejection

**What:** electron-updater emits `autoUpdater.on('error', err)` AND simultaneously rejects the `checkForUpdates()` / `downloadUpdate()` promise for the same error. Both happen.

**Consequence for D-02:** Before the fix, `updater:check-for-updates` IPC catch block was the only forwarding path. After D-01, the event handler ALSO forwards. Without D-02, every manual check failure sends `updater:error` twice to the renderer. The renderer hook receives the event, calls `setStatus('error')` twice — functionally identical but wasteful and potentially confusing in dev tools.

**Note on `downloadUpdate()` errors:** The startup check's `.catch()` (line 80–82) runs concurrently with the `autoUpdater.on('error')` event — both fire for the same error. The `.catch()` only logs; the event handler (after fix) sends to renderer. No double-fire issue here.

### Pattern 3: Window guard

**What:** `if (mainWindow && !mainWindow.isDestroyed())` before any `webContents.send`

**Why:** `mainWindow` can be null (never created), or the BrowserWindow can be destroyed (close flow). Calling `webContents.send` on a destroyed window throws. This guard is used consistently on all 4 existing push-event handlers (lines 49, 55, 61, 67).

---

## Risks and Edge Cases

### Risk 1: Double-fire on manual check failure
**Likelihood:** Certain if D-01 applied without D-02  
**Impact:** `useUpdateStatus` transitions to `status='error'` twice — same state, no visible UI impact, but noisy  
**Mitigation:** D-01 and D-02 MUST land in the same commit. They are coupled.  
**Detection:** Run manual check in dev, filter DevTools console for `updater:error` IPC messages — should see exactly one.

### Risk 2: Window destroyed during background startup check
**Likelihood:** Low (user closes app within 3s of launch)  
**Impact:** Without guard, `webContents.send` throws — main process crash  
**Mitigation:** Fixed by the window guard pattern (`mainWindow && !mainWindow.isDestroyed()`) in D-01. This guard is present in all existing handlers and must be included in the fix.  
**Status:** Already handled by the fix design.

### Risk 3: `throw err` in ipcMain.handle — error serialization
**Likelihood:** Low  
**Impact:** Electron serializes the thrown error for IPC transport. The `err.message` string is always preserved. Stack trace may be truncated. The hook reads `err?.message` which is safe.  
**Mitigation:** `throw err` directly preserves the message. Alternative `throw new Error(err.message)` creates a fresh Error — either is fine per D-04 discretion.

### Risk 4: Comment in lines 72–73 contradicts the fix
**Likelihood:** Certain (the comment says "do NOT forward to renderer here")  
**Impact:** Developer confusion if comment is left unchanged after fix  
**Mitigation:** Update comment to reflect new design intent when applying D-01.

### Risk 5: Startup `.catch()` (line 80–82) — still needed?
**Likelihood:** N/A  
**Impact:** After D-01, the startup check's `.catch()` (which only calls `log.error`) is slightly redundant since `autoUpdater.on('error')` also logs AND forwards. However, keeping it is harmless — it provides an extra log line for the startup context.  
**Recommendation:** Keep lines 80–82 unchanged. Belt-and-suspenders logging is fine.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom error channel to renderer | New IPC channel | `updater:error` channel already wired end-to-end | Preload + hook already subscribed |
| Error state management in hook | New state vars | Existing `error` and `status` state in `useUpdateStatus` | Already correct, no changes needed |
| Custom throw/catch wrapper | Helper function | Direct `throw err` in handler | One-liner, zero abstraction needed |

---

## Validation Architecture

**Config:** `nyquist_validation: true` per `.planning/config.json`

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None detected** — no vitest/jest config found, no test files in project (only in node_modules) |
| Config file | None exists |
| Quick run command | N/A — no automated test runner configured |
| Full suite command | N/A |

**Assessment:** This project has zero automated test infrastructure. The prior two phases (9, 10) both have `nyquist_compliant: false`. Phase 11 is explicitly out-of-scope for Nyquist compliance per CONTEXT.md deferred items. The validation approach must be **manual smoke testing**.

### Phase Requirements → Test Map

| Behavior | Test Type | Method |
|----------|-----------|--------|
| Background startup check error → renderer gets `updater:error` | Integration | Manual: kill network, launch prod build, verify Settings shows error state |
| Mid-download error → renderer transitions from `downloading` to `error` | Integration | Manual: simulate download failure (disconnect mid-download), verify banner hides + Settings shows error |
| `startDownload()` failure → hook `.catch()` fires | Unit-ish | Manual: verify in DevTools that `ipcRenderer.invoke('updater:start-download')` rejects when forced to throw |
| Manual check failure → exactly ONE `updater:error` event | Integration | Manual: DevTools IPC monitor — count `updater:error` events on forced manual check failure |
| `status='error'` in Settings Aggiornamenti section | UI smoke | Manual: trigger any error path, verify Settings shows "Impossibile controllare gli aggiornamenti" |

### Wave 0 Gaps

No test framework to set up — this phase defers automated testing per locked decisions. No Wave 0 infrastructure needed.

**Recommended manual verification sequence (post-implementation):**
1. Apply all 3 hunks
2. In dev: mock `autoUpdater.checkForUpdates` to throw → verify `onUpdateError` IPC fires once
3. In dev: mock `autoUpdater.downloadUpdate` to throw → verify hook `.catch()` fires + status transitions to `error`
4. Code review: confirm `webContents.send` removed from `updater:check-for-updates` catch

---

## Common Pitfalls

### Pitfall 1: Applying D-01 without D-02
**What goes wrong:** Every manual check failure emits `updater:error` twice — from the event handler (new) and from the IPC catch block (existing). The renderer handles both; `setStatus('error')` is called twice for the same error.
**Why it happens:** electron-updater both emits the error event and rejects the promise for the same failure.
**How to avoid:** D-01 and D-02 are a coupled pair — apply in the same edit session.
**Warning signs:** In DevTools IPC monitor, seeing two `updater:error` events for a single manual check failure.

### Pitfall 2: Forgetting the window guard in D-01
**What goes wrong:** `mainWindow.webContents.send(...)` throws "Object has been destroyed" if called after window close, crashing the main process.
**Why it happens:** `autoUpdater.on('error')` can fire during the startup 3s delay if the user immediately closes the window.
**How to avoid:** Copy the guard pattern exactly: `if (mainWindow && !mainWindow.isDestroyed())`.
**Warning signs:** Main process crash logged in electron-log with "Object has been destroyed".

### Pitfall 3: `return { success: false }` instead of `throw err` (Bug 2 exact symptom)
**What goes wrong:** `ipcRenderer.invoke()` resolves with the error object, `.catch()` is never called, `status` stays `'available'` or `'downloading'` forever.
**Why it happens:** JavaScript: returning a value from an async function always resolves the promise, regardless of the value's content.
**How to avoid:** `throw err` is the only way to cause `invoke()` to reject.
**Warning signs:** Hook `.catch()` breakpoint never hits; `status` stuck at non-error value after a known download failure.

---

## Code Examples

### Fix for Bug 1 — Updated `autoUpdater.on('error', ...)` handler

```js
// Source: pattern from main.cjs lines 48–70 (existing push-event handlers)
// Error handler — forward to renderer so it can show error state (Issue 1 fix)
autoUpdater.on('error', (err) => {
  log.error('autoUpdater error:', err.message);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:error', err.message);
  }
});
```

### Fix for D-02 — `updater:check-for-updates` catch block (remove 3 lines)

```js
// Source: main.cjs lines 338–349 — remove only the webContents.send block
ipcMain.handle('updater:check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (err) {
    log.error('checkForUpdates error:', err.message);
    // webContents.send REMOVED — autoUpdater.on('error') handles forwarding now
    return { success: false, error: err.message };
  }
});
```

### Fix for Bug 2 — Updated `updater:start-download` catch block

```js
// Source: pattern from Electron docs — throw causes invoke() to reject
ipcMain.handle('updater:start-download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    log.error('downloadUpdate error:', err.message);
    throw err;  // Causes ipcRenderer.invoke() to reject → hook .catch() fires
  }
});
```

---

## Environment Availability

Step 2.6: SKIPPED — Phase 11 is a pure code edit to `electron/main.cjs`. No external tools, CLIs, services, or runtimes beyond the existing Electron stack are required. Existing `electron-updater` and `electron-log` are already in `dependencies`.

---

## Open Questions

1. **`throw err` vs `throw new Error(err.message)` in start-download handler**
   - What we know: Both work; D-04 explicitly allows either
   - What's unclear: Preference for stack trace preservation vs. clean message forwarding
   - Recommendation: Use `throw err` directly — preserves the full Error object (message + stack) for IPC serialization. Only downside is if `err` is not an Error instance (unlikely with electron-updater).

2. **Should the startup `.catch()` (line 80–82) remain after the fix?**
   - What we know: It only logs; it's redundant after D-01 since `autoUpdater.on('error')` also logs
   - What's unclear: Whether the extra log context ("Startup checkForUpdates failed") is valuable for debugging
   - Recommendation: Keep it — harmless belt-and-suspenders, provides startup-specific context in logs.

---

## Sources

### Primary (HIGH confidence)
- `electron/main.cjs` — Direct source inspection, lines 72–76, 338–349, 351–359
- `src/hooks/useUpdateStatus.js` — Direct source inspection, lines 31–34, 47–50, 62–65
- `.planning/phases/11-update-error-handling/11-CONTEXT.md` — Locked decisions D-01 through D-05
- `.planning/v1.1-MILESTONE-AUDIT.md` — Issue 1 (lines 104–114) and Issue 2 (lines 116–124)

### Secondary (MEDIUM confidence)
- Electron IPC docs (ipcMain.handle — throw behavior) — verified by pattern: all other IPC handlers in main.cjs that return `{ success: false }` never cause caller `.catch()` to fire
- `.planning/phases/09-update-infrastructure/09-CONTEXT.md` — IPC bridge shape, push-event patterns confirmed in actual code
- `.planning/phases/10-update-ui/10-CONTEXT.md` — hook `.catch()` shape confirmed by reading actual useUpdateStatus.js

---

## Metadata

**Confidence breakdown:**
- Current code state: HIGH — directly read from source, line numbers confirmed
- Fix approach: HIGH — decisions locked in CONTEXT.md, pattern confirmed from existing working handlers
- Risk assessment: HIGH — double-fire risk is mechanically certain without D-02; window guard risk is well-documented Electron pattern
- Validation: MEDIUM — manual-only due to no test infrastructure; test approach is clear but requires production build

**Research date:** 2026-04-03
**Valid until:** Stable — this is a one-file targeted fix; code only becomes stale if electron/main.cjs is refactored before implementation
