# Project Research Summary

**Project:** MoneyFlow — UI/UX Redesign  
**Domain:** Desktop Budget Tracker (Electron + React 19)  
**Researched:** 2025-01-17  
**Confidence:** HIGH

## Executive Summary

MoneyFlow is an Electron desktop app for personal budget tracking that needs a complete UI/UX overhaul from custom CSS to a modern "light clean & minimal" design system using Tailwind CSS v4. The app has solid functionality (Excel/CSV import, auto-categorization, Google Drive sync, Recharts visualizations) but suffers from a 2,127-line monolithic `App.jsx` component and inconsistent styling. This redesign focuses on **zero breaking changes** to existing features while introducing modern UI patterns, better maintainability, and visual polish.

The research reveals a clear path forward: **extract state management first** (custom hooks for transactions, categories, filters), **establish component boundaries second** (views, modals, shared components), then **migrate CSS incrementally** view-by-view. This ordering minimizes regression risk and allows parallel UI work once state refactoring stabilizes. The recommended stack—Tailwind v4 + Radix UI primitives + Framer Motion—provides utility-first styling, accessibility by default, and hardware-accelerated animations optimized for Electron's Chromium engine.

Critical risks include localStorage data loss during refactoring, CSP conflicts with Tailwind's development mode, React 19 concurrent rendering race conditions, and Recharts responsiveness issues in Electron window resizes. Each has documented prevention strategies and must be addressed in specific phases. The migration is estimated at 11-13 days with 3 developers working in parallel after initial state extraction completes.

## Key Findings

### Recommended Stack

**Summary from STACK.md** — The technology choices prioritize zero breaking changes, Electron performance, maintainability, and developer experience. NO full component library (shadcn/ui adds complexity); instead, headless Radix UI primitives provide accessibility while Tailwind v4 handles all styling.

**Core technologies:**
- **Tailwind CSS v4** (alpha): Utility-first framework with native CSS variables, `@theme` directive for design tokens, excellent Vite integration, smaller bundle than v3
- **Framer Motion v12+**: Tree-shakeable animation library for modal enter/exit, page transitions, skeleton loading (~40KB gzipped, hardware-accelerated)
- **Radix UI v1.2+**: Headless accessible primitives (Dialog, Dropdown, Select, Tabs, Tooltip) — install only needed primitives, full Tailwind styling control
- **Inter Variable Font** (bundled via Fontsource): Tabular figures for financial data, offline-first (no CDN), WOFF2 subset ~30KB
- **CSS Custom Properties**: OKLCH color space for perceptually uniform theming, runtime theme switching support (future dark mode)

**Critical setup notes:**
- Tailwind v4 uses Vite plugin (`@tailwindcss/vite`), NO PostCSS config needed
- CSP must allow `style-src 'unsafe-inline'` during development (Tailwind generates inline styles for HMR)
- Bundle fonts locally, NOT Google Fonts CDN (Electron apps should work offline)
- Use explicit dimensions or debounced resize handlers for Recharts in Electron windows

### Expected Features

**Summary from FEATURES.md** — Modern budget trackers excel through clarity at a glance, zero-friction data entry, and purposeful micro-interactions. The redesign should add visual breathing room, smooth motion, and contextual density without changing existing functionality.

**Must have (table stakes):**
- At-a-glance balance summary with color coding (green/red/yellow)
- Time period selector (This Month, Last Month, This Year, Custom)
- Category breakdown pie/donut chart with muted color palette
- Monthly trend line chart with clean tooltips
- Transaction list: tabular layout, sortable columns, inline editing, search/filter, pagination
- Fixed sidebar navigation (Notion/Linear pattern) with icon-based items
- Modal overlays with backdrop blur, keyboard shortcuts (ESC, ENTER), focus trap
- Toast notifications (bottom-right, auto-dismiss, success/error states)
- Loading skeletons for perceived speed
- Empty states with clear CTAs

