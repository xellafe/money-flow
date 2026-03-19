---
phase: 6
slug: modals-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already configured via vite.config.js) |
| **Config file** | vite.config.js |
| **Quick run command** | `npm run test -- --reporter=verbose` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --reporter=verbose`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | MOD-01 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | MOD-01 | visual | manual | ✅ | ⬜ pending |
| 6-02-01 | 02 | 1 | MOD-02 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 1 | MOD-02 | visual | manual | ✅ | ⬜ pending |
| 6-03-01 | 03 | 2 | MOD-03 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 6-04-01 | 04 | 2 | MOD-04 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 6-05-01 | 05 | 2 | MOD-05 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 6-06-01 | 06 | 2 | MOD-06 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 6-07-01 | 07 | 2 | MOD-07 | unit | `npm run test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/ModalShell.jsx` — base modal component (Radix + Framer)
- [ ] `@radix-ui/react-dialog` — npm install required before any modal work
- [ ] `src/components/ui/ModalShell.test.jsx` — stubs for MOD-01 through MOD-07

*Wave 0 must complete before any modal migration tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 200ms fade+scale animation visually smooth | MOD-01 | Animation timing not verifiable in jsdom | Open each modal in Electron, verify smooth transition |
| ESC key closes modal | MOD-02 | Keyboard event in Electron window | Press ESC on each open modal, confirm dismissal |
| Backdrop click closes modal | MOD-02 | Pointer event targeting in Electron | Click outside modal content area, confirm dismissal |
| Focus trap — Tab stays inside modal | MOD-03 | Focus management not testable in jsdom | Open each modal, Tab repeatedly, confirm focus cycles within |
| ImportWizard step 2 scrolls internally | MOD-05 | Layout/overflow not testable in jsdom | Open ImportWizard step 2, confirm scroll without layout break |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
