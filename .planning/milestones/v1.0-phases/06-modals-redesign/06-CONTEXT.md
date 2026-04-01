# Phase 6: Modals Redesign — Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign all 7 existing modals with Tailwind v4 styling, Framer Motion animations, ESC/backdrop close, and focus trap. Modals redesigned: `ConfirmModal`, `CategoryManager`, `SyncSettings`, `ImportWizard`, `ConflictResolver`, `CategoryConflictResolver`, `PayPalEnrichWizard`.

Also: make SettingsView functional by adding trigger buttons for CategoryManager and SyncSettings modals.

**Out of scope:** Moving modals into SettingsView inline, new settings content, responsive breakpoints (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Shared Modal Shell — Architecture

- **Install Radix UI Dialog:** `npm install @radix-ui/react-dialog` — use for accessibility primitives (focus trap, ESC handling, aria attributes). This is the exception to the Phase 3 "no component library" decision, justified by MOD-04 focus trap requirement being non-trivial to implement correctly.
- **Build `<ModalShell>` wrapper:** Create `src/components/ui/ModalShell.jsx` — a thin styled wrapper that applies Tailwind + Framer Motion animation ON TOP of `Dialog.Root` / `Dialog.Portal` / `Dialog.Overlay` / `Dialog.Content` from Radix. Each modal keeps its internal content and just wraps in `<ModalShell>`.
- **ModalShell API:**
  - `title` prop — rendered in sticky header row
  - `onClose` prop — called by X button and Radix ESC/backdrop
  - `size` prop — `"sm"` (default) or `"lg"`
  - `children` — rendered in scrollable body area
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

### Backdrop & Overlay Style

- **Backdrop:** `backdrop-blur-sm` (4px) + `bg-black/40` tint — subtle, modern, MOD-01 compliant.
- **Panel entrance animation:** `scale(0.95 → 1) + opacity(0 → 1)`, 200ms ease-out — consistent with Phase 3's 200ms animation standard and MOD-02 requirement.
- **Panel exit:** reverse — scale(1 → 0.95) + opacity(1 → 0), 150ms ease-in.
- **Backdrop animation:** opacity(0 → 1), 200ms ease-out; exit opacity(1 → 0) 150ms.
- **Implementation:** Use Framer Motion `AnimatePresence` + `motion.div` wrappers on the Radix overlay and content elements (Radix Dialog.Content renders as `asChild`-friendly slot).

### SettingsView Integration

- **Keep all 7 as modals** — Phase 6 redesigns their visual style. SettingsView inline integration is Phase 7+.
- **Make SettingsView functional:** Add two buttons to `src/views/SettingsView.jsx`:
  - **"Gestione Categorie"** button → calls `showCategoryManager` from `useModals`
  - **"Sincronizzazione Drive"** button → calls `showSyncSettings` from `useModals`
- SettingsView remains minimal (just these two buttons + section headings), no new content.

### Multi-step Wizard Styling

- **No step progress indicator** — ImportWizard is a single-screen column-mapping form (no steps); PayPalEnrichWizard has content sections that flow vertically, not a navigation stepper.
- **PayPalEnrichWizard step transitions:** Horizontal slide with `AnimatePresence` — outgoing content slides to `x: -30px + opacity 0`, incoming content enters from `x: 30px` → `x: 0 + opacity 1`, 200ms ease-out. Direction reverses for "back" navigation.
- **ImportWizard:** Single screen, no internal step transitions — just styled consistently within ModalShell.

### Button Styles (MOD-06 consistency)

- **Primary action button** (confirm, save, apply): `bg-brand-600 hover:bg-brand-700 text-white` — Tailwind v4 token `--color-brand-600`
- **Secondary/cancel button**: `bg-gray-100 hover:bg-gray-200 text-gray-700`
- **Destructive button** (delete, remove): `bg-red-600 hover:bg-red-700 text-white` — use `--color-expense-500` token or Tailwind `red-600`
- All buttons: `rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- **ModalShell footer area:** Each modal manages its own footer/actions (not a ModalShell slot) — buttons rendered as children in the scrollable body at the bottom.

### Claude's Discretion

- Exact Radix Dialog `asChild` wiring for Framer Motion integration (researcher to verify pattern)
- Whether to use `Dialog.Close` Radix primitive or a plain button + `onOpenChange` for the X button
- Scrollable body overflow behavior for modals with fixed-height inner content (e.g., PayPalEnrichWizard table)
- Whether `ConflictResolver` and `CategoryConflictResolver` need custom footer patterns (both have confirm/skip/cancel action patterns)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MOD-01 through MOD-07 (all Phase 6 requirements)

### Roadmap & State
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, dependency on Phase 3
- `.planning/STATE.md` — Key decisions, current codebase state, deferred items

### Prior phase context (animation & design decisions)
- `.planning/phases/03-navigation-layout/03-CONTEXT.md` — Framer Motion install decision, 200ms ease-in-out animation standard, CSP note for inline styles in Electron

### Existing modal files (ALL must be read before planning)
- `src/components/modals/ConfirmModal.jsx` — simplest modal (22 lines, no close button)
- `src/components/modals/CategoryManager.jsx` — category CRUD, 167 lines
- `src/components/modals/SyncSettings.jsx` — Google Drive sync, 365 lines, complex state
- `src/components/modals/ImportWizard.jsx` — column mapping form, 165 lines
- `src/components/modals/ConflictResolver.jsx` — import conflict resolution, 116 lines
- `src/components/modals/CategoryConflictResolver.jsx` — category conflict, 85 lines
- `src/components/modals/PayPalEnrichWizard.jsx` — multi-step enrichment, 349 lines, has pre-existing lint issue (set-state-in-effect line 200)

### Existing hooks (modal state lives here)
- `src/hooks/useModals.js` — all 9 modal/form state variables, `showCategoryManager`, `showSyncSettings` etc.
- `src/hooks/index.js` — barrel export

### SettingsView (to extend with buttons)
- `src/views/SettingsView.jsx` — current placeholder shell

</canonical_refs>

<specifics>
## Specific Implementation Notes

- **CSP:** Framer Motion uses inline styles — already confirmed safe under Electron dev CSP (`'unsafe-inline'` gated to dev). Production CSP is strict but Framer Motion does NOT use `eval`. Confirmed in Phase 3.
- **PayPalEnrichWizard lint:** Pre-existing `react-hooks/set-state-in-effect` lint warning at line 200. Listed in deferred-items.md. Do NOT fix as part of Phase 6 redesign — scope to styling/animation only.
- **All 7 modals** currently use `.modal-overlay` and `.modal` CSS classes. Phase 6 replaces these with Tailwind utility classes via ModalShell. The old CSS classes can be removed from `src/index.css` once all 7 modals are migrated.
- **`ModalShell` file location:** `src/components/ui/ModalShell.jsx` — add to the existing `src/components/ui/` barrel export.

</specifics>

<deferred>
## Deferred Ideas

- Moving SyncSettings / CategoryManager inline into SettingsView (as page sections instead of modals) — Phase 7
- Keyboard shortcut to open CategoryManager from anywhere — Phase 7
- Step progress indicator / stepper for PayPalEnrichWizard — decided against; revisit if UX feedback warrants it
- Responsive modal sizing for small Electron window widths — Phase 7

</deferred>

---

*Phase: 06-modals-redesign*
*Context gathered: 2026-03-19 via /gsd-discuss-phase 6*
