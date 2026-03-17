# Architecture Patterns: MoneyFlow Refactor + Tailwind CSS v4

**Project:** MoneyFlow UI/UX Redesign
**Domain:** Desktop Finance Application (Electron + React 19)
**Researched:** 2026-03-17
**Confidence:** HIGH (based on established React/Tailwind patterns and codebase analysis)

## Executive Summary

Refactoring a 2,127-line monolithic React component while introducing Tailwind CSS v4 requires a systematic extraction strategy that preserves existing functionality while enabling incremental UI redesign. The architecture must balance three competing concerns: **state extraction** (moving logic to custom hooks), **component hierarchy** (establishing clear boundaries), and **incremental CSS migration** (introducing Tailwind without breaking existing styles).

**Key architectural decision:** Extract state management first (Phase 1), establish component boundaries second (Phase 2), then migrate CSS incrementally view-by-view (Phase 3+). This ordering allows parallel work on UI redesign while state refactoring stabilizes, minimizing merge conflicts and regression risk.

## Recommended Architecture

### Component Hierarchy

```
MoneyFlow (App.jsx) — Root coordinator
├── Layout
│   ├── Sidebar — Navigation, filters, category selector
│   ├── Header — Breadcrumb/title, sync status, settings
│   └── MainContent — View container
│       ├── DashboardView
│       │   ├── StatsGrid (StatCard components)
│       │   ├── ChartsSection
│       │   │   ├── CategoryPieChart
│       │   │   ├── MonthlyBarChart
│       │   │   └── TrendAreaChart
│       │   └── CategoryBreakdown (expandable detail)
│       ├── TransactionsView
│       │   ├── TransactionFilters (search, date, category)
│       │   ├── TransactionTable
│       │   │   ├── TransactionRow (editable inline)
│       │   │   └── TransactionActions (edit, delete)
│       │   └── Pagination
│       └── SettingsView (future)
├── Modals (Portal-rendered)
│   ├── ImportWizard
│   ├── ConflictResolver
│   ├── CategoryManager
│   ├── CategoryConflictResolver
│   ├── PayPalEnrichWizard
│   ├── SyncSettings
│   ├── ConfirmModal
│   └── AddTransactionModal
└── Shared Components
    ├── Button (primary, secondary, danger variants)
    ├── Input (text, number, date)
    ├── Select (with search for categories)
    ├── Card (with header, body, footer slots)
    ├── Toast (notification system)
    └── EmptyState (illustrations for no data)
```

**Component Boundaries:**

| Component | Responsibility | Props In | Events Out |
|-----------|---------------|----------|------------|
| **Sidebar** | Navigation, filters | activeView, categories, selectedCategory | onViewChange, onCategoryFilter, onDateChange |
| **DashboardView** | Stats + charts orchestration | transactions, selectedMonth, selectedYear, filters | onCategoryExpand, onFilterChange |
| **TransactionsView** | Transaction CRUD UI | transactions, categories, filters, pagination | onEdit, onDelete, onAdd, onPageChange |
| **TransactionRow** | Single transaction display/edit | transaction, categories, isEditing | onSave, onCancel, onDelete, onEdit |
| **Modals** | Isolated workflows | isOpen, data, onConfirm, onCancel | onConfirm(data), onCancel() |

**Data flow:** Unidirectional top-down. Root component (`MoneyFlow`) owns state via custom hooks, passes down via props, receives updates via callbacks.

### State Management Strategy

**Current problem:** All state lives in `App.jsx` (23+ useState calls). Refactor extracts into domain-specific custom hooks.

#### Recommended Custom Hooks

**1. `useTransactionData()`**
- **Purpose:** Manage transactions array and CRUD operations
- **State:** `transactions`, `loading`
- **Methods:** `addTransaction`, `updateTransaction`, `deleteTransaction`, `importTransactions`, `recategorizeAll`
- **Persistence:** Handles localStorage sync internally
- **Lines to extract:** App.jsx 80, 176-177, handlers for add/edit/delete

