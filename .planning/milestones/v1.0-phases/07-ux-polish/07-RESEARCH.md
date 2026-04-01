# Phase 7: UX Polish — Research

**Researched:** 2026-03-26
**Domain:** React micro-interactions, Framer Motion animations, Tailwind utility polish, empty states, skeleton loading
**Confidence:** HIGH (all findings verified against live source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**A. Toast Notifications (UX-04)**
- Position: Bottom-right corner — `fixed bottom-6 right-6 z-50`
- Enter: `y: 20px → 0` + `opacity: 0 → 1`, 300ms ease-out
- Exit: `y: 0 → 20px` + `opacity: 1 → 0`, 200ms ease-in
- Stacking: Single toast at a time, `AnimatePresence mode="wait"` keyed by message/timestamp
- Auto-dismiss: 3 seconds
- Success: `bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800`, `text-green-500` Check icon
- Error: same container + `text-red-500` AlertCircle icon; Close: `ml-auto text-gray-400 hover:text-gray-600`
- Wrap `{toast && <Toast ... />}` with `<AnimatePresence mode="wait">`, `key={toast.message}`

**B. "Aggiungi transazione" Button (UX-05)**
- Location: AppHeader — always visible regardless of active view
- Style: `bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2`
- Icon: `<Plus size={16} />` before label; Label: "Aggiungi"
- Opens: `AddTransactionModal` using `ModalShell size="sm"`
- Modal fields: Data (date, defaults today), Importo (number), Descrizione (text, required), Categoria (select)
- Modal title: "Nuova transazione"
- Footer: Secondary "Annulla" + Primary "Aggiungi" (disabled if description empty)
- On confirm: calls `addManualTransaction(...)` — existing callback from `useTransactionData`
- State: Add `showAddTransaction` / `setShowAddTransaction` to `useModals` hook (already present — see Research)
- File: `src/components/modals/AddTransactionModal.jsx`

**C. Empty Dashboard (UX-03)**
- Trigger: `transactions.length === 0` passed as `hasTransactions` prop
- Replaces all chart cards when no data
- Layout: centered flex col, gap-4, py-16; Wallet icon (size=64, text-gray-300); h2 "Nessuna transazione"; p subtext; primary button "Importa transazioni"
- CTA: `document.getElementById('file-input').click()`
- Component: `<DashboardEmptyState onImport={...} />` inside DashboardView

**D. Transaction List Skeleton (UX-02)**
- Trigger: `isLoading` state in TransactionsView — true on mount, false after 300ms
- 5 skeleton rows, each matching TransactionRow layout with `animate-pulse bg-gray-200 rounded`
- Component: `src/components/transactions/SkeletonTransactionRow.jsx`

**E. Hover States & Pointer Cursor (UX-01 + UX-06)**
- Audit sweep: `cursor-pointer` and `transition-colors duration-150` on all `<button>`, `<a>`, clickable `<div>`
- Sidebar nav: active `bg-brand-50 text-brand-600`, inactive `hover:bg-gray-100 hover:text-gray-700`
- Explicit per-element Tailwind utilities (not global CSS rule)

**F. Page Transitions (UX-07)**
- Fade only (`opacity: 0 → 1`, 150ms ease-out)
- `AnimatePresence mode="wait"` + `<motion.div key={view}>` wrapping view-rendering block in App.jsx
- `AnimatePresence` already imported in App.jsx (from Phase 6)

### Claude's Discretion
- Exact `addManualTransaction` signature verification before implementing AddTransactionModal
- Whether to add `showAddTransaction` to existing `useModals` hook or keep as local state in App.jsx
- Date input formatting (ISO string vs locale display)
- Whether `SkeletonTransactionList` should be a wrapper component or inline 5× render in TransactionsView

### Deferred Ideas (OUT OF SCOPE)
- Date range picker in TransactionsView filter bar
- Moving SyncSettings / CategoryManager inline into SettingsView
- Keyboard shortcuts (Cmd+N etc.) — v2 only
- Responsive modal sizing for small Electron window widths
- Balance card in transaction view
- "Aggiungi transazione" button in Sidebar
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | Hover states on all interactive elements (150ms transition) | `transition-colors duration-150` + `cursor-pointer` sweep across components |
| UX-02 | Skeleton loading for transaction list during initial load | New `SkeletonTransactionRow` + local `isLoading` state in TransactionsView (mirrors DashboardView pattern) |
| UX-03 | Empty state dashboard: no data (icon + text + "Importa transazioni" CTA) | New `DashboardEmptyState` component + `hasTransactions` prop; hidden `file-input` already in App.jsx |
| UX-04 | Toast notifications restyled with design system (slide-in 300ms) | Rewrite `Toast.jsx` to Tailwind + `motion.div`; wrap in App.jsx with `AnimatePresence mode="wait"` |
| UX-05 | "Aggiungi transazione" button always accessible in header | AppHeader already has button but conditional on `view === 'transactions'` — remove condition; new `AddTransactionModal` |
| UX-06 | Pointer cursor on all clickable elements | Same sweep as UX-01 — audit for missing `cursor-pointer` |
| UX-07 | Smooth page transition when switching views (fade 150ms) | `AnimatePresence mode="wait"` + `motion.div key={view}` in App.jsx; remove old `transactions.length > 0` guard on DashboardView |
</phase_requirements>

---

## Summary

Phase 7 applies final UX polish across the MoneyFlow app. All six previous phases are complete, providing a stable foundation of Tailwind v4 tokens, extracted hooks, layout components, and Radix+Framer Motion modals. This phase is primarily additive (new components, new wrappers) with a few targeted modifications to existing files.

The most significant architectural change is **App.jsx view rendering reorganization**: the current conditional `{transactions.length > 0 && view === "dashboard" && <DashboardView>}` must be replaced by an unconditional `DashboardView` that receives a `hasTransactions` prop. This allows the page transitions `AnimatePresence` wrapper to function correctly (a key dependency of UX-07). The legacy drop-zone (`className="drop-zone"`) rendered in App.jsx when `transactions.length === 0` must be removed — its role is taken over by `DashboardEmptyState`.

The second significant change is **Toast animation**: `Toast.jsx` currently renders a `<div className="toast success|error">` (legacy CSS class from App.css). It must be fully replaced with Tailwind utilities and a `motion.div` with slide-up animation. The `AnimatePresence mode="wait"` wrapper in App.jsx enables exit animation.

**Primary recommendation:** Plan as 3 sequential waves: (1) new atomic components — `SkeletonTransactionRow`, `AddTransactionModal`, `DashboardEmptyState`; (2) App.jsx wiring — view reorganization, AnimatePresence for views and toast, `showAddTransaction` destructuring; (3) polish sweep — cursor/hover audit across all interactive elements.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.38.0 | `AnimatePresence`, `motion.div` for all animations | Already used for modals; consistent animation system |
| tailwindcss | ^4.2.1 | Utility classes for all styling | Project standard since Phase 1 |
| lucide-react | ^0.563.0 | Icons (Plus, Wallet, Check, AlertCircle, X) | Project standard; `Wallet` icon verified present |
| @radix-ui/react-dialog | ^1.1.15 | `ModalShell` base for `AddTransactionModal` | Already used for all Phase 6 modals |
| react | ^19.2.0 | `useState`, `useEffect` for local loading state | Core |

**No new npm packages required for this phase.**

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── modals/
│   │   └── AddTransactionModal.jsx   ← NEW (UX-05)
│   └── transactions/
│       └── SkeletonTransactionRow.jsx ← NEW (UX-02)
└── views/
    └── DashboardView.jsx             ← MODIFY: add hasTransactions prop + DashboardEmptyState
```

`DashboardEmptyState` can be defined inline in `DashboardView.jsx` (not a separate file) since it's a small component used only there.

### Pattern 1: AnimatePresence Page Transitions

**What:** Wrap the entire view-rendering block in `AnimatePresence mode="wait"` with a `motion.div` keyed by `view`.
**When to use:** Whenever switching between views should have a visual fade.
**Critical prerequisite:** DashboardView must be rendered unconditionally (not gated by `transactions.length > 0`) for the key to change correctly.

```jsx
// In App.jsx — replaces the current conditional render blocks for views
<AnimatePresence mode="wait">
  <motion.div
    key={view}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.15 } }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
  >
    {view === 'dashboard' && (
      <DashboardView
        hasTransactions={transactions.length > 0}
        onImport={() => document.getElementById('file-input')?.click()}
        stats={stats}
        {/* ...other props */}
      />
    )}
    {view === 'transactions' && <TransactionsView {/* ...props */} />}
    {view === 'settings' && <SettingsView {/* ...props */} />}
  </motion.div>
