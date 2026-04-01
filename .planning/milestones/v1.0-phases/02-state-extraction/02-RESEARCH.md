# Phase 2: State Extraction — Research

**Researched:** 2026-03-17  
**Domain:** React custom hooks extraction, localStorage persistence, cross-hook dependency management  
**Confidence:** HIGH (all findings based on direct code inspection of App.jsx 2127 lines)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Wiring scope — Option B: Create + Wire in Phase 2**  
   Phase 2 is complete only when App.jsx **calls** the new hooks. Not "create hooks, wire later in Phase 3." The inline `useState` calls in App.jsx are replaced in this phase.

2. **localStorage backup — N/A (dev environment)**  
   User is still in development, data loss is acceptable. FOUND-11 (localStorage backup) is **not applicable**. No backup hook, no snapshot script.

3. **Cross-hook dependencies — Props drilling**  
   Hook inter-dependencies resolved by passing values as explicit parameters.  
   ```js
   const { transactions, addTransaction } = useTransactionData();
   const { categories } = useCategories();
   const { wizardData, ... } = useImportLogic({ addTransaction, categories });
   ```

4. **Hook return API — Named object**  
   All hooks return a plain object (named fields), not a destructured array. Consistent with `useGoogleDrive.js`.

### Claude's Discretion

- None specified

### Deferred Ideas (OUT OF SCOPE)

- UI component extraction → Phase 3
- Tailwind class application → Phase 3+
- Error boundaries → deferred
- `useLocalStorageBackup` hook → N/A (dev environment)

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-05 | `useTransactionData` hook extracted from App.jsx (stato transazioni, CRUD, persistenza localStorage) | Full state+function inventory in §State Inventory; lazy-init pattern for localStorage load |
| FOUND-06 | `useCategories` hook extracted from App.jsx (categorie, keyword mapping, conflitti) | Full assignment in §State Inventory; recategorizeAll dependency analysis |
| FOUND-07 | `useFilters` hook extracted from App.jsx (month/year/search/category filter state) | Full assignment in §State Inventory; years auto-update effect pattern |
| FOUND-08 | `useModals` hook extracted from App.jsx (visibilità modali, dati apertura) | Full assignment in §State Inventory; confirmed zero cross-hook deps |
| FOUND-09 | `useImportLogic` hook extracted from App.jsx (import profiles, wizard flow, conflict resolution) | Full assignment in §State Inventory; props-drilling signature |
| FOUND-10 | `useToast` hook extracted from App.jsx (notifiche toast) | Exact code pattern in §Code Examples |
| FOUND-11 | Backup localStorage — **SKIPPED** (dev environment, data loss acceptable) | N/A per locked decision |

</phase_requirements>

---

## Summary

App.jsx is a 2127-line monolith with 32 `useState` declarations, 6 `useEffect` hooks, 3 `useMemo` hooks, and 23 `useCallback` functions — all co-located in a single component. This phase extracts them into 6 custom hooks: `useToast`, `useModals`, `useFilters`, `useCategories`, `useTransactionData`, and `useImportLogic`. Each hook is created and immediately wired into App.jsx (no dangling files).

The critical challenge is that localStorage persistence currently saves **all** state in one atomic write (transactions + categories + importProfiles + categoryResolutions), and the load effect sets state that spans 3 different hooks. The recommended solution uses **lazy `useState` initializers** — each hook reads its own slice from localStorage synchronously during initialization, eliminating cross-hook init ordering problems. The save effect is consolidated in `useTransactionData`, which receives the other hooks' persisted state as parameters.

The `stats` useMemo (lines 801–996, ~200 lines of computation) has deps spanning transactions and all filter state. It is **not extracted** — it stays in App.jsx where it can consume state from all hooks. After extraction, App.jsx becomes a ~200–300 line orchestration file: hook calls + stats + JSX.

**Primary recommendation:** Extract in dependency order (Toast → Modals → Filters → Categories → TransactionData → ImportLogic), wiring each immediately. Use lazy initializers for localStorage reads. Keep `stats` useMemo and `isInitialized` in App.jsx.

---

## Standard Stack

### Core (no new dependencies needed)

| Item | Version | Purpose | Notes |
|------|---------|---------|-------|
| React hooks | 19.2.0 ✓ | `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef` | Already installed |
| ESLint react-hooks | ✓ | Validates hook dependency arrays | Already installed — **will flag stale closures after extraction** |

### No New Packages Required

This phase is a refactoring of existing code. All necessary APIs (React hooks, localStorage) are already available. No npm installs needed.

**Verification (already installed):**
```bash
# Confirm React version
node -e "console.log(require('./node_modules/react/package.json').version)"
# → 19.2.0
```