**2. `useCategories()`**
- **Purpose:** Manage categories and keyword mappings
- **State:** `categories`, `categoryResolutions`
- **Methods:** `addCategory`, `updateCategory`, `deleteCategory`, `resolveConflict`, `findMatches`
- **Persistence:** Syncs to localStorage
- **Lines to extract:** App.jsx 81, 99, 178-180, category-related handlers

**3. `useImportProfiles()`**
- **Purpose:** Manage import profiles (built-in + custom)
- **State:** `importProfiles`, `allProfiles` (computed)
- **Methods:** `saveProfile`, `deleteProfile`, `detectProfile`
- **Lines to extract:** App.jsx 82, 179, 214-242

**4. `useFilters()`**
- **Purpose:** Manage all filter state (date, search, category, type)
- **State:** `selectedMonth`, `selectedYear`, `searchQuery`, `dashboardTypeFilter`, `dashboardCategoryFilter`, `transactionsCategoryFilter`
- **Methods:** `setMonthFilter`, `setYearFilter`, `setSearchFilter`, `clearAllFilters`
- **Computed:** `filteredTransactions` (memoized)
- **Lines to extract:** App.jsx 84-85, 90, 115-116, 122-123

**5. `useViewState()`**
- **Purpose:** Manage UI view/navigation state
- **State:** `view`, `currentPage`, `expandedCategory`, `showCategoryPercentage`
- **Methods:** `navigateToView`, `changePage`, `toggleCategory`
- **Lines to extract:** App.jsx 83, 113-120

**6. `useModals()`**
- **Purpose:** Centralize modal open/close state
- **State:** Object with keys for each modal (wizardData, importConflicts, categoryConflicts, confirmDelete, paypalData, etc.)
- **Methods:** `openModal(name, data)`, `closeModal(name)`, `closeAllModals`
- **Lines to extract:** App.jsx 91-97, 102-103, 129-133

**7. `useToast()`**
- **Purpose:** Toast notification management
- **State:** `toast` (message, type, id)
- **Methods:** `showToast(message, type)`, `dismissToast()`
- **Auto-dismiss:** Timeout logic built-in
- **Lines to extract:** App.jsx 89, 166-168

**8. `useGoogleDrive()`** *(already exists)*
- **Current:** `src/hooks/useGoogleDrive.js`
- **No changes needed** — already well-extracted

#### Hook Dependency Graph

```
useTransactionData
├─ depends on: useCategories (for auto-categorization)
└─ used by: DashboardView, TransactionsView, modals

useCategories
└─ used by: useTransactionData, CategoryManager, Sidebar filters

useFilters
├─ depends on: useTransactionData (for filtering)
└─ used by: DashboardView, TransactionsView, Sidebar

useViewState
└─ used by: Sidebar, MainContent routing

useModals
└─ used by: all components that trigger modals

useToast
└─ used by: any component that needs notifications

useImportProfiles
├─ depends on: useTransactionData (for import)
└─ used by: ImportWizard, file handlers

useGoogleDrive
├─ depends on: useTransactionData, useCategories, useImportProfiles
└─ used by: SyncSettings modal
```

**Extract order (dependency-first):**
1. `useToast` (no dependencies)
2. `useModals` (no dependencies)
3. `useViewState` (no dependencies)
4. `useCategories` (no dependencies)
5. `useImportProfiles` (no dependencies)
6. `useTransactionData` (depends on useCategories)
7. `useFilters` (depends on useTransactionData)

### Design System Architecture

#### Token Organization (CSS Variables)

**File structure:**
```
src/
├── styles/
│   ├── tokens.css          # CSS variable definitions
│   ├── base.css            # Reset + base styles
│   ├── utilities.css       # Custom utility classes (if needed)
│   └── index.css           # Import orchestrator
├── App.css                 # Legacy styles (deprecated gradually)
└── tailwind.config.js      # Tailwind v4 configuration
```

**Token Hierarchy (tokens.css):**

