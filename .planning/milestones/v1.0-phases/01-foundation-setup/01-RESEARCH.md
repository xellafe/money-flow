# Phase 1: Foundation & Setup - Research

**Researched:** 2026-03-17
**Domain:** Tailwind CSS v4, Vite plugin integration, Electron CSP, CSS design tokens, Fontsource variable fonts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Design Token Colors**
- `--color-income-500`: `#059669` (emerald-600)
- `--color-income-100`: `#d1fae5` (emerald-100)
- `--color-income-50`: `#ecfdf5` (emerald-50)
- `--color-expense-500`: `#f43f5e` (rose-500)
- `--color-expense-100`: `#ffe4e6` (rose-100)
- `--color-expense-50`: `#fff1f2` (rose-50)
- `--color-brand-500`: `#3b82f6` (same hex as existing `--color-primary`)
- Gray scale: reuse existing `--color-gray-*` values
- Remove: `--color-success`, `--color-danger`, `--color-success-light`, `--color-danger-light`, `--color-primary`, `--color-primary-dark`, `--color-primary-light`

**Token Scope**
- All CSS vars migrate to `@theme` — no duplication between `:root` and Tailwind
- Font: `--font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif`
- Shadows: keep existing values (`--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`)
- Border radius: keep existing values (`--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, `--radius-full`)
- Spacing: extend defaults with `--spacing-sidebar: 240px`, `--spacing-sidebar-collapsed: 64px`

**File Changes**
- `src/index.css`: full rewrite — remove Google Fonts CDN, add `@import 'tailwindcss'`, add `@theme {}`, keep scrollbar styles/keyframes/focus-visible/button+input resets, remove old `:root {}`
- `src/App.css`: remove Tailwind preflight duplicates (box-sizing resets, duplicated global defaults)
- `vite.config.js`: add `@tailwindcss/vite` plugin to plugins array
- `electron/main.cjs`: CSP with dev/prod split via `ELECTRON_DEV` env var; remove Google Fonts CDN domains

**CSP Strategy**
- Dev (ELECTRON_DEV=true): keep `'unsafe-inline'` in `style-src` for Tailwind HMR
- Prod: remove `'unsafe-inline'` from `style-src`
- Remove: `https://fonts.googleapis.com` from style-src/style-src-elem, `https://fonts.gstatic.com` from font-src

### Claude's Discretion
- Exact spacing scale token count (beyond sidebar values)
- Order and grouping of tokens inside the `@theme` block
- Which specific `App.css` duplicates to remove (use judgment for clear Tailwind preflight conflicts)
- Exact Fontsource import syntax and font-display strategy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Tailwind CSS v4 installato e configurato con Vite plugin (senza PostCSS) | `@tailwindcss/vite` plugin added to vite.config.js; `@import "tailwindcss"` in index.css |
| FOUND-02 | Design tokens definiti come CSS variables via `@theme`: colori semantici, tipografia, spacing scale | `@theme {}` block syntax verified; namespace-to-utility mapping documented |
| FOUND-03 | Font Inter Variable bundlato localmente via Fontsource (no CDN) | `@fontsource-variable/inter` npm package; `@import` syntax in index.css |
| FOUND-04 | CSP in `electron/main.cjs` aggiornata per compatibilità Tailwind v4 | `isDev` already exists; dev/prod CSP split pattern documented |
</phase_requirements>

---

## Summary

Phase 1 is purely infrastructure — no component changes. The core work is installing Tailwind v4 via Vite plugin, migrating CSS vars to `@theme`, bundling Inter Variable locally, and hardening the Electron CSP. All four requirements have clear, straightforward implementation paths with no experimental or risky dependencies.

The critical pre-existing pitfall is that `App.css` references old CSS variable names (`--color-primary`, `--color-danger`, `--color-success`) a total of 57 times. Deleting these vars from `:root` without adding backward-compat aliases will silently break every styled component. Since Phase 1 prohibits component changes, the safest strategy is to add compat alias vars (pointing old names to new tokens) outside the `@theme` block, so App.css keeps working until Phase 3+ renames them.

Tailwind v4 is a stable release (4.2.1 as of research date). The `@tailwindcss/vite` plugin is the official first-class integration — no PostCSS needed. Design token definition via `@theme {}` in CSS replaces `tailwind.config.js` entirely. Fontsource variable fonts bundle as local npm packages with a single `@import` directive.

**Primary recommendation:** Install `tailwindcss@^4` + `@tailwindcss/vite@^4` + `@fontsource-variable/inter` as devDependencies; follow the exact code patterns below.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tailwindcss` | 4.2.1 | CSS utility framework | v4 is stable release; native CSS vars; no config file |
| `@tailwindcss/vite` | 4.2.1 | Vite plugin for Tailwind v4 | Official first-class integration; no PostCSS needed |
| `@fontsource-variable/inter` | 5.2.8 | Inter variable font, locally bundled | Eliminates CDN dependency; tree-shakeable per axis |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No PostCSS config | — | Not needed | Tailwind v4 Vite plugin handles processing internally |
| No `tailwind.config.js` | — | Not needed | All config is CSS-first via `@theme {}` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tailwindcss/vite` | PostCSS plugin | PostCSS works but adds config boilerplate; Vite plugin is simpler and has better HMR |
| `@fontsource-variable/inter` | Google Fonts CDN | CDN requires internet + CSP allowances; local bundle is faster and more secure |

**Installation:**
```bash
npm install -D tailwindcss @tailwindcss/vite @fontsource-variable/inter
```

> ⚠️ These go in `devDependencies` — CSS and font assets are bundled at build time, not needed at runtime.

**Version verification:** Confirmed against npm registry on 2026-03-17:
- `tailwindcss`: 4.2.1
- `@tailwindcss/vite`: 4.2.1
- `@fontsource-variable/inter`: 5.2.8

---

## Architecture Patterns

### Recommended Project Structure (after Phase 1)
```
src/
├── index.css           # @import "tailwindcss" + @theme block + globals
├── App.css             # Component-scoped styles (unchanged except preflight cleanup)
└── main.jsx            # Already imports ./index.css — no change needed
electron/
└── main.cjs            # CSP: dev/prod split using existing isDev var
vite.config.js          # Add tailwindcss() to plugins array
```

### Pattern 1: Tailwind v4 Vite Plugin Setup

**What:** Import `tailwindcss` from `@tailwindcss/vite` and add to plugins. No tailwind.config.js, no postcss.config.js.
**When to use:** Always — this is the only supported integration for Vite + Tailwind v4.

**`vite.config.js` after change:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Keep for Electron compatibility
})
```

### Pattern 2: Tailwind v4 CSS Entry and @theme Block

**What:** `@import "tailwindcss"` at the top of index.css replaces the old `@tailwind base/components/utilities` directives. The `@theme {}` block replaces `tailwind.config.js` `theme.extend`.

**When to use:** The `@import` must be the first non-comment CSS in the file (before `@theme`).

**`src/index.css` complete rewrite structure:**
```css
/* 1. Tailwind entry (must be first) */
@import "tailwindcss";