---

## Architecture Patterns

### Recommended File Structure After Phase 2

```
src/hooks/
├── index.js              # Barrel — add 6 new exports here
├── useGoogleDrive.js     # Existing — do not touch
├── useToast.js           # NEW: toast state + showToast
├── useModals.js          # NEW: modal visibility + form state
├── useFilters.js         # NEW: view/month/year/search/page/category filters
├── useCategories.js      # NEW: categories, keywords, conflicts, importProfiles
├── useTransactionData.js # NEW: transactions, categoryResolutions, localStorage I/O
└── useImportLogic.js     # NEW: wizard, conflicts, file parsing, drag-drop
```

### Pattern: Lazy useState Initializer (for localStorage reads)

Use synchronous lazy initializers instead of `useEffect` for reading localStorage. This eliminates the multi-hook initialization ordering problem and renders `isInitialized` trivial.

```js
// Source: React docs — Avoiding recreating the initial state
// https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state

// useTransactionData.js
const [transactions, setTransactions] = useState(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
    return saved.transactions || [];
  } catch {
    console.error('Error loading transactions from localStorage');
    return [];
  }
});

const [categoryResolutions, setCategoryResolutions] = useState(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
    return saved.categoryResolutions || {};
  } catch {
    return {};
  }
});
```

```js
// useCategories.js
const [categories, setCategories] = useState(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
    return saved.categories
      ? { ...DEFAULT_CATEGORIES, ...saved.categories }
      : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
});

const [importProfiles, setImportProfiles] = useState(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
    return saved.importProfiles || {};
  } catch {
    return {};
  }
});
```

This reads localStorage multiple times (once per hook) but the data is the same JSON blob — negligible cost. Eliminates all init-ordering complexity.

### Pattern: isInitialized (stays in App.jsx)

Because lazy initializers run synchronously before the first render, state is ready at mount time. `isInitialized` simply becomes:

```js
// App.jsx — after all hook calls
const [isInitialized, setIsInitialized] = useState(false);
useEffect(() => {
  setIsInitialized(true);
}, []); // runs after first render; lazy initializers already completed by then
```

### Pattern: localStorage Save Effect (in useTransactionData with props drilling)

```js
// useTransactionData.js
export function useTransactionData({ categories, importProfiles, showToast }) {
  const [transactions, setTransactions] = useState(() => { /* lazy init */ });
  const [categoryResolutions, setCategoryResolutions] = useState(() => { /* lazy init */ });

  // Save effect — consolidated here for atomic localStorage writes
  useEffect(() => {
    if (
      transactions.length > 0 ||
      Object.keys(importProfiles).length > 0 ||
      Object.keys(categoryResolutions).length > 0
    ) {
      try {
        localStorage.setItem('moneyFlow', JSON.stringify({
          transactions,
          categories,       // from useCategories via props drilling
          importProfiles,   // from useCategories via props drilling
          categoryResolutions,
        }));
      } catch (error) {
        console.error('Errore salvataggio:', error);
      }
    }
  }, [transactions, categories, importProfiles, categoryResolutions]);

  // ...
}
```

```js
// App.jsx — props drilling order matters
const { toast, setToast, showToast } = useToast();
const { categories, importProfiles, ...catActions } = useCategories({ showToast });
const txData = useTransactionData({ categories, importProfiles, showToast });
```

### Pattern: Electron Backup Ref (in useTransactionData)

The `backupDataRef` + IPC listener is a persistence concern — it belongs in `useTransactionData`:

```js
// useTransactionData.js
const backupDataRef = useRef({ transactions, categories, importProfiles, categoryResolutions });

// Keep ref current
useEffect(() => {
  backupDataRef.current = { transactions, categories, importProfiles, categoryResolutions };
}, [transactions, categories, importProfiles, categoryResolutions]);

// Register IPC listener (once)
useEffect(() => {
  if (window.electronAPI?.onRequestBackupData) {
    const cleanup = window.electronAPI.onRequestBackupData(() => {
      window.electronAPI.sendBackupDataForClose(backupDataRef.current);
    });
    return cleanup;
  }
}, []);
```

### Pattern: Named Object Return (consistent with useGoogleDrive.js)

```js
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);
  return { toast, setToast, showToast };
}
```

Return ALL setters (e.g., `setToast`) not just the state + action callbacks. App.jsx may need raw setters for cleanup (e.g., `setToast(null)` on close).

### Anti-Patterns to Avoid