</AnimatePresence>
```

**Note:** The old drop-zone block (`{transactions.length === 0 && <div className="drop-zone" ...>}`) must be removed from App.jsx. DashboardEmptyState replaces it.

### Pattern 2: Toast with AnimatePresence

**What:** Wrap toast render in `AnimatePresence mode="wait"` to enable exit animation.
**Key insight:** `key={toast.message}` triggers re-mount on new message; `mode="wait"` ensures old toast exits before new one enters.

```jsx
// In App.jsx — replaces current `{toast && <Toast ... />}`
<AnimatePresence mode="wait">
  {toast && (
    <Toast
      key={toast.message}
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  )}
</AnimatePresence>
```

```jsx
// New Toast.jsx — full replacement
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      {type === 'success'
        ? <Check size={18} className="text-green-500 shrink-0" />
        : <AlertCircle size={18} className="text-red-500 shrink-0" />
      }
      <span className="text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Chiudi notifica"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
```

### Pattern 3: Skeleton Loading (TransactionsView)

**What:** Local `isLoading` state, true on mount, false after 300ms — identical to DashboardView pattern.
**Component:** `SkeletonTransactionRow` renders one row's animate-pulse placeholders; render 5× inline.

```jsx
// SkeletonTransactionRow.jsx
export function SkeletonTransactionRow() {
  return (
    <div className="grid grid-cols-[1fr_120px_40px] px-4 py-3 items-center border-b border-gray-100">
      {/* Col 1: date + description + badge */}
      <div className="flex flex-col gap-1">
        <div className="animate-pulse bg-gray-200 rounded h-3 w-24" />
        <div className="animate-pulse bg-gray-200 rounded h-4 w-48" />
        <div className="animate-pulse bg-gray-200 rounded h-5 w-20 mt-1" />
      </div>
      {/* Col 2: amount */}
      <div className="animate-pulse bg-gray-200 rounded h-4 w-16 ml-auto" />
      {/* Col 3: delete placeholder */}
      <div />
    </div>
  );
}
```

```jsx
// In TransactionsView.jsx — add local state + conditional render
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setIsLoading(true);
  const t = setTimeout(() => setIsLoading(false), 300);
  return () => clearTimeout(t);
}, []); // mount-only — same pattern as DashboardView

