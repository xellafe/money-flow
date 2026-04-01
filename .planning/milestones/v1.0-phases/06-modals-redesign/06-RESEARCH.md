# Phase 6: Modals Redesign — Research

**Researched:** 2026-03-19
**Domain:** Radix UI Dialog + Framer Motion v12 + Tailwind v4 modal system
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Shared Modal Shell — Architecture**
- **Install Radix UI Dialog:** `npm install @radix-ui/react-dialog` — use for accessibility primitives (focus trap, ESC handling, aria attributes). Exception to Phase 3 "no component library" decision, justified by MOD-04 focus trap requirement.
- **Build `<ModalShell>` wrapper:** Create `src/components/ui/ModalShell.jsx` — thin styled wrapper applying Tailwind + Framer Motion ON TOP of `Dialog.Root` / `Dialog.Portal` / `Dialog.Overlay` / `Dialog.Content`.
- **ModalShell API:** `title` prop, `onClose` prop, `size` prop (`"sm"` | `"lg"`), `children`
- **Size variants:**
  - `size="sm"` → `max-w-md` — for: `ConfirmModal`, `CategoryConflictResolver`
  - `size="lg"` → `max-w-2xl` — for: `ImportWizard`, `SyncSettings`, `CategoryManager`, `PayPalEnrichWizard`, `ConflictResolver`
- **ModalShell structure:**
  ```
  Dialog.Root (open={true}, onOpenChange triggered by Radix ESC/backdrop → calls onClose)
    Dialog.Portal
      Dialog.Overlay (backdrop-blur-sm bg-black/40, animated)
      Dialog.Content (panel, animated, rounded-xl bg-white shadow-xl)
        header row: Dialog.Title + X button (Dialog.Close)
        scrollable body: overflow-y-auto max-h-[80vh]
          {children}
  ```

**Backdrop & Overlay Style**
- Backdrop: `backdrop-blur-sm` (4px) + `bg-black/40`
- Panel entrance: `scale(0.95 → 1) + opacity(0 → 1)`, 200ms ease-out
- Panel exit: `scale(1 → 0.95) + opacity(1 → 0)`, 150ms ease-in
- Backdrop entrance: `opacity(0 → 1)`, 200ms ease-out; exit `opacity(1 → 0)` 150ms

**SettingsView Integration**
- Keep all 7 as modals (no inline integration in SettingsView)
- Add two buttons to `src/views/SettingsView.jsx`: "Gestione Categorie" → `showCategoryManager`, "Sincronizzazione Drive" → `showSyncSettings`

**Multi-step Wizard Styling**
- No step progress indicator
- PayPalEnrichWizard: Horizontal slide `AnimatePresence` for step transitions
- ImportWizard: Single screen, no internal step transitions

**Button Styles (MOD-06)**
- Primary: `bg-brand-600 hover:bg-brand-700 text-white`
- Secondary: `bg-gray-100 hover:bg-gray-200 text-gray-700`
- Destructive: `bg-red-600 hover:bg-red-700 text-white`
- All: `rounded-lg px-4 py-2 text-sm font-medium transition-colors`

### Claude's Discretion
- Exact Radix Dialog `asChild` wiring for Framer Motion integration
- Whether to use `Dialog.Close` Radix primitive or plain button + `onOpenChange` for X button
- Scrollable body overflow behavior for modals with fixed-height inner content (e.g., PayPalEnrichWizard table)
- Whether `ConflictResolver` and `CategoryConflictResolver` need custom footer patterns