/* 2. Local font (after Tailwind entry) */
@import "@fontsource-variable/inter";

/* 3. Design tokens */
@theme {
  /* Font */
  --font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif;

  /* Brand */
  --color-brand-500: #3b82f6;

  /* Income (emerald) */
  --color-income-500: #059669;
  --color-income-100: #d1fae5;
  --color-income-50: #ecfdf5;

  /* Expense (rose) */
  --color-expense-500: #f43f5e;
  --color-expense-100: #ffe4e6;
  --color-expense-50: #fff1f2;

  /* Gray scale */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* App-specific spacing */
  --spacing-sidebar: 240px;
  --spacing-sidebar-collapsed: 64px;
}

/* 4. Backward compat aliases (App.css references old names) */
/* Remove in Phase 3+ when component styles are migrated */
:root {
  --color-primary: var(--color-brand-500);
  --color-primary-dark: #2563eb;
  --color-primary-light: #dbeafe;
  --color-success: var(--color-income-500);
  --color-success-light: var(--color-income-100);
  --color-danger: var(--color-expense-500);
  --color-danger-light: var(--color-expense-100);
}

/* 5. Global styles (NOT covered by Tailwind preflight) */
html {
  font-family: var(--font-sans);
  line-height: 1.5;
  font-weight: 400;
  color: var(--color-gray-800);
  background-color: var(--color-gray-50);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

/* Focus styles (not in Tailwind preflight) */
button {
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

button:focus { outline: none; }
button:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}

input, select {
  font-family: inherit;
  font-size: inherit;
}

input:focus, select:focus { outline: none; }

input[type="text"]:focus,
input[type="search"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="number"]:focus,
select:focus {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 1px;
}

/* SVG focus removal (for Recharts) */
svg:focus, path:focus, g:focus,
.recharts-wrapper:focus,
.recharts-surface:focus,
.recharts-layer:focus {
  outline: none !important;
}

/* Scrollbar (not in Tailwind) */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--color-gray-100); border-radius: var(--radius); }
::-webkit-scrollbar-thumb { background: var(--color-gray-300); border-radius: var(--radius); }
::-webkit-scrollbar-thumb:hover { background: var(--color-gray-400); }

