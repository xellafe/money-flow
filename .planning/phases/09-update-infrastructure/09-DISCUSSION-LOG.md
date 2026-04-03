# Phase 9: Update Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 09-update-infrastructure
**Areas discussed:** GitHub publish config, autoDownload behavior, logging strategy, listener cleanup pattern

---

## GitHub Publish Config

| Option | Description | Selected |
|--------|-------------|----------|
| GH_TOKEN env variable | Standard — set on the machine, never in code | |
| Hardcoded token | Not recommended — security risk | |
| No token needed | Public repo — no runtime token required | ✓ |

**User's choice:** `owner: xellafe`, `repo: money-flow`, public repo (no runtime token)
**Notes:** Token only needed at publish time (CI or local release script). `allowPrerelease: false` confirmed — stable releases only.

---

## autoDownload Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| autoDownload: true | Download starts automatically after update check | |
| autoDownload: false | Renderer explicitly triggers download via startDownload() | ✓ |

**User's choice:** `autoDownload: false` — renderer must call `startDownload()` to begin download
**Notes:** Deviates from ROADMAP success criteria which listed 7 bridge methods — `startDownload()` added as 8th method. Enables Phase 10 UX to show "update available" state before download begins.

---

## Logging Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| electron-log | Writes to persistent file in AppData — debuggable on end-user machines | ✓ |
| console.log only | No persistence — lost after app closes | |
| No logging | Silent | |

**User's choice:** `electron-log` — `autoUpdater.logger = require('electron-log')`
**Notes:** Added to `dependencies` (not devDependencies).

---

## Listener Cleanup Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Return cleanup function per listener | Like `onRequestBackupData` — consistent pattern | ✓ |
| Single removeAllUpdaterListeners() | Wipes all updater listeners at once | |
| No cleanup | Listeners live for app lifetime | |

**User's choice:** Each `on*` method returns a cleanup function — consistent with existing preload.cjs pattern.

---

## Agent's Discretion

- Internal structure of `setupAutoUpdater()` function
- Whether to use manual event wiring vs `checkForUpdatesAndNotify()`
- Technical implementation of portable build error swallowing

## Deferred Ideas

None.