### Deferred Ideas (OUT OF SCOPE)
- Moving SyncSettings / CategoryManager inline into SettingsView
- Keyboard shortcut to open CategoryManager from anywhere
- Step progress indicator / stepper for PayPalEnrichWizard
- Responsive modal sizing for small Electron window widths
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOD-01 | Overlay with backdrop blur and fade animation (Framer Motion, 200ms) | `Dialog.Overlay asChild` → `motion.div` with opacity variant; `backdrop-blur-sm bg-black/40` |
| MOD-02 | Modal open/close animation with scale + fade (200ms) | `Dialog.Content asChild` → `motion.div` with `scale(0.95↔1) + opacity` variants; AnimatePresence in App.jsx |
| MOD-03 | ESC and backdrop click close | Radix Dialog handles both natively; `onOpenChange` wired to `onClose` prop |
| MOD-04 | Focus trap inside modal (accessibility) | Radix Dialog.Content provides built-in focus trap and focus restoration on close |
| MOD-05 | Consistent styling across all 7 modals | All 7 wrap in ModalShell; current styling is all inline — replace with Tailwind utilities via ModalShell |
| MOD-06 | Primary/secondary/destructive button styles from design system | Tailwind tokens `--color-brand-600`, `red-600` already defined in index.css `@theme` |
| MOD-07 | Long-content modals scroll internally | ModalShell body: `overflow-y-auto max-h-[80vh]`; PayPalEnrichWizard table uses `sticky` thead inside overflow container |
</phase_requirements>

---

## Summary

Phase 6 redesigns all 7 modals in the budget-tracker Electron app by building a shared `ModalShell` component that wraps Radix UI Dialog primitives for accessibility and Framer Motion for animation. The current modals (`ConfirmModal`, `CategoryManager`, `SyncSettings`, `ImportWizard`, `ConflictResolver`, `CategoryConflictResolver`, `PayPalEnrichWizard`) all use empty CSS class names (`.modal-overlay`, `.modal`) with **no actual CSS definition** — all their visual presentation comes from inline `style={{}}` props. Phase 6 replaces this ad-hoc inline styling with proper Tailwind v4 utility classes via ModalShell.

The integration pattern for Radix UI + Framer Motion v12 requires `AnimatePresence` wrappers in `App.jsx` around each conditional modal render, while ModalShell uses `Dialog.Root open={true}` always. Radix Dialog handles ESC, backdrop-click, and focus trap automatically. The `asChild` prop on `Dialog.Overlay` and `Dialog.Content` allows Framer Motion `motion.div` components to receive Radix accessibility attributes (aria-*, data-state, role, tabIndex) while animating independently.

Key pre-requisites for implementation: (1) `@radix-ui/react-dialog` must be installed — it is NOT currently in node_modules; (2) `src/components/ui/` directory does not exist and must be created; (3) App.jsx needs `AnimatePresence` wrappers and `import { AnimatePresence } from 'framer-motion'` (framer-motion v12.38.0 is already installed).

**Primary recommendation:** Build ModalShell first (Wave 0), then migrate modals one-by-one from simplest to most complex: ConfirmModal → CategoryConflictResolver → ConflictResolver → ImportWizard → CategoryManager → SyncSettings → PayPalEnrichWizard.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | latest (^1.1.x) | Accessibility primitives: focus trap, ESC, ARIA, backdrop | NOT installed yet — `npm install @radix-ui/react-dialog` required |
| framer-motion | 12.38.0 (installed) | Fade + scale animations, AnimatePresence for exit | Already installed in Phase 3; consistent 200ms standard |
| tailwindcss v4 | @4.2.1 (installed) | Utility classes replacing all inline styles | Already configured with design tokens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.563.0 (installed) | X button icon in ModalShell header | Already used in all modal files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @radix-ui/react-dialog | Custom focus trap (focus-trap-js) | Radix handles ESC + backdrop + aria-modal + focus restore in one; custom requires all manually |
| @radix-ui/react-dialog | @headlessui/dialog | Both equivalent; Radix already chosen in project decisions |

**Installation:**
```bash
npm install @radix-ui/react-dialog
```

**Version note:** npm CLI is broken in this environment (Volta toolchain issue). Use `npm install @radix-ui/react-dialog` in a normal terminal. Latest stable is ^1.1.x as of research date.

---

## Architecture Patterns

### Current State (what we're replacing)

