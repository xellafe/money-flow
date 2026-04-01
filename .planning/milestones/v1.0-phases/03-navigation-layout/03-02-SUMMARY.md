---
phase: 03-navigation-layout
plan: "02"
subsystem: layout-shell
tags: [sidebar, navigation, framer-motion, tailwind, layout]
dependency_graph:
  requires: ["03-01"]
  provides: ["sidebar-navigation", "app-layout-shell", "settings-view-placeholder"]
  affects: ["src/App.jsx", "src/components/layout/", "src/views/"]
tech_stack:
  added: ["eslint-plugin-react (dev, for jsx-uses-vars)"]
  patterns: ["motion.div with layout prop for reflow", "Sidebar component with animated width", "AppLayout as root wrapper"]
key_files:
  created:
    - src/components/layout/Sidebar.jsx
    - src/components/layout/AppHeader.jsx
    - src/components/layout/AppLayout.jsx
    - src/views/SettingsView.jsx
  modified:
    - src/App.jsx
    - eslint.config.js
    - package.json
key_decisions:
  - "Removed exportData/exportBackup/importBackup/handlePayPalFile from App.jsx destructuring — old header UI gone; will re-add in Settings view (Phase 6)"
  - "Added eslint-plugin-react + react/jsx-uses-vars to fix JSX variable tracking — without it, motion and Icon variables falsely reported unused"
  - "Removed setSelectedMonth/setSelectedYear from App.jsx destructuring — filters-bar removed; each view owns filters from Phase 4+"
metrics:
  duration: "18m"
  completed: "2026-03-18"
  tasks: 2
  files: 6
---

# Phase 3 Plan 02: Layout Shell Components Summary

**One-liner:** Sidebar-based navigation layout with Framer Motion animated collapse (240px/64px), view-aware AppHeader with CTA, and SettingsView placeholder integrated as root AppLayout wrapper.

## What Was Built

### Task 1: Layout Shell Components (commit 32bfdc8)

Four new components created from scratch per UI-SPEC:

- **`src/components/layout/Sidebar.jsx`** — Animated sidebar using `motion.div` with `animate={{ width: collapsed ? 64 : 240 }}`, 200ms easeInOut transition. Three nav items (Dashboard, Transazioni, Impostazioni) with Lucide icons (LayoutDashboard, ArrowLeftRight, Settings). Active state: `bg-brand-500/10 text-brand-500`. Toggle button at bottom with ChevronLeft that rotates 180° when collapsed. `aria-label` on all interactive elements. `font-semibold` per UI-SPEC.

- **`src/components/layout/AppHeader.jsx`** — Header with `VIEW_TITLES` map. Shows "Aggiungi transazione" CTA button with `Plus` icon only when `view === 'transactions'`. Uses `hover:bg-brand-600` token from Plan 03-01.

- **`src/components/layout/AppLayout.jsx`** — Root flex layout (`flex h-screen overflow-hidden bg-gray-50`). Sidebar + `motion.div` with `layout` prop for smooth content reflow when sidebar toggles. `min-w-0` prevents flex overflow. AppHeader + `<main className="flex-1 overflow-auto">` inside.

- **`src/views/SettingsView.jsx`** — Minimal placeholder with "Impostazioni" heading and sync description. No state, no imports.

### Task 2: App.jsx Integration (commit 7ddf949)

- **Root wrapper replaced:** `<div className="app-container">` → `<AppLayout view setView collapsed onToggle onAddTransaction>`
- **Old UI blocks removed:** `<header className="app-header">` (File + Actions dropdowns), `.filters-bar` (month/year selectors), `.tab-bar` (Dashboard/Movimenti tabs)
- **New route added:** `{view === 'settings' && <SettingsView />}`
- **useViewState updated:** Added `sidebarCollapsed, toggleSidebar` to destructuring
- **Unused destructuring cleaned up:** `exportData`, `exportBackup`, `importBackup`, `setSelectedMonth`, `setSelectedYear`, `handlePayPalFile`, `openDropdown`, `setOpenDropdown`
- **Lucide icons cleaned:** Removed `Save`, `FolderOpen`, `Settings`, `CreditCard`, `CloudOff` (header-only); kept `ChevronDown`, `Tag`, `Plus`, `Cloud`, etc. (still used in view content)
- **All existing functionality preserved:** Drop zone, dashboard charts, transaction list, all modals, Toast

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added eslint-plugin-react + react/jsx-uses-vars rule**
- **Found during:** Task 2 (full lint run after App.jsx changes)
- **Issue:** ESLint's `no-unused-vars` rule without `eslint-plugin-react` does not track JSX element usage of variables. `motion` (in `<motion.div>`) and `Icon` (in `<Icon />`) were falsely reported as unused.
- **Fix:** Installed `eslint-plugin-react` dev dependency, added `plugins: { react }` and `'react/jsx-uses-vars': 'error'` to `eslint.config.js`
- **Files modified:** `eslint.config.js`, `package.json`, `package-lock.json`
- **Commit:** 7ddf949

**2. [Rule 1 - Bug] Removed unused destructured vars from App.jsx**
- **Found during:** Task 2 (lint after removing old header/filters-bar/tab-bar)
- **Issue:** `exportData`, `exportBackup`, `importBackup`, `setSelectedMonth`, `setSelectedYear`, `handlePayPalFile`, `openDropdown`, `setOpenDropdown` were destructured but no longer used after old UI blocks were removed
- **Fix:** Removed from useTransactionData, useFilters, useImportLogic, and useModals destructuring
- **Files modified:** `src/App.jsx`
- **Commit:** 7ddf949

## Verification Results

- `npm run lint` (via eslint): ✓ exit 0
- `npm run build` (via vite): ✓ exit 0, 2369 modules
- All 4 layout component files created with correct exports
- App.jsx uses `<AppLayout>` as root wrapper
- Old header, tab-bar, filters-bar completely removed
- Settings view accessible via `view === 'settings'`

## Checkpoint Result

Task 3 (human smoke test) — **APPROVED** ✅

All 13 verification items passed by user in Electron:
- Sidebar renders at correct widths (240px expanded / 64px collapsed)
- Sidebar collapses/expands with smooth 200ms animation (no jank)
- Active nav item highlighted correctly (`bg-brand-500/10 text-brand-500`)
- Header title updates on view navigation
- "Aggiungi transazione" button visible only on Transazioni view
- Main content reflows smoothly when sidebar toggles
- Settings view shows placeholder content
- No CSP violations, no console errors

## Self-Check: PASSED

- ✓ `src/components/layout/Sidebar.jsx` — exists
- ✓ `src/components/layout/AppHeader.jsx` — exists
- ✓ `src/components/layout/AppLayout.jsx` — exists
- ✓ `src/views/SettingsView.jsx` — exists
- ✓ `03-02-SUMMARY.md` — exists
- ✓ commit 32bfdc8 — Task 1 (layout components)
- ✓ commit 7ddf949 — Task 2 (App.jsx integration)
- ✓ Task 3 — Electron smoke test approved by user
