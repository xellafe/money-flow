# Coding Conventions

**Analysis Date:** 2025-01-29

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `GoogleSignInButton.jsx`, `StatCard.jsx`, `CategoryManager.jsx`)
- Utilities: camelCase (e.g., `useGoogleDrive.js`, `index.js`)
- Styles: kebab-case (e.g., `App.css`, `index.css`)

**Functions:**
- Component functions: PascalCase (e.g., `export default function MoneyFlow()`, `export default function StatCard()`)
- Utility functions: camelCase (e.g., `formatCurrency()`, `parseDate()`, `findMatchingCategories()`)
- Event handlers: `handleActionName` prefix (e.g., `handleAddCategory()`, `handleConfirm()`, `handleDecision()`)
- State setters: `setStateName` pattern (e.g., `setTransactions`, `setCategories`, `setLoading`)
- Callbacks: `onActionName` prefix in props (e.g., `onClose`, `onConfirm`, `onCancel`, `onAddCategory`)

**Variables:**
- State variables: camelCase (e.g., `transactions`, `categories`, `importProfiles`, `loading`)
- Boolean flags: prefixed with `is`, `has`, `show` (e.g., `isLoading`, `hasDrivePermission`, `showToast`)
- Object properties: camelCase (e.g., `bankId`, `dateColumn`, `descriptionColumn`)
- Constants: UPPER_SNAKE_CASE (e.g., `COLORS`, `DEFAULT_CATEGORIES`, `BUILTIN_IMPORT_PROFILES`)

**Types/Props:**
- Props objects destructured in function signature (e.g., `function StatCard({ label, value, icon: Icon, type })`)
- No explicit TypeScript used - JSDoc for documentation instead

## Code Style

**Formatting:**
- Indentation: 2 spaces (observed in all files)
- Line endings: LF
- Semicolons: Present, used consistently
- Trailing commas: Present in objects/arrays

**Linting:**
- Tool: ESLint 9.39.1
- Config: `eslint.config.js` (flat config format)
- Extends: `@eslint/js` recommended, `react-hooks`, `react-refresh` for Vite
- Target: ECMAScript 2020, JSX enabled

**ESLint Rules Applied:**
```javascript
{
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
}
```
- Enforces no unused variables except those starting with capital letter or underscore
- Allows intentionally unused hook results

## Import Organization

**Order:**
1. React hooks and React DOM (e.g., `import { useState, useEffect } from "react"`)
2. Third-party UI/data libraries (e.g., `import * as XLSX from "xlsx"`)
3. Chart/icon libraries (e.g., `import { PieChart, Pie, ... } from "recharts"`)
4. Local constants (e.g., `import { COLORS, BUILTIN_IMPORT_PROFILES, ... } from "./constants"`)
5. Local utilities (e.g., `import { formatCurrency, parseDate, ... } from "./utils"`)
6. Local components (e.g., `import { Toast, StatCard, ... } from "./components"`)
7. Custom hooks (e.g., `import { useGoogleDrive } from "./hooks"`)
8. Styles (e.g., `import "./App.css"`)

**Path Aliases:**
- Not used - relative imports throughout (e.g., `"./components"`, `"../utils"`)

**Barrel Files:**
- Used for component exports: `src/components/index.js`
- Used for modal component exports: `src/components/modals/index.js`
- Used for hook exports: `src/hooks/index.js`
- Pattern: Default exports from component files, re-exported as named exports

Example barrel file (`src/components/index.js`):
```javascript
export { default as Toast } from './Toast';
export { default as StatCard } from './StatCard';
export { default as GoogleSignInButton } from './GoogleSignInButton';
export * from './modals';
```

## Error Handling

**Patterns:**

Try/catch for synchronous operations with user-facing errors:
```javascript
try {
  const saved = localStorage.getItem("moneyFlow");
  if (saved) {
    const data = JSON.parse(saved);
    // process data
  }
} catch (error) {
  console.error("Errore caricamento dati:", error);
  showToast("Errore nel caricamento dei dati salvati", "error");
} finally {
  setIsInitialized(true);
}
```

Async operations with try/catch:
```javascript
const refreshUserInfo = useCallback(async () => {
  if (!window.electronAPI?.googleDrive) return;
  
  try {
    const result = await window.electronAPI.googleDrive.getUserInfo();
    if (result.success && result.userInfo) {
      setUserInfo(result.userInfo);
    }
  } catch (err) {
    console.error('Errore recupero info utente:', err);
  }
}, []);
```