/* Keyframes */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
```

### Pattern 3: @theme Namespace-to-Utility Mapping

Tailwind v4 automatically generates utility classes from `@theme` variables:

| @theme variable | Generated utilities |
|----------------|---------------------|
| `--color-brand-500: #3b82f6` | `bg-brand-500`, `text-brand-500`, `border-brand-500`, `ring-brand-500` |
| `--color-income-500: #059669` | `bg-income-500`, `text-income-500`, etc. |
| `--color-gray-800: #1f2937` | `bg-gray-800`, `text-gray-800`, etc. |
| `--font-sans: 'Inter Variable'` | `font-sans` (sets as default sans-serif) |
| `--shadow-sm: ...` | `shadow-sm` |
| `--shadow-md: ...` | `shadow-md` |
| `--radius: 0.5rem` | `rounded` (maps to base radius) |
| `--radius-lg: 0.75rem` | `rounded-lg` |
| `--spacing-sidebar: 240px` | `w-sidebar`, `h-sidebar`, `m-sidebar`, `p-sidebar`, etc. |

> Note: `--radius` (no suffix) maps to `rounded` (not `rounded-base`). `--radius-sm` → `rounded-sm`, `--radius-lg` → `rounded-lg`.

### Pattern 4: Electron CSP Dev/Prod Split

**What:** Conditional CSP string using the existing `isDev` variable already defined in `electron/main.cjs` (line 15).
**Why:** Tailwind v4 + Vite HMR requires `'unsafe-inline'` in style-src during dev; production CSS is a static file.

```javascript
// In electron/main.cjs — the isDev variable already exists (line 15):
// const isDev = process.env.ELECTRON_DEV === 'true' || !fs.existsSync(distPath);

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const styleSrc = isDev
      ? "style-src 'self' 'unsafe-inline';"
      : "style-src 'self';";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          styleSrc + " " +
          "style-src-elem 'self' 'unsafe-inline'; " +
          "font-src 'self' data:; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://oauth2.googleapis.com"
        ]
      }
    });
  });

  createWindow();
  // ... rest unchanged
});
```

> Key changes: Removed `https://fonts.googleapis.com` from style-src, removed `https://fonts.gstatic.com` from font-src, added `data:` to font-src for any base64-embedded font data, dev/prod split for `'unsafe-inline'`.

### Pattern 5: @fontsource-variable/inter Import

**What:** Single `@import` in index.css loads the Inter variable font with full weight/style axes.
**When to use:** Import AFTER `@import "tailwindcss"` but inside index.css (or in main.jsx with a JS import).

```css
/* In index.css (recommended — keeps all font loading in CSS) */
@import "tailwindcss";
@import "@fontsource-variable/inter";

/* Then in @theme: */
@theme {
  --font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif;
}
```

Alternative (import in main.jsx):
```javascript
// src/main.jsx
import '@fontsource-variable/inter'
import './index.css'
```

> **Font name:** The variable font installs as `'Inter Variable'` (with space + "Variable"). The non-variable `@fontsource/inter` installs as `'Inter'`. These are different font-family names — use `'Inter Variable'` when importing from `@fontsource-variable/inter`.

> **Font display:** Default is `font-display: swap` (built into fontsource packages). No additional configuration needed.

### Pattern 6: App.css Preflight Cleanup

Tailwind v4 preflight covers these rules. **Remove from App.css if present:**

