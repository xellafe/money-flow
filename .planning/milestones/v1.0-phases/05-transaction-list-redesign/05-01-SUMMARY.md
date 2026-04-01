---
phase: 05-transaction-list-redesign
plan: "01"
subsystem: transactions
tags: [filters, sort-state, category-colors, badge, chip, components]
dependency_graph:
  requires: []
  provides:
    - useFilters sort state (sortColumn, sortDirection)
    - getCategoryColor + BADGE_PALETTE utility
    - CategoryBadge component
    - FilterChip component
    - src/components/transactions barrel export
  affects:
    - src/hooks/useFilters.js
    - src/utils/categoryColors.js
    - src/components/transactions/*
tech_stack:
  added: []
  patterns:
    - djb2 hash for deterministic color mapping
    - Named exports with JSDoc
    - Barrel export pattern for component directory
key_files:
  created:
    - src/utils/categoryColors.js
    - src/components/transactions/CategoryBadge.jsx
    - src/components/transactions/FilterChip.jsx
    - src/components/transactions/index.js
  modified:
    - src/hooks/useFilters.js
decisions:
  - "sortColumn defaults to 'date', sortDirection defaults to 'desc' — newest first per CONTEXT.md Decision B"
  - "djb2 hash % 10 for deterministic color — same category always same pastel badge"
  - "Full Tailwind class strings in BADGE_PALETTE — required for Tailwind JIT purge detection"
  - "CategoryBadge clickable via onClick prop — dual-mode (button vs span) per UI-SPEC"
  - "FilterChip readOnly prop + !onDismiss guard — both paths render read-only chip"
metrics:
  duration: "10m"
  completed: "2026-03-19"
  tasks: 3
  files: 5
requirements: [TRNS-07]
---

# Phase 5 Plan 01: Foundation — Sort State, Category Colors, Sub-components Summary

Phase 5 foundation: extended useFilters with sort state (sortColumn/sortDirection), created deterministic hash-based category color utility, and built reusable CategoryBadge + FilterChip components as building blocks for Plans 02-03.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Extend useFilters with sort state | a40a9f6 | src/hooks/useFilters.js |
| 2 | Create categoryColors utility | 1289ec3 | src/utils/categoryColors.js |
| 3 | Create CategoryBadge, FilterChip, barrel export | b0d9ffd | src/components/transactions/{CategoryBadge.jsx,FilterChip.jsx,index.js} |

## Decisions Made

1. **sortColumn defaults to 'date', sortDirection to 'desc'** — Newest-first per CONTEXT.md Decision B; pagination reset useEffect includes both sort vars in deps so page resets on sort change.

2. **djb2 hash algorithm for color mapping** — Deterministic: same category name → same color on every call, across sessions, across renders. `Math.abs(hash) % 10` maps into 10-slot BADGE_PALETTE.

3. **Full Tailwind class strings in BADGE_PALETTE** — Dynamic interpolation (e.g. `bg-${color}-100`) would be purged by Tailwind JIT. All 10 bg/text pairs stored as complete strings.

4. **CategoryBadge dual-mode (button/span)** — `onClick` prop switches render from `<span>` to `<button type="button">` with hover:opacity-80 and full aria-label. No onClick → read-only span.

5. **FilterChip readOnly + !onDismiss guard** — Either `readOnly={true}` or missing `onDismiss` renders read-only opacity-75 chip. Dismissible variant renders × button with hover:text-blue-900/hover:bg-blue-200.

## Verification

- ✅ Lint: exit 0 on all 5 modified/created files
- ✅ Build: exit 0 — Tailwind JIT includes all badge color classes (63.80 kB CSS)
- ✅ getCategoryColor determinism: `getCategoryColor('Food')` returns same `{bg, text}` every call
- ✅ BADGE_PALETTE length: 10 entries

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] src/hooks/useFilters.js — modified with sortColumn, sortDirection (verified lines 18-25, 45-46)
- [x] src/utils/categoryColors.js — created, determinism verified via node -e
- [x] src/components/transactions/CategoryBadge.jsx — created with getCategoryColor import, Tag size={12}
- [x] src/components/transactions/FilterChip.jsx — created with X size={12}, readOnly handling
- [x] src/components/transactions/index.js — barrel exports CategoryBadge and FilterChip
- [x] Commits: a40a9f6, 1289ec3, b0d9ffd