Toast notifications for user feedback:
```javascript
const showToast = useCallback((message, type = "success") => {
  setToast({ message, type });
}, []);

// Usage in error context
showToast("Errore nel caricamento dei dati salvati", "error");
showToast("Transazione aggiunta", "success");
```

Null/undefined validation before processing:
```javascript
if (!val) return 0;
if (!desc || amt === 0) return null;
if (!dateColumn || !descriptionColumn) return false;
```

## Logging

**Framework:** `console` (no logger library)

**Patterns:**

Errors logged with context:
```javascript
console.error("Errore caricamento dati:", error);
console.error("Errore recupero info utente:", err);
console.error('Errore verifica auth:', err);
```

No verbose logging in happy path - only errors logged to console.

## Comments

**When to Comment:**

JSDoc comments for component/function documentation:
```javascript
/**
 * Pulsante Sign in with Google secondo le linee guida ufficiali
 * https://developers.google.com/identity/branding-guidelines
 */
export default function GoogleSignInButton({ onClick, disabled, isLoading, style }) {
  // ...
}

/**
 * Formatta un valore come valuta EUR
 * @param {number} value - Valore da formattare
 * @returns {string} Valore formattato come valuta
 */
export const formatCurrency = (value) => {
  // ...
};
```

JSDoc for function parameters and return types:
```javascript
/**
 * Modal per la gestione delle categorie
 * @param {Object} props
 * @param {Object} props.categories - Oggetto categorie { nome: [keywords] }
 * @param {boolean} props.categoriesChanged - Flag modifiche non applicate
 * @param {Function} props.onAddCategory - Callback per aggiungere categoria
 */
export default function CategoryManager({ ... }) {
  // ...
}
```

Inline comments for business logic or non-obvious patterns:
```javascript
// Rimuove tutto tranne numeri, virgola, punto e segno meno
const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(',', '.');

// Una sola keyword per categoria
break; // One keyword per category

// Più match: prendi quello con la keyword più lunga (più specifica)
const best = matches.reduce((a, b) => a.keyword.length >= b.keyword.length ? a : b);
```

Comments in Italian mixed with English (follows codebase language usage).

## Function Design

**Size:** Compact, 20-50 lines typical

**Parameters:** 
- Props passed as destructured object in function signature
- Example: `function StatCard({ label, value, icon: Icon, type })`
- Callbacks as optional props with `on` prefix
- All props documented in JSDoc

**Return Values:**
- Components return JSX
- Utilities return data types (string, number, array, object, null)
- Null returned for invalid inputs: `if (!val) return 0`
- Filtered/processed arrays returned when filtering: `.filter(t => t !== null)`

**Async Functions:**
- useCallback pattern for stable function references
- useEffect dependencies properly listed
- Refs (useRef) used for persistent state across renders without triggering re-renders

## Module Design

**Exports:**

Components exported as default exports:
```javascript
export default function GoogleSignInButton({ ... }) { }
export default function StatCard({ ... }) { }
```

Utilities exported as named exports:
```javascript
export const formatCurrency = (value) => { };
export const parseDate = (val) => { };
export const findMatchingCategories = (description, categories) => { };
```

Constants exported as named exports:
```javascript
export const COLORS = [ /* ... */ ];
export const BUILTIN_IMPORT_PROFILES = { /* ... */ };
export const DEFAULT_CATEGORIES = { /* ... */ };
```

**Barrel Files:**
- Components re-exported from index files for cleaner imports
- Pattern: Import from `'./components'` instead of `'./components/StatCard.jsx'`
- Modals grouped: `export * from './modals'` in components/index.js

## React Patterns

**Hooks:**
- useState for component state
- useEffect for side effects (data loading, subscriptions)
- useCallback for stable function references in dependencies
- useMemo for expensive computations
- useRef for persistent values across renders

**State Management:**
- Component-level state via useState (no global state management library)
- localStorage for persistence
- Electron IPC for inter-process communication

**Rendering:**
- Conditional rendering with ternary: `{condition ? <Component /> : null}`
- List rendering with .map(): `{items.map(item => <Item key={item.id} {...item} />)}`
- Class names concatenation: `className={`stat-card ${type}`}`

---

*Convention analysis: 2025-01-29*
