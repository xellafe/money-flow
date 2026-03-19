---
phase: 05-transaction-list-redesign
plan: "04"
subsystem: requirements
tags: [gap-closure, documentation, requirements]
dependency_graph:
  requires: [05-01, 05-02, 05-03]
  provides: [accurate-trns-02-trns-04-docs]
  affects: [REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
decisions:
  - "TRNS-02 scope confirmed as Date + Importo only — categoria sort not implemented per Decision A stacked layout (no separate category column header)"
  - "TRNS-04 date range filter documented as deferred to Phase 7/v2 — year/month via AppHeader PeriodSelector satisfies Phase 5 scope per Decision C"
metrics:
  duration: 5m
  completed: "2026-03-19"
  tasks: 1
  files: 1
---

# Phase 5 Plan 04: Requirements Gap Closure (TRNS-02, TRNS-04) Summary

**One-liner:** Updated REQUIREMENTS.md to document descoped sub-features: categoria sort removed per stacked-layout Decision A (TRNS-02), date range picker deferred to Phase 7/v2 per AppHeader-only Decision C (TRNS-04).

## What Was Done

Updated exactly two requirement lines in `.planning/REQUIREMENTS.md` to accurately reflect Phase 5 implementation decisions that were locked in `05-CONTEXT.md`:

1. **TRNS-02** — Changed from "ogni colonna (data, importo, categoria)" to "colonne Data e Importo" with rationale: the stacked layout (Decision A) merges Date + Description + CategoryBadge into a single column, eliminating a standalone Categoria column header to sort on.

2. **TRNS-04** — Changed from "filtro data range" to documenting the deferral: "filtro data range differito a Phase 7/v2 — anno/mese via AppHeader; vedi 05-CONTEXT.md §C e Deferred Ideas". Year/month period selection via AppHeader PeriodSelector satisfies Phase 5 scope.

No other lines were modified. Both requirements remain marked `[x]` complete — the implemented scope satisfies the updated requirement descriptions.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update TRNS-02 and TRNS-04 in REQUIREMENTS.md | f905494 | .planning/REQUIREMENTS.md |

## Verification

```
TRNS-02: "Sorting cliccabile su colonne Data e Importo (categoria sort rimosso — layout stacked Decision A elimina colonna Categoria separata; vedi 05-CONTEXT.md §A)"
TRNS-04: "Barra filtri: ricerca testo inline (search-as-type), filtro categoria dropdown (filtro data range differito a Phase 7/v2 — anno/mese via AppHeader; vedi 05-CONTEXT.md §C e Deferred Ideas)"
```

All 8 acceptance criteria passed. TRNS-01, 03, 05, 06, 07, 08 confirmed unchanged.

## Decisions Made

1. **TRNS-02 scoped to Date + Importo only** — Decision A (stacked layout, locked) eliminates a standalone Categoria column. No regression — this matches the actual implementation in 05-03.
2. **TRNS-04 date range deferred** — Decision C (locked) explicitly restricts date filtering to AppHeader PeriodSelector only. Date range picker explicitly listed in Deferred Ideas for Phase 7/v2.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- ✅ `.planning/phases/05-transaction-list-redesign/05-04-SUMMARY.md` — FOUND
- ✅ Commit `f905494` — FOUND (docs(05-04): update TRNS-02 and TRNS-04 with descope rationale)
- ✅ `.planning/REQUIREMENTS.md` — TRNS-02 and TRNS-04 lines updated correctly
