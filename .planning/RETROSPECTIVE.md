# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-30
**Phases:** 8 | **Plans:** 25 | **Duration:** 62 days (2026-01-27 → 2026-03-30)

### What Was Built
- Tailwind CSS v4 design system with Inter Variable font, CSS custom properties, and semantic color tokens
- App.jsx monolith (2,127 lines) decomposed into 6 custom hooks — pure orchestration shell remaining
- Animated sidebar navigation (Framer Motion, 240px/64px collapse with localStorage persistence)
- Dashboard: AreaChart + DonutChart with Recharts, period selector, cross-filter interactivity, skeleton loading
- Transaction list: sortable table, debounced search, filter chips, inline editing, AnimatePresence pagination
- Unified modal system: Radix Dialog + ModalShell for all 7 modals (scale/fade 200ms, focus trap)
- UX polish: toast notifications, skeleton states, empty states, page transitions, keyboard-accessible buttons
- v1.0 tech debt pass: 4 dead useState pairs removed, 7 null guards eliminated, imports normalized

### What Worked
- **Phase-first state extraction (Phase 2):** Extracting all hooks before touching UI made later phases risk-free and isolated bugs cleanly
- **Design token system:** CSS variables (`--color-income`, `--color-expense`, chart tokens) made theming consistent with zero specificity fights
- **Radix Dialog for modals:** Native focus trap + ESC handling meant zero custom modal scaffolding; AnimatePresence wired cleanly outside
- **Gap closure phases:** Decimal phases and audit-driven Phase 8 prevented scope creep while keeping the main phase sequence clean
- **Verification pass per phase:** Catching gaps early (Phase 4 cross-filter, Phase 5 sort descope) prevented compounding debt

### What Was Inefficient
- Some plan `[ ]` checkboxes were never updated to `[x]` in ROADMAP.md during execution — cosmetic but added noise
- `selectedYear !== null` patterns in 2 out-of-scope files (AreaChartCard, TransactionFilterBar) were deferred rather than fixed inline — minor but required a note in deferred-items.md
- Inter Variable font setup required extra iteration due to Fontsource path resolution in Vite

### Patterns Established
- **Hook-first before component refactor:** Always extract state layer before touching UI components
- **Barrel import at `src/ui/index.js`:** Single entry point for all shared UI components
- **CSS variable colors in Recharts:** `getComputedStyle` utility to read Tailwind design tokens at runtime
- **ModalShell as universal wrapper:** Any new modal goes through Radix Dialog + ModalShell — never raw HTML

### Key Lessons
1. State extraction as a dedicated phase pays dividends — downstream phases moved faster with stable hooks
2. Design tokens via CSS variables are worth the upfront setup; theming and consistency fall into place naturally
3. Milestone audit before archiving (Phase 8) is worth running — caught 5 real items that would have been permanent debt
4. AnimatePresence must wrap the conditional render, not be inside the component — easy to get wrong, worth enforcing as convention

### Cost Observations
- Model mix: ~90% sonnet, ~10% haiku (explore agents)
- Sessions: multiple across 62 days
- Notable: parallel wave execution (phases 4+5 logically parallel) reduced planning overhead

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Duration | Key Change |
|-----------|--------|-------|----------|------------|
| v1.0 MVP  | 8      | 25    | 62 days  | First milestone — established hook-first pattern, design tokens, audit-driven cleanup |

### Top Lessons (Verified Across Milestones)

1. Extract state before refactoring UI — reduces coupling and test surface
2. Design tokens as CSS variables beat inline colors every time for maintainability