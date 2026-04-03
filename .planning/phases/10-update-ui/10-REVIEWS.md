---
phase: 10
reviewers: [claude-internal]
reviewed_at: 2026-04-03T13:00:41Z
plans_reviewed: [10-01-PLAN.md, 10-02-PLAN.md]
cli_status: "gemini: missing, codex: missing, claude-cli: ConnectionRefused — review performed by current session"
---

# Cross-AI Plan Review — Phase 10: Update UI

> **Note:** External AI CLIs (gemini, codex) are not installed. The `claude` CLI was found at
> `C:\Users\feded\.local\bin\claude.exe` but returned `ConnectionRefused` when invoked.
> This review was performed by the current Claude session with full context loaded independently.

---

## Plan 10-01 Review: IPC Handler + useUpdateStatus Hook

### Summary

Plan 10-01 is well-scoped and clearly delineated. It tackles exactly what the foundation needs: a single IPC handler, a single bridge method, and a single hook. The hook implementation follows established React patterns correctly — `useCallback` for stable references, combined `useEffect` cleanup, and proper async boundary at `checkForUpdates`. The auto-download trigger (`startDownload()` called inside `onUpdateAvailable`) is clearly annotated with its decision rationale (D-01). The state machine is complete and covers all 7 values. Overall this is a solid, low-risk plan.

### Strengths

- **Clean separation of concerns:** IPC handler (main.cjs), bridge method (preload.cjs), and hook (useUpdateStatus.js) are each one logical unit — no mixing of concerns across layers.
- **Complete state machine coverage:** All 7 status values (`idle`, `checking`, `available`, `downloading`, `ready`, `up-to-date`, `error`) are defined and wired to the correct IPC events.
- **Combined cleanup pattern:** Collecting all 5 IPC listener cleanups in a single `useEffect` array is correct and safe — no risk of partial cleanup if the component unmounts mid-setup.
- **useCallback usage is correct:** `checkForUpdates`, `installUpdate`, and `dismissBanner` are all wrapped in `useCallback` with empty deps arrays, preventing unnecessary re-renders in consumers.
- **Error state clears on retry:** `setError(null)` is called at the start of `checkForUpdates()` — good UX hygiene that prevents stale error messages.
- **Follows existing hook barrel pattern:** Adding to `src/hooks/index.js` is consistent with the 6 existing hooks.

### Concerns

- **[MEDIUM] `startDownload()` inside `onUpdateAvailable` is a fire-and-forget without error handling.** If `startDownload()` throws or rejects (e.g., network issue at that moment), the status stays at `'available'` indefinitely with no user-visible feedback. The `onUpdateError` listener would only fire if electron-updater itself emits an error event — but a rejection from the IPC call itself is unhandled.
  - *Mitigation:* Wrap in try/catch or `.catch()` to set status to `'error'` if startDownload rejects.

