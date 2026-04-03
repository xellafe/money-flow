---
phase: 11
slug: update-error-handling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no automated test infrastructure exists in the project |
| **Config file** | none |
| **Quick run command** | manual smoke test (see Manual-Only Verifications below) |
| **Full suite command** | manual smoke test |
| **Estimated runtime** | ~5 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Visual inspect changed hunks in `electron/main.cjs`
- **After every plan wave:** Manual smoke test (see below)
- **Before `/gsd-verify-work`:** Full manual smoke test must pass
- **Max feedback latency:** N/A (manual only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | Bug 1 fix | manual | grep check (see below) | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | Bug 2 fix | manual | grep check (see below) | ✅ | ⬜ pending |
| 11-01-03 | 01 | 1 | D-02 dedup | manual | grep check (see below) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements (grep-based verification only).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Background check error reaches renderer | Bug 1 (autoUpdater.on('error')) | No test harness; requires electron-updater event simulation | Build app, trigger network-blocked update check, observe banner switches to error state |
| Mid-download error reaches renderer | Bug 1 (autoUpdater.on('error')) | No test harness; requires download interruption | Build app, start download, kill network mid-download, observe status transitions to error |
| startDownload rejection propagates | Bug 2 (updater:start-download throw) | No test harness; requires IPC call simulation | Build app, make download fail (bad network), confirm UI shows error not stuck 'downloading' |
| No double-fire on manual check failure | D-02 (remove webContents.send from IPC catch) | Requires network-blocked environment | Build app, trigger manual check with blocked network, confirm only one error event fires |

**Grep-verifiable acceptance criteria (can run immediately after code change):**

```bash
# Bug 1 fix: autoUpdater.on('error') sends to renderer
grep -n "webContents.send.*updater:error" electron/main.cjs

# Bug 2 fix: start-download handler throws instead of returns
grep -A5 "updater:start-download" electron/main.cjs | grep "throw"

# D-02: no webContents.send in check-for-updates catch block
grep -A20 "updater:check-for-updates" electron/main.cjs | grep -v "webContents.send.*updater:error"
```

---

## Validation Sign-Off

- [ ] All tasks have grep-verifiable `<acceptance_criteria>`
- [ ] Manual smoke test steps documented above
- [ ] Wave 0: N/A (no test framework)
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter when manual tests pass

**Approval:** pending