| Rule | Covered by Tailwind preflight |
|------|------------------------------|
| `*, *::before, *::after { box-sizing: border-box }` | ✅ Yes |
| `body { margin: 0 }` | ✅ Yes |
| `h1-h6 { margin: 0; font-size: inherit; }` | ✅ Yes |
| `button, input, select { font-family: inherit }` | ✅ Yes (partially) |
| `img { display: block; max-width: 100% }` | ✅ Yes |

**NOT covered by Tailwind preflight (keep in index.css):**
- `::-webkit-scrollbar` custom styles
- `@keyframes` definitions
- `button:focus-visible` custom outlines
- Recharts SVG focus removal (`svg:focus { outline: none }`)
- `html { font-family }` explicit font application
- `-webkit-font-smoothing: antialiased` / `text-rendering: optimizeLegibility`

**App.css analysis:** Inspection shows App.css contains only component-scoped classes (`.app-container`, `.app-header`, etc.) — NO global element resets (no `*`, `body`, `html`, `:root` rules). The only cleanup needed in App.css is removing `box-sizing: border-box` if it appears anywhere. Based on inspection, App.css has zero such universal resets. The preflight cleanup for this file may be a no-op.

### Anti-Patterns to Avoid
- **Mixing `:root` and `@theme` for the same token:** If a var is in `@theme`, it MUST NOT also be in `:root`. The backward compat aliases are the ONLY exception and must be explicitly marked as temporary.
- **Using PostCSS config alongside Vite plugin:** Don't add Tailwind to `postcss.config.js` — the Vite plugin handles this; adding PostCSS too causes double-processing.
- **Importing `@fontsource/inter` (non-variable):** This installs as `'Inter'` not `'Inter Variable'`. Must use `@fontsource-variable/inter`.
- **Removing Google Fonts from CSP before removing the CDN import:** Remove the `@import url('https://fonts.googleapis.com/...')` line FIRST, then update CSP.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS design token system | Custom CSS var framework | Tailwind v4 `@theme` | Automatic utility class generation from tokens |
| Variable font loading | Manual `@font-face` declarations | `@fontsource-variable/inter` | Optimized subset, correct `font-display`, proper axes |
| CSS processing pipeline | Manual PostCSS config | `@tailwindcss/vite` plugin | Plugin handles scanning, optimization, HMR internally |

**Key insight:** Tailwind v4's `@theme` block is essentially a zero-cost CSS variable system that also auto-generates utilities. There's no reason to maintain a parallel custom property system alongside it.

---

## Common Pitfalls

### Pitfall 1: Broken CSS Variables After `:root` Removal (CRITICAL)

**What goes wrong:** `App.css` references `--color-primary` (38×), `--color-danger` (12×), `--color-success` (7×). If these vars are simply deleted from `:root` without backward compat aliases, all styled elements using those vars silently lose their colors (no error, no warning — CSS vars just resolve to empty).

**Why it happens:** Phase 1 decisions rename `--color-primary` → `--color-brand-500` etc., but Phase 1 also prohibits component changes. The 57 references in App.css won't be updated until Phase 3+.

**How to avoid:** Add a `:root {}` block (outside `@theme`) in `index.css` with compat aliases:
```css
/* TEMPORARY - remove in Phase 3 */
:root {
  --color-primary: var(--color-brand-500);
  --color-primary-dark: #2563eb;
  --color-primary-light: #dbeafe;
  --color-success: var(--color-income-500);
  --color-success-light: var(--color-income-100);
  --color-danger: var(--color-expense-500);
  --color-danger-light: var(--color-expense-100);
}
```

**Warning signs:** Any styled element losing color/border/background → check for undefined CSS vars in browser DevTools.

---

### Pitfall 2: Tailwind v4 `@import` Order Matters

**What goes wrong:** Placing `@theme {}` before `@import "tailwindcss"` causes theme variables not to be processed by Tailwind, resulting in missing utility classes.

**Why it happens:** Tailwind v4 must process `@theme` declarations, which requires the Tailwind import to come first.

**How to avoid:** `@import "tailwindcss"` MUST be the first CSS directive. Then `@import "@fontsource-variable/inter"`. Then `@theme {}`. Then all other rules.

---

### Pitfall 3: CSP Blocks HMR Style Injection in Electron Dev

