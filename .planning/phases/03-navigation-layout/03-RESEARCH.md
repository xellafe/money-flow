# Phase 03: Navigation & Layout — Research

**Researched:** 2026-03-17  
**Domain:** Framer Motion layout animations, React sidebar architecture, Tailwind v4 patterns, Electron CSP  
**Confidence:** HIGH (all key claims verified against source code, npm registry, and established patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Framer Motion installed now** — Full layout animations with `layout` prop, 200ms ease-in-out, chevron toggle rotating 180°. Install command: `npm install framer-motion`.

2. **`useViewState` hook (new)** owns `view` + `sidebarCollapsed` (localStorage-persisted at `'sidebarCollapsed'`, default `false`). `view` migrated from `useFilters`. Hook API: `{ view, setView, sidebarCollapsed, setSidebarCollapsed }`.

3. **Impostazioni = placeholder shell only** (Phase 6 fills content). Google Drive sync button removed from header, moved to Impostazioni view.

4. **Filter bar (month/year) removed from global layout** — each view owns its own filters from Phase 4+.

5. **Header shows view title + contextual actions** — "Aggiungi transazione" button on Transazioni only; Dashboard and Impostazioni have none.

### Claude's Discretion

*(None specified — all key decisions are locked)*

### Deferred Ideas (OUT OF SCOPE)

- Settings page content (Google Drive, CategoryManager) → Phase 6
- Keyboard shortcuts for sidebar toggle → Phase 7
- Responsive breakpoints for very small windows → Phase 7
- Tooltip labels on collapsed sidebar icons → Phase 7
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | Sidebar fissa a sinistra (240px espansa, 64px collassata) con icone Lucide | Framer Motion `animate={{ width }}` pattern; CSS tokens `--spacing-sidebar` and `--spacing-sidebar-collapsed` already defined in `src/index.css` |
| NAV-02 | Sidebar collassabile via toggle button con animazione smooth (Framer Motion) | `motion.div` animate width + ChevronLeft rotate pattern documented in Code Examples |
| NAV-03 | Active state visivo sulla voce di navigazione corrente | Conditional Tailwind class pattern on nav items; `view` from `useViewState` |
| NAV-04 | Voci navigazione: Dashboard, Transazioni, Impostazioni | New `SettingsView.jsx` placeholder; existing `view` state extended to `'settings'` |
| NAV-05 | Header/top bar con titolo della view corrente e azioni contestuali | `AppHeader` component receives `view` prop; maps view → title + optional button |
| NAV-06 | Layout main content che si adatta alla sidebar espansa/collassata | Framer Motion `layout` prop on main content div; flex row container |
</phase_requirements>

---

## Summary

Phase 3 installs Framer Motion (v12, the current major — **not v11** as might be assumed from older docs) and builds a three-component layout system: `Sidebar`, `AppHeader`, and optionally `AppLayout`. The layout architecture is a CSS flex row: `motion.div` sidebar with animated width + `motion.div` main content with `layout` prop for automatic reflow.

**Critical discovery:** Framer Motion's current major is **v12** (12.38.0 as of 2026-03), not v11. The import remains `framer-motion` and the API is backward-compatible with v10/v11 for the patterns used here (`motion.div`, `layout`, `animate`, `AnimatePresence`). No API breakage for this use case.

**Critical CSP finding:** The production CSP (`style-src 'self'`) does NOT block Framer Motion. Framer Motion animates via JavaScript `element.style.property = value` (DOM manipulation), which is not governed by CSP's `style-src`. CSP `'unsafe-inline'` only controls HTML-level inline style attributes and `<style>` tags — not runtime JavaScript DOM manipulation. Production build is safe.

**Primary recommendation:** Use `motion.div` with `animate={{ width: collapsed ? 64 : 240 }}` on the sidebar. Put `layout` + `transition={{ layout: { duration: 0.2, ease: 'easeInOut' } }}` on the main content wrapper. No `LayoutGroup` needed (siblings in same render tree).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.38.0 (latest) | Sidebar width animation, chevron rotation, view transitions | Project decision; reused Phase 6 for modals |
| lucide-react | 0.563.0 (already installed) | Navigation icons (LayoutDashboard, ArrowLeftRight, Settings, ChevronLeft) | Already in project |
| tailwindcss | ^4.2.1 (already installed) | Layout utilities, conditional classes | Already in project; tokens `--spacing-sidebar` pre-defined |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react (useState, useEffect) | ^19.2.0 (already installed) | `useViewState` hook | New hook for view + sidebar state |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion layout | CSS transitions only | CSS transitions can't animate `flex-1` content reflow smoothly across component boundaries; Framer Motion handles it cleanly |
| Framer Motion layout | React Spring | Framer Motion locked in Phase 3 CONTEXT.md decision; React Spring is comparable but not chosen |

**Installation:**
```bash
npm install framer-motion
```

**Verified version:** `12.38.0` (confirmed via `npm view framer-motion version` on 2026-03-17). The package is still named `framer-motion` (not the newer `motion` package alias).

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   ├── useViewState.js          # NEW: view + sidebarCollapsed state
│   └── index.js                 # UPDATED: export useViewState
├── components/
│   └── layout/
│       ├── Sidebar.jsx          # NEW: fixed sidebar with nav items + toggle
│       ├── AppHeader.jsx        # NEW: view title + contextual action button
│       └── AppLayout.jsx        # NEW: root flex-row wrapper (optional but recommended)
├── views/
│   └── SettingsView.jsx         # NEW: placeholder shell (heading + empty state)
└── App.jsx                      # UPDATED: use useViewState, remove tab-bar/filters-bar/header, add AppLayout
```

### Pattern 1: Animated Sidebar with `motion.div`

**What:** Sidebar width is directly animated by Framer Motion via the `animate` prop. No CSS transitions needed on the sidebar itself.

**When to use:** Any element whose width change should animate — the sidebar is the primary case.

```jsx
// src/components/layout/Sidebar.jsx
import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, Settings, ChevronLeft } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'transactions',  label: 'Transazioni',  Icon: ArrowLeftRight },
  { id: 'settings',      label: 'Impostazioni', Icon: Settings },
];

