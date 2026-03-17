# Feature Landscape: Personal Finance UI/UX

**Domain:** Personal Finance / Budget Tracker Desktop Application
**Researched:** 2025-01-17
**Target Aesthetic:** Light, Clean, Minimal (Notion/Apple/Linear-inspired)
**Platform:** Electron Desktop (Windows 7+)

## Executive Summary

Modern personal finance apps excel through **clarity at a glance**, **zero-friction data entry**, and **subtle but purposeful interactions**. The best apps (YNAB, Copilot, Revolut) prioritize information hierarchy, use color sparingly but meaningfully, and make common actions (add transaction, filter, categorize) require minimal clicks.

For desktop apps, **sidebar navigation** dominates (Notion, Linear, Slack pattern), providing persistent context and quick switching. Transaction lists behave like "smart tables" — inline editing, keyboard shortcuts, bulk actions. Dashboards use **card-based layouts** with progressive disclosure: headline metrics above the fold, detailed charts/breakdowns on scroll.

The redesign should focus on:
1. **Visual breathing room** — whitespace, clear typography hierarchy, light shadows
2. **Purposeful motion** — smooth transitions, loading states, hover feedback
3. **Contextual density** — show more when users need it, hide when they don't

## Table Stakes

Features users expect. Missing = product feels incomplete or amateur.

### Dashboard & Overview

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **At-a-glance balance summary** | First thing users check: "Do I have money?" | Low | Single large metric card: current balance, income this month, expenses this month. Use color coding: green (positive balance), red (negative), yellow (warning threshold). |
| **Time period selector** | Users think in months/quarters/years | Low | Dropdown or segmented control (This Month, Last Month, This Year, Custom). Should update all dashboard metrics/charts. Already exists in MoneyFlow, needs visual refinement. |
| **Income vs. Expense comparison** | Core question: "Am I spending more than I earn?" | Low | Bar chart or side-by-side cards. Show absolute values + percentage comparison. YNAB uses stacked bars; Copilot uses simple ratio display. |
| **Category breakdown pie/donut chart** | Users want to see where money goes | Medium | Already in MoneyFlow (Recharts). Redesign: larger, cleaner legend, click-to-filter category, show top 5-7 categories + "Other". Use muted color palette (not rainbow). |
| **Monthly trend line chart** | Pattern recognition: "Am I improving?" | Medium | Area or line chart showing income/expense over time. Already exists, needs cleaner axis labels, tooltip improvements. |
| **Quick filters: income/expense/all toggle** | Fast context switching | Low | Segmented button group above transaction list. Single click to filter view. |
| **Empty state with CTA** | First-run experience crucial | Low | Friendly illustration or icon, clear "Import your first transactions" button. Explain value prop: "Track spending in 2 minutes". |

### Transaction List

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Tabular layout with sortable columns** | Users expect spreadsheet-like behavior | Low | Date, Description, Amount, Category, Actions. Click column header to sort. Current MoneyFlow has this; needs cleaner styling. |
| **Inline editing (description, category)** | Avoiding modal friction for quick edits | Medium | Double-click or single-click to edit cell. Enter/Esc to save/cancel. Description and Category most common edits. |
| **Search/filter bar (always visible)** | Essential for large transaction sets (>50) | Low | Fixed position near top. Search should filter as-you-type (debounced). Filter by description text. |
| **Bulk selection + actions** | Efficiency: categorize multiple at once | Medium | Checkbox column, "Select All" option. Actions: delete, bulk categorize. Show "X selected" indicator. |
| **Date range filter** | Critical for finance: "Show me Q4" | Medium | Date picker input (single or range). Pre-sets: This Month, Last 3 Months, This Year. |
| **Category filter (multi-select)** | "Show me all Food + Transport" | Medium | Dropdown with checkboxes or tag-style pills. Should support multiple categories. |
| **Pagination or virtual scrolling** | Performance with 1000+ transactions | Medium | MoneyFlow has pagination. Consider virtual scrolling (react-window) for smoother UX if >500 transactions typical. |
| **Amount formatting & color coding** | Readability: income green, expense red | Low | Format with currency symbol, 2 decimals. Positive amounts green, negative red. Already exists; ensure consistent styling. |
| **Quick add transaction button** | Low-friction manual entry | Low | Floating action button or persistent "+ New" button. Opens inline form or compact modal. |
| **Transaction detail hover/tooltip** | Show full info without clicking | Low | Hover shows: full description, note, bank ID, import date. Subtle shadow/border on hover. |

