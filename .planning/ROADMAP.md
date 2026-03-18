# Roadmap: MoneyFlow UI/UX Redesign

**Created:** 2026-03-17
**Last Updated:** 2026-03-17 (Phase 1 complete)

## Project Summary

**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

**Granularity:** Standard (5-8 phases)
**Total v1 Requirements:** 47
**Coverage:** 47/47 mapped ✓

## Phases

- [x] **Phase 1: Foundation & Setup** - Tailwind v4, CSP, design tokens, font setup ✅
- [x] **Phase 2: State Extraction** - Extract 7 custom hooks from App.jsx monolith (completed 2026-03-17)
- [x] **Phase 3: Navigation & Layout** - Sidebar, header, main content routing (completed 2026-03-18)
- [ ] **Phase 4: Dashboard Redesign** - Stats cards, Recharts theming, cross-filtering
- [ ] **Phase 5: Transaction List Redesign** - Table, filters, inline editing, pagination
- [ ] **Phase 6: Modals Redesign** - 7 modals with animations, accessibility, consistent styling
- [ ] **Phase 7: UX Polish** - Micro-interactions, keyboard shortcuts, empty states

## Phase Details

### Phase 1: Foundation & Setup
**Goal:** Establish technical foundation with Tailwind v4 and prevent critical pitfalls before any UI work

**Depends on:** Nothing (first phase)

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04

**Success Criteria** (what must be TRUE):
1. Developer can use Tailwind utility classes in any component and see styles apply in real-time (HMR working)
2. Application runs in Electron with no CSP violations in console during development
3. Inter Variable font renders correctly in all text elements (no FOUT, no CDN requests)
4. Design tokens (`--color-income`, `--color-expense`, `--spacing-*`) are accessible via CSS variables and apply consistently across the app

**Plans:** 2/2 plans executed ✅

Plans:
- [x] 01-01-PLAN.md — Tailwind v4 + Design Tokens + Inter Variable Font ✅
- [x] 01-02-PLAN.md — CSP Hardening + Foundation Smoke Test ✅

---

### Phase 2: State Extraction
**Goal:** Extract all state management into custom hooks before component refactoring to establish stable data layer

**Depends on:** Phase 1 (foundation must be ready)

**Requirements:** FOUND-05, FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10, FOUND-11

**Success Criteria** (what must be TRUE):
1. User can import transactions, categorize them, and filter the list — all functionality works exactly as before extraction
2. All localStorage data persists correctly after every CRUD operation (add, edit, delete transaction/category)
3. No React console errors or warnings appear during state updates or modal interactions
4. localStorage backup file exists with timestamped data before refactoring steps (recovery point)
5. Developer can use any hook (`useTransactionData`, `useCategories`, `useFilters`, `useModals`, `useImportLogic`, `useToast`) in isolation without touching App.jsx

**Plans:** 4/4 plans complete

Plans:
- [ ] 02-01-PLAN.md — Extract useToast + useModals (zero-dependency hooks)
- [ ] 02-02-PLAN.md — Extract useFilters + useCategories (filter state + category CRUD)
- [ ] 02-03-PLAN.md — Extract useTransactionData (CRUD, localStorage, Electron backup)
- [ ] 02-04-PLAN.md — Extract useImportLogic + finalize barrel + smoke test

---

### Phase 3: Navigation & Layout
**Goal:** Establish fixed sidebar navigation and layout structure that adapts to window size

**Depends on:** Phase 2 (needs `useViewState` hook)

**Requirements:** NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06

**Success Criteria** (what must be TRUE):
1. User sees fixed sidebar (240px expanded, 64px collapsed) with Lucide icons for Dashboard, Transazioni, Impostazioni
2. User can toggle sidebar collapse/expand via button with smooth animation (no jank)
3. Active navigation item is visually highlighted based on current view
4. Header shows current view title and contextual actions (e.g., "Aggiungi transazione" button)
5. Main content area resizes smoothly when sidebar expands/collapses

**Plans:** 2/2 plans complete

Plans:
- [ ] 03-01-PLAN.md — Hook foundation: install Framer Motion, create useViewState, migrate view from useFilters, add brand-600 token
- [ ] 03-02-PLAN.md — Layout shell: create Sidebar, AppHeader, AppLayout, SettingsView components + integrate into App.jsx

---

### Phase 4: Dashboard Redesign
**Goal:** Create at-a-glance financial overview with modern card layout and themed charts

**Depends on:** Phase 3 (needs Layout container), Phase 2 (needs `useTransactionData`, `useFilters`)

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08

**Success Criteria** (what must be TRUE):
1. User sees two stat cards (Entrate, Uscite) with semantic color coding (green income, red expense)
2. Charts use Tailwind CSS variables for colors (no hardcoded hex values) and render with clean tooltips
3. User can click on a category in the donut chart and see the transaction list filter to that category automatically
4. User can select different time periods (month/year) from dashboard controls and all stats update immediately
5. Skeleton loading cards appear during initial app load (no flash of empty content)

**Plans:** 1/3 plans executed

Plans:
- [ ] 04-01-PLAN.md — Foundation: chart tokens, chartColors utility, skeleton components, DashboardStatCard
- [ ] 04-02-PLAN.md — Charts: AreaChartCard, DonutChartCard, DashboardView
- [ ] 04-03-PLAN.md — Wiring: PeriodSelector in AppHeader, AppLayout prop threading, App.jsx integration

---

