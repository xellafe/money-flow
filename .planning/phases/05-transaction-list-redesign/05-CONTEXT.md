# Phase 5 Context: Transaction List Redesign

## Phase Goal
Extract the transaction list from App.jsx into a dedicated `TransactionList` component and redesign it with Tailwind v4 — clean filter bar, sortable sticky header, color-coded category badges, inline editing, pagination, and an empty state. All styling uses Tailwind utilities (no new custom CSS classes).

## Requirements Covered
TRNS-01, TRNS-02, TRNS-03, TRNS-04, TRNS-05, TRNS-06, TRNS-07, TRNS-08

---

## Decisions

### A. Table / Row Structure

- **Layout:** Styled flex/grid rows — NOT a semantic `<table>` element (easier to animate with Framer Motion)
- **Header row:** Sticky column labels above the list (Data | Descrizione | Categoria | Importo) — fixed while the list scrolls
- **Row layout:** Date + Description stacked (Date small/muted above, Description prominent below), Category badge below the description, Amount right-aligned, Delete button far right
- **Delete button:** Always visible — trash icon, far right of each row (no hover-reveal)

### B. Sorting

- **Default sort:** Date descending (newest first) — applied on mount
- **Sort toggle cycle (3-state):** First click → ASC · Second click → DESC · Third click → reset to default (date DESC)
- **Sort state location:** Add `sortColumn` + `sortDirection` to `useFilters` hook (consistent with `currentPage` pattern already there)
- **Sort resets pagination:** Changing sort column or direction resets `currentPage` to 1

### C. Filter Bar

- **Date filtering:** Reuse AppHeader period selector only — no duplicate date filter inside the transaction bar
- **Active filter chips:** Show dismissible chips below the filter controls for any active filter (e.g., "Categoria: Food ×", "Anno: 2025 ×") — clicking × clears that filter
- **Category dropdown:** Styled native `<select>` with Tailwind — no Radix UI custom dropdown
- **Search debounce:** 200ms — smooth without excessive re-renders; internal debounced value passed to filter logic

### D. Category Badge Colors

- **Color assignment:** Hash-based auto-assign from a fixed palette — same category name always gets the same color, no config needed
- **Palette size:** 8–10 distinct colors
- **Badge style:** Pastel/muted background with matching darker text (e.g., soft teal bg + dark teal text)
- **Badge content:** Tag icon (Lucide) + category name — keeps visual consistency with existing category buttons

---

## Deferred Ideas

- User-configurable color per category (too complex for Phase 5)
- Date range picker (from/to) in the filter bar — deferred to Phase 7 or v2
- Balance card in transaction view (noted in Phase 4 deferred list)
- Bulk select + batch delete/re-categorize (v2 UX2-03)
- `note` field display in expanded row

---

## Code Context

### Existing state in `useFilters` (to extend)
- `searchQuery` / `setSearchQuery` — text search
- `transactionsCategoryFilter` / `setTransactionsCategoryFilter` — single category (null = all)
- `currentPage` / `setCurrentPage` — pagination (auto-resets on filter change via effect)
- `selectedMonth` / `setSelectedMonth` — from AppHeader period selector
- `selectedYear` / `setSelectedYear` — from AppHeader period selector
- **New to add:** `sortColumn` (default `'date'`) + `sortDirection` (default `'desc'`)

### Existing inline editing state in `useModals`
- `editingTx` / `setEditingTx` — which row has category select open
- `editingDescription` / `setEditingDescription` — which row has description input open
- `newDescription` / `setNewDescription` — controlled value for description input

### Existing callbacks in `useTransactionData`
- `updateTxCategory(id, category)` — updates category + sets categoryResolution
- `updateTxDescription(id, description)` — updates description, shows toast
- `deleteTransaction(id)` — removes transaction

### Existing constants
- `ITEMS_PER_PAGE = 50` in `src/constants/index.js`

### Existing data shape
```js
{
  id: string,
  bankId: string | null,
  date: string,         // ISO string
  description: string,  // editable inline
  amount: number,       // positive = income, negative = expense
  category: string,     // editable inline
  note: string,
}
```

### Relevant filtered data
- `stats.filtered` (computed in App.jsx useMemo) — already filtered by year/month/search/category — Phase 5 component receives this as prop (or re-derives using hooks directly)

### Design tokens available
- `--color-income-500: #059669` (green for positive amounts)
- `--color-expense-500: #f43f5e` (red for negative amounts)
- `--color-brand-500/600` (blue for interactive elements)
- `--color-gray-*` scale (50–900)

### Framer Motion
- Already installed (used in Sidebar collapse animation)
- Can use `AnimatePresence` + `motion.div` for row enter/exit animations (optional)

### No Recharts dependency
- Phase 5 is pure list/table — no chart components needed

### Phase 4 cross-filter integration
- `transactionsCategoryFilter` is already set by DonutChart click in Phase 4
- Phase 5 TransactionList must visually reflect this (show active chip for it)