- **[MEDIUM] `onUpdateAvailable` receives `info` but only uses `info.version`.** The `info` object from electron-updater also contains `releaseNotes`, `releaseDate`, and other fields. While the plan correctly scopes to just `version`, there is no guard for the case where `info` is null or `info.version` is undefined (which can happen in some edge cases of electron-updater's event emission).
  - *Mitigation:* `setVersion(info?.version ?? null)` defensive access.

- **[LOW] `checkForUpdates()` is `async` and awaits the IPC call, but the result is handled by event listeners.** If `checkForUpdates()` throws (IPC channel dead, main process not responding), status gets stuck at `'checking'`. There is no timeout or error boundary.
  - *Mitigation:* Wrap the `await` in try/catch that sets `setStatus('error')` and `setError(message)`.

- **[LOW] `getAppVersion()` on mount has no error handling.** If `window.electronAPI.getAppVersion` is not available (e.g., running in browser dev mode without Electron), the `.then()` call will throw. Since this hook runs at the app level, this could crash the app in development.
  - *Mitigation:* `window.electronAPI?.getAppVersion?.()?.then(setAppVersion)` with optional chaining, or a `try/catch`.

- **[LOW] `isDismissed` is never reset when a new update becomes available.** If the user dismisses the banner for version 1.1.0, then later version 1.2.0 becomes available in the same session, `isDismissed` stays `true` and the banner never shows. This is an edge case (rare in the same session), but worth noting.
  - *Mitigation:* Reset `isDismissed` to `false` inside `onUpdateAvailable` handler alongside `setVersion()`.

### Suggestions

- Add `try/catch` around `await window.electronAPI.updater.checkForUpdates()` in `checkForUpdates()`:
  ```javascript
  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    setError(null);
    try {
      await window.electronAPI.updater.checkForUpdates();
    } catch (err) {
      setStatus('error');
      setError(err?.message ?? 'Errore sconosciuto');
    }
  }, []);
  ```
- Wrap `startDownload()` call in `onUpdateAvailable` with `.catch()`:
  ```javascript
  window.electronAPI.updater.startDownload().catch((err) => {
    setStatus('error');
    setError(err?.message ?? 'Download non avviato');
  });
  ```
- Reset `isDismissed` when a new update becomes available:
  ```javascript
  window.electronAPI.updater.onUpdateAvailable((info) => {
    setStatus('available');
    setVersion(info?.version ?? null);
    setIsDismissed(false); // Reset dismiss for new version
    window.electronAPI.updater.startDownload().catch(...);
  }),
  ```
- Add optional chaining for `getAppVersion` to guard against non-Electron environments:
  ```javascript
  window.electronAPI?.getAppVersion?.()?.then(setAppVersion);
  ```

### Risk Assessment

**LOW–MEDIUM.** The core logic is correct and follows established patterns. The concerns above are edge cases that won't affect the happy path, but could produce confusing UX (stuck "checking" state, invisible banner after version bump). The fixes are small and non-invasive.

---

## Plan 10-02 Review: UpdateBanner + App.jsx Wiring + SettingsView

### Summary

Plan 10-02 is the most complex change in the phase but is broken down well into 3 independent tasks. The most significant risk is Task 2: the Toast.jsx surgery (removing `fixed` positioning). This is a cross-cutting change that could silently break Toast rendering if the shared container is ever absent or conditionally rendered. The SettingsView state machine in Task 3 is thorough and covers all 6 states correctly. The UpdateBanner component in Task 1 is a clean visual match to Toast. Overall the plan is solid, with the main risk concentrated in the Toast refactor.

### Strengths

- **Toast refactor is minimal and correct:** Removing only the three utility classes (`fixed bottom-6 right-6 z-50`) from Toast's className and moving them to the parent container is the right approach — no change to Toast's internal layout or animation logic.
- **`flex-col-reverse gap-3` stacking is elegant:** No absolute/relative offset math needed. When both notifications are present, they stack naturally with the bottom item (Toast) closer to the viewport edge, which is appropriate since Toast is transient and UpdateBanner is persistent.
- **Separate `AnimatePresence` blocks for Toast and UpdateBanner:** Removing `mode="wait"` ensures each notification animates independently. If a Toast appears while UpdateBanner is visible, neither animation blocks the other. This is correct.
- **`key="update-banner"` on UpdateBanner:** Providing a stable key ensures AnimatePresence correctly tracks the element for enter/exit animation without re-mounting on re-render.
- **Full state machine in SettingsView:** All 6 post-check states are covered with appropriate UI. The `role="status" aria-live="polite"` on the downloading progress paragraph is good accessibility practice.
- **`dismissBanner()` does not change status:** Correctly documented in D-06; the Settings section will still show "Aggiornamento pronto" after the user dismisses the corner banner — both paths to install remain available.
- **No new packages required:** The plan correctly identifies that all dependencies (Framer Motion, Lucide, Tailwind) are already installed.

### Concerns

- **[HIGH] Toast.jsx is used throughout the app — removing `fixed` positioning is a breaking change if the notification container in App.jsx is ever missing.** The plan assumes Toast is always rendered inside the `<div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3">` container. If Toast is ever rendered outside that container (e.g., in a future context or test), it will appear at its document flow position (likely invisible or layout-breaking). There is no fallback.
  - *Mitigation:* Document clearly in Toast.jsx that it requires a positioned parent. Alternatively (safer), keep `fixed bottom-6 right-6 z-50` on the container AND on Toast as a defensive default — but only one will apply since Toast is always inside the container.

- **[MEDIUM] `updateStatus` prop is not guarded against `undefined` in SettingsView.** The Aggiornamenti section renders `{updateStatus.appVersion}` and `{updateStatus.status === 'idle' && ...}` unconditionally. If SettingsView is ever rendered without the `updateStatus` prop (e.g., in a test, Storybook, or future refactor), this will throw a TypeError.
  - *Mitigation:* Add a default: `function SettingsView({ ..., updateStatus = {} })` or a null guard at the top of the Aggiornamenti section: `{updateStatus && (<section>...</section>)}`.

- **[MEDIUM] The `up-to-date` state in SettingsView renders both a success message AND the "Controlla aggiornamenti" button.** This is UX-correct (allow re-checking), but there's no state reset between the old check and a new one. If the user clicks "Controlla aggiornamenti" again in `up-to-date` state, `checkForUpdates()` correctly sets status to `'checking'` and clears the error. However, `version` and `progress` are not reset — stale data from a previous cycle could theoretically leak through if the IPC events fire out of order.
  - *Mitigation:* In `checkForUpdates()`, also reset `version` to `null` and `progress` to `0` before the IPC call.

- **[MEDIUM] Two separate `<AnimatePresence>` blocks inside one container is not standard Framer Motion usage.** Typically `AnimatePresence` is used with a single direct child. Having two separate `AnimatePresence` wrappers inside a flex container is functionally correct, but Framer Motion may emit a warning if it detects multiple AnimatePresence contexts without a `custom` prop. Worth testing.
  - *Mitigation:* Test in `npm run dev` to confirm no warnings. Alternative: use a single `AnimatePresence` with multiple keyed children.

- **[LOW] `UpdateBanner` uses `<button>` inside a `<button>` effectively — the "Installa e riavvia" button is inside the flex container, but the dismiss X button is a sibling.** The structure is fine, but the "Installa e riavvia" button has `w-fit` which could behave unexpectedly on very narrow screens. Since this is a desktop Electron app with a fixed minimum window width, this is not a real concern but worth noting.

- **[LOW] No loading/disabled state on "Installa e riavvia" button** (in either the banner or the Settings section). After clicking, the IPC call triggers and the app should close — but if there's a delay, the button remains clickable and could trigger multiple `installUpdate()` calls.
  - *Mitigation:* Add a local `isInstalling` state to prevent double-clicks. Simple one-liner: track first click.

### Suggestions

- Add a comment to Toast.jsx documenting the positioning dependency:
  ```jsx
  // Positioned by parent container in App.jsx (fixed bottom-6 right-6 z-50)
  // Do NOT add fixed positioning here — it will double-position the toast
  ```
- Guard `updateStatus` in SettingsView with a default prop or null check to prevent crashes in tests/isolation.
- Reset `version` and `progress` at the start of `checkForUpdates()` in the hook:
  ```javascript
  setStatus('checking');
  setError(null);
  setVersion(null);
  setProgress(0);
  ```
- Consider adding a single `isInstalling` state in `useUpdateStatus` to disable the install button after first click:
  ```javascript
  const [isInstalling, setIsInstalling] = useState(false);
  const installUpdate = useCallback(() => {
    setIsInstalling(true);
    window.electronAPI.updater.installUpdate();
  }, []);
  ```
- Test the dual `AnimatePresence` pattern with both a Toast and UpdateBanner visible simultaneously to verify no Framer Motion warnings.

### Risk Assessment

**MEDIUM.** The Toast positioning refactor is the highest-risk change: it modifies a shared, widely-used component. The risk is low in the current codebase where Toast is only ever rendered in one place (App.jsx), but the change removes a safety net. The SettingsView and UpdateBanner implementations are straightforward. With the suggested `updateStatus` null guard and a comment on Toast, this drops to LOW.

---

## Consensus Summary

Both plans are well-structured and correctly scoped. The implementation approach is sound: hook-first (Plan 01), then components (Plan 02). The two plans have a clean dependency boundary.

### Agreed Strengths

- **State machine completeness:** All 7 status values in the hook and all 6 rendering states in SettingsView are correctly wired — no missing branches.
- **Pattern consistency:** Both plans follow established codebase conventions (IPC handler pattern, barrel exports, hook architecture, Toast animation template).
- **Correct notification stacking:** The `flex-col-reverse gap-3` container approach is clean and avoids offset math.
- **AnimatePresence per-notification:** Removing `mode="wait"` and using separate `AnimatePresence` blocks is the right call.
- **Dismiss-without-status-change:** `dismissBanner()` correctly preserves the `ready` state so Settings still shows the install option.

### Agreed Concerns

1. **[MEDIUM] Missing error handling on `checkForUpdates()` async boundary** — if the IPC call throws, status gets stuck at `'checking'` indefinitely. Add try/catch in both the hook and the IPC layer.

2. **[MEDIUM] Toast.jsx loses its positioning safety net** — after the refactor, Toast has no fallback positioning if rendered outside its expected container. Document the dependency clearly or add a defensive comment.

3. **[MEDIUM] `updateStatus` prop not guarded in SettingsView** — will throw TypeError if undefined. Add a null guard or default prop value.

4. **[LOW] `startDownload()` in `onUpdateAvailable` is unguarded** — fire-and-forget without a `.catch()`. Should at minimum log or set error state on rejection.

5. **[LOW] No install button protection** — double-click on "Installa e riavvia" could call `quitAndInstall()` twice. A simple `isInstalling` flag would prevent this.

### Divergent Views

None — this is a single-reviewer analysis. All concerns above are from the same perspective. A second reviewer (Gemini, Codex) might independently raise the `useUpdateStatus` initialization behavior (whether to auto-trigger a check on mount) and the two-`AnimatePresence` pattern as Framer Motion edge cases.

---

*Phase: 10-update-ui*
*Reviewed: 2026-04-03T13:00:41Z*
*Reviewer: Claude (current session — external CLIs unavailable)*