### Navigation & Layout

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Fixed sidebar navigation** | Desktop standard (Notion, Linear, Slack) | Low | Left-aligned, 240px wide, icons + labels. Sections: Dashboard, Transactions, Categories, Settings, Sync. Always visible. |
| **Icon-based navigation items** | Visual recognition faster than text | Low | Use Lucide icons (already in project). Home, List, Tag, Settings, Cloud icons. Hover shows tooltip if labels hidden. |
| **Active state indication** | User needs to know "where am I?" | Low | Highlight active nav item with background color or left border. Subtle, not bold. |
| **Responsive sidebar collapse** | Smaller windows need more space | Medium | Toggle button to collapse sidebar to icon-only mode. Save state in localStorage. |
| **Header with contextual title** | Reinforces current view | Low | Top bar shows current view name (e.g., "Dashboard", "Transactions — February 2025"). Breadcrumb optional for multi-level views. |
| **Window controls integration** | Electron-specific: native feel | Low | Custom title bar or integrate with system controls. Drag region for moving window. |

### Modals & Dialogs

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Overlay with backdrop blur** | Focus attention, modern aesthetic | Low | Semi-transparent dark backdrop (rgba(0,0,0,0.5)), optional backdrop-blur CSS. |
| **Smooth open/close animations** | Perceived performance, polish | Low | Fade + scale (0.95 → 1.0) on open. Duration: 200-300ms. Use CSS transitions or Framer Motion. |
| **Keyboard shortcuts (ESC to close)** | Power user efficiency | Low | ESC closes modal, ENTER submits form (when not in textarea). Already standard, ensure consistent. |
| **Focus trap** | Accessibility + UX | Medium | Tab cycles within modal. Focus returns to trigger element on close. Use focus-trap-react or manual implementation. |
| **Persistent position on screen** | Modal shouldn't jump around | Low | Center modal in viewport, fixed position. Large modals (Import Wizard) may be full-screen overlay. |
| **Action buttons: consistent placement** | Predictability reduces cognitive load | Low | Primary action right-aligned, secondary left or left of primary. "Save" right, "Cancel" left. Never swap. |
| **Loading states within modal** | Async operations need feedback | Low | Disable buttons, show spinner, or progress indicator. "Saving..." text. |

### Data Visualization

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Consistent color palette** | Brand identity + readability | Low | Define 6-8 category colors (muted palette: blues, greens, oranges). Avoid pure red/green for colorblind users. |
| **Accessible chart colors** | Colorblind-friendly | Medium | Use patterns or labels in addition to color. Test with colorblind simulator. |
| **Interactive tooltips on charts** | Show exact values on hover | Low | Recharts supports this. Ensure tooltip is readable: white bg, shadow, formatted numbers. |
| **Responsive chart sizing** | Desktop windows resize frequently | Medium | Use aspect ratio or viewport-relative sizing. Charts should scale gracefully 1024px to 1920px width. |
| **Legend with click-to-filter** | Let users explore data dynamically | Medium | Click legend item to hide/show that category in chart. Visual feedback on hover. |
| **Empty state for charts** | "No data to display" handling | Low | Show placeholder with message: "Add transactions to see insights". Don't show broken/empty chart. |

