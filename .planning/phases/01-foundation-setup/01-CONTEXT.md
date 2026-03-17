# Phase 1: Foundation & Setup - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Tailwind CSS v4 (via `@tailwindcss/vite` plugin), bundle Inter Variable font locally via Fontsource, define a full design token system in `@theme` inside `index.css`, update `electron/main.cjs` CSP for Tailwind compatibility (with dev/prod split), and clean up duplicated base styles from `App.css`. **No component changes in this phase** — purely foundational infrastructure.

Requirements in scope: FOUND-01, FOUND-02, FOUND-03, FOUND-04

</domain>

<decisions>
## Implementation Decisions

### Design Token Colors

**Income tokens (numeric scale):**
- `--color-income-500`: `#059669` (emerald-600 — softer than existing #10b981, fits Notion/Apple aesthetic)
- `--color-income-100`: `#d1fae5` (emerald-100, for badge/card backgrounds)
- `--color-income-50`: `#ecfdf5` (emerald-50, for subtle hover backgrounds)

**Expense tokens (numeric scale):**
- `--color-expense-500`: `#f43f5e` (rose-500 — softer than existing #ef4444, fits Notion/Apple aesthetic)
- `--color-expense-100`: `#ffe4e6` (rose-100, for badge/card backgrounds)
- `--color-expense-50`: `#fff1f2` (rose-50, for subtle hover backgrounds)

**Neutral/balance:** Reuse the existing `--color-gray-*` scale — no separate neutral ramp needed. Balance states use gray tones.

**Primary brand color renamed:**
- `--color-brand-500`: `#3b82f6` (same hex as existing `--color-primary`, renamed to match numeric scale pattern)

**Existing vars to remove cleanly:** `--color-success`, `--color-danger`, `--color-success-light`, `--color-danger-light`, `--color-primary`, `--color-primary-dark`, `--color-primary-light`. These are superseded by the new token system.

### Token Scope & @theme Block

**All existing CSS vars migrate to `@theme`** — no duplication between `:root` and Tailwind. The complete token set:
- Color semantic: income (3 shades), expense (3 shades), brand (brand-500)
- Color gray scale: gray-50 through gray-900 (keep existing values)
- Font: `--font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif`
- Shadow: `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg` (existing values)
- Border radius: `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, `--radius-full` (existing values)
- Spacing: extend Tailwind defaults with app-specific named tokens only — `--spacing-sidebar: 240px`, `--spacing-sidebar-collapsed: 64px` (Claude's discretion on exact spacing scale; use Tailwind's 4px grid as base)

**Typography:** Font family only — `--font-sans: 'Inter Variable'`. Let Tailwind handle font-size/weight scales.

### Existing CSS File Changes

**`src/index.css` — rewrite to:**
1. Remove Google Fonts CDN `@import url('https://fonts.googleapis.com/...')` — replaced by local Fontsource bundle
2. Add `@import 'tailwindcss'` at the top
3. Add `@theme { ... }` block with full token definitions (see above)
4. Keep scrollbar styles and keyframe animations (not covered by Tailwind)
5. Keep focus-visible and `button`/`input` resets (clean and minimal, not duplicated by Tailwind)
6. Remove the old `:root { ... }` block entirely

**`src/App.css` — clean up duplicates with Tailwind `@layer base`:**
- Remove any `box-sizing: border-box` global resets (Tailwind preflight handles this)
- Remove duplicated color/typography defaults that conflict with @theme tokens
- Keep component-specific styles untouched (this phase only removes global-level duplicates)

**Inter Variable font installation:** Install `@fontsource-variable/inter` via npm, import in `index.css` (or `main.jsx`). No CDN requests in production or development.

### CSP Update Strategy

**Remove from CSP:** `https://fonts.googleapis.com` (style-src and style-src-elem), `https://fonts.gstatic.com` (font-src). Inter is now bundled locally.

**Dev/prod split:**
- **Dev CSP** (when `ELECTRON_DEV=true`): keep `'unsafe-inline'` in `style-src` — required for Tailwind v4 HMR to inject styles
- **Prod CSP** (production build): remove `'unsafe-inline'` from `style-src`; Tailwind v4 generates a static CSS file at build time, no inline injection needed

Implementation: use `process.env.ELECTRON_DEV` check already present in `electron/main.cjs` to conditionally set the CSP string.

### Claude's Discretion

- Exact spacing scale token count (beyond sidebar values) — use Tailwind defaults, add only what the app structurally needs
- Order and grouping of tokens inside the `@theme` block
- Which specific `App.css` duplicates to remove (use judgment to remove only clear conflicts with Tailwind preflight/base)
- Exact Fontsource import syntax and font-display strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — FOUND-01 (Tailwind install), FOUND-02 (design tokens), FOUND-03 (Inter Variable local), FOUND-04 (CSP update)
- `.planning/ROADMAP.md` — Phase 1 success criteria (§Phase 1: Foundation & Setup)

### Files Being Modified
- `src/index.css` — current CSS vars and global styles (read before editing)
- `src/App.css` — existing component/global styles (read before removing duplicates)
- `vite.config.js` — needs `@tailwindcss/vite` plugin added
- `electron/main.cjs` — CSP configuration at lines ~92-106

### Codebase Context
- `.planning/codebase/STACK.md` — tech stack details, Tailwind not yet installed
- `.planning/codebase/CONCERNS.md` — known risks: CSP conflicts with Tailwind JIT

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.css`: has a complete `:root` CSS variable system (colors, shadows, radii) — all migrate to `@theme`
- `electron/main.cjs`: CSP at lines ~92-106 — modify in-place, check for `ELECTRON_DEV` env var already used in this file

### Established Patterns
- `vite.config.js` uses plugin array pattern (`plugins: [react()]`) — add `tailwindcss()` plugin to same array
- `src/main.jsx` imports `./index.css` — keep this; Inter Variable font import also goes here or in index.css
- CSP is set via `session.defaultSession.webRequest.onHeadersReceived` callback — modify the string(s) in that callback

### Integration Points
- Tailwind v4 works with Vite via `@tailwindcss/vite` npm package (not PostCSS) — add to vite.config.js, add `@import 'tailwindcss'` to index.css
- Inter Variable via `@fontsource-variable/inter` — install as npm dependency, import in index.css or main.jsx
- CSP ELECTRON_DEV check is already present in main.cjs — reuse the same conditional pattern for dev/prod CSP split

</code_context>

<specifics>
## Specific Ideas

- Color inspiration: Notion/Apple aesthetic — soft, clean, not saturated. Emerald (#059669) and rose (#f43f5e) fit this palette.
- Numeric scale naming (--color-income-500/100/50) preferred over semantic names (--color-income-light) for consistency with Tailwind conventions.
- `--color-brand-500` replaces `--color-primary` — same hex (#3b82f6, Tailwind blue-500), just renamed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-setup*
*Context gathered: 2026-03-17*