### Phase 5: Transaction List Redesign
**Goal:** Deliver clean, filterable transaction table with inline editing and accessible controls

**Depends on:** Phase 3 (needs Layout container), Phase 2 (needs `useTransactionData`, `useFilters`)

**Requirements:** TRNS-01, TRNS-02, TRNS-03, TRNS-04, TRNS-05, TRNS-06, TRNS-07, TRNS-08

**Success Criteria** (what must be TRUE):
1. User sees transaction table with sortable columns (Date, Descrizione, Categoria, Importo)
2. User can search transactions inline with real-time filtering (search-as-type)
3. User can click on description or category in a row to edit it directly without opening a modal
4. Income amounts show in green with + sign, expense amounts show in red with - sign
5. Pagination shows clear counter ("Showing 1-100 of 342 transazioni") and navigation works smoothly
6. Empty state appears when no transactions exist, with clear CTA to import or add manually

**Plans:** TBD

---

### Phase 6: Modals Redesign
**Goal:** Unify all 7 modals with consistent styling, animations, and accessibility

**Depends on:** Phase 3 (needs shared Button/Input components), Phase 2 (needs `useModals` hook)

**Requirements:** MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07

**Success Criteria** (what must be TRUE):
1. All modals (ImportWizard, CategoryManager, SyncSettings, ConfirmModal, ConflictResolver, CategoryConflictResolver, PayPalEnrichWizard) open/close with smooth 200ms fade+scale animation
2. User can close any modal by pressing ESC or clicking the backdrop
3. Focus is trapped inside modal when open (Tab cycles through modal elements only, doesn't escape to page behind)
4. All modals use consistent button styles (primary/secondary/destructive) from design system
5. Long-content modals (ImportWizard step 2) scroll internally without breaking layout

**Plans:** TBD

---

### Phase 7: UX Polish
**Goal:** Add micro-interactions, keyboard shortcuts, and final polish for professional feel

**Depends on:** All previous phases (polish applied across all views)

**Requirements:** UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07

**Success Criteria** (what must be TRUE):
1. All interactive elements (buttons, links, table rows) show hover state with 150ms transition
2. User sees skeleton loading for transaction list during initial data load
3. Empty dashboard shows clear illustration and "Importa transazioni" CTA when no data exists
4. Toast notifications appear/disappear with smooth slide-in animation (300ms) and match design system
5. "Aggiungi transazione" button is always visible and accessible (header or sidebar)
6. Page transitions between views (Dashboard ↔ Transazioni) fade smoothly (150ms)
7. All clickable elements show pointer cursor on hover

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Setup | 2/2 | ✅ Complete | 2026-03-17 |
| 2. State Extraction | 4/4 | Complete   | 2026-03-17 |
| 3. Navigation & Layout | 2/2 | Complete    | 2026-03-18 |
| 4. Dashboard Redesign | 1/3 | In Progress|  |
| 5. Transaction List Redesign | 0/? | Not started | - |
| 6. Modals Redesign | 0/? | Not started | - |
| 7. UX Polish | 0/? | Not started | - |

## Dependencies

```
Phase 1: Foundation & Setup
    ↓
Phase 2: State Extraction
    ↓
Phase 3: Navigation & Layout
    ↓ ↙
Phase 4: Dashboard ←→ Phase 5: Transaction List (parallel)
    ↓           ↓
    → Phase 6: Modals ←
         ↓
    Phase 7: UX Polish
```

## Coverage Map

**Foundation (4 requirements):**
- FOUND-01 → Phase 1
- FOUND-02 → Phase 1
- FOUND-03 → Phase 1
- FOUND-04 → Phase 1

**State Extraction (7 requirements):**
- FOUND-05 → Phase 2
- FOUND-06 → Phase 2
- FOUND-07 → Phase 2
- FOUND-08 → Phase 2
- FOUND-09 → Phase 2
- FOUND-10 → Phase 2
- FOUND-11 → Phase 2

**Navigation & Layout (6 requirements):**
- NAV-01 → Phase 3
- NAV-02 → Phase 3
- NAV-03 → Phase 3
- NAV-04 → Phase 3
- NAV-05 → Phase 3
- NAV-06 → Phase 3

**Dashboard (8 requirements):**
- DASH-01 → Phase 4
- DASH-02 → Phase 4
- DASH-03 → Phase 4
- DASH-04 → Phase 4
- DASH-05 → Phase 4
- DASH-06 → Phase 4
- DASH-07 → Phase 4
- DASH-08 → Phase 4

**Transactions (8 requirements):**
- TRNS-01 → Phase 5
- TRNS-02 → Phase 5
- TRNS-03 → Phase 5
- TRNS-04 → Phase 5
- TRNS-05 → Phase 5
- TRNS-06 → Phase 5
- TRNS-07 → Phase 5
- TRNS-08 → Phase 5

**Modals (7 requirements):**
- MOD-01 → Phase 6
- MOD-02 → Phase 6
- MOD-03 → Phase 6
- MOD-04 → Phase 6
- MOD-05 → Phase 6
- MOD-06 → Phase 6
- MOD-07 → Phase 6

**UX Polish (7 requirements):**
- UX-01 → Phase 7
- UX-02 → Phase 7
- UX-03 → Phase 7
- UX-04 → Phase 7
- UX-05 → Phase 7
- UX-06 → Phase 7
- UX-07 → Phase 7

**Total Coverage:** 47/47 requirements mapped ✓

---

*Last updated: 2026-03-17*