All 7 modals currently:
- Render `<div className="modal-overlay" onClick={onClose}>` + `<div className="modal">` as root elements
- Use **empty CSS class names** — `.modal-overlay`, `.modal`, `.modal-large`, `.btn-primary`, `.btn-secondary`, `.btn-cancel`, `.btn-danger` have **zero definitions** in `src/index.css`
- Rely entirely on inline `style={{}}` props for all visual presentation
- Have no animations, no ESC handling (except backdrop click), no focus trap

### Recommended Project Structure
```
src/
├── components/
│   ├── ui/                      # NEW in Phase 6
│   │   └── ModalShell.jsx       # Shared modal wrapper (create this first)
│   ├── modals/
│   │   ├── ConfirmModal.jsx     # Migrate → wrap in ModalShell
│   │   ├── CategoryManager.jsx  # Migrate → wrap in ModalShell
│   │   ├── SyncSettings.jsx     # Migrate → wrap in ModalShell
│   │   ├── ImportWizard.jsx     # Migrate → wrap in ModalShell
│   │   ├── ConflictResolver.jsx # Migrate → wrap in ModalShell
│   │   ├── CategoryConflictResolver.jsx  # Migrate → wrap in ModalShell
│   │   └── PayPalEnrichWizard.jsx        # Migrate → wrap in ModalShell
│   └── ...
├── views/
│   └── SettingsView.jsx         # Add 2 buttons with onShowX props
└── App.jsx                      # Add AnimatePresence wrappers + import
```

### Pattern 1: ModalShell — Radix Dialog + Framer Motion asChild

**What:** ModalShell is a thin wrapper around Radix Dialog primitives. The key integration is using `asChild` on `Dialog.Overlay` and `Dialog.Content` to pass Radix's accessibility attributes down to Framer Motion's `motion.div` elements.

**When to use:** All 7 modals use this via `<ModalShell title="..." onClose={...} size="lg">`.

```jsx
// src/components/ui/ModalShell.jsx
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1,    transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } },
};

const sizeClasses = {
  sm: 'max-w-md',
  lg: 'max-w-2xl',
};

export default function ModalShell({ title, onClose, size = 'sm', children }) {
  return (
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/40"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        </Dialog.Overlay>

        {/* Panel */}
        <Dialog.Content asChild>
          <motion.div
            className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl
                        flex flex-col max-h-[90vh]`}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <Dialog.Title className="text-lg font-semibold text-gray-800">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Chiudi"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {children}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Pattern 2: AnimatePresence in App.jsx (enables exit animations)

**What:** Wrap each conditional modal render in `<AnimatePresence>`. AnimatePresence delays unmounting until exit animation completes. The `key` prop tells AnimatePresence which child to track.

**Why required:** Without AnimatePresence, modal components are immediately removed from DOM when parent state changes to false, making exit animations impossible.

```jsx
// App.jsx — add to imports
import { AnimatePresence } from 'framer-motion';

// App.jsx — each modal gets wrapped
<AnimatePresence>
  {showCategoryManager && (
    <CategoryManager
      key="category-manager"
      categories={categories}
      onClose={() => setShowCategoryManager(false)}
      // ... other props
    />
  )}
</AnimatePresence>

<AnimatePresence>
  {showSyncSettings && (
    <SyncSettings key="sync-settings" onClose={() => setShowSyncSettings(false)} ... />
  )}
</AnimatePresence>

// etc. for all 7 modals
```

### Pattern 3: Migrated Modal — Standard wrapping pattern

**What:** Each existing modal replaces its outermost `<div className="modal-overlay">...<div className="modal">` shell with `<ModalShell>`. All internal content becomes children.

```jsx
// BEFORE (e.g., ConfirmModal)
export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Annulla</button>
          <button className="btn-danger" onClick={onConfirm}>Elimina</button>
        </div>
      </div>
    </div>
  );
}

// AFTER
import ModalShell from '../ui/ModalShell';

export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <ModalShell title={title} onClose={onCancel} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={onCancel}
        >Annulla</button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={onConfirm}
        >Elimina</button>
      </div>
    </ModalShell>
  );
}
```