- **Nested hooks (hook depending on another hook):** Never call `useToast()` inside `useTransactionData`. Pass `showToast` as a parameter instead.
- **Sharing state between hooks without props drilling:** Don't use React context or a global store. Every cross-hook dependency must be an explicit parameter.
- **Putting `stats` in a hook:** The `stats` useMemo uses state from 3+ hooks. Extracting it to a hook would just move the same cross-hook coupling problem. Leave it in App.jsx.
- **useEffect for localStorage initialization:** Lazy initializers are synchronous and avoid an unnecessary render cycle + `isInitialized` complexity.

---

## Complete State Inventory

### 32 useState Declarations → Hook Assignments

| Line | State Variable | Hook | Rationale |
|------|---------------|------|-----------|
| 80 | `transactions` | `useTransactionData` | Primary data store |
| 81 | `categories` | `useCategories` | Category/keyword mapping |
| 82 | `importProfiles` | `useCategories` | Import profile config (co-located with categories) |
| 83 | `view` | `useFilters` | UI navigation state |
| 84 | `selectedMonth` | `useFilters` | Time filter |
| 85 | `selectedYear` | `useFilters` | Time filter |
| 86 | `editingTx` | `useModals` | Inline edit state |
| 87 | `dragOver` | `useImportLogic` | File drag-drop UX |
| 88 | `loading` | `useImportLogic` | Import loading state |
| 89 | `toast` | `useToast` | Toast message |
| 90 | `searchQuery` | `useFilters` | Text search filter |
| 91 | `confirmDelete` | `useModals` | Confirm modal state |
| 92 | `editingDescription` | `useModals` | Inline description edit |
| 93 | `newDescription` | `useModals` | Inline description value |
| 95 | `wizardData` | `useImportLogic` | Import wizard session |
| 97 | `importConflicts` | `useImportLogic` | Conflict resolver state |
| 99 | `categoryResolutions` | `useTransactionData` | Persisted resolution choices |
| 101 | `openDropdown` | `useModals` | Dropdown menu state |
| 103 | `showAddTransaction` | `useModals` | Add transaction form |
| 105 | `showCategoryManager` | `useModals` | Category manager modal |
| 106 | `newTransaction` | `useModals` | New transaction form fields |
| 113 | `currentPage` | `useFilters` | Pagination |
| 115 | `dashboardTypeFilter` | `useFilters` | Dashboard filter (all/income/expenses) |
| 116 | `dashboardCategoryFilter` | `useFilters` | Dashboard category multi-filter |
| 118 | `expandedCategory` | `useFilters` | Expanded category accordion |
| 120 | `showCategoryPercentage` | `useFilters` | Toggle % vs € display |
| 122 | `transactionsCategoryFilter` | `useFilters` | Transaction list category filter |
| 125 | `categoriesChanged` | `useCategories` | Pending recategorize flag |
| 127 | `categoryConflicts` | `useCategories` | Category conflict resolution data |
| 129 | `showSyncSettings` | `useModals` | Sync settings modal |
| 131 | `isInitialized` | **App.jsx (stays)** | Initialization guard |
| 133 | `paypalData` | `useImportLogic` | PayPal CSV data |

### useRef → Hook Assignments

| Line | Ref | Hook | Rationale |
|------|-----|------|-----------|
| 140 | `backupDataRef` | `useTransactionData` | Persistence concern — keeps latest data for Electron close handler |

### 6 useEffect → Hook Assignments

| Lines | Effect | Hook | Notes |
|-------|--------|------|-------|
| 141–143 | Update `backupDataRef.current` | `useTransactionData` | Keeps ref current for IPC handler |
| 145–152 | Electron IPC `onRequestBackupData` | `useTransactionData` | Registers cleanup-returning listener |
| 154–163 | Reset `currentPage` to 1 on filter change | `useFilters` | Internal to filters — no external deps needed |
| 171–189 | Load from localStorage + `setIsInitialized` | **SPLIT**: lazy initializers handle load; App.jsx handles `isInitialized` | See §Architecture Patterns |
| 191–212 | Save to localStorage | `useTransactionData` | Receives `categories` + `importProfiles` as params |
| 1045–1049 | Auto-update `selectedYear` when `years` changes | `useFilters` | Receives `years` param from `useTransactionData` |

### 3 useMemo → Hook Assignments

| Lines | Memo | Hook | Deps |
|-------|------|------|------|
| 215–221 | `allProfiles` | `useImportLogic` | `importProfiles` (passed in from useCategories) |
| 801–996 | `stats` | **App.jsx (stays)** | transactions + 6 filter states — cross-hook, extraction not worthwhile |
| 1037–1043 | `years` | `useTransactionData` | `transactions` |

### 23 useCallback → Hook Assignments