### Feedback & States

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Toast notifications** | Non-blocking confirmations | Low | Already in MoneyFlow. Redesign: bottom-right corner, auto-dismiss in 3-5s, success/error/info states with icons. |
| **Loading skeletons** | Perceived speed during data load | Low | Use gray placeholder boxes mimicking content layout. Better than spinners for list/table data. |
| **Form validation (inline feedback)** | Prevent errors before submission | Medium | Show validation message below input field. Red border + icon. Validate on blur, not on keystroke. |
| **Hover states on interactive elements** | Affordance: "this is clickable" | Low | Subtle background color change, pointer cursor, slight shadow. Consistent across buttons, rows, cards. |
| **Disabled state styling** | Prevent invalid actions | Low | Reduced opacity (0.5), no hover effect, cursor: not-allowed. Explain why disabled (tooltip). |
| **Smooth page transitions** | Polish, reduces jarring switches | Low | Fade between views (150-200ms). Don't overdo — keep it subtle. |

## Differentiators

Features that set products apart. Not expected, but highly valued when present.

### Advanced UX Polish

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| **Keyboard shortcuts for power users** | 10x faster for frequent actions | Medium | Cmd/Ctrl+N (new transaction), Cmd+F (search), Cmd+K (command palette), / (focus search). Show shortcut hints in tooltips. |
| **Command palette (Cmd+K)** | Notion/Linear pattern — fast access to any action | High | Fuzzy search over all commands: "Add transaction", "Go to Dashboard", "Export CSV". Use library like `kbar` or `cmdk`. |
| **Smart search with natural language** | "coffee" finds transactions with "coffee" in any field | Medium | Search across description, note, category. Highlight matches. Bonus: "last month food" → filters date + category. |
| **Undo/redo for destructive actions** | Confidence to experiment without fear | High | Transaction delete → show "Undo" in toast for 5s. Implement action history stack. Complex for bulk operations. |
| **Drag-and-drop categorization** | Visual, intuitive bulk categorization | Medium | Drag transaction row onto category pill/tag in sidebar. Updates category instantly. Satisfying interaction. |
| **Auto-save with visual indicator** | Peace of mind: "my changes are saved" | Low | Show "All changes saved" message in header. Fade in/out on each save. Already auto-saves to localStorage; just expose it. |
| **Dark mode toggle** | User preference, reduces eye strain | Low | Toggle in settings. Use CSS variables for theme colors. Notion/Linear standard feature. Not critical for MVP, but expected in 2025+. |
| **Customizable dashboard cards** | Users value different metrics | High | Drag-to-reorder cards, hide/show specific charts. Save layout preference. Advanced feature — defer to v2. |
| **Transaction notes/memos** | Context for future self: "why did I buy this?" | Low | Already exists in MoneyFlow (note field). Ensure visible in detail view, editable inline. |
| **Recurring transaction templates** | Efficiency: rent, subscriptions don't need re-entry | High | Define template → auto-add monthly. Out of scope for redesign, but common request. |

### Data Intelligence

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| **Smart category suggestions** | Reduces manual categorization | Medium | MoneyFlow has keyword-based auto-categorization. Improve: show confidence score, "Accept" button inline. |
| **Duplicate detection warnings** | Prevents data quality issues | Low | Already exists (conflict resolver). Enhance: show "Possible duplicate" badge on import preview. |
| **Spending trends insights** | Proactive guidance: "Food up 20% vs last month" | High | Requires trend analysis logic. Display as callout cards on dashboard. High value, but complex. Defer to post-redesign. |
| **Budget vs. actual comparison** | Core YNAB feature — goal tracking | High | Out of scope for redesign (no budgeting feature yet). Future consideration. |