export function Sidebar({ collapsed, onToggle, view, setView }) {
  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen flex flex-col bg-white border-r border-gray-200 overflow-hidden shrink-0"
    >
      {/* Logo / App name */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 shrink-0">
        <span className="text-brand-500 font-semibold truncate">
          {collapsed ? 'M' : 'MoneyFlow'}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150 cursor-pointer
              ${view === id
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Toggle button — bottom */}
      <div className="p-2 border-t border-gray-200 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer"
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronLeft size={20} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
}
```

### Pattern 2: Main Content with `layout` Prop

**What:** The main content div uses Framer Motion's `layout` prop, so it smoothly animates to fill the space vacated by the sidebar on collapse. Without `layout`, the content area snaps instantly to its new size as the sidebar animates.

**When to use:** Sibling of the animated sidebar; ensures content area reflows smoothly.

```jsx
// src/components/layout/AppLayout.jsx
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';

export function AppLayout({ view, setView, collapsed, onToggle, onAddTransaction, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={onToggle}
        view={view}
        setView={setView}
      />

      <motion.div
        layout
        transition={{ layout: { duration: 0.2, ease: 'easeInOut' } }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
      >
        <AppHeader
          view={view}
          onAddTransaction={onAddTransaction}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
```

**Key detail:** `transition={{ layout: { ... } }}` controls the layout animation specifically — this overrides the global `transition` for layout-triggered animations only, keeping `animate` animations unaffected.

### Pattern 3: `useViewState` Hook

**What:** Single hook owning navigation view + sidebar collapsed state, both surfaced to App.jsx. `view` is migrated from `useFilters`.

```jsx
// src/hooks/useViewState.js
import { useState } from 'react';

export function useViewState() {
  const [view, setView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Lazy initializer — reads localStorage synchronously at mount (consistent with project pattern)
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Persist sidebarCollapsed to localStorage on toggle
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', String(next)); } catch {}
      return next;
    });
  };

  return { view, setView, sidebarCollapsed, setSidebarCollapsed, toggleSidebar };
}

export default useViewState;
```

**Note on localStorage persistence pattern:** The project uses lazy initializers in hooks (established in Phase 2 — see `useCategories.js`). Follow the same pattern: `useState(() => JSON.parse(localStorage.getItem(...)) ?? default)`. For `sidebarCollapsed`, the value is a boolean stored as the string `'true'`/`'false'`.

### Pattern 4: `AppHeader` Component

**What:** Header bar receiving view name and optional contextual action.

```jsx
// src/components/layout/AppHeader.jsx
const VIEW_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Transazioni',
  settings:     'Impostazioni',
};

export function AppHeader({ view, onAddTransaction }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">
        {VIEW_TITLES[view] ?? 'MoneyFlow'}
      </h1>

      {view === 'transactions' && (
        <button
          onClick={onAddTransaction}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors duration-150 cursor-pointer"
        >
          <Plus size={16} />
          Aggiungi transazione
        </button>
      )}
    </header>
  );
}
```

### Pattern 5: `view` Migration from `useFilters`

**What:** `view` + `setView` are removed from `useFilters` and live in `useViewState`. `useFilters` effect that resets `currentPage` on `view` change still works (it reads from `useViewState`'s view, passed as a dependency).

**Migration in `useFilters.js`:**
- Remove `const [view, setView] = useState('dashboard');` 
- Remove `view` from the return object and from the page-reset effect dependency array

**Migration in `App.jsx`:**
```jsx
// BEFORE:
const { view, setView, selectedMonth, ... } = useFilters({ years });