| Lines | Function | Hook | Cross-hook deps (props drilling) |
|-------|----------|------|----------------------------------|
| 166–168 | `showToast` | `useToast` | none |
| 224–242 | `detectProfile` | `useImportLogic` | `allProfiles` (internal) |
| 245–280 | `processRowsWithProfile` | `useImportLogic` | `categories` (param) |
| 283–336 | `processImportedTransactions` | `useImportLogic` | `transactions` (param), `setTransactions` (param), `showToast` (param) |
| 339–408 | `handleFile` | `useImportLogic` | `showToast` (param) |
| 411–440 | `handlePayPalFile` | `useImportLogic` | `showToast` (param) |
| 443–464 | `applyPayPalEnrichment` | `useImportLogic` | `setTransactions` (param), `showToast` (param) |
| 467–499 | `handleConflictResolve` | `useImportLogic` | `setTransactions` (param), `showToast` (param) |
| 502–518 | `handleWizardConfirm` | `useImportLogic` | `setImportProfiles` (param), `processRowsWithProfile` (internal) |
| 521–529 | `onDrop` | `useImportLogic` | `handleFile` (internal) |
| 532–548 | `exportData` | `useTransactionData` | `showToast` (param) |
| 551–570 | `exportBackup` | `useTransactionData` | `categories` + `importProfiles` (params), `showToast` (param) |
| 573–622 | `importBackup` | `useTransactionData` | `setCategories` + `setImportProfiles` (params), `showToast` (param) |
| 625–632 | `deleteTransaction` | `useTransactionData` | `showToast` (param) |
| 635–640 | `clearAllData` | `useTransactionData` | `showToast` (param) |
| 643–655 | `addCategory` | `useCategories` | `showToast` (param) |
| 658–669 | `deleteCategory` | `useCategories` | `showToast` (param) |
| 672–688 | `addKeyword` | `useCategories` | `showToast` (param) |
| 691–697 | `removeKeyword` | `useCategories` | none |
| 700–736 | `recategorizeAll` | `useCategories` | `transactions` (param), `categoryResolutions` (param), `showToast` (param) |
| 739–764 | `confirmCategoryConflicts` | **App.jsx** ⚠️ | Sets `categoryResolutions`+`transactions` (useTransactionData) AND `setCategoryConflicts` (useCategories) |
| 767–798 | `addManualTransaction` | `useTransactionData` | `newTransaction` (param), `setShowAddTransaction` (param), `setNewTransaction` (param), `showToast` (param) |
| 999–1014 | `updateTxCategory` | `useTransactionData` | `showToast` (param) *(setEditingTx handled by App.jsx after call)* |
| 1017–1034 | `updateTxDescription` | `useTransactionData` | `showToast` (param) *(setEditingDescription + setNewDescription handled by App.jsx)* |

> ⚠️ **`confirmCategoryConflicts` stays in App.jsx** — it modifies state in both `useTransactionData` (setCategoryResolutions, setTransactions) and `useCategories` (setCategoryConflicts). Moving it to either hook creates artificial coupling. App.jsx has access to all setters and is the right orchestration layer for this cross-cutting function.

---

## Dependency Graph Between Hooks

```
useToast          (zero deps)
    ↑
    ├── useTransactionData({ categories, importProfiles, showToast })
    │       ↑
    │       └── useImportLogic({ transactions, setTransactions, categories,
    │                            importProfiles, setImportProfiles, showToast })
    │
    └── useCategories({ showToast })
              (recategorizeAll takes transactions, categoryResolutions as params — not hook deps)

useFilters({ years })      (years comes from useTransactionData)
    (zero constructor deps, years only affects one useEffect)

useModals                  (zero deps)
```

**Dependency construction order in App.jsx:**