```css
@layer base {
  :root {
    /* Semantic Color Palette — Finance Domain */
    --color-income: 34 197 94;      /* green-500 */
    --color-income-light: 134 239 172;  /* green-300 */
    --color-income-dark: 22 163 74;     /* green-600 */
    
    --color-expense: 239 68 68;     /* red-500 */
    --color-expense-light: 252 165 165;  /* red-300 */
    --color-expense-dark: 220 38 38;     /* red-600 */
    
    --color-neutral: 148 163 184;   /* slate-400 */
    --color-neutral-light: 226 232 240;  /* slate-200 */
    --color-neutral-dark: 71 85 105;     /* slate-600 */
    
    --color-primary: 59 130 246;    /* blue-500 — actions */
    --color-primary-hover: 37 99 235;    /* blue-600 */
    
    --color-background: 255 255 255;     /* white */
    --color-background-secondary: 248 250 252;  /* slate-50 */
    --color-surface: 255 255 255;        /* card background */
    --color-border: 226 232 240;         /* slate-200 */
    
    --color-text-primary: 15 23 42;      /* slate-900 */
    --color-text-secondary: 71 85 105;   /* slate-600 */
    --color-text-muted: 148 163 184;     /* slate-400 */
    
    /* Typography Scale */
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'Fira Code', ui-monospace, monospace;
    
    --text-xs: 0.75rem;    /* 12px */
    --text-sm: 0.875rem;   /* 14px */
    --text-base: 1rem;     /* 16px */
    --text-lg: 1.125rem;   /* 18px */
    --text-xl: 1.25rem;    /* 20px */
    --text-2xl: 1.5rem;    /* 24px */
    --text-3xl: 1.875rem;  /* 30px */
    
    /* Spacing Scale (matches Tailwind defaults) */
    --space-1: 0.25rem;    /* 4px */
    --space-2: 0.5rem;     /* 8px */
    --space-3: 0.75rem;    /* 12px */
    --space-4: 1rem;       /* 16px */
    --space-6: 1.5rem;     /* 24px */
    --space-8: 2rem;       /* 32px */
    --space-12: 3rem;      /* 48px */
    
    /* Elevation (shadows) */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    
    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
```

**Tailwind Config (tailwind.config.js):**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic finance colors
        income: {
          DEFAULT: 'rgb(var(--color-income) / <alpha-value>)',
          light: 'rgb(var(--color-income-light) / <alpha-value>)',
          dark: 'rgb(var(--color-income-dark) / <alpha-value>)',
        },
        expense: {
          DEFAULT: 'rgb(var(--color-expense) / <alpha-value>)',
          light: 'rgb(var(--color-expense-light) / <alpha-value>)',
          dark: 'rgb(var(--color-expense-dark) / <alpha-value>)',
        },
        neutral: {
          DEFAULT: 'rgb(var(--color-neutral) / <alpha-value>)',
          light: 'rgb(var(--color-neutral-light) / <alpha-value>)',
          dark: 'rgb(var(--color-neutral-dark) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        // System colors
        background: {
          DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
          secondary: 'rgb(var(--color-background-secondary) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        12: 'var(--space-12)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
    },
  },
  plugins: [],
}
```

**Rationale:**
- **CSS variables over hardcoded Tailwind values:** Allows runtime theming if needed later, centralized updates
- **RGB format for colors:** Enables alpha transparency with Tailwind's `/<alpha-value>` syntax
- **Semantic naming:** `income`, `expense`, `neutral` are domain-specific; `primary`, `surface`, `border` are system-level
- **Spacing matches Tailwind defaults:** Minimizes migration friction; familiar to developers

#### Component Styling Pattern

**Shared components use Tailwind classes, legacy views keep custom CSS temporarily:**

```jsx
// NEW: Shared Button component (src/components/shared/Button.jsx)
export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-fast focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-background-secondary text-text-primary hover:bg-neutral-light focus:ring-neutral',
    danger: 'bg-expense text-white hover:bg-expense-dark focus:ring-expense',
    ghost: 'bg-transparent text-text-secondary hover:bg-background-secondary',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Usage:**
```jsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
```

### Incremental CSS Migration Strategy

**Problem:** Can't rewrite all CSS at once without breaking existing UI. Need coexistence strategy.

#### Phase-Based Migration