// AFTER:
const { view, setView, sidebarCollapsed, toggleSidebar } = useViewState();
const { selectedMonth, ... } = useFilters({ years, view }); // pass view as param OR...
// OR: remove view dependency from useFilters page-reset effect (each view handles its own pagination)
```

**Decision point for planner:** Since the filter bar is removed from global layout (each view owns filters from Phase 4+), the `view` dependency in `useFilters`'s page-reset effect can be removed entirely in Phase 3. The `setCurrentPage(1)` on view change becomes moot because each view resets its own filters. This simplifies `useFilters`.

### Anti-Patterns to Avoid

- **Don't put `layout` on every element inside the sidebar** — only the sidebar div itself and the main content sibling should use layout animation. Inner elements (nav items, toggle button) must NOT have `layout` prop, or they'll animate unnecessarily and may cause jank.
- **Don't use CSS `transition` AND Framer Motion `animate` on the same property** — they'll conflict. Use one or the other. For width animation: Framer Motion `animate={{ width }}` only; remove any `transition-width` Tailwind class from the sidebar.
- **Don't use `position: fixed` for the sidebar** — use CSS flex row. Fixed positioning takes the sidebar out of document flow, requiring JS to calculate and manually set the main content `margin-left`. Flex layout handles this automatically and works better with Framer Motion `layout`.
- **Don't pass `sidebarCollapsed` as a prop through 3+ levels** — the sidebar receives it directly from `AppLayout`, which receives it from `App.jsx`. Maximum 2-level prop depth — no context API needed for this phase.
- **Don't initialize `sidebarCollapsed` with `useEffect`** — use lazy initializer in `useState(() => ...)` to read localStorage synchronously at mount (consistent with Phase 2 hook patterns; avoids flicker).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar width animation | CSS `transition: width` + JS class toggle | Framer Motion `animate={{ width }}` | CSS width transitions on flex children don't animate sibling reflow smoothly; FM handles layout projection correctly |
| Content reflow animation | Manual `margin-left` calculation + CSS transition | Framer Motion `layout` prop on main content | `layout` uses FLIP technique to capture before/after positions automatically — no manual calc needed |
| Chevron rotation | CSS transform + class toggle | Framer Motion `animate={{ rotate }}` on a `motion.div` | Already using FM for sidebar; consistent; less code |

**Key insight:** Framer Motion's FLIP-based `layout` system is the correct tool for this specific pattern (sidebar collapse → adjacent content reflow). CSS transitions alone can't animate the content's position change triggered by a sibling's width change, because there's no CSS trigger to animate from.

---

## Common Pitfalls

### Pitfall 1: Framer Motion Version Assumption

**What goes wrong:** Docs/examples from 2023-2024 reference v10/v11 APIs. Installing `framer-motion` today gets v12.

**Why it happens:** Training data cutoff; the package reached v12 in 2025.

**How to avoid:** Always use `import { motion, AnimatePresence } from 'framer-motion'` — the named exports are stable across v10/v11/v12 for the patterns used here. The `layout`, `animate`, `transition`, `AnimatePresence` APIs have not changed.

**Warning signs:** Import errors or type errors referencing removed APIs.

---

### Pitfall 2: `layout` Prop on Too Many Elements

**What goes wrong:** Adding `layout` to every `motion.div` in the sidebar (logo div, nav items, toggle) causes layout thrashing — Framer Motion measures ALL of them on every animation frame.

**Why it happens:** Developers think "more layout = smoother animation."

**How to avoid:** Only the **main content wrapper** needs `layout`. The sidebar uses `animate={{ width }}` directly. Inner elements use NO layout or animate props.

**Warning signs:** Janky animation, browser frame drops during sidebar toggle, slow toggle in Electron DevTools performance trace.

---

### Pitfall 3: `shrink-0` Missing on Sidebar

**What goes wrong:** In a flex row, if the sidebar doesn't have `flex-shrink: 0`, Flexbox will shrink the sidebar when the window is resized or when content is large, overriding the animated width.

**Why it happens:** Flex items can shrink by default (`flex-shrink: 1`).

**How to avoid:** Always add `shrink-0` (or `flex-shrink-0`) to the sidebar `motion.div`. The main content uses `flex-1` (which includes `min-width: 0` via `min-w-0` for correct overflow behavior).

**Warning signs:** Sidebar narrower than expected on certain window sizes; content overflowing into sidebar space.

---

### Pitfall 4: `min-w-0` Missing on Main Content

**What goes wrong:** Without `min-w-0`, flex children don't shrink below their content's natural width. Long transaction descriptions or wide charts can push the sidebar off screen.

**Why it happens:** CSS Flexbox quirk — default `min-width: auto` on flex items.

**How to avoid:** Always add `min-w-0` to the main content `motion.div` alongside `flex-1`.

**Warning signs:** Horizontal scrollbar appears on the app container; sidebar disappears from left edge.

---

### Pitfall 5: `view` Still in `useFilters` After Migration

**What goes wrong:** If `view` is exported from both `useFilters` and `useViewState`, App.jsx could accidentally destructure from the wrong hook, causing state sync issues (two separate `view` states).

**Why it happens:** Partial migration — forgot to remove from `useFilters` return value.

**How to avoid:** In the same task that creates `useViewState`, remove `view` and `setView` from `useFilters.js` return object AND from `useFilters`'s internal state declaration.

**Warning signs:** Tab navigation appears to work but the old nav bar (if accidentally kept) and new sidebar show different active states.

---

### Pitfall 6: `h-screen` on Layout Root Causes Double Scrollbar

**What goes wrong:** If `#root` or `body` also have `min-height: 100vh` (set in index.css) AND the app container has `h-screen`, there might be a scrollbar on `body` + `overflow: hidden` on the app container.

