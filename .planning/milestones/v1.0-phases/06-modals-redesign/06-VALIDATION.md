---
phase: 6
slug: modals-redesign
status: draft
nyquist_compliant: true
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
| 6-01-01 | 01 | 1 | MOD-01 | build | `npm run build` | ✅ | ⬜ pending |
| 6-01-02 | 01 | 1 | MOD-01 | build | `npm run build` | ✅ | ⬜ pending |
| 6-01-03 | 01 | 1 | MOD-01 | lint | `npm run lint -- --quiet` | ✅ | ⬜ pending |
| 6-02-01 | 02 | 2 | MOD-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 6-02-02 | 02 | 2 | MOD-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 6-02-03 | 02 | 2 | MOD-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 6-03-01 | 03 | 2 | MOD-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 6-03-02 | 03 | 2 | MOD-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 6-03-03 | 03 | 2 | MOD-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 6-04-01 | 04 | 2 | MOD-05,06,07 | build | `npm run build` | ✅ | ⬜ pending |
| 6-04-02 | 04 | 2 | MOD-05,06,07 | build | `npm run build` | ✅ | ⬜ pending |
| 6-05-01 | 05 | 3 | MOD-01,02 | grep | `Select-String -Path src/App.jsx -Pattern "AnimatePresence"` | ✅ | ⬜ pending |
| 6-05-02 | 05 | 3 | MOD-01,02 | grep | Count `<AnimatePresence>` occurrences = 7 | ✅ | ⬜ pending |
| 6-05-03 | 05 | 3 | MOD-01,02 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `@radix-ui/react-dialog` — npm install required before any modal work (Plan 01 Task 1)
- [x] `src/components/ui/ModalShell.jsx` — base modal component (Radix + Framer) (Plan 01 Task 2)
- [x] `src/components/ui/index.js` — barrel export (Plan 01 Task 3)

*Wave 0 is covered by Plan 01 (Wave 1). No test scaffolds required — this is a UI styling phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 200ms fade+scale animation visually smooth | MOD-01 | Animation timing not verifiable in jsdom | Open each modal in Electron, verify smooth transition |
| 150ms exit animation plays before unmount | MOD-02 | Animation timing requires visual inspection | Close each modal, confirm fade-out before disappearing |
| ESC key closes modal | MOD-03 | Keyboard event in Electron window | Press ESC on each open modal, confirm dismissal |
| Backdrop click closes modal | MOD-03 | Pointer event targeting in Electron | Click outside modal content area, confirm dismissal |
| Focus trap — Tab stays inside modal | MOD-04 | Focus management not testable in jsdom | Open each modal, Tab repeatedly, confirm focus cycles within |
| ImportWizard scrolls internally | MOD-07 | Layout/overflow not testable in jsdom | Open ImportWizard with many columns, confirm scroll without layout break |
| PayPalEnrichWizard step slide animation | MOD-06 | Animation direction requires visual inspection | Navigate forward/back between steps, confirm horizontal slide |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (build/lint/grep commands)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covered by Plan 01 (installs + creates ModalShell)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (build ~10s, lint ~3s)
- [x] `nyquist_compliant: true` set in frontmatter
- [x] MOD behavioral checks (ESC, focus trap, animations) declared in Manual-Only table

**Approval:** ready