**What goes wrong:** Tailwind HMR in Electron dev mode fails silently — styles stop updating, or the initial load shows unstyled content. No Electron error is shown.

**Why it happens:** Vite's style HMR injects `<style>` tags dynamically. Without `'unsafe-inline'` in `style-src`, Electron's CSP blocks this.

**How to avoid:** The dev/prod CSP split (Pattern 4) ensures `'unsafe-inline'` is present in dev. Always test `npm run electron:dev` after the CSP change to verify styles load.

**Warning signs:** Styles appear in `npm run dev` (browser) but not in `npm run electron:dev`.

---

### Pitfall 4: `@theme` Variables NOT Available as `var()` in Regular CSS

**What goes wrong:** Expecting `var(--color-income-500)` to work everywhere because it's defined in `@theme`, but finding it doesn't work in certain contexts.

**Why it happens:** `@theme` variables ARE exposed as CSS custom properties on `:root` — they work with `var()`. This is actually fine. **Confirmed:** Tailwind v4 `@theme` vars are registered as native CSS custom properties and available globally.

**Reality:** This is NOT a pitfall — `var(--color-brand-500)` WORKS after defining in `@theme`. App.css and any other CSS can use these vars normally.

---

### Pitfall 5: Vite Plugin Not Activated (Double-Check Plugin Order)

**What goes wrong:** Tailwind classes silently don't work; no CSS is generated.

**Why it happens:** Plugin registered but not active (e.g., import typo, wrong array position).

**How to avoid:** After installing, run `npm run build` and inspect `dist/assets/*.css` to confirm Tailwind utilities appear. Also check: running `npm run dev` should print Tailwind startup log in Vite output.

---

## Code Examples

### Complete vite.config.js (after Phase 1)
```javascript
// Source: Tailwind v4 official docs + current vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Required for Electron — keep this
})
```

### Complete electron/main.cjs CSP section (after Phase 1)
```javascript
// Lines ~91-107 in electron/main.cjs
app.whenReady().then(() => {
  // CSP: dev uses unsafe-inline for Tailwind HMR, prod is strict
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const styleUnsafe = isDev ? " 'unsafe-inline'" : "";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          `style-src 'self'${styleUnsafe}; ` +
          `style-src-elem 'self'${styleUnsafe}; ` +
          "font-src 'self' data:; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://oauth2.googleapis.com"
        ]
      }
    });
  });
  createWindow();
  // ... rest of app.whenReady unchanged
});
```

### @theme token reference — all tokens for this project
```css
@theme {
  /* Typography */
  --font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif;

  /* Brand */
  --color-brand-500: #3b82f6;

  /* Income palette (emerald) */
  --color-income-50:  #ecfdf5;
  --color-income-100: #d1fae5;
  --color-income-500: #059669;

  /* Expense palette (rose) */
  --color-expense-50:  #fff1f2;
  --color-expense-100: #ffe4e6;
  --color-expense-500: #f43f5e;

  /* Neutral gray scale */
  --color-gray-50:  #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Box shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow:    0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Border radius */
  --radius-sm:   0.375rem;   /* rounded-sm  */
  --radius:      0.5rem;     /* rounded      */
  --radius-lg:   0.75rem;    /* rounded-lg   */
  --radius-xl:   1rem;       /* rounded-xl   */
  --radius-full: 9999px;     /* rounded-full */

  /* App structural spacing */
  --spacing-sidebar:           240px;  /* w-sidebar, h-sidebar, etc. */
  --spacing-sidebar-collapsed:  64px;  /* w-sidebar-collapsed, etc.  */
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | `@theme {}` block in CSS | Tailwind v4 (early 2025) | No separate config file needed |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Single import replaces three directives |
| PostCSS plugin (`tailwindcss` in postcss config) | `@tailwindcss/vite` Vite plugin | Tailwind v4 | Native Vite integration; faster HMR |
| Google Fonts CDN | `@fontsource-variable/inter` | Ecosystem shift | No CDN, no network request, CSP-friendly |

**Deprecated/outdated:**
- `tailwind.config.js`: Still works in v4 for compatibility, but is not needed and not recommended for new projects
- `postcss.config.js` with tailwindcss: Works but redundant when using `@tailwindcss/vite`
- `@tailwind base; @tailwind components; @tailwind utilities;`: These v3 directives are NOT valid in v4

---

## Open Questions

1. **`style-src-elem` behavior in Electron with Tailwind v4**
   - What we know: `style-src` covers inline styles; `style-src-elem` covers `<style>` elements
   - What's unclear: Whether Tailwind v4 Vite HMR specifically uses `<style>` elements (requiring `style-src-elem 'unsafe-inline'`) or injects via JS (requiring `script-src`)
   - Recommendation: In dev CSP, set BOTH `style-src 'unsafe-inline'` AND `style-src-elem 'unsafe-inline'` — current main.cjs already has both, so keep them in dev. In prod, omit `'unsafe-inline'` from both.

2. **Recharts + Tailwind v4 CSS Variable Resolution**
   - What we know: Recharts reads colors from props, not CSS. It doesn't inherit from CSS vars automatically.
   - What's unclear: Whether Recharts chart fill/stroke props will pick up `var(--color-income-500)` syntax
   - Recommendation: Out of scope for Phase 1. Document as risk for Phase 5 planning. Pass resolved hex values directly to Recharts props as needed.

---

## Validation Architecture

> `nyquist_validation: true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no jest.config.*, vitest.config.*, pytest.ini, test/ directories) |
| Config file | None — see Wave 0 |
| Quick run command | `npm run build` (build verification) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

