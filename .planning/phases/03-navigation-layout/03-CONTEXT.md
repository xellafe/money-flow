# Phase 3: Navigation & Layout — Context

**Phase:** 03 — Navigation & Layout  
**Goal:** Establish fixed sidebar navigation and layout structure that adapts to window size  
**Requirements:** NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06

---

## Decisions

### 1. Animation library — Framer Motion (install now)

Install Framer Motion in Phase 3. It will be used for sidebar layout animations and reused in Phase 6 (Modal fade+scale animations).

**Approach:** Full Framer Motion layout animations using the `layout` prop. The sidebar is a `motion.div`; sibling `main` content uses `layout` so it automatically reflows when the sidebar width changes.

**Duration:** 200ms `ease-in-out` — snappy desktop-app feel.

**Toggle button:** Chevron arrow (`ChevronLeft` Lucide icon) inside the sidebar, rotates 180° when collapsed. Placed at the bottom of the sidebar nav items.

**CSP note:** Verify Framer Motion works under the existing Electron dev CSP (`'unsafe-inline'` gated to dev mode). Production CSP must remain strict — Framer Motion uses inline styles which are covered by `'unsafe-inline'`; confirm no eval usage.

**Install command:**
```
npm install framer-motion
```

---

### 2. Impostazioni view — Placeholder shell

Phase 3 creates the Impostazioni route as a **placeholder shell only** — a heading + empty state. The actual settings content (Google Drive sync, category management) is delivered in Phase 6+.

**Always visible:** The Impostazioni nav item is shown in the sidebar regardless of whether any transactions exist. (Dashboard and Transazioni items follow the same always-visible rule.)

**Implication for current SyncSettings button:** The Google Drive sync button currently in the header is removed from the header in Phase 3. It moves to the Impostazioni placeholder view (even if just a note "coming in Phase 6"). This keeps the header clean.

---

### 3. Sidebar collapse — `useViewState` hook with localStorage

Create a new **`useViewState`** hook that owns both navigation state and sidebar UI state.

**Hook API:**
```js
export function useViewState() {
  // view: 'dashboard' | 'transactions' | 'settings'
  // sidebarCollapsed: boolean, persisted to localStorage key 'sidebarCollapsed'
  return { view, setView, sidebarCollapsed, setSidebarCollapsed };
}
```

**localStorage key:** `'sidebarCollapsed'` (boolean, defaults to `false` = expanded)

**Migration:** `view` + `setView` are **migrated from `useFilters`** to `useViewState`. `useFilters` becomes pure filter state (searchQuery, pagination, date filters, category filters). App.jsx imports `view`/`setView` from `useViewState` instead of `useFilters`.

**Barrel update:** `src/hooks/index.js` exports `useViewState` alongside existing hooks.

---

### 4. Header & layout structure

**Header title:** Current view name only — "Dashboard", "Transazioni", or "Impostazioni". No subtitle, no breadcrumb, no app name.

**Contextual actions per view:**
| View | Header action |
|------|--------------|
| Dashboard | *(none)* |
| Transazioni | "Aggiungi transazione" button (opens existing add-transaction modal) |
| Impostazioni | *(none)* |

**Google Drive:** Removed from header. Lives in Impostazioni view (placeholder).

**Filter bar removed:** The existing `filters-bar` (month buttons + year selector) is **removed** from the global layout. Each view (Dashboard in Phase 4, Transactions in Phase 5) will own its own filter controls internally. This prevents duplication and deferred cleanup debt.

**Empty state:** When no transactions exist, the drop-zone is the full content area — the sidebar and header are still rendered (sidebar always visible, header shows view title). This replaces the current "hide tabs when no data" behavior.

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px expanded / 64px collapsed)           │
│  [Logo / App name]                                  │
│  ● Dashboard                                        │
│  ○ Transazioni                                      │
│  ○ Impostazioni                                     │
│  ...                                                │
│  [Chevron toggle button — bottom]                   │
├─────────────────────────────────────────────────────┤
│ Header (full width, right of sidebar)               │
│  [View title]              [Contextual action btn]  │
├─────────────────────────────────────────────────────┤
│ Main content (fills remaining space)                │
│  <Dashboard | Transactions | Settings placeholder>  │
└─────────────────────────────────────────────────────┘
```

The root layout is a flex row: sidebar + flex-col (header + main).

---

## Code Context

**`view` state migration:**
- Current location: `src/hooks/useFilters.js` — remove `view`, `setView`
- New location: `src/hooks/useViewState.js` — add `view`, `setView`, `sidebarCollapsed`, `setSidebarCollapsed`
- App.jsx: import `useViewState`, destructure `{ view, setView }` from it instead of `useFilters`

**Existing components to extract from App.jsx:**
- Current nav (`<nav className="tab-bar">`) → replaced by new `<Sidebar>` component
- Current header (`<header>`) → replaced/refactored into new `<AppHeader>` component
- Main content wrapper → wrapped in `<main>` with Framer Motion `layout`

**New component files:**
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/AppHeader.jsx`
- `src/components/layout/AppLayout.jsx` (root layout wrapper, optional)
- `src/views/SettingsView.jsx` (placeholder)

**Lucide icons available (already installed):**
- `LayoutDashboard` or `Home` — Dashboard
- `ArrowLeftRight` or `List` — Transazioni
- `Settings` — Impostazioni
- `ChevronLeft` — sidebar toggle (rotates 180° when collapsed)

**Tailwind v4 tokens available:**
- `--color-sidebar` (define if needed), use `bg-white` or `bg-neutral-50`
- `--spacing-*` design tokens already defined in Phase 1
- `transition-all` utility + Framer Motion `layout` for resize

---

## Out of Scope (deferred)

- Settings page content (Google Drive, CategoryManager) → Phase 6
- Keyboard shortcuts for sidebar toggle → Phase 7
- Responsive breakpoints for very small windows → Phase 7
- Tooltip labels on collapsed sidebar icons → Phase 7
