---
phase: 7
slug: ux-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no vitest.config, jest.config, or test files found |
| **Config file** | None — no automated test framework in project |
| **Quick run command** | Manual Electron smoke test of specific feature |
| **Full suite command** | Full app walkthrough (all 7 UX requirements) |
| **Estimated runtime** | ~5 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Manual Electron smoke test of the specific feature added
- **After every plan wave:** Full app walkthrough (all 7 UX requirements)
- **Before `/gsd-verify-work`:** All 7 success criteria confirmed via manual inspection
- **Max feedback latency:** Per-feature visual confirmation

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-hover-states | 01 | 1 | UX-01, UX-06 | manual | — Hover over all buttons, rows, links in Electron | ❌ | ⬜ pending |
| 7-skeleton-loading | 01 | 1 | UX-02 | manual | — Switch to Transazioni view, observe 300ms skeleton | ❌ | ⬜ pending |
| 7-empty-dashboard | 02 | 1 | UX-03 | manual | — Clear localStorage, reload app, verify dashboard empty state + CTA | ❌ | ⬜ pending |
| 7-toast-animation | 02 | 1 | UX-04 | manual | — Trigger any action producing toast, verify slide-in/out + bottom-right position | ❌ | ⬜ pending |
| 7-add-transaction | 03 | 2 | UX-05 | manual | — Click "Aggiungi" on dashboard, fill form, confirm transaction saved | ❌ | ⬜ pending |
| 7-page-transitions | 03 | 2 | UX-07 | manual | — Click sidebar nav items, verify 150ms fade transition | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*No automated test infrastructure needed for this polish phase — all validation is visual/manual.*

Existing infrastructure covers all phase requirements via manual Electron smoke testing.

*(If automated testing is desired in future: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover states + 150ms transitions visible on all buttons/rows | UX-01 | CSS animation — no DOM assertion possible without visual testing framework | Open Electron app, hover over every button, table row, nav item; verify smooth color transition |
| Skeleton shows on TransactionsView mount, disappears after 300ms | UX-02 | Time-based visual animation | Switch to "Transazioni" view; verify skeleton rows appear briefly then fade to real data |
| Empty dashboard shows when no transactions, import CTA works | UX-03 | Requires specific app state (no transactions) | Clear localStorage, reload; verify Wallet icon + "Nessuna transazione" + "Importa" CTA appears; click CTA and confirm file picker opens |
| Toast animates in/out, positioned bottom-right, 3s auto-dismiss | UX-04 | Animation — requires visual inspection | Trigger an action producing toast; verify slide-up entrance, bottom-right position, 3s auto-dismiss, slide-down exit |
| "Aggiungi" button visible on all views, modal opens + saves | UX-05 | Electron UI interaction | Click "Aggiungi" from dashboard, transactions, and settings views; fill form; confirm transaction appears in list |
| Pointer cursor on all clickable elements | UX-06 | CSS cursor — requires visual hover inspection | Hover over every interactive element; verify cursor changes to pointer |
| Fade transition visible when switching views | UX-07 | Animation — requires visual inspection | Click each sidebar nav item; verify smooth 150ms opacity fade between views |

---

## Validation Sign-Off

- [ ] All tasks have manual verification instructions documented
- [ ] Sampling continuity: each task has explicit Electron smoke test steps
- [ ] Wave 0: no automated stubs needed — all validation is manual
- [ ] No watch-mode flags
- [ ] Feedback latency: per-feature visual confirmation after each commit
- [ ] `nyquist_compliant: true` set in frontmatter when sign-off complete

**Approval:** pending