### Pattern 4: SettingsView buttons

**What:** SettingsView is currently a placeholder. Phase 6 adds two modal trigger buttons. Props passed from App.jsx.

```jsx
// src/views/SettingsView.jsx
export function SettingsView({ onShowCategoryManager, onShowSyncSettings }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Impostazioni</h2>

      <div className="space-y-4">
        <section>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Categorie
          </h3>
          <button
            onClick={onShowCategoryManager}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Gestione Categorie
          </button>
        </section>

        <section>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Sincronizzazione
          </h3>
          <button
            onClick={onShowSyncSettings}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Sincronizzazione Drive
          </button>
        </section>
      </div>
    </div>
  );
}
```

```jsx
// App.jsx — pass props when rendering SettingsView
<SettingsView
  onShowCategoryManager={() => setShowCategoryManager(true)}
  onShowSyncSettings={() => setShowSyncSettings(true)}
/>
```

### Pattern 5: PayPalEnrichWizard — table inside ModalShell body

**What:** PayPalEnrichWizard has a scrollable table with `sticky thead`. When moved inside ModalShell's `overflow-y-auto` body, the sticky header must be relative to the ModalShell body container, not the viewport.

```jsx
// Inside PayPalEnrichWizard children — table container
// Remove the explicit maxHeight: '400px' — ModalShell body handles overflow
<div className="border border-gray-200 rounded-lg overflow-hidden">
  <div className="overflow-y-auto max-h-96"> {/* or let ModalShell body scroll */}
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 bg-gray-100 z-10">
        {/* ... */}
      </thead>
      <tbody>{/* ... */}</tbody>
    </table>
  </div>
</div>
```

**Note:** Two valid approaches: (a) Remove inner scroll — let ModalShell `max-h-[80vh] overflow-y-auto` handle everything, keeping `sticky top-0` on thead. (b) Keep inner table's own `overflow-y-auto` container within ModalShell body (nested scroll). Approach (a) is recommended — cleaner UX for long tables.

### Anti-Patterns to Avoid

- **Don't use `Dialog.Root open={condition}` with `forceMount`** — This adds complexity without benefit here. The `AnimatePresence` in App.jsx + `open={true}` in ModalShell is cleaner.
- **Don't keep `.modal-overlay` / `.modal` class names** — They have zero CSS definition; remove them and replace with ModalShell (they only add confusion).
- **Don't use `e.stopPropagation()` inside Dialog.Content** — Radix Dialog.Content handles backdrop click via `onPointerDownOutside`, not through event bubbling. The old `onClick={e => e.stopPropagation()}` pattern is not needed with Radix.
- **Don't mix AnimatePresence in ModalShell AND in App.jsx** — AnimatePresence should only be in App.jsx (the tree level where components are conditionally rendered). ModalShell's motion.div variants animate on mount/unmount driven by the outer AnimatePresence.
- **Don't forget `key` prop on AnimatePresence children** — Without unique keys, AnimatePresence can't distinguish which modal is exiting.
- **Don't add ModalShell footer slot** — Per locked decisions, each modal manages its own actions as `children` in the body, not a dedicated footer slot.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap | Custom `onKeyDown` Tab cycling, tabindex management | `@radix-ui/react-dialog` | Focus trap requires handling: Tab/Shift+Tab cycle, tabbable element detection, focus restoration on close, nested portals, dynamic content — 200+ edge cases |
| ESC close | `useEffect` + `window.addEventListener('keydown')` | `@radix-ui/react-dialog` (built-in) | Race conditions with multiple modals, cleanup, event ordering |
| Aria modal | Manual `aria-modal`, `role="dialog"`, `aria-labelledby` | `@radix-ui/react-dialog` (built-in) | Screen reader behavior requires precise attr combination |
| Backdrop click | `onClick` + `stopPropagation` | `Dialog.onPointerDownOutside` | Old approach breaks with Radix Portal; `onPointerDownOutside` is the correct event |
| Animation on unmount | `useEffect` timeout delays + CSS class toggling | `AnimatePresence` from framer-motion | Exit animations impossible once component unmounts from DOM |