**Why it happens:** `min-height: 100vh` on body is inherited; the app takes `100vh`.

**How to avoid:** The existing `index.css` has `body { min-height: 100vh }` and `#root { min-height: 100vh }`. These are fine — the `h-screen overflow-hidden` on the flex container prevents body-level scroll while internal scroll happens in `<main className="flex-1 overflow-auto">`.

**Warning signs:** Two scrollbars visible, or body-level scrollbar appears when content is long.

---

## Code Examples

Verified patterns aligned with project's existing conventions:

### Complete AppLayout Integration in App.jsx

```jsx
// App.jsx — after Phase 3 migration
import { useViewState } from './hooks';
// ... other hook imports

export default function MoneyFlow() {
  const { view, setView, sidebarCollapsed, toggleSidebar } = useViewState();
  // ... other hooks (useFilters NO LONGER returns view/setView)
  const { selectedMonth, ... } = useFilters({ years });

  return (
    <AppLayout
      view={view}
      setView={setView}
      collapsed={sidebarCollapsed}
      onToggle={toggleSidebar}
      onAddTransaction={() => setShowAddTransaction(true)}
    >
      {/* Current view content */}
      {view === 'dashboard' && <DashboardView ... />}
      {view === 'transactions' && <TransactionsView ... />}
      {view === 'settings' && <SettingsView />}

      {/* Modals (unchanged) */}
      {/* Toast (unchanged) */}
    </AppLayout>
  );
}
```