**Phase 1: Foundation (No Visual Changes)**
- Install Tailwind CSS v4: `npm install -D tailwindcss@next`
- Create `tailwind.config.js` with semantic colors
- Create `src/styles/tokens.css` with CSS variables
- Update `src/index.css`:
  ```css
  @import 'tailwindcss';
  @import './styles/tokens.css';
  @import './App.css'; /* Legacy — to be deprecated */
  ```
- **Test:** All views render unchanged (Tailwind loaded but not used yet)

**Phase 2: Shared Components (New Code Only)**
- Create new shared components (`Button`, `Input`, `Card`, `Select`) with Tailwind classes
- **DO NOT** touch existing components yet
- Use new components in new features or heavily refactored views
- **Test:** New components render correctly, old components unchanged

**Phase 3: View-by-View Migration (Incremental)**
- **Order:** Migrate views by least-to-most complexity
  1. **SettingsView** (new/simple)
  2. **Sidebar** (navigation, filters)
  3. **Header** (breadcrumb, status)
  4. **DashboardView** → Start with `StatsGrid`, then charts
  5. **TransactionsView** → Start with filters, then table
  6. **Modals** (last — many, but isolated)

- **Per-view migration process:**
  1. Identify custom CSS classes used (e.g., `.transaction-item`, `.stat-card`)
  2. Rewrite component with Tailwind classes
  3. Remove custom CSS rules from `App.css`
  4. Test view in isolation (verify styling matches)
  5. Commit (one view per commit for easy rollback)

**Phase 4: Cleanup**
- Delete `App.css` (should be empty by now)
- Remove legacy color constants from `src/constants/index.js` (use tokens instead)
- Audit for remaining inline styles, convert to Tailwind

**Coexistence Strategy:**

**Custom CSS scoped to specific views (temporary):**
```css
/* App.css — Phase 3 migration in progress */

/* Dashboard styles — NOT YET MIGRATED */
.dashboard-stats {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Transactions styles — MIGRATED (classes removed) */
/* .transaction-item { ... } — DELETED */
```

**View components explicitly mark migration status:**
```jsx
// DashboardView.jsx — Phase 3: Partially migrated
export default function DashboardView({ ... }) {
  return (
    <div className="p-6"> {/* Tailwind */}
      <div className="dashboard-stats"> {/* Legacy CSS — TODO: migrate */}
        <StatCard {...} /> {/* NEW component with Tailwind */}
      </div>
    </div>
  );
}
```

**Avoid conflicts:**
- **Never** mix custom CSS and Tailwind on the same element (`<div className="stat-card p-4">` → pick one system)
- Use Tailwind's `@layer` directive if extending utilities
- Leverage CSS specificity: Tailwind uses low specificity, custom CSS can override if scoped

### Build Order & Dependency Strategy

**Goal:** Maximize parallel work, minimize blocking dependencies, reduce merge conflicts.

#### Recommended Build Order

**Milestone 1: Foundation (Sequential — Must Complete First)**
1. **Setup Tailwind CSS v4**
   - Install dependencies
   - Configure `tailwind.config.js` with semantic colors
   - Create `src/styles/` directory with tokens
   - Verify build works (no visual changes yet)
   - **Blocks:** All subsequent work
   - **Estimated time:** 0.5 days

2. **Extract `useToast` hook**
   - Move toast state/logic to `src/hooks/useToast.js`
   - Update `App.jsx` to use hook
   - Test toast notifications work
   - **Blocks:** None (but simplifies App.jsx for next extractions)
   - **Estimated time:** 0.5 days

3. **Extract `useModals` hook**
   - Move all modal state to `src/hooks/useModals.js`
   - Update `App.jsx` to use hook
   - Test all modals open/close correctly
   - **Blocks:** Component refactoring (modals will receive state from this hook)
   - **Estimated time:** 1 day

**Milestone 2: State Extraction (Parallel after Milestone 1)**

These can be built in parallel by different developers since they touch different state domains:

4. **Extract `useCategories` hook** (Developer A)
   - Move categories, categoryResolutions state
   - Add CRUD methods
   - Update App.jsx to use hook
   - **Blocks:** useTransactionData (depends on categorization logic)
   - **Estimated time:** 1.5 days