```js
// STEP 1 — no deps
const { toast, setToast, showToast } = useToast();
const { confirmDelete, setConfirmDelete, editingTx, setEditingTx, 
        editingDescription, setEditingDescription, newDescription, setNewDescription,
        showAddTransaction, setShowAddTransaction, newTransaction, setNewTransaction,
        showCategoryManager, setShowCategoryManager, showSyncSettings, setShowSyncSettings,
        openDropdown, setOpenDropdown } = useModals();

// STEP 2 — needs showToast
const { categories, setCategories, importProfiles, setImportProfiles,
        categoriesChanged, categoryConflicts, setCategoryConflicts,
        addCategory, deleteCategory, addKeyword, removeKeyword, recategorizeAll } = useCategories({ showToast });

// STEP 3 — needs categories, importProfiles, showToast
const { transactions, setTransactions, categoryResolutions, setCategoryResolutions,
        years, deleteTransaction, clearAllData, exportData, exportBackup, importBackup,
        applyPayPalEnrichment, addManualTransaction, updateTxCategory, updateTxDescription } = useTransactionData({
  categories,
  importProfiles,
  setCategories,       // for importBackup
  setImportProfiles,   // for importBackup
  setShowAddTransaction,   // for addManualTransaction
  setNewTransaction,       // for addManualTransaction
  showToast
});

// STEP 4 — needs years (from useTransactionData), selectedYear from within
const filterState = useFilters({ years });

// STEP 5 — needs most of the above
const { wizardData, setWizardData, importConflicts, setImportConflicts,
        loading, dragOver, setDragOver, paypalData, setPaypalData,
        handleFile, handlePayPalFile, handleWizardConfirm, handleConflictResolve, onDrop } = useImportLogic({
  transactions,
  setTransactions,
  categories,
  importProfiles,
  setImportProfiles,
  showToast
});

// STEP 6 — stays in App.jsx
const [isInitialized, setIsInitialized] = useState(false);
useEffect(() => { setIsInitialized(true); }, []);

// STEP 7 — stays in App.jsx (cross-cutting)
const confirmCategoryConflicts = useCallback((resolutions) => {
  // updates categoryResolutions, transactions, setCategoryConflicts
}, [setCategoryResolutions, setTransactions, setCategoryConflicts, showToast]);

// STEP 8 — stays in App.jsx (cross-cutting memo)
const stats = useMemo(() => { ... }, [transactions, selectedMonth, selectedYear, ...]);
```

---

## Safe Extraction Order

Extract and wire in this sequence — each step can be verified independently:

### Wave 1: Zero-dependency hooks (extract first, verify build)
1. **`useToast`** — single state + one useCallback. Simplest possible hook. Wire immediately; verify `showToast` works.
2. **`useModals`** — 9 state variables, zero logic. Pure state bag. Wire immediately; verify all modals open/close.

### Wave 2: Minimal-dependency hooks
3. **`useFilters`** — 10 state variables + 2 effects. Needs `years` param (from useTransactionData) for one effect — pass `[]` initially, add proper wiring when useTransactionData is done. Wire immediately.
4. **`useCategories`** — needs `showToast`. Lazy inits from localStorage. Contains `recategorizeAll`, `addCategory`, `deleteCategory`, `addKeyword`, `removeKeyword`. Wire and test category manager.

### Wave 3: Data hooks
5. **`useTransactionData`** — needs `categories`, `importProfiles`, `showToast`. Contains all localStorage save/load, Electron backup, CRUD operations, `years` memo. Wire and test CRUD + persistence.

### Wave 4: Complex logic hook (extract last)
6. **`useImportLogic`** — needs state/setters from previous 4 hooks. Contains `allProfiles` memo, all file parsing, wizard/conflict flows. Wire and test full import flow.

**Rule:** After wiring each hook, run `npm run build` and `npm run lint` before proceeding to the next. Don't batch-extract and try to fix all problems at the end.

---

## Common Pitfalls

### Pitfall 1: Stale Closures in useCallback After Extraction

**What goes wrong:** After extraction, ESLint `react-hooks/exhaustive-deps` flags incomplete dependency arrays. Developer adds all deps → function recreates on every render → child components re-render unexpectedly.

**Why it happens:** Functions that previously captured state directly (`processImportedTransactions` capturing `transactions`) now receive it as a param. Params that change on every render (non-memoized callbacks) cause hooks to recreate all their functions.

**How to avoid:** Ensure all callback props passed to hooks are stable — wrap in `useCallback` at the call site in App.jsx, or use functional updates (`setTransactions(prev => ...)`) to eliminate the need for `transactions` in deps at all.

**Example — use functional update to eliminate transactions dep:**
```js
// BAD: needs transactions in deps
const deleteTransaction = useCallback((id) => {
  setTransactions(transactions.filter(t => t.id !== id));
}, [transactions]);

// GOOD: functional update, no transactions dep
const deleteTransaction = useCallback((id) => {
  setTransactions(prev => prev.filter(t => t.id !== id));
}, []); // only needs showToast
```

**Warning signs:** ESLint `react-hooks/exhaustive-deps` warnings after extraction.

---

### Pitfall 2: localStorage Parsed Multiple Times (minor)

**What goes wrong:** With lazy initializers, `localStorage.getItem('moneyFlow')` is called once per piece of state (transactions, categories, importProfiles, categoryResolutions = 4 times).

**Why it happens:** Each hook has its own initializer that reads from the same key.

**How to avoid:** Acceptable cost — these are synchronous reads of a single small JSON blob. Profile only if startup performance becomes a concern. Alternative: parse once at module level (not recommended — SSR issues). 

**Not a real problem** in this Electron app context.

