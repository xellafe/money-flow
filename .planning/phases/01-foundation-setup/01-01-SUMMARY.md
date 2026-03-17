---
phase: 01-foundation-setup
plan: "01"
subsystem: css-foundation
tags: [tailwind-v4, design-tokens, fonts, vite-plugin, css-foundation]
dependency_graph:
  requires: []
  provides: [tailwind-v4-build, design-tokens, inter-variable-font, compat-aliases]
  affects: [all-subsequent-phases]
tech_stack:
  added:
    - tailwindcss@4.x (Tailwind CSS v4)
    - "@tailwindcss/vite (Vite plugin, replaces PostCSS pipeline)"
    - "@fontsource-variable/inter (local woff2 font bundle)"
  patterns:
    - "@theme {} block for CSS design token generation"
    - ":root {} compat aliases for backward compatibility"
    - "Vite plugin CSS processing (no tailwind.config.js needed)"
key_files:
  created: []
  modified:
    - vite.config.js
    - src/index.css
decisions:
  - "Used @tailwindcss/vite plugin (no PostCSS config) — Tailwind v4 native Vite integration"
  - "Compat aliases in :root map old var names to @theme tokens — avoids touching App.css in this phase"
  - "@import 'tailwindcss' placed first per Tailwind v4 requirements (Pitfall 2 from research)"
  - "Pre-existing lint error in PayPalEnrichWizard.jsx deferred — out of scope for CSS plan"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-17"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 1 Plan 1: Tailwind v4 Installation + Design Tokens + Inter Variable Font Summary

**One-liner:** Tailwind CSS v4 installed via @tailwindcss/vite plugin with complete @theme design token system, Inter Variable font bundled locally via Fontsource, and backward-compat aliases preserving all existing App.css var() references.

## What Was Built

Established the complete CSS foundation for the MoneyFlow UI/UX redesign:

1. **Tailwind v4 + Vite plugin** — `@tailwindcss/vite` installed and configured in `vite.config.js`. No `tailwind.config.js` or `postcss.config.js` required — the Vite plugin handles CSS processing natively.

2. **Design token system via `@theme`** — Full set of semantic tokens defined:
   - Brand color (`--color-brand-500: #3b82f6`)
   - Income palette (`--color-income-50/100/500` — emerald)
   - Expense palette (`--color-expense-50/100/500` — rose)
   - Complete gray scale (`--color-gray-50` through `--color-gray-900`)
   - Box shadows (sm, default, md, lg)
   - Border radii (sm, default, lg, xl, full)
   - App structural spacing (`--spacing-sidebar: 240px`, `--spacing-sidebar-collapsed: 64px`)

3. **Inter Variable font locally bundled** — `@fontsource-variable/inter` replaces the Google Fonts CDN import. 7 `.woff2` font files are bundled directly into `dist/assets/`, eliminating external network dependency.

4. **Backward-compat aliases** — `:root {}` block maps 8 old variable names to new `@theme` tokens (e.g., `--color-primary: var(--color-brand-500)`). This preserves the 57+ existing `var()` references in `App.css` with zero visual regressions.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` exits with code 0 | ✅ |
| `dist/assets/*.css` contains `--color-income-500` | ✅ |
| `dist/assets/*.css` contains `--color-brand-500` | ✅ |
| `dist/assets/*.css` contains `--color-primary` | ✅ |
| `dist/assets/*.css` contains `Inter Variable` | ✅ |
| `dist/assets/` contains 7 `.woff2` font files | ✅ |
| `src/index.css` has no Google Fonts CDN reference | ✅ |
| `src/App.css` is unmodified | ✅ |
| No `tailwind.config.js` or `postcss.config.js` | ✅ |
| `npm run lint` | ⚠️ Pre-existing failure (unrelated to this plan) |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: Install deps + configure Vite | `89a3022` | `feat(01-01): install Tailwind v4 + Vite plugin + Inter Variable font` |
| Task 2: Rewrite src/index.css | `9249d6e` | `feat(01-01): rewrite src/index.css with Tailwind v4, design tokens, and compat aliases` |

## Deviations from Plan

### Out-of-Scope Issues Discovered

**1. [Pre-existing] Lint error in PayPalEnrichWizard.jsx**
- **Found during:** Task 2 verification (`npm run lint`)
- **Issue:** `react-hooks/set-state-in-effect` — `setSelectedMatches()` called synchronously inside `useEffect` body
- **Location:** `src/components/modals/PayPalEnrichWizard.jsx` line 200
- **Action taken:** Logged to `deferred-items.md` — file is unmodified by this plan, pre-existing error
- **Acceptance criteria note:** The plan's lint acceptance criterion technically fails, but the failure is 100% pre-existing and unrelated to the CSS/Tailwind changes in this plan

## Key Decisions Made

1. **`@tailwindcss/vite` over PostCSS** — Tailwind v4 native Vite integration; simpler config, no `tailwind.config.js` needed
2. **Compat aliases in `:root`** — Mapping old var names to new `@theme` tokens avoids touching `App.css` (57+ references) until Phase 3+ migration
3. **`@import "tailwindcss"` must be first** — Tailwind v4 requirement; fontsource import placed second per correct order
4. **No `tailwind.config.js`** — Tailwind v4 Vite plugin does not need one; creating it would be unnecessary and potentially conflicting

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `vite.config.js` exists | ✅ |
| `src/index.css` exists | ✅ |
| `01-01-SUMMARY.md` exists | ✅ |
| Commit `89a3022` exists | ✅ |
| Commit `9249d6e` exists | ✅ |
