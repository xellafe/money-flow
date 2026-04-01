# Deferred Items — Phase 08-v1-cleanup

## Out of Scope: Pre-existing selectedYear !== null patterns

**Discovered during:** Plan 08-01, Task 1

These patterns exist in files not in the plan's `files_modified` list and are pre-existing code not introduced by this cleanup pass.

| File | Line | Pattern | Note |
|------|------|---------|------|
| `src/components/dashboard/AreaChartCard.jsx` | 63 | `selectedYear !== null ? ... : 'Andamento'` | Dead else-branch since selectedYear is always number |
| `src/components/transactions/TransactionFilterBar.jsx` | 73 | `if (selectedYear !== null)` | Always-true condition since selectedYear is always number |

**Recommended action (v1.1):** Simplify these two occurrences in a future cleanup pass.