5. **Extract `useImportProfiles` hook** (Developer B)
   - Move importProfiles state and detection logic
   - Update App.jsx to use hook
   - **Blocks:** ImportWizard refactor
   - **Estimated time:** 1 day

6. **Extract `useViewState` hook** (Developer C)
   - Move view, currentPage, expandedCategory state
   - Add navigation methods
   - **Blocks:** Layout component refactor
   - **Estimated time:** 1 day

**Milestone 3: Core Data Hook (Sequential after Milestone 2)**

7. **Extract `useTransactionData` hook**
   - **Depends on:** `useCategories` (for auto-categorization)
   - Move transactions state, CRUD methods
   - Integrate with useCategories for auto-categorize
   - **Blocks:** All view components (they need transaction data)
   - **Estimated time:** 2 days

8. **Extract `useFilters` hook**
   - **Depends on:** `useTransactionData` (for filtering)
   - Move all filter state
   - Add computed `filteredTransactions` memo
   - **Blocks:** DashboardView, TransactionsView
   - **Estimated time:** 1.5 days

**Milestone 4: Shared Components (Parallel after Milestone 1)**

These can be built alongside state extraction since they're new code:

9. **Create shared UI components** (Designer + Developer D)
   - `Button`, `Input`, `Select`, `Card`, `Badge`
   - Build in Storybook or isolated test page
   - **Blocks:** View redesign (views will use these)
   - **Estimated time:** 2 days

**Milestone 5: Layout Refactor (Sequential after Milestone 3)**

10. **Build Layout structure**
    - **Depends on:** `useViewState`, shared components
    - Create `Sidebar`, `Header`, `MainContent` components
    - Extract from App.jsx
    - **Blocks:** View-specific work
    - **Estimated time:** 2 days

**Milestone 6: View Redesign (Parallel after Milestone 5)**

11. **Redesign DashboardView** (Developer A + Designer)
    - **Depends on:** `useTransactionData`, `useFilters`, Layout, shared components
    - Extract stats calculation to `useDashboardStats` hook
    - Build `StatsGrid`, chart components with Tailwind
    - Migrate custom CSS
    - **Estimated time:** 3 days

12. **Redesign TransactionsView** (Developer B + Designer)
    - **Depends on:** `useTransactionData`, `useFilters`, Layout, shared components
    - Build `TransactionTable`, `TransactionRow` with Tailwind
    - Add inline editing, pagination
    - Migrate custom CSS
    - **Estimated time:** 3 days

**Milestone 7: Modals Redesign (Parallel after Milestone 5)**

13. **Redesign Modals** (Developer C)
    - **Depends on:** `useModals`, shared components
    - Update modal wrappers with Tailwind (animations, backdrop)
    - Refactor modal content with shared components
    - Migrate custom CSS
    - **Estimated time:** 4 days (7 modals)

**Critical Path:**
```
Setup Tailwind (0.5d)
  → useModals (1d)
    → useCategories (1.5d)
      → useTransactionData (2d)
        → useFilters (1.5d)
          → Layout (2d)
            → DashboardView (3d) + TransactionsView (3d)
              → Modals (4d)
```
**Total critical path:** ~18 days

**Parallelizable work:**
- `useImportProfiles`, `useViewState` alongside `useCategories` (saves ~2 days)
- Shared components alongside state extraction (saves ~2 days)
- DashboardView + TransactionsView in parallel (saves ~3 days)

**Optimized timeline:** ~11-13 days with 3 developers

#### Merge Conflict Mitigation

**File ownership during refactor:**

| File | Owner | Phase | Notes |
|------|-------|-------|-------|
| `App.jsx` | **Lock for edits** | M1-M3 | State extraction phase — one person only |
| `src/hooks/*.js` | Respective dev | M2-M3 | Each hook owned by one developer |
| `src/components/shared/*.jsx` | Dev D | M4 | Isolated from App.jsx changes |
| `src/views/*.jsx` | Dev A/B | M6 | Parallel OK (different files) |
| `src/components/modals/*.jsx` | Dev C | M7 | Parallel OK (different files) |
| `App.css` | Dev A/B/C | M6-M7 | Delete rules as views migrate (coordinate) |
| `tailwind.config.js` | **Lock** | M1 | Modified once at start, read-only after |