### Onboarding & Guidance

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| **Multi-step onboarding wizard** | Guided first experience reduces abandonment | Medium | Step 1: Welcome. Step 2: Import first file. Step 3: Review categories. Step 4: See dashboard. Progress indicator. |
| **Contextual tooltips (first visit)** | "This is where you add transactions" | Medium | Use library like `react-joyride` or `intro.js`. Show once, dismiss option. Store in localStorage. |
| **Empty state CTAs with next steps** | Guide users to value | Low | Empty transaction list → "Import from bank or add manually". Button for each action. |
| **Sample data for demo mode** | Let users explore without commitment | Medium | "Load sample transactions" button in empty state. Pre-populate with fake data. Reset option. |
| **Help/documentation links** | Reduce support burden | Low | "?" icon in header → link to docs or FAQ. Tooltip on complex features (e.g., Import Profiles). |

## Anti-Features

Features to deliberately NOT build in a redesign. Either out of scope, anti-pattern, or against design philosophy.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Mobile responsive layout** | Desktop-only Electron app; mobile not in scope | Focus on desktop window sizes (1024px+). Tablet/mobile is separate product decision. |
| **Heavy animations (3D, particles)** | Distracts from data, slows performance | Use subtle transitions (200-300ms), functional animations only. Finance needs clarity, not flash. |
| **Gamification (badges, streaks)** | Not in line with "clean minimal" aesthetic | Focus on clear metrics, trends. Positive reinforcement via insights ("You saved $200 this month"). |
| **Overly complex filtering UI** | Analysis paralysis; users want quick answers | Provide 3-5 common filters (date, category, type). Advanced filters in "More" dropdown, not primary UI. |
| **Multi-column dashboard layout** | Desktop temptation to cram too much | Use single-column card stack with clear hierarchy. Wide cards utilize horizontal space without columns. |
| **Social features (sharing, leaderboards)** | Finance is private; adds complexity | Keep data local-first. Sync is backup only, not social. |
| **Real-time bank sync** | Requires bank APIs, security, ongoing maintenance | Import from files (existing flow). Real-time sync is major feature, not redesign scope. |
| **Budgeting goals/envelopes** | Core feature of YNAB, but not current MoneyFlow scope | MoneyFlow is transaction tracker + analytics. Budgeting is future milestone, not redesign. |
| **AI-powered insights** | Buzzword-driven; requires ML, data privacy concerns | Smart categorization (keyword-based) sufficient. Defer AI to post-MVP if user need validated. |
| **Customizable themes/skins** | Introduces inconsistency, maintenance burden | Single light theme (clean minimal). Dark mode as binary toggle acceptable, but not full themes. |
| **In-app chat support** | Adds dependency, weight; desktop app users expect email/docs | Link to email/GitHub issues. Simple feedback form acceptable. |
| **Confetti/celebration animations** | Against minimal aesthetic | Subtle toast notification sufficient for success states. |

## Feature Dependencies

```
Dashboard Summary
  ↓ requires
Transaction Data
  ↓ requires
Import/Manual Entry

Filters (Category, Date)
  ↓ requires
Transaction Data + Categories

Inline Editing
  ↓ requires
Editable Transaction State

Bulk Actions
  ↓ requires
Multi-Select UI
  ↓ requires
Checkbox Column in Table

Auto-categorization
  ↓ requires
Category Keyword Mappings

Chart Visualizations
  ↓ requires
Aggregated Statistics (useMemo)
  ↓ requires
Filtered Transaction Set

Google Drive Sync
  ↓ requires
OAuth Flow (Electron IPC)
  ↓ requires
Electron Environment
```

## Domain-Specific UX Patterns

### Dashboard Best Practices

**Hierarchy:** Big numbers first (total balance), then comparisons (income vs. expense), then breakdowns (category chart), finally trends (monthly line).

**Card Layout:** Use card components with subtle shadows for visual separation. Each card = one insight. MoneyFlow should adopt:
- **Hero card:** Current balance + month-to-date change (top of page, full width)
- **Stat cards:** Income, Expense, Savings Rate (3-column grid below hero)
- **Chart cards:** Category Pie, Monthly Trend, Top Expenses List (stacked vertically)