// In render:
{isLoading ? (
  Array.from({ length: 5 }, (_, i) => <SkeletonTransactionRow key={i} />)
) : (
  // normal table content
)}
```

### Pattern 4: AddTransactionModal

**Critical finding:** `addManualTransaction()` in `useTransactionData` takes **no arguments** — it reads from `newTransaction` state (passed via constructor from `useModals`). The modal must use `newTransaction` / `setNewTransaction` from `useModals`, not local state.

```jsx
// AddTransactionModal.jsx
import ModalShell from '../ui/ModalShell';
import { Plus } from 'lucide-react';

export default function AddTransactionModal({
  newTransaction,       // from useModals
  setNewTransaction,    // from useModals
  onConfirm,            // addManualTransaction from useTransactionData
  onClose,              // () => setShowAddTransaction(false)
  categories,
}) {
  const today = new Date().toISOString().slice(0, 10);
  // Ensure date defaults to today when opened
  // ...
  return (
    <ModalShell title="Nuova transazione" onClose={onClose} size="sm">
      {/* form fields: data, importo, descrizione, categoria */}
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer">
          Annulla
        </button>
        <button
          onClick={onConfirm}
          disabled={!newTransaction.description?.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2">
          <Plus size={16} /> Aggiungi
        </button>
      </div>
    </ModalShell>
  );
}
```

**App.jsx wiring for AddTransactionModal:**

```jsx
// 1. Add `showAddTransaction` to useModals destructuring
const { ..., showAddTransaction, setShowAddTransaction, newTransaction, setNewTransaction } = useModals();

// 2. Add `addManualTransaction` to useTransactionData destructuring
const { ..., addManualTransaction } = useTransactionData({ ... });

// 3. Render with AnimatePresence (alongside other modals)
<AnimatePresence>
  {showAddTransaction && (
    <AddTransactionModal
      key="add-transaction"
      newTransaction={newTransaction}
      setNewTransaction={setNewTransaction}
      onConfirm={addManualTransaction}
      onClose={() => setShowAddTransaction(false)}
      categories={categories}
    />
  )}
</AnimatePresence>
```

### Pattern 5: DashboardEmptyState

```jsx
// Inline in DashboardView.jsx (small component, single consumer)
function DashboardEmptyState({ onImport }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <Wallet size={64} className="text-gray-300" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-gray-700">Nessuna transazione</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Importa un file Excel o CSV per iniziare a monitorare le tue finanze.
      </p>
      <button
        onClick={onImport}
        className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
      >
        Importa transazioni
      </button>
    </div>
  );
}