**Strategy:**
- **Milestone 1-3:** Serial merges (one PR at a time into main)
- **Milestone 4+:** Feature branches, parallel PRs (different files)
- **App.jsx coordination:** Use explicit `TODO: extract X` comments to mark next refactor target

## Component Boundaries in Detail

### Data Flow Example: Transaction Edit

```
User clicks "Edit" on TransactionRow
  ↓
TransactionRow.onEdit(transactionId) callback
  ↓
TransactionsView passes callback up
  ↓
MoneyFlow (App.jsx) receives event
  ↓
useModals.openModal('editTransaction', transaction)
  ↓
EditTransactionModal renders with data
  ↓
User edits, clicks "Save"
  ↓
Modal.onConfirm(updatedTransaction) callback
  ↓
MoneyFlow receives event
  ↓
useTransactionData.updateTransaction(id, updates)
  ↓
Hook updates state, triggers localStorage save
  ↓
React re-renders TransactionsView with new data
  ↓
Toast shows "Transaction updated"
```

**Key principle:** Events flow up (callbacks), data flows down (props). No sibling component communication.

### State Ownership Rules

| State | Owner | Access Pattern |
|-------|-------|----------------|
| Transactions array | `useTransactionData` | Passed as prop to views, modified via hook methods |
| Categories | `useCategories` | Passed as prop to dropdowns, modified via CategoryManager |
| Active filters | `useFilters` | Passed to filter UI, computed `filteredTransactions` passed to views |
| Current view | `useViewState` | Passed to Sidebar (highlight), MainContent (routing) |
| Modal open state | `useModals` | Queried by App.jsx to render modal, modified by modal actions |
| Toast queue | `useToast` | Not passed as props; hook provides `showToast` method, Toast component reads queue |

**Anti-pattern to avoid:** Passing setters down the tree (`setTransactions` should never be a prop). Always wrap in semantic methods (`addTransaction`, `updateTransaction`).

## Anti-Patterns to Avoid

### 1. Premature Component Extraction
**Bad:** Extracting components before hooks are stable
**Why:** Component props will change as hooks are refactored; causes rework
**Instead:** Extract hooks first (Milestone 2-3), then components (Milestone 4-7)

### 2. "Big Bang" CSS Migration
**Bad:** Removing all custom CSS in one PR
**Why:** High regression risk, impossible to review, breaks existing UI
**Instead:** Migrate view-by-view (one component per PR), remove CSS rules incrementally

### 3. Mixing CSS Systems on Same Element
**Bad:** `<div className="stat-card bg-blue-500 p-4">` (custom + Tailwind)
**Why:** Specificity conflicts, unpredictable results, maintainability nightmare
**Instead:** Choose one system per element; during migration, wrap in Tailwind container if needed

### 4. Inline Styles Proliferation
**Bad:** Moving custom CSS to inline styles instead of Tailwind
**Why:** Loses all benefits of utility classes (consistency, reusability, purging)
**Instead:** Always use Tailwind classes; only use inline styles for truly dynamic values (e.g., `width: ${percentage}%`)

### 5. Hook Circular Dependencies
**Bad:** `useTransactionData` imports `useFilters`, `useFilters` imports `useTransactionData`
**Why:** React hook rules prevent circular imports; causes runtime errors
**Instead:** Establish clear dependency hierarchy (see Hook Dependency Graph); pass data as arguments, not hook imports

### 6. Prop Drilling Without Context
**Bad:** Passing `transactions` through 5 levels of components
**Why:** Boilerplate heavy, error-prone, difficult to refactor
**Instead:** For deeply nested shared state (e.g., theme, user, auth), use React Context; for view-specific state, 2-3 levels of drilling is acceptable

**When to use Context:**
- Global UI state: theme, toast notifications (already via hook), modals (already via hook)
- Auth/user state (future)
- i18n strings (future)