**Key insight:** Focus trap in particular is deceptive — trivial for simple cases, broken for edge cases (dynamic content, nested portals, shadow DOM). Radix has thousands of hours of a11y testing behind it.

---

## Common Pitfalls

### Pitfall 1: Exit animation never plays
**What goes wrong:** Modal closes instantly with no animation; exit variants ignored.
**Why it happens:** `AnimatePresence` is missing in App.jsx, or the conditional is `{condition && <Modal />}` directly without AnimatePresence parent.
**How to avoid:** Wrap every `{condition && <ModalComponent />}` in `<AnimatePresence>` in App.jsx. Import `{ AnimatePresence }` from `'framer-motion'`.
**Warning signs:** Entrance animation plays but close is instant; no console error.

### Pitfall 2: `asChild` on Dialog.Content breaks focus trap
**What goes wrong:** Focus trap stops working; Tab key escapes the modal.
**Why it happens:** When using `asChild`, Radix merges props onto the child. If `motion.div` doesn't forward the ref, Radix can't attach its focus management. Framer Motion's `motion.div` DOES forward refs correctly, so this should work — but verify with `React.forwardRef` if using a custom component.
**How to avoid:** Use `motion.div` directly (not a custom wrapper). Ensure `Dialog.Content asChild` child is `motion.div`, not a component wrapping `motion.div`.
**Warning signs:** Tab key leaves modal; screen reader doesn't announce "dialog".

### Pitfall 3: Backdrop click fires even when clicking modal content
**What goes wrong:** Clicking inside the modal panel closes it.
**Why it happens:** Using old `onClick` on overlay + `e.stopPropagation()` inside panel — this doesn't work with Radix Portal (portal renders outside the overlay DOM tree).
**How to avoid:** Remove all `e.stopPropagation()` from modal content. Radix `Dialog.Content` handles this via `onPointerDownOutside` internally. Simply wire `onOpenChange={(open) => { if (!open) onClose(); }}` on `Dialog.Root`.
**Warning signs:** Clicking any button inside modal closes it.

### Pitfall 4: `z-index` stacking broken in Electron
**What goes wrong:** Modal overlay appears behind app content.
**Why it happens:** `fixed` positioning in Portals interacts with stacking contexts. Tailwind's default `z-40` / `z-50` should suffice, but existing layout components (Sidebar: `z-10`?) may create new stacking contexts.
**How to avoid:** Dialog.Portal renders at `document.body` level, bypassing stacking context issues. Use `z-40` for overlay and `z-50` for panel. Verify no existing component has `z-index` > 40 with a new stacking context.
**Warning signs:** Modal panel appears behind sidebar or header.

### Pitfall 5: PayPalEnrichWizard lint warning — DO NOT TOUCH
**What goes wrong:** Pre-existing `react-hooks/set-state-in-effect` lint warning at line 200 (`setSelectedMatches` called inside `useEffect`).
**Why it happens:** Pre-existing tech debt, documented in CONTEXT.md.
**How to avoid:** Scope changes to styling/animation ONLY. Do not refactor the hook logic. The lint warning must remain as-is after Phase 6.
**Warning signs:** Any ESLint changes touching the `useEffect` + `setSelectedMatches` pattern.

### Pitfall 6: CategoryManager internal styling uses non-Tailwind classes
**What goes wrong:** After migrating to ModalShell, CategoryManager internal elements (`.categories-grid`, `.category-card`, `.keyword-tag`, `.btn-delete`) still have no CSS.
**Why it happens:** These classes are also empty (no CSS definition) — CategoryManager relied on inline styles for everything except these class names.
**How to avoid:** Replace all internal class-based styling with Tailwind utilities during migration. Check for `className="categories-grid"`, `className="category-card"`, `className="keyword-tag"`, `className="btn-delete"`, `className="search-input"` — all must be replaced with Tailwind utilities.
**Warning signs:** CategoryManager shows correctly in ModalShell but category cards have no layout.