---

### Pitfall 3: `stats` useMemo Dependencies After Hook Extraction

**What goes wrong:** The `stats` useMemo (line 801) depends on `transactions` (from useTransactionData), `selectedMonth/Year/searchQuery/dashboardTypeFilter/dashboardCategoryFilter/transactionsCategoryFilter` (all from useFilters). After extraction, these come from destructured hook returns. If the useMemo isn't updated with the new variable names, it silently uses stale values.

**How to avoid:** When extracting useFilters, ensure destructuring names in App.jsx match exactly what the useMemo dependency array references. Check all 7 deps in the stats useMemo after each hook wiring.

---

### Pitfall 4: `confirmCategoryConflicts` Cross-Hook State

**What goes wrong:** This function modifies state in `useTransactionData` (`setCategoryResolutions`, `setTransactions`) AND `useCategories` (`setCategoryConflicts`). If extracted to either hook, it creates a hidden dependency.

**How to avoid:** **Keep `confirmCategoryConflicts` in App.jsx.** App.jsx has all setters available and is the correct orchestration layer for functions that span multiple domains. This is a feature, not a failure of extraction.

---

### Pitfall 5: React 19 Concurrent Rendering — Batching Change

**What goes wrong:** React 18/19 batches ALL setState calls (even outside event handlers). Previously, code like:
```js
setTransactions([...]);
setImportConflicts(null);
showToast("Done");
```
...triggered 3 renders in React 17 but 1 batched render in React 18/19. This is generally better but can cause unexpected behavior if code relied on intermediate state snapshots.

**How to avoid:** 
- Already using functional updates (`setTransactions(prev => ...)`) throughout — this is correct concurrent-safe pattern.
- Don't rely on reading state immediately after setting it in the same synchronous block.
- The `backupDataRef` pattern (ref + useEffect to keep ref current) is the correct way to read latest state in async contexts — already used at line 140.

---

### Pitfall 6: `useEffect` for localStorage Read (anti-pattern)

**What goes wrong:** If the localStorage load is done via `useEffect` instead of lazy initializer, there's a render cycle gap: first render shows empty state, then effect fires, data loads, second render shows correct state. This causes a flash of empty content even with `isInitialized` guard, plus `isInitialized` must be coordinated across multiple hooks.

**How to avoid:** Always use lazy initializers (`useState(() => { /* read localStorage */ })`) for synchronous localStorage reads. Only use `useEffect` for async reads (network, IPC) or side effects.

---

### Pitfall 7: Hook Parameters Must Be Stable References

**What goes wrong:** If `setCategories` or `showToast` passed to hooks are recreated each render, every hook that depends on them recreates its callbacks, causing cascade re-renders.

**How to avoid:**
- Setters from `useState` (e.g., `setCategories`) are **stable by React guarantee** — always safe to pass as params.
- `showToast` from `useToast` must be wrapped in `useCallback` (it already is: `useCallback((msg, type) => setToast({...}), [])`).
- `recategorizeAll` receives `transactions` and `categoryResolutions` as params — these are values, not setters. Their identity changes with data changes, causing `recategorizeAll` to recreate. This is **correct and expected behavior**.

---

## Code Examples

### useToast (complete implementation)

```js
// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);
  
  return { toast, setToast, showToast };
}
```

### useModals (complete skeleton)

```js
// src/hooks/useModals.js
import { useState } from 'react';

export function useModals() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [editingDescription, setEditingDescription] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    date: '', description: '', amount: '', category: 'Altro',
  });

  return {
    confirmDelete, setConfirmDelete,
    editingTx, setEditingTx,
    editingDescription, setEditingDescription,
    newDescription, setNewDescription,
    showAddTransaction, setShowAddTransaction,
    showCategoryManager, setShowCategoryManager,
    showSyncSettings, setShowSyncSettings,
    openDropdown, setOpenDropdown,
    newTransaction, setNewTransaction,
  };
}
```

### useFilters (with years effect)

```js
// src/hooks/useFilters.js
import { useState, useEffect } from 'react';

export function useFilters({ years = [] } = {}) {
  const [view, setView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dashboardTypeFilter, setDashboardTypeFilter] = useState('all');
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState([]);
  const [transactionsCategoryFilter, setTransactionsCategoryFilter] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showCategoryPercentage, setShowCategoryPercentage] = useState(false);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, searchQuery, view, transactionsCategoryFilter]);

  // Auto-update selectedYear when available years change
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  return {
    view, setView,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    dashboardTypeFilter, setDashboardTypeFilter,
    dashboardCategoryFilter, setDashboardCategoryFilter,
    transactionsCategoryFilter, setTransactionsCategoryFilter,
    expandedCategory, setExpandedCategory,
    showCategoryPercentage, setShowCategoryPercentage,
  };
}
```

