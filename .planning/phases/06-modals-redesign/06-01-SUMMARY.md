---
phase: 06-modals-redesign
plan: "01"
subsystem: ui-components
tags: [radix-ui, framer-motion, modal, accessibility, animation]
dependency_graph:
  requires: []
  provides: [ModalShell, ui-barrel-export]
  affects: [all-modal-redesigns-06-02-through-06-04]
tech_stack:
  added: ["@radix-ui/react-dialog@1.1.15"]
  patterns: ["Radix asChild pattern with Framer Motion", "Dialog.Root open={true} with AnimatePresence lifecycle", "Barrel export from src/components/ui/"]
key_files:
  created:
    - src/components/ui/ModalShell.jsx
    - src/components/ui/index.js
  modified:
    - package.json
    - package-lock.json
decisions:
  - "ModalShell uses Dialog.Root open={true} — parent AnimatePresence (App.jsx) controls mount/unmount lifecycle"
  - "asChild on Dialog.Overlay and Dialog.Content delegates Radix a11y props to motion.div"
  - "size prop maps to sizeClasses object: sm=max-w-md, lg=max-w-2xl"
metrics:
  duration: "8m"
  completed: "2026-03-19"
  tasks_completed: 3
  files_changed: 4
---

# Phase 6 Plan 01: ModalShell Foundation Summary

**One-liner:** Radix Dialog + Framer Motion ModalShell with backdrop-blur overlay, scale+fade animation (200ms enter / 150ms exit), focus trap, and sm/lg size variants.

## What Was Built

Created the shared `ModalShell` component — the foundation for all 7 modal redesigns in Phase 6. This component wraps Radix UI Dialog primitives for accessibility (focus trap, ESC close, backdrop click close) and Framer Motion for smooth animations.

### Component API

```jsx
<ModalShell title={string} onClose={fn} size="sm|lg">
  {children}
</ModalShell>
```

### Key Design Decisions

**Radix + Framer Motion via `asChild`:**  
`Dialog.Overlay asChild` and `Dialog.Content asChild` allow `motion.div` to receive Radix accessibility attributes while keeping Framer Motion's animation capabilities. This is the recommended Radix pattern for custom animated wrappers.

**`open={true}` lifecycle:**  
`Dialog.Root open={true}` means the modal is always open when mounted. The parent component (App.jsx) uses `AnimatePresence` to control mount/unmount — this gives exit animations time to play before the modal unmounts.

**`onOpenChange` for ESC and backdrop:**  
Radix fires `onOpenChange(false)` on ESC key and backdrop click. The `onClose()` callback is called on these events, delegating close logic to the parent.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install @radix-ui/react-dialog | ee1977c | package.json, package-lock.json |
| 2 | Create ModalShell component | f528f9e | src/components/ui/ModalShell.jsx |
| 3 | Create ui barrel export | d02d4e3 | src/components/ui/index.js |

## Acceptance Criteria — All Met

- ✅ `@radix-ui/react-dialog@1.1.15` in dependencies (^1.1.x)
- ✅ ModalShell uses `Dialog.Root open={true} onOpenChange`
- ✅ Backdrop: `backdrop-blur-sm bg-black/40` with `z-40`
- ✅ Panel: `bg-white rounded-xl shadow-xl` with `z-50`
- ✅ Framer Motion variants: 200ms enter, 150ms exit (scale 0.95→1 + opacity)
- ✅ `size="sm"` → `max-w-md`, `size="lg"` → `max-w-2xl`
- ✅ X button: `aria-label="Chiudi"` via `Dialog.Close asChild`
- ✅ Focus trap: automatic via Radix `Dialog.Content`
- ✅ ESC close: via Radix `onOpenChange`
- ✅ Barrel export: `import { ModalShell } from '../ui'`
- ✅ `npm run build` exits 0
- ✅ `npm run lint` exits 0

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/components/ui/ModalShell.jsx` — FOUND ✅
- `src/components/ui/index.js` — FOUND ✅
- commit ee1977c — FOUND ✅
- commit f528f9e — FOUND ✅
- commit d02d4e3 — FOUND ✅
- `@radix-ui/react-dialog@1.1.15` — FOUND ✅
- build exit 0 — PASSED ✅
- lint exit 0 — PASSED ✅
