---
phase: 4
slug: dashboard-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — no vitest/jest in devDependencies |
| **Config file** | none |
| **Quick run command** | `node node_modules/vite/bin/vite.js build` |
| **Full suite command** | `node node_modules/vite/bin/vite.js build && node node_modules/eslint/bin/eslint.js src/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node node_modules/vite/bin/vite.js build`
- **After every plan wave:** Run `node node_modules/vite/bin/vite.js build && node node_modules/eslint/bin/eslint.js src/`
- **Before `/gsd-verify-work`:** Full suite must be green + Electron smoke test
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DASH-03 | automated | `node node_modules/vite/bin/vite.js build` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | DASH-01, DASH-02 | automated | `node node_modules/vite/bin/vite.js build` | ✅ | ⬜ pending |
| 04-01-03 | 01 | 1 | DASH-08 | automated | `node node_modules/vite/bin/vite.js build` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | DASH-04, DASH-05 | automated | `node node_modules/vite/bin/vite.js build` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 2 | DASH-06 | automated | `node node_modules/vite/bin/vite.js build` | ✅ | ⬜ pending |
| 04-02-03 | 02 | 2 | DASH-07 | automated | `node node_modules/vite/bin/vite.js build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

No test framework installation needed — this is a UI-only visual phase. Build + lint gate is sufficient for compilation verification. Visual correctness is validated via Electron smoke test after each wave.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stat cards show correct income/expense amounts | DASH-01 | No test framework; visual data display | Launch Electron, add transactions, verify card values match |
| Green/red semantic tints apply correctly | DASH-02 | Visual color check | Verify income card has green tint, expense has red tint |
| Chart colors resolve from CSS vars (not black) | DASH-03 | getComputedStyle only runs in browser | Verify chart lines are colored (not black/default) |
| Donut renders with center text | DASH-04 | Visual Recharts output | Verify donut chart shows category total at center |
| AreaChart renders trend lines | DASH-05 | Visual Recharts output | Verify area chart shows income/expense lines |
| Period selector in AppHeader (dashboard only) | DASH-06 | View-conditional rendering | Verify arrows + label visible on dashboard, hidden on other views |
| Donut click filters transaction list | DASH-07 | Interaction state check | Click donut segment, verify transaction list filters |
| Skeleton shimmer on mount + period change | DASH-08 | Visual + timing check | Verify shimmer appears for ≥300ms on load and period switch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