### useImportLogic signature (props drilling)

```js
// src/hooks/useImportLogic.js
export function useImportLogic({
  transactions,       // for duplicate detection in processImportedTransactions
  setTransactions,    // for resolving conflicts and applying enrichment
  categories,         // for categorize() in processRowsWithProfile
  importProfiles,     // for allProfiles memo
  setImportProfiles,  // for handleWizardConfirm (saves new custom profile)
  showToast,          // for user feedback
}) { ... }
```

### barrel re-export update

```js
// src/hooks/index.js — after Phase 2
export { useGoogleDrive } from './useGoogleDrive';
export { useToast } from './useToast';
export { useModals } from './useModals';
export { useFilters } from './useFilters';
export { useCategories } from './useCategories';
export { useTransactionData } from './useTransactionData';
export { useImportLogic } from './useImportLogic';
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hook dependency tracking | Custom pub/sub for inter-hook state | React's props drilling pattern (decided) | React already handles re-render propagation when values change |
| Async localStorage | Custom queue for batched writes | Synchronous localStorage with try-catch (existing pattern) | localStorage is synchronous; app data is small; no quota issue expected |
| Global state | Context/Redux/Zustand | Props drilling per CONTEXT.md decision | Overkill for 6 hooks; adds complexity without isolation benefit |
| Test runner | Custom assertion scripts | Vitest (if automated tests desired) | Native Vite integration, React Testing Library support |

**Key insight:** This phase is pure refactoring — no new logic should be written. The rule is: if it worked before, it should work identically after. Any "improvement" to the logic during extraction is out of scope and introduces risk.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `useEffect` for localStorage load | Lazy `useState(() => ...)` initializer | Eliminates extra render cycle, simpler isInitialized |
| Monolithic component state | Custom hooks with explicit deps | Enables isolated testing, smaller re-render scope |
| All setState in component | Functional updates `setState(prev => ...)` | Already used in App.jsx — carry forward to hooks |
| React 17 non-batched updates | React 19 automatic batching | Multiple setState calls in handlers are already batched — no change needed |

---

## Open Questions

1. **`stats` useMemo — move to hook or keep in App.jsx?**
   - What we know: It deps on 7+ state values from 2 different hooks (transactions from useTransactionData, filters from useFilters)
   - What's unclear: CONTEXT.md doesn't mention a `useStats` hook — was it intentionally omitted?
   - **Recommendation:** Keep in App.jsx for this phase. If App.jsx is still too large after extraction, introduce `useStats` in Phase 3 if needed.

2. **`importBackup` setter params — how many to pass?**
   - What we know: `importBackup` calls `setCategories` + `setImportProfiles` (from useCategories) + `setTransactions` + `setCategoryResolutions` (from useTransactionData)
   - What's unclear: Is it simpler to pass these setters into useTransactionData, or keep importBackup in App.jsx?
   - **Recommendation:** Pass setters as params to useTransactionData (`setCategories`, `setImportProfiles`). Keeps all data I/O in one hook. This is 2 extra params — manageable.

3. **Google Drive download flow — where does it wire?**
   - What we know: Lines 1354-1370 and 2159-2176 call `googleDrive.downloadBackup()` and then call `setTransactions`, `setCategories`, `setImportProfiles` inline in JSX
   - What's unclear: This currently lives in JSX callbacks — stays in App.jsx after extraction?
   - **Recommendation:** Yes, stays in App.jsx JSX. These are event handlers in the render, not extracted logic. App.jsx will have access to all setters from hooks.

---

## Validation Architecture

> nyquist_validation: true — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None installed** — vitest not in devDependencies |
| Config file | None (vitest.config.js does not exist) |
| Quick run command | `npm run build && npm run lint` (build + lint smoke) |
| Full suite command | Same (no test suite) |

### Phase Requirements → Validation Map

| Req ID | Behavior | Validation Type | Command | Notes |
|--------|----------|-----------------|---------|-------|
| FOUND-05 | `useTransactionData` exports and is importable, App.jsx uses it | Build smoke | `npm run build` | Build failure = hook broken |
| FOUND-05 | localStorage persists after add/edit/delete | Manual | Open app → import → verify persistence after reload | |
| FOUND-06 | `useCategories` exports and App.jsx uses it | Build smoke | `npm run build` | |
| FOUND-06 | Category CRUD works, recategorize works | Manual | Open CategoryManager → add/delete category → recategorize | |
| FOUND-07 | `useFilters` exports and App.jsx uses it | Build smoke | `npm run build` | |
| FOUND-07 | Filters reset page, year auto-updates | Manual | Filter by category → check page resets to 1 | |
| FOUND-08 | `useModals` exports and App.jsx uses it | Build smoke | `npm run build` | |
| FOUND-08 | All modals open/close without errors | Manual | Open each of 7 modals, confirm close | |
| FOUND-09 | `useImportLogic` exports and App.jsx uses it | Build smoke | `npm run build` | |
| FOUND-09 | Import wizard flow, conflict resolver work | Manual | Import Excel file, verify wizard + conflict resolution | |
| FOUND-10 | `useToast` exports and App.jsx uses it | Build smoke | `npm run build` | |
| FOUND-10 | Toast appears on CRUD operations | Manual | Delete a transaction → verify toast appears | |
| FOUND-11 | **SKIPPED** — N/A (dev environment) | — | — | Locked decision |

### Automated Checks Available Without Test Framework

```bash
# 1. Build check — catches import errors, missing exports, TypeScript-style JSX errors
npm run build