**Color Coding:**
- **Green:** Income, positive balance, savings
- **Red:** Expenses, negative balance, overspending
- **Blue/Neutral:** Informational, transfers, neutral categories
- **Yellow/Orange:** Warnings (approaching budget limit — future feature)

**Interactivity:** Click category in pie chart → filter transaction list to that category. Click month in bar chart → drill down to that month. All charts should cross-filter.

**Reference:**
- **YNAB:** Uses "Age of Money" as hero metric (not applicable to MoneyFlow, but shows power of single focus number)
- **Copilot Money:** Clean cards with "Income this month" / "Spent this month" side-by-side
- **Revolut:** Donut chart with spending categories, tap to drill down

### Transaction List UX

**Density:** Finance users want information density (see many transactions at once) but not clutter. Aim for ~15-20 transactions visible without scrolling on 1080p screen.

**Row Height:** 44-48px for comfortable click targets and readability. Hover increases to 50px with subtle background change.

**Zebra Striping:** Optional alternating row background (very light gray). Reduces eye fatigue for scanning long lists. Notion doesn't use it; Excel does. Test both.

**Inline Editing Flow:**
1. Single-click on description or category cell
2. Cell transforms to input field (description) or dropdown (category)
3. ESC cancels, ENTER saves
4. Tab moves to next editable cell (power user flow)
5. Auto-save on blur (click outside)

**Bulk Actions:**
- Show checkbox column only when first transaction selected (progressive disclosure)
- Selected rows highlighted with light blue background
- Action bar appears at top: "X selected | Delete | Categorize as... | Cancel"
- Confirmation modal for destructive actions (delete)

**Search/Filter Persistence:** Save filter state in URL query params or localStorage. User returns to app → sees last applied filters. Clear button resets to default (all transactions, current month).

**Reference:**
- **Linear:** Excellent inline editing, keyboard shortcuts, bulk selection
- **Notion:** Database table view — inline editing, filters, sorting
- **Apple Numbers:** Clean table aesthetics, but lacks inline bulk actions

### Onboarding / Empty States

**First Launch:**
1. **Welcome screen:** "MoneyFlow helps you understand spending in 2 minutes" + "Get Started" button
2. **Import prompt:** "Import your first bank transactions" or "Add manually"
3. **Category setup:** "Review auto-detected categories or customize"
4. **Dashboard intro:** "Here's your financial overview" (tour optional)

**Empty State Components:**
- **Icon:** Large, friendly icon (not illustration — keeps minimal)
- **Headline:** "No transactions yet"
- **Subtext:** "Import from your bank or add your first transaction manually"
- **Primary CTA:** "Import Transactions" button
- **Secondary CTA:** "Add Manually" link

**Empty Chart:** Show placeholder: "Your spending breakdown will appear here after importing transactions." Don't show axes/legend for empty data.

**Reference:**
- **Notion:** Clean empty states with icon + single CTA
- **Linear:** "No issues yet" with keyboard shortcut hint
- **Apple:** Minimal text, clear action

### Data Visualization for Finance

**Color Palette (Muted, Accessible):**
- Category 1: `#3B82F6` (blue)
- Category 2: `#10B981` (green)
- Category 3: `#F59E0B` (amber)
- Category 4: `#8B5CF6` (purple)
- Category 5: `#EC4899` (pink)
- Category 6: `#6366F1` (indigo)
- Category 7: `#EF4444` (red — use for overspending only)
- Other: `#9CA3AF` (gray)

**Chart Types:**
- **Pie/Donut:** Category breakdown (max 7 slices + "Other")
- **Bar Chart:** Monthly comparison (side-by-side bars for income/expense)
- **Area Chart:** Trend over time (filled area for expense, line for income)
- **Sparklines:** Inline micro-charts in stat cards (minimal axes)

**Tooltip Design:**
- White background, drop-shadow
- Bold label, formatted value (e.g., "Food: $234.50")
- Percentage of total if relevant
- No border (shadow provides separation)

