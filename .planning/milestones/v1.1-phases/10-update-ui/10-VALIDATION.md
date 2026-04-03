---
phase: 10
slug: update-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework detected |
| **Config file** | None found |
| **Quick run command** | N/A — no test runner installed |
| **Full suite command** | N/A |
| **Estimated runtime** | Manual only |

---

## Sampling Rate

- **After every task commit:** Manual smoke test in Electron dev mode
- **After every plan wave:** Full manual checklist below
- **Before `/gsd-verify-work`:** All 6 manual checks must pass
- **Max feedback latency:** N/A (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | UPD-07 | manual | N/A | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | UPD-07 | manual | N/A | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | UPD-04, UPD-05 | manual | N/A | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | UPD-08, UPD-09 | manual | N/A | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | UPD-04, UPD-05, UPD-07, UPD-08, UPD-09 | manual | N/A | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework — manual validation only. No Wave 0 setup needed.

*Existing infrastructure covers all phase requirements (manual smoke testing).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Settings Aggiornamenti shows current version from `app.getVersion()` | UPD-07 | No test framework | Run app; open Settings; verify version matches package.json |
| "Controlla aggiornamenti" button enters disabled/spinner state on click | UPD-08 | No test framework | Click button; verify disabled state + spinner visible during check |
| "Sei già aggiornato" text appears when no update available | UPD-09 | No test framework | Trigger check when already on latest; verify text shown |
| "Versione X.Y.Z disponibile — download N% completato" updates live | UPD-09 | No test framework | Trigger download; verify progress updates in settings section |
| "Impossibile controllare gli aggiornamenti" + Riprova link on error | UPD-09 | No test framework | Trigger error state; verify error text + Riprova link visible |
| UpdateBanner appears only when `status === 'ready'` | UPD-04, UPD-05 | No test framework | Verify banner absent during checking/downloading; appears only when download complete |
| Dismiss X hides banner; Settings still shows `ready` state | UPD-04 | No test framework | Dismiss banner; open Settings; verify "Installa e riavvia" still visible |
| "Installa e riavvia" triggers quit-and-install | UPD-04, UPD-05 | No test framework | Click button; verify app quits and relaunches to new version |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < N/A (manual only)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