# 2. Lint check — catches react-hooks/exhaustive-deps violations (stale closures)
npm run lint

# 3. Combined (run after each hook wiring)
npm run build && npm run lint
```

### Sampling Rate

- **After wiring each hook:** `npm run build && npm run lint`
- **After wiring all 6 hooks:** Full manual smoke test checklist
- **Phase gate before verify:** Build green + lint green + manual checklist passed

### Wave 0 Gaps

- [ ] `src/hooks/useToast.js` — covers FOUND-10
- [ ] `src/hooks/useModals.js` — covers FOUND-08
- [ ] `src/hooks/useFilters.js` — covers FOUND-07
- [ ] `src/hooks/useCategories.js` — covers FOUND-06
- [ ] `src/hooks/useTransactionData.js` — covers FOUND-05
- [ ] `src/hooks/useImportLogic.js` — covers FOUND-09
- [ ] `src/hooks/index.js` — add 6 new barrel exports

**No test framework install needed** — this phase validates via build success, lint cleanliness, and manual smoke testing. If automated hook tests are desired in future, add `vitest` + `@testing-library/react-hooks` — but that is out of scope for Phase 2.

---

## Manual Smoke Test Checklist (Phase Gate)

After all 6 hooks are wired and build/lint pass:

```
App functionality (zero regressions):
[ ] 1. App loads without console errors
[ ] 2. Import Excel file → wizard appears (or auto-detects) → transactions appear
[ ] 3. Import duplicate file → conflict resolver appears
[ ] 4. Add manual transaction → appears in list, persists after reload
[ ] 5. Delete transaction → confirm modal appears → transaction removed → toast shown
[ ] 6. Edit transaction description inline → persists after reload
[ ] 7. Edit transaction category inline → persists, categoryResolutions updated
[ ] 8. Open CategoryManager → add category → add keyword → recategorize all → works
[ ] 9. Dashboard filters (type/category/month/year) → stats update correctly
[ ] 10. Pagination → page resets when filter changes
[ ] 11. All 7 modals open and close without errors (ImportWizard, CategoryManager, 
        SyncSettings, ConfirmModal, ConflictResolver, CategoryConflictResolver, PayPalEnrichWizard)
[ ] 12. localStorage backup: close and reopen → all data still present
```

---

## Sources

### Primary (HIGH confidence)
- `src/App.jsx` (direct code inspection, 2127 lines) — complete state inventory, all useCallback/useEffect/useMemo assignments
- `src/hooks/useGoogleDrive.js` (direct inspection) — reference pattern for named object return, useCallback deps, useRef usage
- React 19.2.0 (installed in project) — lazy initializer pattern, functional updates, automatic batching
- `package.json` (direct inspection) — confirmed no test framework, confirmed React 19.2.0, available scripts

### Secondary (MEDIUM confidence)
- `.planning/phases/02-state-extraction/02-CONTEXT.md` — locked decisions (props drilling, named object return, Option B wiring)
- `.planning/codebase/ARCHITECTURE.md` — localStorage format, data flow confirmation

---

## Metadata

**Confidence breakdown:**
- State inventory: HIGH — based on complete App.jsx line-by-line inspection
- Hook assignment: HIGH — validated against actual code, with specific rationale for each edge case
- Architecture patterns: HIGH — lazy initializer is standard React pattern, props drilling is locked decision
- Pitfalls: HIGH — derived from actual code patterns in App.jsx
- React 19 specifics: MEDIUM — concurrent rendering risks are documented React behavior; Electron app is simpler context

**Research date:** 2026-03-17  
**Valid until:** Stable (pure React hooks pattern, no fast-moving deps)