### SettingsView Placeholder

```jsx
// src/views/SettingsView.jsx
export function SettingsView() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Impostazioni</h2>
      <p className="text-gray-500">
        Sincronizzazione Google Drive e gestione categorie saranno disponibili qui.
      </p>
    </div>
  );
}
```

### Framer Motion Chevron Rotation

```jsx
// Inside Sidebar.jsx toggle button
<motion.div
  animate={{ rotate: collapsed ? 180 : 0 }}
  transition={{ duration: 0.2, ease: 'easeInOut' }}
>
  <ChevronLeft size={20} />
</motion.div>
```

Note: `ChevronLeft` points left when expanded (collapse action). When `collapsed=true`, rotating 180° makes it point right (expand action). This matches standard sidebar toggle UX conventions.

### LocalStorage Persistence (Lazy Initializer Pattern)

```js
// Consistent with Phase 2 hook patterns (see useCategories.js)
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  try {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  } catch {
    return false; // localStorage unavailable (shouldn't happen in Electron)
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` v6-v9: explicit exit animations on every component | v10+: `layout` prop + `LayoutGroup` for shared element transitions | framer-motion v10 (2023) | Much less boilerplate for layout animations |
| Sidebar = `position: fixed` + `margin-left` on content | Sidebar = CSS flex row item; content uses Framer Motion `layout` | Modern pattern | No JS margin calculation needed |
| Separate `width` in CSS + JS class toggle for collapse | `motion.div animate={{ width }}` directly | Standard FM usage | Single source of truth for width |

**Deprecated/outdated:**
- `useAnimation()` hook for triggering animations: Still works but `animate` prop with state variable is the modern declarative approach.
- `AnimateSharedLayout`: Removed in v11+. Replaced by `LayoutGroup`. Not needed for this phase's use case.
- framer-motion v10/v11 docs: Still mostly accurate for our use case; v12 is backward-compatible for `motion.div`, `layout`, `animate`, `transition`, `AnimatePresence`.

---

## Electron-Specific Notes

### Window Chrome
- `autoHideMenuBar: true` is already set in `electron/main.cjs`
- No custom titlebar — standard OS window chrome
- `h-screen` = full window height EXCLUDING the OS titlebar (correct behavior)
- No safe areas, notches, or platform-specific layout concerns on Windows desktop

### CSP Verification (HIGH confidence)
Production CSP: `style-src 'self'` (no `unsafe-inline`)

Framer Motion animates via `element.style.xxx = value` (JavaScript DOM property manipulation). This is **not** governed by `style-src` CSP directive. `style-src 'unsafe-inline'` controls only:
1. HTML `<style>` elements
2. HTML `style` attributes (`<div style="...">`)

JavaScript DOM manipulation at runtime is outside CSP's `style-src` scope. Framer Motion does NOT inject `<style>` elements. **Production CSP is NOT affected by Framer Motion.**

The existing dev-only `'unsafe-inline'` on `style-src` is already in place for Tailwind v4 HMR — Framer Motion benefits from this in dev as well, but it's not required.

### Window Resize
- Electron fires standard browser `resize` events → no special handling needed
- The flex layout responds to window resize automatically
- No debounced resize handlers needed for the sidebar/layout (that concern is for Recharts in Phase 4)

---

## Open Questions

1. **`view` dependency in `useFilters` page-reset effect**
   - What we know: `useFilters` currently has `view` in its page-reset `useEffect` dependency array (line 24 of `useFilters.js`). After migrating `view` to `useViewState`, it must be passed as a parameter to `useFilters` OR the dependency removed.
   - What's the best choice: Since the filter bar is removed from global layout in Phase 3, `setCurrentPage(1)` on view change is dead code for now. **Recommendation:** Remove `view` from the page-reset effect in Phase 3 — Phase 5 (TransactionsView) will own its own pagination reset.
   - Risk: Low — `currentPage` resets happen naturally when each view mounts fresh.