// In DashboardView render (add hasTransactions + onImport props):
if (!hasTransactions) return <DashboardEmptyState onImport={onImport} />;
// else render stat cards + charts as before
```

### Pattern 6: AppHeader "Aggiungi" Always Visible

Current AppHeader renders the button **only** when `view === 'transactions'`. Per UX-05, it must be always visible.

```jsx
// Before (AppHeader.jsx line 41-49):
{view === 'transactions' && (
  <button onClick={onAddTransaction} className="...">
    <Plus size={16} />
    Aggiungi transazione
  </button>
)}

// After — remove view condition entirely:
<button
  onClick={onAddTransaction}
  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
>
  <Plus size={16} />
  Aggiungi
</button>
```

**Note:** Shorten "Aggiungi transazione" → "Aggiungi" per CONTEXT.md (fits header without overflow). Also update `bg-brand-500` → `bg-brand-600` to match the locked decision style.

### Anti-Patterns to Avoid

- **Don't add `cursor-pointer` as a global CSS rule** — Tailwind utility approach is explicit per-element (per CONTEXT.md Decision E). A global `.cursor-pointer { cursor: pointer }` would be out of pattern.
- **Don't use `AnimatePresence` without `mode="wait"` for page transitions** — without `mode="wait"`, old and new views render simultaneously during transition causing layout flash.
- **Don't add new `useState` for `showAddTransaction` in App.jsx** — it already exists in `useModals.js` (line 11). Just destructure `showAddTransaction` alongside the existing `setShowAddTransaction`.
- **Don't pass arguments to `addManualTransaction()`** — the function reads from `newTransaction` state. Passing args will be ignored; the modal must wire `newTransaction`/`setNewTransaction`.
- **Don't forget to remove `.toast` CSS classes from `App.css`** after `Toast.jsx` migration — old `.toast`, `.toast.success`, `.toast.error` are at lines 1116-1138.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton shimmer animation | Custom CSS animation | `animate-pulse` (Tailwind) | Already used in `SkeletonStatCard` — consistent project pattern |
| Modal wrapper for AddTransaction | New dialog primitive | `ModalShell` from `src/components/ui/ModalShell.jsx` | Consistent with all 7 Phase 6 modals; ESC/backdrop/focus-trap built in |
| Toast enter/exit animation | CSS @keyframes | `motion.div` with `AnimatePresence` | Already used throughout project; declarative, interruptible |
| View fade transition | CSS transitions / `useTransition` | `AnimatePresence mode="wait"` + `motion.div` | Already installed, same pattern as all modals |

---

## Common Pitfalls

### Pitfall 1: addManualTransaction Signature Mismatch
**What goes wrong:** Developer creates AddTransactionModal with local state, then tries to call `addManualTransaction({ date, amount, description, category })`. The function ignores all arguments — it reads from `newTransaction` state via closure.
**Why it happens:** CONTEXT.md describes the intent as "calls `addManualTransaction({ date, ... })`" but the actual implementation uses shared `newTransaction` state.
**How to avoid:** AddTransactionModal must receive and update `newTransaction`/`setNewTransaction` props. Form fields bind to `newTransaction.date`, etc. "Aggiungi" button calls `addManualTransaction()` with no args.
**Confidence:** HIGH — verified in `src/hooks/useTransactionData.js` lines 220-251.

### Pitfall 2: DashboardView drop-zone vs Empty State conflict
**What goes wrong:** Old drop-zone (`className="drop-zone"`) in App.jsx and new DashboardEmptyState both try to handle the "no data" state, creating duplicate UIs.
**Why it happens:** The drop-zone block (`{transactions.length === 0 && <div className="drop-zone">}`) is at the top of App.jsx's render output (line ~433). If DashboardView is changed to always render and show empty state, both will appear.
**How to avoid:** Remove the entire old drop-zone block from App.jsx when adding the `AnimatePresence` view wrapper. DashboardEmptyState takes full ownership of the no-data state for dashboard view. The hidden `<input id="file-input">` stays.
**Warning signs:** Two file import UIs visible simultaneously on dashboard with no transactions.

### Pitfall 3: AnimatePresence key collision with modal AnimatePresence
**What goes wrong:** Nesting `AnimatePresence mode="wait"` for views inside the same component that has other `AnimatePresence` wrappers for modals causes unexpected exit animations.
**Why it happens:** `AnimatePresence` is applied to the direct parent; multiple independent ones in the same render tree don't conflict as long as they're siblings, not nested.
**How to avoid:** The view `AnimatePresence` wraps `motion.div key={view}` **inside** the `<AppLayout>` children. The modal `AnimatePresence` wrappers are **siblings** at the bottom of the same JSX block. No nesting conflict.
**Confidence:** HIGH — verified App.jsx structure; `AnimatePresence` docs confirm sibling instances are independent.

### Pitfall 4: Toast key causes premature re-mount on same message
**What goes wrong:** If user triggers two identical messages rapidly, `key={toast.message}` will not re-trigger because React sees the same key.
**Why it happens:** React key comparison is referential — same string = same instance.
**How to avoid:** Use a timestamp or counter as part of the key: `key={toast.message + toast.timestamp}`. The `useToast` hook can set `{ message, type, ts: Date.now() }`. This is a minor enhancement for the hook.
**Warning signs:** Second identical toast doesn't animate in.

### Pitfall 5: SkeletonTransactionRow grid mismatch
**What goes wrong:** Skeleton rows use a different grid than `TransactionRow`, causing layout shift when loading completes.
**Why it happens:** Developer uses wrong column template.
**How to avoid:** `TransactionRow` uses `grid-cols-[1fr_120px_40px]`. `SkeletonTransactionRow` must use the exact same template.

### Pitfall 6: isLoading effect dependency
**What goes wrong:** Adding period/filter dependencies to the `isLoading` effect in TransactionsView causes skeleton to flash on every filter change.
**Why it happens:** Copying DashboardView's effect which DOES re-trigger on period change.
**How to avoid:** Per CONTEXT.md Decision D: "mount-only" — `useEffect(..., [])`. DashboardView has `[selectedMonth, selectedYear]` deps because its data changes per period. TransactionsView skeleton is only for **initial mount load**, not filter changes.

---

## Code Examples

### Current App.jsx view rendering (to replace)
```jsx
// CURRENT — conditional on transactions.length
{transactions.length > 0 && view === "dashboard" && (
  <DashboardView stats={stats} ... />
)}
{view === "transactions" && <TransactionsView ... />}
{view === 'settings' && <SettingsView ... />}
```

### New App.jsx view rendering (with page transitions + empty state)
```jsx
// NEW — unconditional DashboardView, AnimatePresence wrapper
<AnimatePresence mode="wait">
  <motion.div
    key={view}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.15 } }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
  >
    {view === 'dashboard' && (
      <DashboardView
        hasTransactions={transactions.length > 0}
        onImport={() => document.getElementById('file-input')?.click()}
        stats={stats}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        dashboardCategoryFilter={dashboardCategoryFilter}
        onCategoryFilterChange={setDashboardCategoryFilter}
        onTransactionsCategoryChange={setTransactionsCategoryFilter}
      />
    )}
    {view === 'transactions' && <TransactionsView {/* same props as before */} />}
    {view === 'settings' && <SettingsView ... />}
  </motion.div>