**Accessibility:**
- Include text labels on chart segments for screen readers
- Hover state must be keyboard-accessible
- Don't rely on color alone (use labels, patterns)

**Reference:**
- **Recharts:** MoneyFlow already uses this; customize theme
- **Copilot Money:** Excellent color choices (muted, pastel)
- **YNAB:** High contrast, clear labels

### Navigation: Desktop Electron Patterns

**Sidebar (Recommended for MoneyFlow):**
- **Width:** 240px expanded, 64px collapsed (icon-only)
- **Position:** Fixed left, full height
- **Sections:** Group navigation items (Data: Dashboard, Transactions | Manage: Categories | Sync: Settings)
- **Active State:** Background color + left border (3px accent color)
- **Collapse Toggle:** Icon button at bottom or top (hamburger or arrow)

**Why Sidebar over Tabs:**
- Desktop has horizontal space; sidebar utilizes it
- Always-visible navigation (no hunting for tabs)
- Supports nested navigation (future: sub-categories)
- Standard pattern (Notion, Linear, Slack, VS Code, Finder)

**Top Bar (Complement to Sidebar):**
- **Left:** Logo or app name + current view title
- **Right:** User profile (future), sync status, settings icon
- **Center:** Breadcrumb (optional for multi-level views)
- **Height:** 56-64px

**Window Controls (Electron-specific):**
- **macOS:** Native traffic lights (red/yellow/green) — no customization needed
- **Windows:** Custom title bar with Minimize, Maximize, Close buttons (right-aligned)
- **Drag region:** Entire top bar should be draggable for window repositioning

**Reference:**
- **Linear:** Gold standard sidebar navigation
- **Notion:** Collapsible sidebar with nested pages
- **VS Code:** Icon-only sidebar with expandable sections

### Modal/Dialog UX Best Practices

**Size Tiers:**
- **Small:** 400px wide (confirmation, simple forms)
- **Medium:** 600px wide (add transaction, category editor)
- **Large:** 800px wide (import wizard, conflict resolver)
- **Full-screen:** Overlay for complex multi-step flows

**Layout:**
- **Header:** Title (bold, 18-20px) + Close button (X icon, top-right)
- **Body:** Content with padding (24px), scrollable if tall
- **Footer:** Action buttons, always visible (sticky if body scrolls)

**Animation:**
- **Open:** Fade in backdrop (150ms) → Scale in modal (200ms, ease-out, 0.95→1.0)
- **Close:** Fade out modal (150ms) → Fade out backdrop (100ms)
- **Timing:** Total open duration 200-250ms; close 150-200ms

