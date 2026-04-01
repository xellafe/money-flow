# Phase 5: Transaction List Redesign - Research

**Researched:** 2026-03-19
**Domain:** React 19 list component, Tailwind v4 layout, Framer Motion v12, inline editing patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**A. Table / Row Structure**
- Layout: Styled flex/grid rows — NOT a semantic `<table>` element (easier to animate with Framer Motion)
- Header row: Sticky column labels above the list (Data | Descrizione | Categoria | Importo) — fixed while the list scrolls
- Row layout: Date + Description stacked (Date small/muted above, Description prominent below), Category badge below the description, Amount right-aligned, Delete button far right
- Delete button: Always visible — trash icon, far right of each row (no hover-reveal)

**B. Sorting**
- Default sort: Date descending (newest first) — applied on mount
- Sort toggle cycle (3-state): First click → ASC · Second click → DESC · Third click → reset to default (date DESC)
- Sort state location: Add `sortColumn` + `sortDirection` to `useFilters` hook
- Sort resets pagination: Changing sort column or direction resets `currentPage` to 1

**C. Filter Bar**
- Date filtering: Reuse AppHeader period selector only — no duplicate date filter inside the transaction bar
- Active filter chips: Show dismissible chips below the filter controls for any active filter
- Category dropdown: Styled native `<select>` with Tailwind — no Radix UI custom dropdown
- Search debounce: 200ms — useEffect + clearTimeout pattern; internal debounced value passed to filter logic

**D. Category Badge Colors**
- Color assignment: Hash-based auto-assign from a fixed palette — same category name always gets the same color
- Palette size: 8–10 distinct colors
- Badge style: Pastel/muted background with matching darker text
- Badge content: Tag icon (Lucide) + category name

### Claude's Discretion
*(No items marked as discretionary — all key decisions are locked)*

### Deferred Ideas (OUT OF SCOPE)
- User-configurable color per category
- Date range picker (from/to) in the filter bar
- Balance card in transaction view
- Bulk select + batch delete/re-categorize (v2 UX2-03)
- `note` field display in expanded row
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRNS-01 | Tabella transazioni con colonne: Data, Descrizione, Categoria, Importo | Flex/grid row layout, sticky header pattern, component extraction from App.jsx |
| TRNS-02 | Sorting cliccabile su ogni colonna (data, importo, categoria) | 3-state sort toggle in useFilters, sort useMemo in TransactionsView |
| TRNS-03 | Paginazione pulita con contatore "X-Y di Z transazioni" | Existing ITEMS_PER_PAGE=50 + currentPage in useFilters, redesign pagination UI |
| TRNS-04 | Barra filtri: ricerca testo inline, filtro categoria dropdown | 200ms useEffect debounce, native select, dismissible chips from filter state |
| TRNS-05 | Inline editing: click su descrizione o categoria per editare direttamente | Re-style existing editingTx/editingDescription state from useModals; extract to TransactionRow |
| TRNS-06 | Importo colorato (verde entrate, rosso uscite) con segno esplicito | text-income-500 / text-expense-500 design tokens already in @theme |
| TRNS-07 | Badge colorato per categoria su ogni riga | Hash-based getCategoryColor() utility, BADGE_PALETTE constant, CategoryBadge component |
| TRNS-08 | Empty state quando non ci sono transazioni (illustrazione + CTA importa/aggiungi) | motion.div with AnimatePresence, SearchX or InboxIcon from Lucide |
</phase_requirements>

---

## Summary

Phase 5 extracts the existing transaction list from App.jsx (lines 613–901) into a dedicated `TransactionsView` component and redesigns it with Tailwind v4 utilities. The existing logic is already functional — the work is structural extraction, UI redesign, and adding sort + debounce + filter chips.

The primary technical risk is the **sort/filter data pipeline**: `stats.filtered` from App.jsx's useMemo is pre-filtered but unsorted. TransactionsView must apply sort as a separate `useMemo` on top of `stats.filtered`, not re-implement filtering. This keeps App.jsx as the single source of filtered data.

