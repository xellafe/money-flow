# Phase 7: UX Polish — Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply final UX polish across all views: redesign Toast notifications with Framer Motion animation, add "Aggiungi transazione" button to AppHeader (opens a ModalShell modal), create empty state for DashboardView when no data, add skeleton loading to TransactionsView, and ensure hover states + pointer cursors are consistent across all interactive elements.

**Out of scope:** New data features, Settings view content, responsive breakpoints, bulk operations.

</domain>

<decisions>
## Implementation Decisions

### A. Toast Notifications (UX-04)

- **Position:** Bottom-right corner — `fixed bottom-6 right-6 z-50`
- **Enter animation:** Slide up from bottom + fade in — `y: 20px → 0` + `opacity: 0 → 1`, **300ms** ease-out (UX-04 spec)
- **Exit animation:** Reverse — `y: 0 → 20px` + `opacity: 1 → 0`, 200ms ease-in
- **Stacking behavior:** Single toast at a time — new toast replaces current (use `AnimatePresence mode="wait"` keyed by message/timestamp)
- **Auto-dismiss:** 3 seconds (preserve existing behavior)
- **Styling:** Tailwind utilities replacing old `.toast` CSS class:
  - Success: `bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800`
  - Success icon: `text-green-500` (Check)
  - Error: same container + `text-red-500` icon (AlertCircle)
  - Close button: `ml-auto text-gray-400 hover:text-gray-600`
- **Implementation:** Wrap `{toast && <Toast ... />}` in App.jsx with `<AnimatePresence mode="wait">`, pass `key={toast.message}` for replacement trigger

### B. "Aggiungi transazione" Button (UX-05)

- **Location:** AppHeader — always visible regardless of active view
- **Style:** Primary — `bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2`
- **Icon:** `<Plus size={16} />` from Lucide (before text label)
- **Label:** "Aggiungi" (short form — fits header without overflow)
- **What it opens:** A new `AddTransactionModal` using `ModalShell size="sm"`
- **Modal fields (minimal set):**
  1. **Data** — date input (`type="date"`, defaults to today)
  2. **Importo** — number input (positive = income, negative = expense; placeholder "es. -45.50")
  3. **Descrizione** — text input (required)
  4. **Categoria** — `<select>` from existing `categories` array
- **Modal title:** "Nuova transazione"
- **Footer:** Secondary "Annulla" + Primary "Aggiungi" (disabled if description empty)
- **On confirm:** calls `addManualTransaction({ date, amount: parseFloat(amount), description, category })` — existing callback from `useTransactionData`
- **State wiring:** Add `showAddTransaction` / `setShowAddTransaction` to `useModals` hook (was removed in Phase 5). Wire in App.jsx with `<AnimatePresence>` wrapper (same pattern as other modals).
- **File location:** `src/components/modals/AddTransactionModal.jsx`

### C. Empty Dashboard (UX-03)

- **Trigger:** `transactions.length === 0` passed as prop to DashboardView (or derived inside)
- **Position:** Centered in the main content area — replaces all chart cards when no data
- **Layout:**
  ```
  [centered flex col, gap-4, py-16]
    Wallet icon (size=64, text-gray-300)        ← from Lucide, "financial theme"
    <h2> "Nessuna transazione" (text-xl font-semibold text-gray-700)
    <p> "Importa un file Excel o CSV per iniziare a monitorare le tue finanze."
        (text-gray-500 text-sm max-w-xs text-center)
    <button> "Importa transazioni" (primary style, triggers file picker)
  ```
- **CTA behavior:** Clicking "Importa transazioni" triggers the hidden `<input type="file" id="file-input">` already present in App.jsx (added in Phase 5 for TransactionsView empty state). Use `document.getElementById('file-input').click()`.
- **DashboardView prop:** Add `hasTransactions: boolean` prop (derived from `transactions.length > 0` in App.jsx). When `false`, render `<DashboardEmptyState onImport={...} />` instead of stat cards + charts.

### D. Transaction List Skeleton (UX-02)

- **Trigger:** Show skeleton when TransactionsView first mounts — use same `isLoading` pattern as DashboardView (300ms minimum display, then show real data)
- **Row count:** 5 skeleton rows
- **Row structure:** Matches actual `TransactionRow` layout:
  ```
  [flex row, items-center, px-4 py-3, border-b]
    left col (flex-1):
      animate-pulse bg-gray-200 rounded h-3 w-24 mb-1   ← date placeholder
      animate-pulse bg-gray-200 rounded h-4 w-48         ← description placeholder
      animate-pulse bg-gray-200 rounded h-5 w-20 mt-1    ← category badge placeholder
    right col (amount area):
      animate-pulse bg-gray-200 rounded h-4 w-16
  ```
- **Animation:** `animate-pulse` (CSS Tailwind utility — same as `SkeletonStatCard`)
- **Component:** Create `src/components/transactions/SkeletonTransactionRow.jsx` — renders one skeleton row. Import 5x in `TransactionsView` or in a new `SkeletonTransactionList` wrapper.
- **State management:** Add `isLoading` state to `TransactionsView` (local, not hook) — `true` on mount, `false` after 300ms timeout (mirrors DashboardView pattern).

