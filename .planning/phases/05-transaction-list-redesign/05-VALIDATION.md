---
phase: 5
slug: transaction-list-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project uses manual Electron smoke tests (consistent with Phases 1-4) |
| **Config file** | None |
| **Quick run command** | N/A — manual checklist |
| **Full suite command** | N/A — manual checklist |
| **Estimated runtime** | ~5 minutes (manual Electron smoke run) |

---

## Sampling Rate

- **After every task commit:** Visual inspection in Electron dev window
- **After every plan wave:** Run manual checklist for all wave requirements
- **Before `/gsd-verify-work`:** Full manual checklist must be green
- **Max feedback latency:** ~5 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-xx-TRNS-01 | TBD | TBD | TRNS-01 | manual | — | ✅ | ⬜ pending |
| 5-xx-TRNS-02 | TBD | TBD | TRNS-02 | manual | — | ✅ | ⬜ pending |
| 5-xx-TRNS-03 | TBD | TBD | TRNS-03 | manual | — | ✅ | ⬜ pending |
| 5-xx-TRNS-04 | TBD | TBD | TRNS-04 | manual | — | ✅ | ⬜ pending |
| 5-xx-TRNS-05 | TBD | TBD | TRNS-05 | manual | — | ✅ | ⬜ pending |
| 5-xx-TRNS-06 | TBD | TBD | TRNS-06 | manual | — | ✅ | ⬜ pending |
| 5-xx-TRNS-07 | TBD | TBD | TRNS-07 | unit | `node -e "const {getCategoryColor}=require('./src/utils/categoryColor'); console.assert(getCategoryColor('Food')===getCategoryColor('Food'),'determinism fail')"` | ✅ | ⬜ pending |
| 5-xx-TRNS-08 | TBD | TBD | TRNS-08 | manual | — | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No new test infrastructure needed — project uses manual Electron smoke tests as validation pattern, consistent with Phases 1-4.
- TRNS-07 (`getCategoryColor` determinism) can be verified with a `node -e` one-liner inline; no test harness required.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rows render with correct columns (Date, Descrizione, Categoria, Importo) | TRNS-01 | UI structure; Electron visual check | Open Electron app → navigate to Transactions → confirm 4 columns present and labeled correctly |
| Sort column click cycles ASC→DESC→default | TRNS-02 | Visual sort state + row order verification | Click Date column header 3×; confirm chevron icon cycles and rows reorder |
| Pagination counter shows correct X–Y of Z | TRNS-03 | Requires real transaction data | Import ≥101 transactions → confirm counter reads "Mostrando 1–100 di N transazioni" |
| Search debounce — input shows instantly, filter triggers after 200ms | TRNS-04 | Timing-sensitive interaction | Type in search box; confirm input is immediate and list filters after ~200ms pause |
| Inline edit description/category saves and closes | TRNS-05 | Full interaction flow | Click description cell → edit text → press Enter/blur → confirm saved value persists |
| Positive amounts green, negative red | TRNS-06 | Visual color verification | Confirm income rows show green `+` amounts, expense rows show red `−` amounts |
| Same category always same badge color | TRNS-07 | Determinism check | Add two transactions with same category → confirm identical badge color |
| Empty state visible when no transactions match filter | TRNS-08 | Requires filter to produce zero results | Apply a filter that matches nothing → confirm "Nessun risultato" empty state appears with "Rimuovi filtri" CTA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual checklist entry
- [ ] Sampling continuity: visual inspection after every task
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5 minutes
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