The second risk is **sticky header in a scrollable container**: requires the scrollable container to have a fixed/max height, and the sticky element's background must be opaque (otherwise rows bleed through). In Tailwind v4, `sticky top-0 z-10 bg-white` works identically to v3 — the CSS primitives haven't changed.

**Primary recommendation:** Extract TransactionsView from App.jsx first (as a thin wrapper), then progressively redesign — this preserves working state at each step and is consistent with how Phase 3/4 views were built.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component rendering, hooks | Already installed |
| Tailwind CSS v4 | 4.2.1 | All utility styling | Project standard — no custom CSS |
| Framer Motion | 12.38.0 | Row enter/exit animations | Already installed, used in Sidebar |
| Lucide React | 0.563.0 | Icons (Tag, Trash2, ChevronUp/Down, Search, X, ArrowUpDown) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Built-in `useEffect` | React 19 | 200ms search debounce | Already in React — no external debounce library needed |
| `useMemo` | React 19 | Sort + paginate filtered array | Avoids resort on every render |

### No New Packages Needed
All required functionality is covered by existing installed packages. Do NOT add:
- `lodash.debounce` — `useEffect + clearTimeout` handles 200ms debounce cleanly
- `react-window` / `@tanstack/react-virtual` — 50 items requires no virtualization
- Radix UI Select — native `<select>` chosen (locked decision)

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── views/
│   ├── DashboardView.jsx       # existing
│   ├── SettingsView.jsx        # existing
│   └── TransactionsView.jsx    # NEW — Phase 5 root view
├── components/
│   └── transactions/           # NEW — Phase 5 sub-components
│       ├── TransactionRow.jsx
│       ├── TransactionFilterBar.jsx
│       ├── CategoryBadge.jsx
│       └── FilterChip.jsx
└── utils/
    └── categoryColors.js       # NEW — hash-based color utility
```

### Pattern 1: View Component Structure (matches DashboardView pattern)
**What:** Top-level view exports a named function, receives data/callbacks as props from App.jsx, composes sub-components.
**When to use:** Every time a new view is extracted from App.jsx.

```jsx
// src/views/TransactionsView.jsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { TransactionFilterBar } from '../components/transactions/TransactionFilterBar';
import { ITEMS_PER_PAGE } from '../constants';

/**
 * Transaction list view: filter bar, sortable header, paginated rows, empty state.
 * @param {{
 *   transactions: Array,          // stats.filtered from App.jsx (pre-filtered by year/month/search/category)
 *   allCategories: string[],       // stats.allCategories
 *   categories: Object,            // from useCategories
 *   searchQuery: string,
 *   setSearchQuery: Function,
 *   transactionsCategoryFilter: string|null,
 *   setTransactionsCategoryFilter: Function,
 *   sortColumn: string,
 *   sortDirection: string,
 *   setSortColumn: Function,
 *   setSortDirection: Function,
 *   currentPage: number,
 *   setCurrentPage: Function,
 *   selectedMonth: number|null,
 *   selectedYear: number|null,
 *   editingTx: string|null,
 *   setEditingTx: Function,
 *   editingDescription: string|null,
 *   setEditingDescription: Function,
 *   newDescription: string,
 *   setNewDescription: Function,
 *   updateTxCategory: Function,
 *   updateTxDescription: Function,
 *   setConfirmDelete: Function,
 * }} props
 */