### E. Hover States & Pointer Cursor (UX-01 + UX-06)

Already partially implemented in Phase 5/6. Phase 7 completes the sweep:

- **Tailwind class audit:** Every `<button>`, `<a>`, and clickable `<div>` that doesn't already have `cursor-pointer` should get it. Rows with `onClick` → add `cursor-pointer`.
- **Hover transitions:** `transition-colors duration-150` on all interactive elements that don't have it (review AppHeader, Sidebar nav items, stat cards).
- **Sidebar nav items:** Ensure active state uses `bg-brand-50 text-brand-600`, inactive uses `hover:bg-gray-100 hover:text-gray-700` (verify Phase 3 implementation).
- **Approach:** Global sweep + targeted fixes — not a global CSS rule (Tailwind utility approach is explicit per-element).

### F. Page Transitions (UX-07)

- **Animation type:** Fade only (`opacity: 0 → 1`, 150ms ease-out) — no slide (views are not spatially ordered)
- **Implementation:** Wrap the view-rendering block in App.jsx with `<AnimatePresence mode="wait">` and `<motion.div key={view} ...>`:
  ```jsx
  <AnimatePresence mode="wait">
    <motion.div
      key={view}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.15 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {view === 'dashboard' && <DashboardView ... />}
      {view === 'transactions' && <TransactionsView ... />}
      {view === 'settings' && <SettingsView ... />}
    </motion.div>
  </AnimatePresence>
  ```
- **Note:** `AnimatePresence` is already imported in App.jsx (added in Phase 6 for modals). No new import needed.

### Claude's Discretion

- Exact `addManualTransaction` signature verification before implementing AddTransactionModal
- Whether to add `showAddTransaction` to existing `useModals` hook or keep it as local state in App.jsx
- Date input formatting (ISO string vs locale display)
- Whether `SkeletonTransactionList` should be a wrapper component or inline 5× render in TransactionsView

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — UX-01 through UX-07 (all Phase 7 requirements)

### Roadmap & State
- `.planning/ROADMAP.md` — Phase 7 goal and success criteria
- `.planning/STATE.md` — Accumulated decisions (especially Phase 5/6 patterns)

### Prior phase context (patterns to follow)
- `.planning/phases/06-modals-redesign/06-CONTEXT.md` — ModalShell API, button styles, AnimatePresence pattern
- `.planning/phases/03-navigation-layout/03-CONTEXT.md` — Animation standard (200ms), Framer Motion install

### Files to read before implementing
- `src/App.jsx` — modal wiring, AnimatePresence for modals, file-input hidden element, view routing
- `src/components/Toast.jsx` — current toast implementation to replace with Tailwind + animation
- `src/hooks/useModals.js` — where showAddTransaction state should be added
- `src/hooks/useTransactionData.js` — addManualTransaction callback signature
- `src/hooks/useToast.js` — toast state management
- `src/components/ui/ModalShell.jsx` — for AddTransactionModal wrapper
- `src/components/layout/AppHeader.jsx` — where "Aggiungi" button goes
- `src/views/DashboardView.jsx` — where empty state condition and hasTransactions prop go
- `src/views/TransactionsView.jsx` — where skeleton loading state goes
- `src/components/dashboard/SkeletonStatCard.jsx` — animate-pulse pattern to replicate
- `src/components/transactions/TransactionRow.jsx` — layout to match in SkeletonTransactionRow

</canonical_refs>

<specifics>
## Specific Implementation Notes

- **AnimatePresence already in App.jsx** — Phase 6 added it for modals. Page transition just needs a new `<AnimatePresence mode="wait">` wrapping the view block (separate from the modal wrappers).
- **file-input already exists** — Phase 5 added `<input type="file" id="file-input">` unconditionally in App.jsx. Empty dashboard CTA can call `document.getElementById('file-input').click()` directly.
- **addManualTransaction** — Was present in `useTransactionData` but removed from App.jsx destructuring in Phase 5. Must be re-added to destructuring when building AddTransactionModal.
- **Toast replacement** — Old `.toast` and `.toast.success/.error` classes in `src/index.css` (or `App.css`) should be removed once Toast.jsx is fully migrated to Tailwind.
- **Wallet icon** — Lucide `Wallet` exists in `lucide-react@0.563.0`. Verify before using; fallback is `PiggyBank`.

</specifics>

<deferred>
## Deferred Ideas

- Date range picker in TransactionsView filter bar (noted in Phase 5 deferred)
- Moving SyncSettings / CategoryManager inline into SettingsView (noted in Phase 6 deferred)
- Keyboard shortcuts (Cmd+N for new transaction, etc.) — mentioned in Phase 7 roadmap as "keyboard shortcuts" but not in UX-01 through UX-07 requirements; treat as v2
- Responsive modal sizing for small Electron window widths (Phase 6 deferred)
- Balance card in transaction view (Phase 4 deferred)
- "Aggiungi transazione" button in Sidebar (chose header-only for simplicity)

</deferred>

---

*Phase: 07-ux-polish*
*Context gathered: 2026-03-19 via /gsd-discuss-phase 7*
