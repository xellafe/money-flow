# Phase 2: State Extraction — Context

**Phase:** 02 — State Extraction  
**Goal:** Extract 7 custom hooks from App.jsx (2127 lines) and wire them back in. App.jsx must remain functionally identical after extraction.

---

## Decisions

### 1. Wiring scope — Option B: Create + Wire in Phase 2

Phase 2 is complete only when App.jsx **calls** the new hooks. Not "create hooks, wire later in Phase 3." The inline `useState` calls in App.jsx are replaced in this phase.

**Implication:** Each hook is created and immediately wired into App.jsx. No dangling hook files at end of phase.

---

### 2. localStorage backup — N/A (dev environment)

User is still in development, data loss is acceptable. FOUND-11 (localStorage backup) is considered **not applicable** for this phase. No backup hook, no snapshot script.

---

### 3. Cross-hook dependencies — Props drilling

Hook inter-dependencies are resolved by passing values as explicit parameters.

**Pattern:**
```js
// In App.jsx:
const { transactions, addTransaction } = useTransactionData();
const { categories } = useCategories();
const { wizardData, ... } = useImportLogic({ addTransaction, categories });
```

Each hook remains independent and individually testable. No hidden coupling. Consistent with existing `useGoogleDrive` pattern.

---

### 4. Hook return API — Named object

All hooks return a plain object (named fields), not a destructured array.

**Pattern:**
```js
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);
  return { toast, showToast, setToast };
}
```

Consistent with `useGoogleDrive.js`. Allows selective destructuring. New fields never break callers.

---

## Hook Map (state groupings)

| Hook | State variables | Dependencies |
|------|----------------|-------------|
| `useTransactionData` | `transactions`, localStorage persistence | none |
| `useCategories` | `categories`, `categoriesChanged`, `categoryConflicts`, `importProfiles` | none |
| `useFilters` | `searchQuery`, `currentPage`, `dashboardTypeFilter`, `dashboardCategoryFilter`, `transactionsCategoryFilter`, `expandedCategory`, `showCategoryPercentage`, `selectedMonth`, `selectedYear`, `view` | none |
| `useModals` | `confirmDelete`, `editingTx`, `editingDescription`, `newDescription`, `showAddTransaction`, `showCategoryManager`, `showSyncSettings`, `openDropdown`, `newTransaction` | none |
| `useImportLogic` | `wizardData`, `importConflicts`, `categoryResolutions`, `paypalData`, `dragOver`, `loading` | `addTransaction` (from useTransactionData), `categories` (from useCategories) |
| `useToast` | `toast` + `showToast` helper | none |

> Note: `isInitialized` stays in App.jsx (controls initialization guard, not extractable logic).

---

## Code Context

**Existing hook pattern** (`src/hooks/useGoogleDrive.js`):
- Returns named object
- Uses `useCallback` for stable function references
- Uses `useEffect` for side effects
- Exported from `src/hooks/index.js` barrel

**Hook barrel** (`src/hooks/index.js`):
- Currently exports only `useGoogleDrive`
- Phase 2 adds 6 new exports

**App.jsx structure:**
- All `useState` declarations are at the top (~lines 50–90)
- Business logic functions follow (CRUD handlers, localStorage effects)
- JSX render at bottom
- 2127 lines total

**Naming:**
- Hook files: camelCase (e.g., `useTransactionData.js`)
- Barrel re-exports: named exports
- All follow existing `src/hooks/` conventions

---

## Out of Scope (deferred)

- UI component extraction → Phase 3
- Tailwind class application → Phase 3+
- Error boundaries → deferred
- `useLocalStorageBackup` hook → N/A (dev environment)