</AnimatePresence>
```

### useModals destructuring in App.jsx (add showAddTransaction)
```jsx
// BEFORE:
const {
  confirmDelete, setConfirmDelete,
  editingTx, setEditingTx,
  editingDescription, setEditingDescription,
  newDescription, setNewDescription,
  setShowAddTransaction,             // ← only setter, no reader
  showCategoryManager, setShowCategoryManager,
  showSyncSettings, setShowSyncSettings,
  newTransaction, setNewTransaction,
} = useModals();

// AFTER — add showAddTransaction:
const {
  confirmDelete, setConfirmDelete,
  editingTx, setEditingTx,
  editingDescription, setEditingDescription,
  newDescription, setNewDescription,
  showAddTransaction, setShowAddTransaction,  // ← add showAddTransaction
  showCategoryManager, setShowCategoryManager,
  showSyncSettings, setShowSyncSettings,
  newTransaction, setNewTransaction,
} = useModals();
```

### useTransactionData destructuring in App.jsx (add addManualTransaction)
```jsx
// Add addManualTransaction to destructured return:
const {
  transactions, setTransactions,
  categoryResolutions, setCategoryResolutions,
  years,
  deleteTransaction,
  clearAllData,
  addManualTransaction,    // ← add this
  updateTxCategory,
  updateTxDescription,
} = useTransactionData({ ... });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `.toast` class with hardcoded styles | Tailwind utilities + Framer Motion `motion.div` | Phase 7 | Consistent with design system; animated entry/exit |
| DashboardView gated by `transactions.length > 0` | DashboardView always rendered, `hasTransactions` prop | Phase 7 | Enables page transitions; clean empty state |
| `AnimatePresence` only for modals | `AnimatePresence` also for views and toast | Phase 7 | Full animation coverage |
| Drop-zone as global empty state | View-scoped empty states (DashboardEmptyState, TransactionsView EmptyState) | Phase 7 | Cleaner separation of concerns |

