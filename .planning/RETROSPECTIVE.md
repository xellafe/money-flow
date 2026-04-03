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

---

## Milestone: v1.1 — Auto-Update

**Shipped:** 2026-04-03
**Phases:** 3 (9–11) | **Plans:** 4 | **Duration:** 1 day

### What Was Built
- electron-updater integration with GitHub Releases provider (prod-only guard, 3s startup delay)
- IPC bridge: 8 preload methods, 3 `ipcMain.handle` handlers, 5 push event channels
- `useUpdateStatus` hook — centralised update state machine in renderer (idle → checking → available → downloading → ready)
- `UpdateBanner` — non-blocking toast shown when download completes, "Installa e riavvia" triggers `quitAndInstall`
- Settings → Aggiornamenti section with current version display, manual check button, progress bar, last-checked timestamp
- Fixed silent error swallowing: `autoUpdater.on('error')` is now the single forwarding point; `updater:start-download` throws instead of returning `{ success: false }`

### What Worked
- **Atomic D-01+D-02:** Fixing both the duplicate send and the missing guard in one commit prevented a window where the double-fire bug could exist in any shipped revision
- **Single forwarding point pattern:** Identifying `autoUpdater.on('error')` as the canonical source-of-truth for all update errors made the fix clean and easy to verify
- **gsd-plan-checker catching exact code hunks:** Verifying exact before/after in the plan before execution meant zero surprises at edit time
- **`ipcMain.handle` / `throw` pattern understood early:** Knowing that `return { success: false }` silently resolves the renderer promise prevented a harder-to-diagnose bug

### What Was Inefficient
- Stale `.git/index.lock` from a prior interrupted command blocked the first commit — required manual removal
- `edit` tool failed on ROADMAP.md due to CRLF/whitespace encoding mismatch; needed PowerShell `Set-Content` fallback
- gsd-tools `milestone complete` accomplishment extraction pulled frontmatter keys instead of real content — manual correction needed

### Patterns Established
- **Single IPC error-forwarding point:** `autoUpdater.on('error')` is the canonical place to send `updater:error` to renderer; IPC handlers must not duplicate it
- **`throw err` in `ipcMain.handle`:** Returning an error object silently resolves the renderer promise; throwing is required for `.catch()` to fire
- **Prod-only auto-update guard:** Wrap all `autoUpdater` calls with `!isDev` to prevent crashes during development

### Key Lessons
1. `ipcMain.handle` semantics: `return` always resolves, `throw` rejects — this matters for any IPC handler where the renderer needs to catch errors
2. electron-updater fires both the `error` event AND rejects the `.checkForUpdates()` promise for the same failure — dedup is required
3. Milestone audit before archiving was worth it — Phase 11 was discovered and planned from the audit's tech debt findings

### Cost Observations
- Model mix: ~70% opus (planning + verification), ~30% sonnet (execution + research)
- Duration: single-day milestone — 3 phases in one session

### Process Evolution

| Milestone | Phases | Plans | Duration | Key Change |
|-----------|--------|-------|----------|------------|
| v1.0 MVP  | 8      | 25    | 62 days  | First milestone — established hook-first pattern, design tokens, audit-driven cleanup |
| v1.1 Auto-Update | 3 | 4 | 1 day | IPC bridge pattern, single error-forwarding point, `throw` semantics in `ipcMain.handle` |

### Top Lessons (Verified Across Milestones)

1. Extract state before refactoring UI — reduces coupling and test surface
2. Design tokens as CSS variables beat inline colors every time for maintainability
3. Milestone audit before archiving is worth it — surfaces tech debt that becomes the next milestone
4. `ipcMain.handle` semantics differ from REST: `throw` to reject, not `return { error }`