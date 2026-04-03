---
phase: 9
slug: update-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no jest/vitest/pytest configured in project |
| **Config file** | none — no test runner configured |
| **Quick run command** | `npm run electron:build` (build smoke check) |
| **Full suite command** | `npm run electron:build` + manual DevTools inspection |
| **Estimated runtime** | ~60–120 seconds (electron-builder build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run electron:build` — verifies no syntax errors break the build
- **After every plan wave:** Run `npm run electron:build && Test-Path .\release\latest.yml` (Wave 1+); DevTools bridge check after preload changes
- **Before `/gsd-verify-work`:** All 4 phase success criteria verified
- **Max feedback latency:** 120 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | UPD-01 | smoke (build) | `npm run electron:build && Test-Path .\release\latest.yml` | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 1 | UPD-02 | manual | Run packaged NSIS build, check electron-log file for startup check | manual-only | ⬜ pending |
| 9-01-03 | 01 | 2 | UPD-03 | smoke (DevTools) | `typeof window.electronAPI.updater.checkForUpdates === 'function'` in DevTools | manual-only | ⬜ pending |
| 9-01-04 | 01 | 2 | UPD-06 | code review | Read `installUpdate` IPC handler — verify `isQuitting = true` precedes `quitAndInstall()` | code review | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test infrastructure required for this phase. Verification is build-output inspection + DevTools manual check.

*Existing infrastructure covers all automated phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| autoUpdater 3 s startup check fires (prod only) | UPD-02 | Requires packaged NSIS build with live GitHub Release; no mock infrastructure | Run packaged NSIS build; open electron-log in `%AppData%/money-flow/logs/`; verify update-check event appears ~3 s after launch |
| `window.electronAPI.updater.*` all 8 methods are functions | UPD-03 | Requires running renderer context | Open DevTools console; run `Object.keys(window.electronAPI.updater).forEach(k => console.log(k, typeof window.electronAPI.updater[k]))` — all 8 must log `function` |
| `isQuitting = true` set before `quitAndInstall()` | UPD-06 | End-to-end requires a downloaded update; code review is sufficient | Read `electron/main.cjs` `installUpdate` IPC handler — verify `isQuitting = true` is the first line before `autoUpdater.quitAndInstall()` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