**Should have (competitive differentiators):**
- Keyboard shortcuts (Cmd/Ctrl+N, Cmd+F for search, focus navigation)
- Smart search across all transaction fields with highlighting
- Drag-and-drop categorization (visual bulk categorization)
- Auto-save with visual indicator
- Command palette (Cmd+K for fast action access — defer to v2)
- Dark mode toggle (expected in 2025+, defer to post-MVP)
- Multi-step onboarding wizard (reduce first-run friction)

**Defer to v2+:**
- Customizable dashboard cards (drag-to-reorder, hide/show)
- Undo/redo for destructive actions (requires action history stack)
- Recurring transaction templates
- Budget vs. actual comparison (YNAB feature, out of scope)
- AI-powered insights (defer until user need validated)
- Mobile responsive layout (desktop-only Electron app)

### Architecture Approach

**Summary from ARCHITECTURE.md** — Refactoring a 2,127-line monolith requires systematic extraction: state first (custom hooks), then component hierarchy, then CSS migration. This ordering preserves functionality while enabling incremental redesign.

**Major components:**
1. **State Management Hooks** (extract first):
   - `useTransactionData`: Transactions array, CRUD operations, localStorage persistence
   - `useCategories`: Categories, keyword mappings, conflict resolution
   - `useFilters`: Date/search/category filters, computed `filteredTransactions`
   - `useImportProfiles`: Import profile detection and management
   - `useViewState`: Current view, pagination, UI toggles
   - `useModals`: Centralized modal open/close state
   - `useToast`: Notification queue management

2. **Component Hierarchy**:
   - **Layout**: Sidebar (navigation, filters), Header (breadcrumb, sync status), MainContent (view container)
   - **Views**: DashboardView (stats grid, charts), TransactionsView (table, filters, pagination)
   - **Modals**: ImportWizard, ConflictResolver, CategoryManager, SyncSettings (portal-rendered)
   - **Shared**: Button, Input, Select, Card, Badge (Tailwind-based, reusable)

3. **Data Flow**: Unidirectional top-down — root component owns state via hooks, passes down via props, receives updates via callbacks. NO prop drilling beyond 2-3 levels (use Context for global UI state like theme/toast).

**Build order (critical path ~18 days, optimized to 11-13 with parallelization):**
1. Setup Tailwind + CSP config (0.5 days)
2. Extract utility hooks: `useToast`, `useModals`, `useViewState` (parallel, ~1 day each)
3. Extract domain hooks: `useCategories` → `useTransactionData` → `useFilters` (sequential, 5 days)
4. Build Layout + Shared components (parallel with hook extraction, 2 days)
5. Redesign Views: DashboardView + TransactionsView (parallel, 3 days each)
6. Redesign Modals (parallel after Layout, 4 days for 7 modals)

### Critical Pitfalls

**Top 5 from PITFALLS.md** — Mistakes that cause rewrites, data loss, or major functionality breaks.

1. **CSP Breaks Tailwind JIT During Development** — Tailwind v4 generates inline styles for HMR, Electron CSP with `style-src 'self'` blocks them. **Prevention**: Keep `'unsafe-inline'` during dev, test production builds early, use CSP nonces for production.

2. **Breaking localStorage During Component Refactoring** — State extraction changes initialization order, causing silent data loss. **Prevention**: Extract localStorage logic to dedicated hook FIRST, add data migration layer, implement backup before refactoring, test persistence after EVERY refactor step.

3. **Recharts ResponsiveContainer Breaks in Electron Window Resize** — Charts don't redraw when window resizes; `ResponsiveContainer` misses Electron resize events. **Prevention**: Force remount on window resize (debounced), use explicit dimensions instead of ResponsiveContainer, add Electron-specific resize handler in preload.

4. **React 19 Concurrent Rendering Breaks Callback Chains** — Deeply nested callbacks (import → parse → categorize → merge → save) interleave unpredictably. **Prevention**: Use `useTransition` for non-urgent updates, wrap critical mutations in `flushSync`, avoid refs for UI-critical state, test async operations thoroughly.

5. **Accessibility Regressions from Visual Redesign** — Focus on aesthetics breaks keyboard navigation, screen reader support, color contrast. **Prevention**: Preserve semantic HTML (`<button>` not `<div>`), add ARIA labels for icon-only buttons, test focus management in modals, check color contrast (4.5:1 ratio minimum), audit accessibility after EVERY component redesign.