export function TransactionsView({ ... }) {
  // Internal debounced search (200ms)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  // NOTE: stats.filtered in App.jsx uses searchQuery directly — see Pitfall 3

  // Sort + paginate
  const sorted = useMemo(() => {
    const arr = [...transactions];
    arr.sort((a, b) => {
      let va, vb;
      if (sortColumn === 'date') { va = new Date(a.date); vb = new Date(b.date); }
      else if (sortColumn === 'amount') { va = a.amount; vb = b.amount; }
      else if (sortColumn === 'category') { va = a.category; vb = b.category; }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [transactions, sortColumn, sortDirection]);

  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [sorted, currentPage]
  );

  return (
    <div className="flex flex-col h-full">
      <TransactionFilterBar ... />
      {/* Sticky header + scroll container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Sticky header row */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 ...">
          {/* column headers with sort indicators */}
        </div>
        {/* Rows */}
        <AnimatePresence initial={false} mode="popLayout">
          {paginated.map(tx => <TransactionRow key={tx.id} tx={tx} ... />)}
        </AnimatePresence>
        {/* Empty state */}
        {transactions.length === 0 && <EmptyState />}
      </div>
      {/* Pagination */}
    </div>
  );
}
```

### Pattern 2: 200ms Search Debounce (useEffect + clearTimeout)
**What:** The component holds a `debouncedQuery` state that trails `searchQuery` by 200ms. The filter logic in App.jsx's stats useMemo uses `searchQuery` (immediate) — see Pitfall 3.
**When to use:** Any search input that drives expensive computations.

```jsx
// In TransactionsView or TransactionFilterBar
const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 200);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Pass debouncedQuery to filter function / parent setter
// For Phase 5: call setSearchQuery(debouncedQuery) after delay
// OR keep immediate searchQuery in input, only pass debounced to stats useMemo
```

> **Critical implementation note:** App.jsx's `stats` useMemo currently uses `searchQuery` directly (line 338). Two options:
> 1. **Simple approach:** Move debounce to where `setSearchQuery` is called — the input calls a local debounced setter that then calls `setSearchQuery`. The stats useMemo naturally gets debounced input.
> 2. **Alternative:** Keep `searchQuery` as immediate UI state, add `debouncedSearchQuery` to useFilters, use the debounced one in stats useMemo.
>
> **Recommended: Option 1** — debounce at the input call site. TransactionFilterBar maintains a local `inputValue` state, debounces, then calls `setSearchQuery`. Stats useMemo uses `searchQuery` (the debounced version).

### Pattern 3: Hash-Based Category Color Assignment
**What:** Deterministic string hash → fixed palette index → stable color on every render, no state or configuration needed.
**When to use:** Any time a category name needs consistent color assignment.

```js
// src/utils/categoryColors.js

/** Pastel badge palette: bg color + text color pairs */
export const BADGE_PALETTE = [
  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100',  text: 'text-amber-700'   },
  { bg: 'bg-rose-100',   text: 'text-rose-700'    },
  { bg: 'bg-violet-100', text: 'text-violet-700'  },
  { bg: 'bg-pink-100',   text: 'text-pink-700'    },
  { bg: 'bg-cyan-100',   text: 'text-cyan-700'    },
  { bg: 'bg-lime-100',   text: 'text-lime-700'    },
  { bg: 'bg-orange-100', text: 'text-orange-700'  },
  { bg: 'bg-indigo-100', text: 'text-indigo-700'  },
];

/**
 * Returns a stable {bg, text} Tailwind class pair for a category name.
 * Uses djb2 hash % palette length. Same name → same color always.
 * @param {string} name - Category name
 * @returns {{ bg: string, text: string }}
 */
export function getCategoryColor(name) {
  if (!name) return BADGE_PALETTE[0];
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    // djb2: hash * 33 XOR char code
    hash = ((hash << 5) + hash) ^ name.charCodeAt(i);
  }
  return BADGE_PALETTE[Math.abs(hash) % BADGE_PALETTE.length];
}
```

> **Why NOT inline styles:** Tailwind v4 JIT requires class names to be in source (no dynamic string concatenation). The `BADGE_PALETTE` approach uses complete class name strings — JIT scans and includes them. Using `bg-[${color}]` or template literals with partial class names will NOT be included by JIT.

### Pattern 4: 3-State Sort Toggle
**What:** Column header click cycles ASC → DESC → reset-to-default. State lives in `useFilters`.
**When to use:** Any table with multi-column sorting where "back to default" is needed.

```js
// In useFilters.js — add to existing state:
const [sortColumn, setSortColumn] = useState('date');
const [sortDirection, setSortDirection] = useState('desc');

// Return: sortColumn, setSortColumn, sortDirection, setSortDirection

// In TransactionsView — sort toggle handler:
const handleSort = useCallback((column) => {
  if (column !== sortColumn) {
    // New column: start at ASC
    setSortColumn(column);
    setSortDirection('asc');
  } else if (sortDirection === 'asc') {
    // Same column ASC → DESC
    setSortDirection('desc');
  } else {
    // Same column DESC → reset to default
    setSortColumn('date');
    setSortDirection('desc');
  }
  setCurrentPage(1); // always reset pagination on sort change
}, [sortColumn, sortDirection, setSortColumn, setSortDirection, setCurrentPage]);
```

> **Reset pagination:** The existing useFilters useEffect already resets `currentPage` when filters change. Sort changes also need to reset — either add `sortColumn, sortDirection` to the existing useEffect deps, or call `setCurrentPage(1)` inside `handleSort`.

### Pattern 5: Dismissible Filter Chips (derived state)
**What:** Active filter chips are derived from filter state — no separate "chips state". Each chip renders if its corresponding filter is active.
**When to use:** Anywhere filter state should be visually summarized.

```jsx
// In TransactionFilterBar or TransactionsView
const activeChips = useMemo(() => {
  const chips = [];
  if (transactionsCategoryFilter) {
    chips.push({
      key: 'category',
      label: `Categoria: ${transactionsCategoryFilter}`,
      onDismiss: () => setTransactionsCategoryFilter(null),
    });
  }
  if (searchQuery.trim()) {
    chips.push({
      key: 'search',
      label: `Ricerca: "${searchQuery}"`,
      onDismiss: () => setSearchQuery(''),
    });
  }
  // Note: year/month filters are controlled by AppHeader — show as read-only info chips
  if (selectedYear !== null) {
    chips.push({
      key: 'year',
      label: `Anno: ${selectedYear}`,
      onDismiss: null, // year managed by AppHeader, not dismissible here
    });
  }
  return chips;
}, [transactionsCategoryFilter, searchQuery, selectedYear, setTransactionsCategoryFilter, setSearchQuery]);

// Render:
{activeChips.map(chip => (
  <span key={chip.key}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-100 text-brand-700"
  >
    {chip.label}
    {chip.onDismiss && (
      <button onClick={chip.onDismiss} className="hover:text-brand-900">
        <X size={12} />
      </button>
    )}
  </span>
))}
```

### Pattern 6: Sticky Header in Scrollable Container (Tailwind v4)
**What:** Fixed header that stays visible as rows scroll beneath it.
**Critical requirements:**
1. The scroll container must be the `overflow-y-auto` element with a defined height
2. The sticky element must have `sticky top-0` + opaque background
3. Z-index must prevent rows from appearing over the header during scroll

```jsx
{/* OUTER: fills remaining view height */}
<div className="flex-1 overflow-y-auto min-h-0 relative">
  
  {/* STICKY HEADER — stays at top of scroll container */}
  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
    <div className="grid grid-cols-[1fr_2fr_1fr_auto] px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
      <SortableHeader column="date" label="Data" ... />
      <span>Descrizione</span>
      <SortableHeader column="category" label="Categoria" ... />
      <SortableHeader column="amount" label="Importo" ... />
    </div>
  </div>

  {/* ROWS — scroll under the header */}
  <div className="divide-y divide-gray-100">
    {paginated.map(tx => <TransactionRow key={tx.id} ... />)}
  </div>
</div>
```

> **Tailwind v4 note:** `sticky` utility is unchanged from v3 — maps to `position: sticky`. The `min-h-0` on flex children is critical in Tailwind to allow flex children to shrink below content size when using `overflow-y-auto`. Without `min-h-0`, the flex child will grow to content height and the overflow scroll will never trigger.

### Pattern 7: Row Enter/Exit Animation (Framer Motion v12)
**What:** Simple opacity + translate-y for row appearance/disappearance. Keep SIMPLE.
**When to use:** When filter changes cause rows to appear/disappear.

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Wrap list in AnimatePresence
<AnimatePresence initial={false} mode="popLayout">
  {paginated.map(tx => (
    <motion.div
      key={tx.id}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
    >
      <TransactionRow tx={tx} ... />
    </motion.div>
  ))}
</AnimatePresence>
```

> **Framer Motion v12 notes:**
> - `mode="popLayout"` removes exiting items from the flow immediately, preventing layout jank during page transitions
> - `layout` prop on rows allows smooth reordering when sort changes (animates position)
> - `initial={false}` on `AnimatePresence` skips entrance animation on first mount (good UX — don't animate initial data load)
> - Keep `duration: 0.15` — snappy, not distracting
> - **Do NOT animate `height`** — `height: 0 → 'auto'` animations require the `LayoutGroup` wrapper and cause layout jank on fast filter changes. Stick to opacity + y.

### Anti-Patterns to Avoid
- **Dynamic Tailwind class construction:** `className={`bg-${color}-100`}` — Tailwind JIT won't include this class. Use complete class name strings in BADGE_PALETTE.
- **Filtering in TransactionsView:** Don't re-implement year/month/search/category filtering. Receive `stats.filtered` from App.jsx props.
- **Semantic `<table>`:** Locked decision — use flex/grid. Table makes sticky header + Framer Motion row animations harder.
- **Debouncing `setSearchQuery` call itself:** If you debounce the call to `setSearchQuery`, the search input's controlled value will lag. Instead: maintain local `inputValue` in FilterBar → display `inputValue` immediately → debounced effect calls `setSearchQuery(inputValue)`.
- **Height animation on rows:** Causes layout thrash when many rows exit/enter simultaneously. Use opacity + transform only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| String debounce | Custom debounce class | `useEffect + clearTimeout` | React-native, cleanup handles unmount race conditions |
| Category color | User preference storage | `getCategoryColor()` hash function | Deterministic, zero config, stable across re-renders |
| Row animations | CSS keyframes in App.css | `motion.div` + `AnimatePresence` | Already installed, handles exit animations (CSS can't) |
| Sort icon state | Custom SVG + logic | `ChevronUp`/`ChevronDown`/`ArrowUpDown` from Lucide | Already installed |
| Virtualization | `react-window` integration | None (50 items) | Adds complexity for no measurable perf gain at 50 items |

**Key insight:** All complex behaviors (animations, icons, color tokens) have existing solutions in the already-installed stack. Phase 5 is primarily a **restructuring + styling** task, not a "add new capabilities" task.

---

## Common Pitfalls

### Pitfall 1: Sticky Header Fails (min-h-0 missing)
**What goes wrong:** Sticky header scrolls away with content instead of staying fixed.
**Why it happens:** The flex column container doesn't have `min-h-0`, so the overflow-y-auto child grows to full content height and never creates a scroll context.
**How to avoid:** Always add `min-h-0` to flex children that need `overflow-y-auto`.
```jsx
// WRONG:
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto"> {/* grows to content, never scrolls */}

// CORRECT:
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto min-h-0"> {/* shrinks to parent, scrolls */}
```
**Warning signs:** Page scrolls instead of list scrolling; sticky header disappears on scroll.

### Pitfall 2: Tailwind JIT Misses Dynamic Category Colors
**What goes wrong:** Category badges have no background/text color in production build.
**Why it happens:** Tailwind JIT scans source for class name strings. Dynamic concatenation like `bg-${color}-100` produces strings not present in source — JIT doesn't include them.
**How to avoid:** Use complete class name strings in `BADGE_PALETTE`. Never concatenate partial Tailwind class names.
**Warning signs:** Badges appear with transparent background in Electron production build but work fine in dev (if CSS is hot-reloaded from full source).

### Pitfall 3: Debounce Architecture — Where to Apply It
**What goes wrong:** Debouncing `setSearchQuery` causes the search input to visually lag (controlled input shows old value).
**Why it happens:** If `searchQuery` state updates are delayed, the `value={searchQuery}` on the input also delays, creating visible input lag.
**How to avoid:** Use a local uncontrolled `inputValue` in `TransactionFilterBar`:
```jsx
const [inputValue, setInputValue] = useState(searchQuery);

// Sync upward, debounced:
useEffect(() => {
  const t = setTimeout(() => setSearchQuery(inputValue), 200);
  return () => clearTimeout(t);
}, [inputValue, setSearchQuery]);

// Input uses local inputValue (instant response):
<input value={inputValue} onChange={e => setInputValue(e.target.value)} />
```
**Warning signs:** Search input feels "sticky" or characters appear with delay.

### Pitfall 4: Sort Pagination Not Reset
**What goes wrong:** After sorting, users see wrong page (e.g., page 3 of newly sorted results that only has 2 pages).
**Why it happens:** `currentPage` stays at previous value when sort changes.
**How to avoid:** Call `setCurrentPage(1)` inside `handleSort`. Also add `sortColumn, sortDirection` to useFilters' page-reset useEffect.
**Warning signs:** Pagination shows "151–200 di 120 movimenti" (impossible range).

### Pitfall 5: `onBlur` Race on Category Select
**What goes wrong:** Clicking a `<select>` option fires `onBlur` on the row before `onChange`, causing the select to close without saving.
**Why it happens:** `onBlur` fires when focus leaves the select element. On some browsers, clicking an option briefly moves focus away, triggering blur before change.
**How to avoid:** In `updateTxCategory`, the callback already calls `setEditingTx(null)` after saving. Don't call `setEditingTx(null)` in `onBlur` if `onChange` hasn't fired yet. Use `onBlur={() => setEditingTx(null)}` ONLY as a fallback for Escape/focus-away; `onChange` saves + closes.
**Warning signs:** Category edit closes without changing the value.

### Pitfall 6: AnimatePresence key Stability
**What goes wrong:** Rows animate in/out when they shouldn't (e.g., on sort).
**Why it happens:** If `key={tx.id}` is stable but rows reorder, `mode="popLayout"` with `layout` prop should handle reordering animation. But if keys are not stable (e.g., using array index), every re-sort looks like all rows exiting/entering.
**How to avoid:** Always use `key={tx.id}` (stable transaction ID), not array index. The `layout` prop on `motion.div` will smoothly animate position changes on sort.
**Warning signs:** All rows flash/fade when sort direction changes.

---

## Code Examples

Verified patterns from the existing codebase and React/Tailwind/Framer Motion docs:

### CategoryBadge Component
```jsx
// src/components/transactions/CategoryBadge.jsx
import { Tag } from 'lucide-react';
import { getCategoryColor } from '../../utils/categoryColors';

/**
 * Colored pill badge for transaction category.
 * Color is deterministic from category name (hash-based).
 * @param {{ category: string, onClick?: Function }} props
 */
export function CategoryBadge({ category, onClick }) {
  const { bg, text } = getCategoryColor(category);
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text} hover:opacity-80 transition-opacity duration-150`}
      title={onClick ? 'Clicca per modificare categoria' : undefined}
    >
      <Tag size={10} />
      {category}
    </button>
  );
}
```

### Sort Header Button
```jsx
// Inside sticky header row
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

