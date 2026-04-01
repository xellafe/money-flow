---
phase: 1
slug: foundation-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no test framework installed — Phase 1 is config/CSS, no JS unit tests needed) |
| **Config file** | none — build verification only |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd-verify-work`:** Full suite green + all manual checks passed
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-??-01 | 01 | 1 | FOUND-01 | Build smoke | `npm run build` — check `dist/assets/*.css` contains utility class names | ❌ Wave 0 | ⬜ pending |
| 01-??-02 | 01 | 1 | FOUND-02 | Build + manual | `npm run build` — check CSS contains `--color-brand-500`, `--color-income-500` | ❌ Wave 0 | ⬜ pending |
| 01-??-03 | 01 | 1 | FOUND-03 | Build + manual | `npm run build` — check `dist/assets/` contains `.woff2` font files | ❌ Wave 0 | ⬜ pending |
| 01-??-04 | 01 | 2 | FOUND-04 | Manual Electron | `npm run electron:dev` — devtools console shows no CSP violations | ❌ Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test framework installation needed — Phase 1 is config/CSS infrastructure with no JavaScript logic to unit test.

*Existing infrastructure (`npm run build`, `npm run lint`) covers all automated verification for this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tailwind utility classes apply in components (HMR) | FOUND-01 | No browser automation; requires visual check in running app | Open `npm run electron:dev`, add `class="text-income-500"` to any element, verify color applies |
| Design tokens accessible as CSS vars | FOUND-02 | CSS var runtime resolution requires browser | Open devtools, inspect `:root`, verify `--color-income-500: #059669` is present |
| Inter Variable font renders, no CDN requests | FOUND-03 | Network requests require browser devtools | Open devtools Network tab, reload, verify no requests to fonts.googleapis.com or fonts.gstatic.com |
| CSP: no violations in dev | FOUND-04 | Electron security headers require running app | Open `npm run electron:dev`, check devtools Console for CSP violation errors — expect zero |
| CSP: prod build has no unsafe-inline | FOUND-04 | Requires inspecting headers in prod build | Run `npm run electron:preview`, check devtools Security tab for CSP header value |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