**Additional moderate risks:**
- Performance degradation from long className strings (extract to constants, use `@apply` for repeated patterns, virtualize lists)
- Window drag regions broken by Tailwind (explicitly set `-webkit-app-region: drag` on header)
- Custom scrollbar styles lost (use Tailwind plugin for webkit-scrollbar, test cross-browser)
- Recharts tooltip styling inconsistent (build custom Tailwind-styled tooltip component)
- Toast notifications lost during migration (migrate Toast component FIRST with Tailwind)
- Class name conflicts between custom CSS and Tailwind (migrate view-by-view, delete old CSS as you go)

## Implications for Roadmap

Based on research, suggested phase structure prioritizes **risk mitigation** (state extraction first to prevent data loss), **dependency ordering** (hooks before components), and **parallelization opportunities** (independent views after foundation complete).

### Phase 1: Foundation & Setup
**Rationale:** Establish technical foundation and prevent critical pitfalls before any UI work.  
**Delivers:** Tailwind v4 configured, CSP verified, localStorage backup implemented, design tokens defined.  
**Addresses:** Tailwind setup (STACK.md), CSP configuration (PITFALLS.md #1), localStorage safety (PITFALLS.md #2).  
**Avoids:** CSP blocking Tailwind JIT, data loss during refactoring.  
**Duration:** 0.5-1 day  
**Research needed:** None (well-documented Tailwind v4 + Vite setup)

### Phase 2: State Extraction (Sequential)
**Rationale:** Extract all state management BEFORE component refactoring to establish stable data layer.  
**Delivers:** 7 custom hooks (`useToast`, `useModals`, `useViewState`, `useCategories`, `useImportProfiles`, `useTransactionData`, `useFilters`), localStorage persistence tested.  
**Implements:** Hook architecture from ARCHITECTURE.md, data flow patterns.  
**Avoids:** Race conditions (PITFALLS.md #4), localStorage corruption (PITFALLS.md #2).  
**Duration:** 5-7 days (sequential due to dependencies)  
**Research needed:** None (standard React hooks patterns)

### Phase 3: Shared Component Library (Parallel with Phase 2)
**Rationale:** Build reusable Tailwind-based components while hooks stabilize; no App.jsx conflicts.  
**Delivers:** Button, Input, Select, Card, Badge, Toast components with consistent styling.  
**Uses:** Tailwind utilities, Radix UI primitives where needed (Select, Tooltip).  
**Addresses:** Design system tokens (STACK.md), table stakes UI components (FEATURES.md).  
**Duration:** 2-3 days  
**Research needed:** None (Tailwind + Radix patterns well-established)

### Phase 4: Layout Refactor
**Rationale:** Extract Layout structure after hooks complete; provides container for views.  
**Delivers:** Sidebar navigation, Header, MainContent routing container.  
**Depends on:** `useViewState`, shared components from Phase 3.  
**Addresses:** Fixed sidebar navigation (FEATURES.md), window drag regions (PITFALLS.md #10).  
**Duration:** 2 days  
**Research needed:** None (standard desktop layout patterns)

### Phase 5: Dashboard View Redesign (Parallel)
**Rationale:** High-impact view; can work in parallel with TransactionsView.  
**Delivers:** Stats grid, chart components with Tailwind styling, Recharts theming.  
**Depends on:** `useTransactionData`, `useFilters`, Layout (Phase 4).  
**Addresses:** Card-based layout (FEATURES.md), chart visualizations, loading skeletons.  
**Avoids:** Recharts resize issues (PITFALLS.md #3), tooltip styling inconsistency (PITFALLS.md #13).  
**Duration:** 3 days  
**Research needed:** MINOR — Test Recharts + Tailwind color integration

### Phase 6: Transaction List Redesign (Parallel)
**Rationale:** Most-used feature; can work in parallel with DashboardView.  
**Delivers:** Transaction table, inline editing, filters, pagination with Tailwind.  
**Depends on:** `useTransactionData`, `useFilters`, Layout (Phase 4).  
**Addresses:** Tabular layout (FEATURES.md), search/filter bar, bulk selection.  
**Avoids:** Performance degradation (PITFALLS.md #9), scrollbar styling loss (PITFALLS.md #7).  
**Duration:** 3 days  
**Research needed:** None (standard table patterns)

### Phase 7: Modals Redesign
**Rationale:** After views complete; modals depend on shared components and hooks.  
**Delivers:** 7 modals (ImportWizard, ConflictResolver, CategoryManager, etc.) with Tailwind, Radix Dialog, Framer Motion animations.  
**Depends on:** `useModals`, shared components, Radix UI Dialog.  
**Addresses:** Modal animations (FEATURES.md), focus trap, backdrop blur.  
**Avoids:** Accessibility regressions (PITFALLS.md #8), focus management issues.  
**Duration:** 4 days (7 modals)  
**Research needed:** None (Radix Dialog handles accessibility)

### Phase 8: Polish & Micro-Interactions
**Rationale:** Final pass for animations, keyboard shortcuts, edge cases.  
**Delivers:** Hover states, page transitions, keyboard shortcuts (Cmd+N, Cmd+F), empty states, onboarding.  
**Uses:** Framer Motion for complex animations, CSS transitions for micro-interactions.  
**Addresses:** Differentiators from FEATURES.md (keyboard shortcuts, smart search).  
**Duration:** 2-3 days  
**Research needed:** None (standard UX patterns)

### Phase Ordering Rationale

- **Sequential state extraction (Phase 2)** prevents localStorage corruption and establishes stable data layer before UI changes
- **Parallel component library (Phase 3)** utilizes wait time while hooks extract; no file conflicts with App.jsx
- **Layout before views (Phase 4)** provides container structure; views render inside MainContent
- **Parallel view redesign (Phases 5-6)** maximizes developer efficiency (different files, no conflicts)
- **Modals after views (Phase 7)** ensures shared components and hooks tested; modals are lower-priority UX
- **Polish last (Phase 8)** addresses nice-to-have features after core functionality proven

**Critical path:** Setup (0.5d) → Hooks (7d) → Layout (2d) → Views (3d) → Modals (4d) → Polish (2d) = **~18.5 days**  
**Optimized with parallelization:** Setup → Hooks + Components (7d) → Layout (2d) → Views (3d) → Modals (4d) → Polish (2d) = **~18d total, but overlapping work reduces calendar time to ~11-13 days with 3 developers**

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Dashboard):** Test Recharts + Tailwind CSS variable integration (color theming via `rgb(var(--color-income))` or JavaScript object). **Action**: Create proof-of-concept chart before full implementation.
- **Phase 7 (Modals):** Verify Radix Dialog + Framer Motion animation compatibility in Electron (potential CSP issues with animation libraries). **Action**: Test modal POC in Electron environment early.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Setup):** Tailwind v4 + Vite setup well-documented
- **Phase 2 (Hooks):** React hooks patterns established
- **Phase 3 (Components):** Tailwind utility patterns standard
- **Phase 4 (Layout):** Desktop layout conventions proven
- **Phase 6 (Transactions):** Table/list patterns ubiquitous
- **Phase 8 (Polish):** UX micro-interaction patterns mature

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tailwind v4 beta stable for Vite projects (Dec 2024), Radix UI de facto standard, Framer Motion proven in Electron apps |
| Features | HIGH | UI/UX patterns from established apps (Notion, Linear, YNAB), timeless design principles |
| Architecture | HIGH | React hooks best practices, monolithic component refactoring patterns well-documented, dependency analysis from codebase |
| Pitfalls | HIGH | Electron + React 19 patterns from official docs, CSP/Tailwind issues documented in community, localStorage risks from codebase analysis |

**Overall confidence:** HIGH

### Gaps to Address

**Tailwind CSS v4 stability** — Research assumes v4 alpha is production-ready for Vite projects (documented Dec 2024). If unstable, fallback to Tailwind v3.4+ with same semantic color strategy and `tailwind.config.js` instead of `@theme` directive. **Action**: Verify v4 stability before Phase 1; switch to v3 if any HMR or build issues surface.

**Recharts + Tailwind theming** — Unclear if Recharts can consume Tailwind CSS variables directly (`stroke="rgb(var(--color-income))"`) or requires JavaScript color objects. **Action**: Test during Phase 5 POC; fallback to JavaScript theme object if CSS variables unsupported.

**Electron CSP + Framer Motion** — Potential risk that Framer Motion's inline styles trigger CSP violations in Electron production builds. **Action**: Test modal animation POC in production build during Phase 7; if blocked, use CSS transitions instead of Framer Motion for modals.

**Performance with 1000+ transactions** — Current pagination (100 items/page) sufficient for MVP, but unknown if Tailwind's long className strings cause performance issues with large lists. **Action**: Profile TransactionList rendering during Phase 6; implement virtualization (`@tanstack/react-virtual`) if FPS drops below 30.

**Windows 7 compatibility** — Electron 34 supports Windows 7+, but OKLCH color space (CSS Color Level 4) requires Chromium 111+. Electron 34 uses Chromium 130, so compatible. However, if users on older Electron versions, OKLCH may not render. **Action**: Use OKLCH as documented; fallback to HSL if compatibility issues reported (unlikely).

## Sources

### Primary Sources (HIGH confidence)

**Official Documentation:**
- Tailwind CSS v4 Beta: https://tailwindcss.com/docs/v4-beta
- Vite Documentation: https://vite.dev/config/
- Framer Motion: https://www.framer.com/motion/
- Radix UI: https://www.radix-ui.com/primitives
- Electron CSP Guide: https://www.electronjs.org/docs/latest/tutorial/security
- React 19 Documentation: https://react.dev (concurrent rendering, hooks)
- Recharts Documentation: https://recharts.org

**Codebase Analysis:**
- Direct inspection: `src/App.jsx` (2127 lines), `electron/main.cjs`, `package.json`, `src/App.css`, `src/index.css`
- Planning docs: `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONCERNS.md`
- Existing functionality: Google Drive sync (`src/hooks/useGoogleDrive.js`), localStorage persistence (App.jsx lines 171-212)

### Secondary Sources (MEDIUM confidence)

**Community Patterns:**
- Tailwind v4 + Vite setup: Based on Tailwind Labs migration guide, community adoption (2024-2025)
- Radix UI with Tailwind: Standard pattern in 2025 React apps (replacing shadcn/ui for custom implementations)
- Framer Motion in Electron: Common in desktop apps (Discord, Linear, Raycast use similar stacks)
- React hooks extraction patterns: Established best practices from React community (extract-hook-first strategy)

**UI/UX Reference Knowledge:**
- Personal finance app patterns: YNAB, Copilot, Revolut (training data, not real-time verification)
- Desktop app conventions: Notion, Linear, VS Code, Slack sidebar navigation, modal UX
- Design systems: Material Design, Apple HIG, Tailwind UI patterns

### Tertiary Sources (LOW confidence, needs validation)

**Electron-Specific Edge Cases:**
- Font loading strategies: Based on Electron 24-34 file:// protocol behavior (needs testing per version)
- CSP configurations for Tailwind inline styles: Requires testing with Electron 34 specifically
- Recharts ResponsiveContainer in Electron: Community reports, not official Recharts documentation
- HMR behavior with Vite + Electron: Works in most cases, but can vary with network setup

**Verification Limitations:**
- Unable to access current web sources (Brave API unavailable during research)
- Tailwind v4 alpha status based on Dec 2024 documentation; may have changed
- Specific 2025/2026 trends not verified; research focuses on timeless principles
- No real-time testing of Tailwind v4 + Electron + React 19 combination (recommend Phase 1 POC)

**Recommended Validation:**
- Test Tailwind v4 setup in Electron during Phase 1 (fallback to v3 if unstable)
- Review reference apps (YNAB, Copilot, Revolut) for latest patterns before finalizing designs
- Benchmark animation performance on target Windows 7+ systems during Phase 8
- User-test transaction list density and filter UX with real data (100+ transactions)

---

*Research completed: 2025-01-17*  
*Ready for roadmap: Yes*  
*Next step: Define detailed phase requirements and task breakdown*