**When NOT to use Context:**
- Transaction data (prop passing is fine)
- Filters (localized to specific views)
- Form state (keep local to form component)

### 7. Overly Granular Hooks
**Bad:** `useTransactionById(id)`, `useTransactionsByCategory(cat)`, `useTransactionsByDate(date)` as separate hooks
**Why:** Explosion of hooks, maintenance burden, state synchronization issues
**Instead:** One `useTransactionData` hook with a separate `useFilters` hook that computes derived views via `useMemo`

## Testing Strategy

### Unit Testing Hooks

**Each custom hook should have tests:**

```javascript
// src/hooks/__tests__/useTransactionData.test.js
import { renderHook, act } from '@testing-library/react';
import { useTransactionData } from '../useTransactionData';

describe('useTransactionData', () => {
  it('adds transaction', () => {
    const { result } = renderHook(() => useTransactionData());
    
    act(() => {
      result.current.addTransaction({
        date: '2026-03-17',
        description: 'Test',
        amount: 100,
        category: 'Income',
      });
    });
    
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].description).toBe('Test');
  });
  
  // ... more tests for update, delete, import
});
```

**Priority:** Test hooks with complex logic (useTransactionData, useCategories). UI components can be tested visually.

### Visual Regression Testing

**For CSS migration (Phase 3-7):**
- **Before migrating a view:** Take screenshot (Playwright or Puppeteer)
- **After migrating:** Compare screenshot, ensure visual parity
- **Acceptable differences:** Tiny pixel shifts (fonts, shadows); unacceptable: layout breaks, missing elements

**Tool recommendation:** Playwright with `toHaveScreenshot()`

```javascript
// tests/visual/dashboard.spec.js
test('dashboard matches design', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', { maxDiffPixels: 100 });
});
```

### Integration Testing

**Key user flows to test:**
1. Import Excel file → Detect profile → Confirm → Transactions appear
2. Add manual transaction → Auto-categorize → Save → Appears in list
3. Edit transaction inline → Update description → Save → Persists
4. Open CategoryManager → Add keyword → Apply → Transactions recategorize
5. Filter transactions by month → List updates → Clear filter → Full list returns

**Tool:** React Testing Library + Vitest/Jest

## Performance Considerations

### Memoization Strategy

**Heavy computations to memoize:**

```javascript
// In useFilters hook
const filteredTransactions = useMemo(() => {
  return transactions.filter(tx => {
    // Date filter
    if (selectedYear && new Date(tx.date).getFullYear() !== selectedYear) return false;
    if (selectedMonth !== null && new Date(tx.date).getMonth() !== selectedMonth) return false;
    // Search filter
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Category filter
    if (categoryFilter && tx.category !== categoryFilter) return false;
    return true;
  });
}, [transactions, selectedYear, selectedMonth, searchQuery, categoryFilter]);
```

**Chart data:**
```javascript
// In DashboardView
const chartData = useMemo(() => {
  const categoryTotals = {};
  filteredTransactions.forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Math.abs(tx.amount);
  });
  return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
}, [filteredTransactions]);
```

**Avoid over-memoization:**
- Don't memoize simple array maps/filters (< 100 items)
- Don't memoize primitives or objects that change every render
- Profile first, optimize second

### Virtualization for Large Lists

**Current:** Pagination (100 items per page) — sufficient for MVP

**If transactions exceed 1000+ items:**
- Consider `react-window` or `react-virtual` for TransactionTable
- Render only visible rows (10-20) + buffer
- Reduces DOM nodes from 1000 to ~30

**Implementation deferred** — not needed for initial redesign (existing pagination is fine).

## Security Considerations

**No new security risks introduced by refactor,** but maintain existing patterns:

- **localStorage persistence:** Already used; no change
- **Google Drive sync:** Already implemented via `useGoogleDrive`; no change
- **IPC communication:** Electron preload.cjs already secured with contextBridge; no change
- **Input sanitization:** Excel/CSV parsing already handled; no change

**CSS-related security:**
- Tailwind purges unused classes at build time → smaller bundle (security via obscurity: less code to attack)
- No user-provided CSS injection risk (not accepting custom styles)

## Migration Risks & Mitigation

