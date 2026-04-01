---
phase: 2
slug: state-extraction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — vitest not in devDependencies |
| **Config file** | None |
| **Quick run command** | `npm run build && npm run lint` |
| **Full suite command** | `npm run build && npm run lint` (same — no test suite) |
| **Estimated runtime** | ~15–30 seconds |

---

## Sampling Rate

- **After wiring each hook into App.jsx:** Run `npm run build && npm run lint`
- **After all 6 hooks wired:** Full manual smoke test checklist (see below)
- **Before `/gsd-verify-work`:** Build green + lint green + manual checklist passed

---

## Per-Task Verification Map

| Task | Plan | Wave | Requirement | Type | Automated Command | Status |
|------|------|------|-------------|------|-------------------|--------|
| Create `useToast` + wire | 02-01 | 1 | FOUND-10 | Build smoke | `npm run build && npm run lint` | ⬜ pending |
| Create `useModals` + wire | 02-01 | 1 | FOUND-08 | Build smoke | `npm run build && npm run lint` | ⬜ pending |
| Create `useFilters` + wire | 02-01 | 1 | FOUND-07 | Build smoke | `npm run build && npm run lint` | ⬜ pending |
| Create `useCategories` + wire | 02-01 | 1 | FOUND-06 | Build smoke | `npm run build && npm run lint` | ⬜ pending |
| Create `useTransactionData` + wire | 02-01 | 1 | FOUND-05 | Build smoke | `npm run build && npm run lint` | ⬜ pending |
| Create `useImportLogic` + wire | 02-01 | 1 | FOUND-09 | Build smoke | `npm run build && npm run lint` | ⬜ pending |
| Update `src/hooks/index.js` barrel | 02-01 | 1 | FOUND-05–10 | Build smoke | `npm run build` | ⬜ pending |
| Manual smoke test (all features) | — | gate | FOUND-05–10 | Manual | See checklist below | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Files that must be CREATED as part of this phase (not pre-existing):

- [ ] `src/hooks/useToast.js` — covers FOUND-10
- [ ] `src/hooks/useModals.js` — covers FOUND-08
- [ ] `src/hooks/useFilters.js` — covers FOUND-07
- [ ] `src/hooks/useCategories.js` — covers FOUND-06
- [ ] `src/hooks/useTransactionData.js` — covers FOUND-05
- [ ] `src/hooks/useImportLogic.js` — covers FOUND-09
- [ ] `src/hooks/index.js` — updated barrel with all 6 new exports

No test framework install needed. Validation is build success + lint cleanliness + manual smoke test.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| localStorage persists after CRUD reload | FOUND-05 | No test framework | Add transaction → reload app → verify it appears |
| Import wizard flow end-to-end | FOUND-09 | No test framework | Import Excel → wizard → transactions added |
| Conflict resolver appears on duplicate import | FOUND-09 | No test framework | Import same file twice → conflict modal appears |
| All 7 modals open/close without errors | FOUND-08 | No test framework | Open each modal, confirm close, check console |
| Toast appears on add/delete operations | FOUND-10 | No test framework | Delete transaction → toast visible |
| Dashboard filters update stats | FOUND-07 | No test framework | Apply category filter → stats change |
| Pagination resets on filter change | FOUND-07 | No test framework | Go to page 2 → apply filter → back to page 1 |
| Category add/delete/recategorize works | FOUND-06 | No test framework | CategoryManager → add → recategorize all |

**FOUND-11 (localStorage backup):** SKIPPED — N/A per locked decision (dev environment).

---

## Manual Smoke Test Checklist (Phase Gate)

Run after all 6 hooks are wired and `npm run build && npm run lint` pass:

```
App functionality (zero regressions):
[ ] 1. App loads without console errors
[ ] 2. Import Excel file → wizard appears → transactions appear in list
[ ] 3. Import duplicate file → conflict resolver modal appears
[ ] 4. Add manual transaction → appears in list, persists after reload
[ ] 5. Delete transaction → confirm modal appears → transaction removed → toast shown
[ ] 6. Edit transaction description inline → persists after reload
[ ] 7. Edit transaction category inline → persists, categoryResolutions updated
[ ] 8. Open CategoryManager → add category → add keyword → recategorize all → works
[ ] 9. Dashboard filters (type/category/month/year) → stats update correctly
[ ] 10. Pagination → page resets when filter changes
[ ] 11. No React console errors or warnings during any of the above
```

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (build+lint) or are in manual checklist
- [ ] Sampling continuity: build+lint runs after each hook wiring step
- [ ] Wave 0 files (6 new hook files) created
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s per build check
- [ ] `nyquist_compliant: true` set in frontmatter after all checks pass

**Approval:** pending