Phase 1 is purely infrastructure (CSS + config files). There are no JavaScript functions to unit test. Validation is build-based and visual.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Tailwind v4 installed; build generates CSS with utility classes | Build smoke test | `npm run build` — check `dist/assets/*.css` contains utility class names | ❌ Wave 0: no test file, verify manually |
| FOUND-02 | `@theme` tokens available as CSS vars; Tailwind utilities generated | Build + visual | `npm run build` — check CSS contains `--color-brand-500`, `bg-income-500` etc. | ❌ Wave 0: manual check |
| FOUND-03 | Inter Variable font loads locally; no CDN requests | Build smoke + visual | `npm run build` — check `dist/assets/` contains `.woff2` font files | ❌ Wave 0: manual check |
| FOUND-04 | CSP updated; Electron dev loads styles; prod has no `unsafe-inline` for styles | Electron smoke | `npm run electron:dev` — devtools console shows no CSP violations | ❌ Wave 0: manual check |

### Sampling Rate
- **Per task commit:** `npm run build` (validates CSS compilation, catches syntax errors)
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** All 4 manual checks pass before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No test framework currently installed — Phase 1 is config/CSS, no JS test coverage needed
- [ ] Manual verification checklist for CSS output (Wave 0 setup: create checklist in PLAN.md verify steps)

*Note: Phase 1 has no automatable unit tests. Build success + ESLint clean + manual visual checks are the appropriate validation gate.*

---

## Sources

### Primary (HIGH confidence)
- npm registry (`registry.npmjs.org`) — verified package versions: tailwindcss@4.2.1, @tailwindcss/vite@4.2.1, @fontsource-variable/inter@5.2.8
- Current codebase analysis: `electron/main.cjs` lines 1-117, `src/index.css`, `src/App.css`, `vite.config.js`, `package.json` — direct file inspection
- Training knowledge of Tailwind v4 release (stable, early 2025) — `@import "tailwindcss"` syntax, `@theme` block, namespace mapping

### Secondary (MEDIUM confidence)
- Tailwind v4 `@theme` namespace-to-utility mapping (font, shadow, radius, color, spacing) — from training data on Tailwind v4 stable release; major structural claims cross-referenced with package version confirmation
- `@fontsource-variable/inter` font name being `'Inter Variable'` — from training data on fontsource-variable packages

### Tertiary (LOW confidence)
- Exact behavior of `style-src-elem` vs `style-src` in Electron 34 with Tailwind v4 HMR — not independently verified; pattern is conservative (set both)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions verified against npm registry
- Architecture patterns: HIGH — vite.config.js plugin pattern is standard Tailwind v4 docs pattern; CSP pattern based on existing code structure
- Pitfalls: HIGH — CSS var breakage count verified by direct file inspection (57 occurrences)
- Preflight coverage: MEDIUM — based on Tailwind v4 training knowledge, not direct source inspection

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (Tailwind v4 stable; fontsource stable; low churn)
