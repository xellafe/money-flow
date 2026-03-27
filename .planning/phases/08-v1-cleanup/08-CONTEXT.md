# Phase 8: v1.0 Cleanup - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all accumulated tech debt from the v1.0 milestone audit. No new features. Scope is exactly the 5 INFO/LOW items identified in `v1.0-MILESTONE-AUDIT.md`:

1. Add `cursor-pointer` to both buttons in `SettingsView.jsx`
2. Remove dead state from `useFilters` (3 pairs) and `useModals` (1 pair)
3. Simplify `selectedYear === null` dead code branches in `App.jsx`
4. Normalize `AddTransactionModal` import to named barrel pattern
5. Fix REQUIREMENTS.md documentation: FOUND-04 traceability table + FOUND-11 closure

</domain>

<decisions>
## Implementation Decisions

### Dead state removal (useFilters / useModals)
- **Full removal**: delete both the `useState` declarations and the return object entries — not just the return entries
- Affected in `useFilters.js`: `dashboardTypeFilter`/`setDashboardTypeFilter`, `expandedCategory`/`setExpandedCategory`, `showCategoryPercentage`/`setShowCategoryPercentage`
- Affected in `useModals.js`: `openDropdown`/`setOpenDropdown`
- **Verification step required**: grep `src/` for each identifier before deleting to confirm zero external consumers (belt-and-suspenders, audit already confirmed no consumers)
- **Update JSDoc** in both hooks to reflect the cleaned-up return signature after removal

### selectedYear === null dead branches
- **Simplify**: remove all `selectedYear !== null` ternary guards — always filter directly by `selectedYear`
- Applies to all 4 locations in `App.jsx`: `stats` useMemo (lines ~157, ~217), `availableMonths` useMemo (line ~357), and the `handleSelectMonth` guard (line ~375)
- Do NOT restore "Tutti gli anni" feature — that is out of scope for this cleanup phase
- `selectedYear` is always a number (initialized to `new Date().getFullYear()` in `useFilters`, never set to null via any UI path)

### AddTransactionModal import normalization
- Change: `import ModalShell from '../ui/ModalShell'` → `import { ModalShell } from '../ui'`
- This matches the named barrel pattern used by all other Phase 6 modals

### REQUIREMENTS.md documentation closure
- **FOUND-11**: tick `[ ]` → `[x]` and add an inline note explaining that the Electron runtime backup (`backupDataRef` + `electronAPI.onRequestBackupData` in `useTransactionData.js`) satisfies the data-safety spirit; the dev-process refactoring intent is moot with all 7 phases complete
- **FOUND-04**: fix the traceability table row — change status from "Pending" to "Complete" (checkbox is already `[x]`, implementation was verified in Phase 1; table was simply never updated)

### Claude's Discretion
- Exact placement and wording of the FOUND-11 inline annotation
- Whether to update `STATE.md` to reflect Phase 8 closure (standard GSD practice — Claude decides)

</decisions>

<specifics>
## Specific Ideas

- The cursor-pointer fix is the simplest possible change: add one class to two `className` strings in SettingsView
- For the `selectedYear !== null` simplification: replace `selectedYear !== null ? transactions.filter(t => getYear(t) === selectedYear) : [...transactions]` with just `transactions.filter(t => getYear(t) === selectedYear)` — the else branch was always dead
- All 5 items can logically go into a single plan (08-01-PLAN.md) as they're small, independent, same-file-or-nearby changes

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit source of truth
- `.planning/v1.0-MILESTONE-AUDIT.md` — Complete audit findings: exact file locations, line references, and recommended fixes for all 5 tech debt items

### Requirements documentation
- `.planning/REQUIREMENTS.md` — FOUND-04 and FOUND-11 entries that need to be updated; traceability table at the bottom

### Files to be modified
- `src/views/SettingsView.jsx` — cursor-pointer fix (2 buttons)
- `src/hooks/useFilters.js` — remove 3 dead state pairs
- `src/hooks/useModals.js` — remove 1 dead state pair
- `src/App.jsx` — remove selectedYear === null dead branches (4 locations)
- `src/components/modals/AddTransactionModal.jsx` — normalize import
- `.planning/REQUIREMENTS.md` — FOUND-04 + FOUND-11 documentation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/index.js` barrel — already exports `ModalShell` as a named export; `AddTransactionModal` just needs to consume it instead of the direct path

### Established Patterns
- Named barrel imports: `import { X } from '../ui'` — used by all Phase 6 modals (e.g., `ImportWizard`, `CategoryManager`, `ConfirmModal`)
- `cursor-pointer` class: already present on `AppHeader` buttons, `Sidebar` nav items, `TransactionRow` actions — SettingsView buttons are the sole outlier
- Hook return objects in `useFilters` and `useModals` use paired exports (`foo, setFoo`) — removal should be symmetric

### Integration Points
- `App.jsx` destructures from `useFilters({ years })` — the destructuring already omits the 3 dead state pairs (lines 85-94), so removing from the hook return won't break App.jsx
- Same for `useModals` — `openDropdown` is not destructured in App.jsx
- The `selectedYear` simplification touches only `App.jsx` internals (useMemo and useCallback) — no child components receive a nullable year today

</code_context>

<deferred>
## Deferred Ideas

- "Tutti gli anni" (All years) period selector — restoring a nullable year + UI reset control would be a feature addition, not cleanup. Belongs in v2 backlog.
- Nyquist compliance for phases 1-4 and 7 — `/gsd-validate-phase N` per the audit recommendation; separate from this cleanup.

</deferred>

---

*Phase: 08-v1-cleanup*
*Context gathered: 2026-03-27*