### Pitfall 7: SyncSettings `confirmDelete` sub-state conflict
**What goes wrong:** `SyncSettings` has an internal `confirmDelete` state (`useState(false)`) for confirming Drive backup deletion. This is separate from `useModals.confirmDelete` (transaction deletion). Name collision in App.jsx scope.
**Why it happens:** SyncSettings manages its own destructive confirmation inline. Migration to ModalShell doesn't change this internal state — it stays in SyncSettings.
**How to avoid:** No action needed — SyncSettings.jsx internal state is local to the component. Just don't rename it when migrating.

---

## Code Examples

### AnimatePresence wiring in App.jsx
```jsx
// Source: Framer Motion docs + Radix UI integration pattern
import { AnimatePresence } from 'framer-motion';

// In App.jsx JSX return — each modal gets its own AnimatePresence:
<AnimatePresence>
  {showCategoryManager && (
    <CategoryManager key="category-manager" ... onClose={() => setShowCategoryManager(false)} />
  )}
</AnimatePresence>

<AnimatePresence>
  {showSyncSettings && (
    <SyncSettings key="sync-settings" ... onClose={() => setShowSyncSettings(false)} />
  )}
</AnimatePresence>

<AnimatePresence>
  {paypalData && (
    <PayPalEnrichWizard key="paypal-wizard" ... onCancel={() => setPaypalData(null)} />
  )}
</AnimatePresence>

<AnimatePresence>
  {confirmDelete && (
    <ConfirmModal key="confirm-delete" ... onCancel={() => setConfirmDelete(null)} />
  )}
</AnimatePresence>

// importWizardData and conflictData from useImportLogic:
<AnimatePresence>
  {importWizardData && (
    <ImportWizard key="import-wizard" ... onCancel={...} />
  )}
</AnimatePresence>

<AnimatePresence>
  {conflictData && (
    <ConflictResolver key="conflict-resolver" ... onCancel={...} />
  )}
</AnimatePresence>

<AnimatePresence>
  {categoryConflictData && (
    <CategoryConflictResolver key="category-conflict" ... onClose={...} />
  )}
</AnimatePresence>
```

### Dialog.Close for X button (preferred over plain button)
```jsx
// Dialog.Close automatically triggers onOpenChange(false) → calls onClose
// Use asChild to style it as needed
<Dialog.Close asChild>
  <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
    <X size={20} />
  </button>
</Dialog.Close>
```

### Button pattern — three variants
```jsx
// Primary
<button className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
  Salva
</button>

// Secondary / Cancel
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
  Annulla
</button>

// Destructive
<button className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
  Elimina
</button>
```

### Design tokens available in Tailwind v4 (from src/index.css @theme)
```
--color-brand-600: #2563eb    → bg-brand-600, text-brand-600
--color-gray-100..900         → bg-gray-*, text-gray-*, border-gray-*
--color-income-500            → text-income-500 (for success states)
--color-expense-500           → text-expense-500 (for error states)
--shadow-xl                   → shadow-xl
--radius-xl                   → rounded-xl (1rem)
```

---

## Modal-by-Modal Migration Notes