2. **`AnimatePresence` for view transitions (UX-07)**
   - What we know: UX-07 requires smooth view transitions (150ms fade). This is Phase 7 scope.
   - What's relevant now: The Phase 3 architecture should NOT put `AnimatePresence` + view key in the main content yet — that's Phase 7. Just render views conditionally with no animation for now.
   - Recommendation: Keep a `{children}` passthrough in AppLayout; Phase 7 wraps children in `AnimatePresence`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (no test framework in project) |
| Config file | None — Wave 0 gap |
| Quick run command | `npm run build && echo "BUILD OK"` |
| Full suite command | `npm run lint && npm run build && echo "FULL OK"` |

No automated UI tests exist in this project. The validation strategy for Phase 3 is:
1. **Build gate:** `npm run build` must exit 0
2. **Lint gate:** `npm run lint` must exit 0  
3. **Manual smoke test:** Human verifies sidebar toggle, active nav, header title

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Sidebar renders at 240px expanded | manual | `npm run build` | ❌ Wave 0 |
| NAV-02 | Sidebar toggles with animation (200ms) | manual | `npm run build` | ❌ Wave 0 |
| NAV-03 | Active nav item highlighted | manual | `npm run build` | ❌ Wave 0 |
| NAV-04 | Three nav items visible | manual | `npm run build` | ❌ Wave 0 |
| NAV-05 | Header shows correct title | manual | `npm run build` | ❌ Wave 0 |
| NAV-06 | Main content adapts to sidebar state | manual | `npm run build` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run build`
- **Per wave merge:** `npm run lint && npm run build` + manual electron:dev smoke test
- **Phase gate:** Build green + manual smoke test checklist before `/gsd-verify-work`

### Wave 0 Gaps
- `framer-motion` not installed — must be first task: `npm install framer-motion`
- No test framework — manual smoke test is the validation for all NAV requirements
- Consider: `npm run electron:dev` smoke test checklist (sidebar visible, toggle works, 3 nav items, active state, header title changes, "Aggiungi transazione" on Transazioni only)

*(No automated unit test infrastructure to set up — manual testing is appropriate for this type of visual/animation work)*

---

## Sources

### Primary (HIGH confidence)
- Project source code: `src/index.css` — confirmed `--spacing-sidebar: 240px` and `--spacing-sidebar-collapsed: 64px` tokens defined
- Project source code: `src/hooks/useFilters.js` — confirmed `view` state location and page-reset effect
- Project source code: `electron/main.cjs` — confirmed CSP structure (dev `'unsafe-inline'`, prod strict)
- Project source code: `package.json` — confirmed framer-motion NOT installed; confirmed existing Lucide React, Tailwind v4
- npm registry: `npm view framer-motion version` → `12.38.0` (2026-03-17)

### Secondary (MEDIUM confidence)
- Framer Motion official docs pattern: `motion.div` + `layout` prop for adjacent element reflow — standard documented pattern, stable across v10-v12
- MDN Web Docs / CSP spec: `style-src` controls HTML-level styles, not JavaScript DOM manipulation — well-established browser security model
- Framer Motion v11 changelog (known): `AnimateSharedLayout` removed, replaced by `LayoutGroup`; v12 backward-compatible for `motion`, `layout`, `animate` APIs

### Tertiary (LOW confidence)  
- Framer Motion v12 specific changelog: Not independently verified — API compatibility assumed based on consistent backward-compat track record of the library

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry; packages confirmed in codebase
- Architecture: HIGH — flex row + Framer Motion layout is the standard pattern; confirmed against existing project structure
- CSP safety: HIGH — verified CSP in electron/main.cjs; browser security model for style-src is well-established
- Framer Motion v12 API compat: MEDIUM — backward compat assumed, specific v12 changelog not independently verified

**Research date:** 2026-03-17  
**Valid until:** 2026-06-17 (90 days — framer-motion has stable API between majors)