**Behavior:**
- **ESC:** Always closes modal (except during async operation)
- **Click Backdrop:** Close modal (UX debate, but common pattern)
- **ENTER:** Submits form if single input focused
- **Focus Trap:** Tab cycles within modal, Shift+Tab reverses

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` points to title element
- Focus moves to first interactive element on open
- Focus returns to trigger on close

**Reference:**
- **Radix UI:** Excellent modal primitives with a11y built-in
- **Headless UI:** Unstyled modal component with focus management
- **Linear:** Clean, fast modals with keyboard shortcuts

### Micro-Interactions & Animation Standards

**Hover States:**
- **Duration:** 150ms
- **Easing:** ease-in-out
- **Effect:** Background color shift (10-20% darker/lighter), subtle scale (1.0 → 1.02 for buttons)

**Button Press:**
- **Duration:** 100ms
- **Effect:** Scale down (1.0 → 0.98), increase shadow (active state)

**Page Transitions:**
- **Duration:** 200ms
- **Effect:** Fade out old view (100ms) → Fade in new view (100ms)
- **Alternative:** Slide (subtle, 10-20px offset)

**Loading States:**
- **Spinner:** 1-2s delay before showing (avoid flash)
- **Skeleton:** Immediate, mimics content layout
- **Progress Bar:** Linear or circular, show percentage if available

**Toast Notifications:**
- **Enter:** Slide in from bottom-right (300ms, ease-out)
- **Exit:** Fade out (200ms) after 3-5s auto-dismiss
- **Interaction:** Hover pauses auto-dismiss

**List Item Add/Remove:**
- **Add:** Fade in + slight scale (0.95 → 1.0), 300ms
- **Remove:** Fade out + collapse height, 250ms
- **Reorder:** Smooth position transition (CSS `transition: transform 200ms`)

**Chart Updates:**
- **Duration:** 500ms (longer acceptable for data visualization)
- **Easing:** ease-in-out
- **Effect:** Animate bar heights, pie slices, line paths (Recharts supports this)

**Performance:**
- Use CSS transforms (scale, translate) not width/height (hardware-accelerated)
- Avoid animating expensive properties (box-shadow → use opacity on shadow element)
- 60fps minimum (16ms per frame budget)

**Reference:**
- **Framer Motion:** React animation library for complex interactions
- **Apple Human Interface Guidelines:** Tasteful, purposeful motion
- **Linear:** Fast, subtle animations that feel responsive

## MVP Recommendation

### Phase 1: Visual Foundation (Week 1-2)
**Prioritize:**
1. **Tailwind CSS setup** — design tokens, utility classes
2. **Sidebar navigation** — fixed left, icon + labels, active state
3. **Card-based dashboard layout** — hero card, stat cards, chart cards
4. **Color palette & typography** — define system, apply consistently
5. **Button component library** — primary, secondary, ghost, danger variants

**Why:** Establishes visual language; all future work builds on this.

### Phase 2: Core UX Polish (Week 3-4)
**Prioritize:**
1. **Transaction list redesign** — table styling, hover states, inline editing (description)
2. **Filter/search bar** — sticky position, search-as-type, category filter dropdown
3. **Modal animations** — fade + scale, ESC to close, focus trap
4. **Toast notifications** — redesign with icons, success/error states
5. **Loading skeletons** — dashboard and transaction list placeholders

**Why:** Addresses most-used features; high impact on daily UX.

### Phase 3: Differentiators (Week 5-6)
**Prioritize:**
1. **Keyboard shortcuts** — Cmd+N, Cmd+F, ESC, ENTER
2. **Bulk selection + actions** — checkbox column, delete, categorize
3. **Smart search** — filter across all fields, highlight matches
4. **Chart interactivity** — click category to filter, legend toggle
5. **Onboarding empty states** — welcome screen, CTAs, sample data option

**Why:** Separates "good" from "great"; power user delight.

### Defer to Post-MVP
- Command palette (Cmd+K) — high complexity, lower immediate impact
- Undo/redo — requires architecture changes
- Dark mode — nice-to-have, not critical for light minimal theme
- Customizable dashboard — advanced feature, low ROI for redesign
- Multi-step onboarding wizard — polish after core UX proven

## Sources & Confidence

**Confidence Level:** HIGH (UI/UX patterns), MEDIUM (Specific app comparisons)

**Knowledge Base:**
- **Personal use:** Notion, Linear, YNAB, Revolut apps (direct experience)
- **Design systems:** Material Design, Apple HIG, Tailwind UI patterns
- **Desktop patterns:** Electron app conventions (VS Code, Slack, Discord)
- **Training data:** Personal finance UX articles, case studies (2022-2024)

**Verification Limitation:**
- Unable to access current web sources (Brave API unavailable)
- Recommendations based on established patterns and training knowledge
- Specific 2025/2026 trends not verified; focused on timeless principles

**Recommended Validation:**
- Review reference apps directly (YNAB, Copilot, Revolut) for latest patterns
- Test designs with real users (especially transaction list density/filters)
- Benchmark performance of animations on target Windows 7+ systems

---

*Feature research completed: 2025-01-17*
*Target: MoneyFlow Desktop Budget Tracker UI/UX Redesign*