| Modal | Size | Complexity | Key Migration Notes |
|-------|------|------------|---------------------|
| `ConfirmModal` | sm | Low | 22 lines; replace 4 lines of shell + 2 buttons; no internal state |
| `CategoryConflictResolver` | sm | Low | 85 lines; radio button list; keep `.conflict-list` internal structure, replace with Tailwind |
| `ConflictResolver` | lg | Medium | 116 lines; conflict list with radio buttons; "select all" buttons use `btn-small` class — replace |
| `ImportWizard` | lg | Medium | 165 lines; single screen form with selects; replace `wizard-form`, `wizard-field`, `wizard-preview` classes |
| `CategoryManager` | lg | High | 167 lines; grid of category cards; ALL internal classes are empty CSS (`.categories-grid`, `.category-card`, `.keyword-tag`, `.btn-delete`, `.search-input`) — must all be Tailwind-ified |
| `SyncSettings` | lg | High | 365 lines; complex async state + spinner; mostly inline styles already — straightforward replacement; internal `confirmDelete` state is local (no conflict) |
| `PayPalEnrichWizard` | lg | High | 349 lines; large match table with sticky thead; pre-existing lint warning at line 200 — DO NOT touch; remove inner `maxHeight: '400px'` — let ModalShell body scroll |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom CSS `.modal-overlay` + `.modal` | Radix Dialog + Tailwind utilities | Phase 6 | All a11y handled by library |
| `onClick={e => e.stopPropagation()}` anti-pattern | Radix `onPointerDownOutside` | Phase 6 | Correct portal-aware handling |
| Inline `style={{}}` everywhere | Tailwind utility classes | Phase 6 | Consistent, maintainable, token-aware |
| No focus trap | Radix Dialog focus trap | Phase 6 | WCAG 2.1 AA compliance for MOD-04 |
| No exit animations | `AnimatePresence` + `exit` variants | Phase 6 | Smooth close that was impossible without AnimatePresence |
| Framer Motion v10 patterns | v12.x API (same public API) | No change needed | `motion.div`, `AnimatePresence`, `variants` unchanged in v12 |

**Note on framer-motion v12:** The public API (`motion`, `AnimatePresence`, `variants`, `initial`/`animate`/`exit`) is unchanged from v10/v11. No migration needed. The `motion.create()` factory is new in v12 but not needed here.

---

## Open Questions

1. **Where does `importWizardData`, `conflictData`, `categoryConflictData` live in App.jsx?**
   - What we know: `useImportLogic` manages wizard flow; `useModals` has `confirmDelete`, `showCategoryManager`, `showSyncSettings`, `paypalData`.
   - What's unclear: Exact variable names for the import wizard trigger and conflict data (not verified in App.jsx code, only confirmed for the 3 modals directly in useModals).
   - Recommendation: Planner should verify App.jsx lines 754-780 for exact conditional variable names before writing tasks for ImportWizard, ConflictResolver, CategoryConflictResolver wrapping.

2. **Do `ConflictResolver` and `CategoryConflictResolver` need custom footer patterns?**
   - What we know: Both have multi-button action patterns (ConflictResolver has "Annulla import" + "Conferma"; CategoryConflictResolver has "Annulla" + "Conferma").
   - What's unclear: Whether a dedicated footer section (outside scrollable body) is needed for UX consistency when conflict lists are long.
   - Recommendation: Add a sticky footer row inside ModalShell body using `sticky bottom-0 bg-white pt-4 border-t border-gray-100` for conflict modals with long lists. Claude's discretion.

3. **Exact `@radix-ui/react-dialog` version**
   - What we know: Package not installed; npm CLI broken in this environment.
   - What's unclear: Exact latest version to pin.
   - Recommendation: Run `npm install @radix-ui/react-dialog` without version pin in Wave 0; let npm resolve latest stable (expected ^1.1.x).

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **None installed** — no `vitest.config.*`, `jest.config.*`, `*.test.*`, or `*.spec.*` files found |
| Config file | None — Wave 0 must install if automated tests are planned |
| Quick run command | N/A (no test runner) |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| MOD-01 | Overlay renders with backdrop-blur + bg-black/40 | Visual/Manual | Manual-only | CSS visual property; Electron window required |
| MOD-02 | Modal opens/closes with 200ms scale+fade | Visual/Manual | Manual-only | Animation timing; requires visual inspection |
| MOD-03 | ESC closes modal; backdrop click closes modal | Manual interaction | Manual-only | Event sequence in Electron; Radix handles both |
| MOD-04 | Tab cycles only within modal; focus restores on close | Manual accessibility | Manual-only | Requires keyboard interaction testing |
| MOD-05 | All 7 modals render without visual regressions | Visual/Manual | Manual-only | Compare before/after via Electron app |
| MOD-06 | Button styles consistent (primary/secondary/destructive) | Visual/Manual | Manual-only | Visual inspection of button appearances |
| MOD-07 | Long-content modals scroll internally | Manual interaction | Manual-only | Scroll inside ImportWizard preview, PayPal table |