function SortableHeader({ column, label, sortColumn, sortDirection, onSort }) {
  const isActive = sortColumn === column;
  const Icon = !isActive
    ? ArrowUpDown
    : sortDirection === 'asc'
    ? ChevronUp
    : ChevronDown;

  return (
    <button
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide
        ${isActive ? 'text-brand-600' : 'text-gray-500'}
        hover:text-gray-800 transition-colors duration-150`}
    >
      {label}
      <Icon size={12} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
    </button>
  );
}
```

### Transaction Row (Restructured)
```jsx
// src/components/transactions/TransactionRow.jsx
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { formatCurrency } from '../../utils';

export function TransactionRow({
  tx, categories,
  isEditingDescription, isEditingCategory,
  newDescription, onDescriptionChange,
  onDescriptionSave, onDescriptionCancel,
  onCategoryChange, onCategoryBlur,
  onEditDescription, onEditCategory,
  onDelete,
}) {
  const dateStr = new Date(tx.date).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  });

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 items-start">
      {/* Date — small, muted */}
      <div className="text-xs text-gray-400 font-mono pt-0.5 min-w-[4.5rem]">
        {dateStr}
      </div>

      {/* Description + Category badge stacked */}
      <div className="min-w-0">
        {isEditingDescription ? (
          <input
            type="text"
            value={newDescription}
            onChange={e => onDescriptionChange(e.target.value)}
            onBlur={() => onDescriptionSave(tx.id, newDescription)}
            onKeyDown={e => {
              if (e.key === 'Enter') onDescriptionSave(tx.id, newDescription);
              if (e.key === 'Escape') onDescriptionCancel();
            }}
            autoFocus
            className="w-full text-sm text-gray-800 font-medium border border-brand-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        ) : (
          <div
            onClick={onEditDescription}
            className="text-sm text-gray-800 font-medium truncate cursor-pointer hover:text-brand-600 transition-colors"
            title="Clicca per modificare"
          >
            {tx.description}
          </div>
        )}
        {/* Category badge below description */}
        <div className="mt-1">
          {isEditingCategory ? (
            <select
              value={tx.category}
              onChange={e => onCategoryChange(tx.id, e.target.value)}
              onBlur={() => onCategoryBlur()}
              autoFocus
              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {Object.keys(categories).sort((a, b) => a.localeCompare(b, 'it')).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Altro">Altro</option>
            </select>
          ) : (
            <CategoryBadge category={tx.category} onClick={onEditCategory} />
          )}
        </div>
      </div>

      {/* Amount — right-aligned, color-coded */}
      <div className={`text-sm font-semibold tabular-nums text-right pt-0.5 ${tx.amount >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
      </div>

      {/* Delete — always visible */}
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-expense-500 transition-colors duration-150 p-1 rounded hover:bg-expense-50 mt-0.5"
        title="Elimina transazione"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
```

### Empty State
```jsx
import { SearchX } from 'lucide-react';

function EmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <SearchX size={48} className="text-gray-300 mb-4" />
      <p className="text-gray-600 font-medium mb-1">
        {hasFilters ? 'Nessuna transazione trovata' : 'Nessuna transazione'}
      </p>
      <p className="text-sm text-gray-400 mb-4">
        {hasFilters
          ? 'Prova a modificare i filtri attivi'
          : 'Importa un file o aggiungi una transazione manualmente'}
      </p>
      {hasFilters && (
        <button onClick={onClearFilters} className="text-sm text-brand-600 hover:text-brand-800 underline">
          Rimuovi tutti i filtri
        </button>
      )}
    </div>
  );
}
```

### Pagination Bar
```jsx
// "X-Y di Z transazioni" counter + prev/next
function PaginationBar({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <span className="text-sm text-gray-500">
        {start}–{end} di {totalItems} movimenti
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Precedente
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Successiva →
        </button>
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useDeferredValue` for search debounce | `useEffect + clearTimeout` for explicit ms timing | React 18+ | `useDeferredValue` defers rendering priority, NOT timing — wrong tool for "wait 200ms before filtering" |
| `height: 0 → 'auto'` exit animations | `opacity + translateY` only | Framer Motion v6+ | Height-auto requires `LayoutGroup`; opacity/transform is GPU-accelerated and jank-free |
| Tailwind JIT dynamic classes | Complete class name strings in constant | Tailwind v2+ | JIT scans source — dynamic string interpolation produces classes not in source tree |
| Separate filter state component | Derive chips from existing filter state | Established React pattern | Less state = fewer bugs; derived state always in sync |
| `mode="sync"` AnimatePresence | `mode="popLayout"` | Framer Motion v9+ | `popLayout` removes exit items immediately, preventing layout jumps during list updates |

**Deprecated/outdated:**
- `framer-motion/dist/...` direct imports: Use top-level `import { motion } from 'framer-motion'` (v12 tree-shakable)
- `AnimateSharedLayout` wrapper: Replaced by `LayoutGroup` in Framer Motion v6+; not needed for simple row animations
- `useDeferredValue` as debounce: It's a rendering priority hint, not a timing mechanism

---

## Open Questions

1. **Where does `stats.filtered` sorting live?**
   - What we know: `stats.filtered` in App.jsx useMemo is pre-filtered by year/month/search/category. Sort is NOT applied there currently.
   - What's clear: Sort should be a `useMemo` inside `TransactionsView` that takes `stats.filtered` as input. This keeps App.jsx's useMemo unchanged.
   - Recommendation: `const sorted = useMemo(() => [...transactions].sort(...), [transactions, sortColumn, sortDirection])` inside TransactionsView. No change to App.jsx stats useMemo.

2. **Should `addManualTransaction` form stay in App.jsx or move to TransactionsView?**
   - What we know: The existing "add transaction" inline form (lines 676-757 in App.jsx) is triggered by `showAddTransaction` state from `useModals`. It uses `newTransaction` state and `addManualTransaction` callback.
   - What's unclear: Phase 5 CONTEXT doesn't explicitly mention extracting the add-transaction form.
   - Recommendation: Extract it into TransactionsView as part of the view extraction. The form is tightly coupled to the transaction list UI. Pass `showAddTransaction`, `setShowAddTransaction`, `newTransaction`, `setNewTransaction`, `addManualTransaction` as props.

3. **Cross-filter chip for category set by DonutChart click (Phase 4)**
   - What we know: Phase 4 DonutChart sets `transactionsCategoryFilter` via `onTransactionsCategoryChange`. Phase 5 must show this as an active chip.
   - What's clear: The chip dismissal calls `setTransactionsCategoryFilter(null)` — same mechanism as manual filter clear.
   - Recommendation: The category chip in `activeChips` handles both sources (user dropdown + chart click) identically since both set the same state variable.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test runner config or test files found |
| Config file | None — Wave 0 must create if validation required |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| TRNS-01 | Rows render with correct columns | manual-only | UI structure; Electron smoke test |
| TRNS-02 | Sort column click cycles ASC→DESC→default | manual-only | Visual sort state + row order |
| TRNS-03 | Pagination counter shows correct X-Y of Z | manual-only | Requires transaction data |
| TRNS-04 | Search debounce — input shows instantly, filter triggers after 200ms | manual-only | Timing-sensitive |
| TRNS-05 | Inline edit description/category saves and closes | manual-only | Interaction test |
| TRNS-06 | Positive amounts green, negative red | manual-only | Visual |
| TRNS-07 | Same category always same badge color | unit (getCategoryColor) | Can be verified with node |
| TRNS-08 | Empty state visible when no transactions match | manual-only | Requires filter to zero results |

### Wave 0 Gaps
- No test infrastructure exists in this project. All validation is via Electron smoke test (manual checklist), consistent with prior phases.
- `getCategoryColor('Food')` determinism can be verified with a quick `node -e` one-liner if desired, but no formal test harness required.

*(Note: Project uses manual smoke tests as the verification pattern, consistent with Phases 1-4.)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/App.jsx` lines 613–901 (existing transaction list implementation)
- Direct codebase inspection: `src/hooks/useFilters.js` (current filter state)
- Direct codebase inspection: `src/index.css` (@theme tokens — income-500, expense-500, brand-500/600, gray-*scale)
- Direct codebase inspection: `src/views/DashboardView.jsx` (component pattern to match)
- Direct codebase inspection: `package.json` (framer-motion ^12.38.0, lucide-react ^0.563.0, tailwindcss ^4.2.1)

### Secondary (MEDIUM confidence)
- Framer Motion v12 changelog: `mode="popLayout"` and `layout` prop confirmed stable in v10+; no breaking API changes for `motion.div`/`AnimatePresence` in v12
- React 19 docs: `useDeferredValue` is explicitly a rendering-priority tool, not a timing debounce
- Tailwind v4 docs: `sticky` utility unchanged from v3; `min-h-0` pattern for flex overflow is documented

### Tertiary (LOW confidence)
- None — all claims verified against codebase or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and existing codebase
- Architecture: HIGH — follows established DashboardView pattern in this codebase
- Debounce pattern: HIGH — React docs confirm useDeferredValue ≠ debounce; useEffect pattern is well-established
- Hash color function: HIGH — djb2 is a well-known algorithm; Tailwind JIT class scanning is documented
- Pitfalls: HIGH — all verified against actual code (e.g., min-h-0 flex issue verified from known Tailwind behavior)
- Framer Motion patterns: MEDIUM — v12 API stable, but `mode="popLayout"` behavior at 50-item list scale not empirically verified in this specific setup

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable stack)
