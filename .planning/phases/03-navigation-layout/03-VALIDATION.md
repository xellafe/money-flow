---
phase: 03
slug: navigation-layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no automated test framework in project) |
| **Config file** | None — build + lint gates only |
| **Quick run command** | `npm run lint && npm run build` |
| **Full suite command** | `npm run lint && npm run build && echo "FULL OK"` |
| **Estimated runtime** | ~30 seconds |

No automated UI tests exist in this project. Validation for Phase 3 is build/lint gates + manual Electron smoke test checklist.

---

## Sampling Rate

- **After every task commit:** `npm run lint && npm run build`
- **After every plan wave:** `npm run lint && npm run build` + manual `electron:dev` smoke test
- **Before `/gsd-verify-work`:** Full suite green + manual smoke test checklist complete
- **Max feedback latency:** ~30 seconds (build + lint)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | NAV-01..06 | build | `npm run lint && npm run build` | ❌ W0 (framer-motion install) | ⬜ pending |
| 03-01-02 | 01 | 1 | NAV-01, NAV-06 | build+manual | `npm run build` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | NAV-02, NAV-03, NAV-04 | build+manual | `npm run build` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | NAV-05 | build+manual | `npm run build` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | NAV-01..06 | manual smoke | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install framer-motion` — Framer Motion v12 not installed; required before any layout animation code
- [ ] Verify `framer-motion` appears in `package.json` dependencies after install

*Note: No test framework setup needed — manual smoke test is the validation strategy for visual/animation work.*

---

## Manual Smoke Test Checklist

Run `npm run electron:dev` and verify:

| # | Behavior | Requirement |
|---|----------|-------------|
| 1 | Sidebar visible at left, 240px wide (expanded default) | NAV-01 |
| 2 | Dashboard, Transazioni, Impostazioni nav items shown with Lucide icons | NAV-04 |
| 3 | Chevron toggle button at bottom of sidebar — clicking it collapses sidebar to 64px | NAV-02 |
| 4 | Sidebar collapse/expand animates smoothly ~200ms (no jank) | NAV-02 |
| 5 | Main content area reflows when sidebar collapses (no overlap, no gap) | NAV-06 |
| 6 | Active nav item is visually highlighted (current view) | NAV-03 |
| 7 | Header shows "Dashboard" when on Dashboard view | NAV-05 |
| 8 | Header shows "Transazioni" when on Transazioni view | NAV-05 |
| 9 | Header shows "Aggiungi transazione" button only on Transazioni view | NAV-05 |
| 10 | Header shows "Impostazioni" when on Impostazioni view | NAV-05 |
| 11 | Impostazioni shows placeholder shell (heading, no content error) | NAV-04 |
| 12 | Sidebar collapsed state persists after app restart | NAV-02 |
| 13 | No CSP violations in Electron DevTools console | FOUND-02 |
| 14 | No React errors or warnings in console | General |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar animation smoothness (no jank) | NAV-02 | Visual/animation — cannot be asserted in build output | Toggle sidebar 5x rapidly, verify no layout thrashing |
| Active nav highlight updates on view change | NAV-03 | Visual state — requires Electron rendering | Click each nav item, confirm highlight follows |
| 200ms animation duration "feels right" | NAV-02 | Perceptual — subjective timing | Compare before/after toggle, feel for snappiness |
| Framer Motion CSP compliance in Electron prod build | FOUND-02 | Requires full Electron prod build + DevTools | `npm run electron:build`, open, check Console for CSP errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (build gate covers all)
- [ ] Wave 0 covers `framer-motion` install
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