### Risk 1: State Extraction Breaks Existing Logic
**Likelihood:** Medium
**Impact:** High (app unusable if core CRUD broken)
**Mitigation:**
- Extract hooks one at a time with full testing
- Keep App.jsx functional after each extraction (no broken intermediate state)
- Use feature flags if needed (e.g., `USE_NEW_HOOKS` env var for gradual rollout)

### Risk 2: CSS Migration Breaks Layout
**Likelihood:** High (expected during migration)
**Impact:** Medium (visual only, not data loss)
**Mitigation:**
- Visual regression tests (screenshots)
- Migrate one view at a time
- Keep legacy CSS alongside Tailwind temporarily
- Rollback plan: revert single view/component

### Risk 3: Performance Regression from Re-Renders
**Likelihood:** Low
**Impact:** Medium (slow UI, user frustration)
**Mitigation:**
- Use React DevTools Profiler to measure before/after
- Memoize heavy computations (filters, chart data)
- `React.memo()` for pure presentational components if needed

### Risk 4: Merge Conflicts During Parallel Development
**Likelihood:** Medium (if not coordinated)
**Impact:** Low (time wasted on conflicts, but no data loss)
**Mitigation:**
- File ownership strategy (see Build Order)
- Serial PRs for App.jsx modifications (Milestone 1-3)
- Parallel PRs for isolated components (Milestone 4+)

## Open Questions & Research Gaps

1. **Tailwind CSS v4 adoption status:** Is v4 stable/production-ready? If not, fallback to v3.x.
   - **Action:** Check Tailwind docs for v4 release status before starting
   - **Fallback:** Use v3.4+ (current stable) with same semantic color strategy

2. **Recharts theming with Tailwind:** Can Recharts consume Tailwind colors via CSS variables?
   - **Research needed:** Test passing `stroke="rgb(var(--color-income))"` to Recharts components
   - **Fallback:** Use JavaScript color object mapped from Tailwind theme

3. **Electron + Vite + Tailwind HMR:** Any known issues with hot module reload during development?
   - **Action:** Test HMR after Tailwind setup (Milestone 1)
   - **Fallback:** Full reload if HMR breaks (acceptable for Electron dev)

4. **Inter font licensing:** Is Inter free for commercial use in Electron app?
   - **Answer:** Yes, Inter uses SIL Open Font License (free for all use)
   - **Action:** Add `@fontsource/inter` or Google Fonts CDN link

## Success Criteria

Refactor is complete when:

- [ ] All custom hooks extracted and tested (`useTransactionData`, `useCategories`, `useFilters`, etc.)
- [ ] App.jsx reduced to < 500 lines (from 2127)
- [ ] All views use Tailwind CSS (DashboardView, TransactionsView, Sidebar, Header, Modals)
- [ ] `App.css` deleted (all custom CSS migrated or removed)
- [ ] Visual regression tests pass (screenshots match pre-refactor)
- [ ] All existing functionality works (import, CRUD, sync, filters, charts)
- [ ] No performance degradation (dashboard renders in < 500ms)
- [ ] Shared component library complete (Button, Input, Card, Select, etc.)
- [ ] Design system tokens documented in `tokens.css`
- [ ] Build time < 5 seconds (Tailwind purge optimized)

---

**Confidence Assessment:**
- **Component extraction patterns:** HIGH (established React best practices)
- **Custom hook patterns:** HIGH (React documentation, proven patterns)
- **Tailwind CSS migration strategy:** MEDIUM-HIGH (based on common migration patterns; v4 specifics need verification)
- **Build order:** HIGH (dependency analysis from codebase structure)
- **Performance impact:** MEDIUM (memoization patterns proven, but specific app behavior needs profiling)

**Sources:**
- React Hooks documentation (https://react.dev/reference/react/hooks)
- Tailwind CSS documentation (https://tailwindcss.com/docs)
- Codebase analysis: `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONCERNS.md`
- Monolithic component analysis: `src/App.jsx` (2127 lines)
- Established patterns: Extract-hook-first strategy, view-by-view CSS migration

**Research Date:** 2026-03-17