---

## Open Questions

1. **Date input default in AddTransactionModal**
   - What we know: CONTEXT.md says "defaults to today". `useModals` initializes `newTransaction.date` as `''` (empty string).
   - What's unclear: Should `setNewTransaction` be called with today's date when the modal opens, or should the `<input>` use a `defaultValue`?
   - Recommendation: On modal open (`useEffect(..., [])`), call `setNewTransaction(prev => ({ ...prev, date: new Date().toISOString().slice(0, 10) }))`. Reset to `''` on close/submit (already handled by `addManualTransaction`'s `setNewTransaction({ date: '', ... })`).

2. **Old drop-zone Google Drive UI**
   - What we know: The drop-zone currently renders Google Drive sign-in/restore UI when no transactions. This is only available in Electron.
   - What's unclear: Where does this Google Drive "first-run restore" UI live after the drop-zone is removed?
   - Recommendation: The `SyncSettings` modal (accessible via Settings view → "Sincronizzazione Cloud") already handles Google Drive restore. Remove the drop-zone Google Drive block. Users can access Drive restore via Settings. This is the clean Phase 6+ architecture intent.

3. **SkeletonTransactionRow column 3 (delete button) placeholder**
   - What we know: `TransactionRow` Col 3 is a Trash2 delete button (40px).
   - What's unclear: Should skeleton show an animated placeholder or just empty?
   - Recommendation: Empty `<div />` for Col 3 in skeleton — delete button state is irrelevant while loading.

---

## Validation Architecture

> nyquist_validation is `true` in config.json — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no vitest.config, jest.config, or test files found |
| Config file | None — Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

**Note:** This is a UI/UX polish phase in an Electron desktop app. All validation is via Electron smoke testing (visual inspection). No automated test infrastructure exists in the project. Wave 0 would require a significant test setup investment (vitest + electron-testing) that is out of scope for a polish phase. All phase requirements are validated via manual Electron smoke test.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Hover states + 150ms transitions visible on all buttons/rows | manual-only | — Visual inspection in Electron | ❌ |
| UX-02 | Skeleton shows on TransactionsView mount, disappears after 300ms | manual-only | — Open app, switch to Transazioni | ❌ |
| UX-03 | Empty dashboard shows when no transactions, import CTA works | manual-only | — Clear localStorage, reload app | ❌ |
| UX-04 | Toast animates in/out, positioned bottom-right, 3s auto-dismiss | manual-only | — Trigger any action that shows toast | ❌ |
| UX-05 | "Aggiungi" button visible on all views, modal opens + saves transaction | manual-only | — Click button on dashboard, fill form | ❌ |
| UX-06 | Pointer cursor on all clickable elements | manual-only | — Hover over all interactive elements | ❌ |
| UX-07 | Fade transition visible when switching views | manual-only | — Click sidebar nav items | ❌ |

### Sampling Rate
- **Per task commit:** Manual Electron smoke test of the specific feature added
- **Per wave merge:** Full app walkthrough (all 7 UX requirements)
- **Phase gate:** All 7 success criteria confirmed before `/gsd-verify-work`

### Wave 0 Gaps
- No automated test infrastructure needed for this polish phase — all validation is visual/manual
- No test files to create

*(If automated testing is desired in future: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`)*

---

## Sources

### Primary (HIGH confidence)
- `src/App.jsx` — Live source: view rendering, modal wiring, drop-zone structure, AnimatePresence usage
- `src/hooks/useTransactionData.js` — Verified `addManualTransaction` signature (no args, reads `newTransaction` state)
- `src/hooks/useModals.js` — Verified `showAddTransaction`/`setShowAddTransaction`/`newTransaction`/`setNewTransaction` present
- `src/hooks/useToast.js` — Verified `toast` state shape: `{ message, type }`
- `src/components/Toast.jsx` — Current implementation with `.toast` CSS class
- `src/components/layout/AppHeader.jsx` — Verified "Aggiungi" button present but conditional on `view === 'transactions'`
- `src/views/DashboardView.jsx` — Verified `isLoading` pattern with 300ms timeout
- `src/views/TransactionsView.jsx` — Verified grid layout and existing `EmptyState` component
- `src/components/transactions/TransactionRow.jsx` — Verified `grid-cols-[1fr_120px_40px]` layout for skeleton matching
- `src/components/dashboard/SkeletonStatCard.jsx` — Verified `animate-pulse` pattern to replicate
- `src/components/ui/ModalShell.jsx` — Verified `size="sm"` works; footer built into `children`
- `src/components/modals/ConfirmModal.jsx` — Verified footer button pattern inside `children`
- `src/App.css` lines 1116-1138 — Old `.toast`, `.toast.success`, `.toast.error` CSS to remove
- `package.json` — Verified: framer-motion@12.38.0, lucide-react@0.563.0, no new installs needed
- Node.js verification — `Wallet` and `PiggyBank` icons confirmed present in lucide-react@0.563.0

### Secondary (MEDIUM confidence)
- Framer Motion `AnimatePresence mode="wait"` behavior — consistent with Phase 3/6 patterns already in codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json, no new installs needed
- Architecture: HIGH — all patterns verified against live source files
- Pitfalls: HIGH — critical `addManualTransaction` signature mismatch and drop-zone conflict verified in code; `AnimatePresence` nesting verified against existing App.jsx structure
- Code examples: HIGH — derived directly from existing codebase patterns

**Research date:** 2026-03-26
**Valid until:** Indefinite — based on live source inspection, not training data