### Practical Validation Checklist (per modal)

Since there is no automated test infrastructure, the planner should create a **manual verification checklist** task as a wave gate:

```
For EACH of the 7 modals, verify:
[ ] Opens from its trigger (App.jsx or SettingsView)
[ ] Overlay renders (backdrop-blur visible behind panel)
[ ] Panel entrance animation plays (scale+fade, ~200ms)
[ ] ESC key closes modal
[ ] Clicking backdrop closes modal
[ ] Clicking inside panel does NOT close modal
[ ] Tab key stays within modal (check: first and last focusable element)
[ ] X button closes modal
[ ] All buttons use correct style variant (primary/secondary/destructive)
[ ] Content scrolls internally if long (ImportWizard preview table, PayPal matches table)
[ ] Panel exit animation plays on close (~150ms)
[ ] Focus returns to trigger element after close
```

### Sampling Rate
- **Per task commit:** Visual check — open the modified modal in `npm run electron:dev`, verify basic open/close
- **Per wave merge:** Full 7-modal checklist above
- **Phase gate:** All 7 modals pass checklist before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `npm install @radix-ui/react-dialog` — required before any implementation
- [ ] `src/components/ui/` directory — must be created (doesn't exist)
- [ ] `src/components/ui/ModalShell.jsx` — core shared component
- [ ] No test framework to install — validation is 100% manual/visual for this phase

*(Automated testing of animation/accessibility is technically possible with Vitest + @testing-library/react, but out of scope for this phase — the app has zero test infrastructure and adding it would be Phase 8+ work.)*

---

## Sources

### Primary (HIGH confidence)
- Direct source file inspection: `src/components/modals/*.jsx` (all 7 files read)
- Direct source file inspection: `src/index.css` (160 lines, confirmed no modal CSS classes)
- Direct source file inspection: `src/hooks/useModals.js`, `src/views/SettingsView.jsx`
- Direct source file inspection: `src/App.jsx` (grep for modal usage, lines 643-780)
- Direct source file inspection: `package.json` (framer-motion 12.38.0 installed; @radix-ui/react-dialog absent)
- Direct source file inspection: `.planning/config.json` (nyquist_validation: true)
- `.planning/phases/06-modals-redesign/06-CONTEXT.md` (locked decisions)

### Secondary (MEDIUM confidence)
- Radix UI Dialog API: `asChild`, `onOpenChange`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Close`, `Dialog.Title` — standard documented API verified through component use patterns
- Framer Motion v12 API: `AnimatePresence`, `motion.div`, `variants`, `initial/animate/exit` — unchanged from v10/v11, well-established pattern

### Tertiary (LOW confidence)
- `@radix-ui/react-dialog` latest version (^1.1.x) — estimated from training data; npm CLI broken in environment, could not verify via registry
- Exact behavior of `Dialog.Content asChild` + `motion.div` focus trap — documented Radix pattern, HIGH confidence from Radix docs + community usage, but not live-verified in this project

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — framer-motion version confirmed from package.json; Radix UI absence confirmed; Tailwind v4 confirmed
- Architecture: HIGH — all 7 modal files read; integration pattern well-established (Radix asChild + AnimatePresence)
- Pitfalls: HIGH — derived from direct code inspection (empty CSS classes, stopPropagation anti-pattern, PayPal lint warning)
- Migration notes: HIGH — each modal's complexity derived from actual line counts and class usage

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable libraries; Radix UI + framer-motion APIs stable)

---

## RESEARCH COMPLETE
