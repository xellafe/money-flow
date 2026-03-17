# Domain Pitfalls: Electron + React UI Redesign with Tailwind CSS v4

**Domain:** Electron desktop app (MoneyFlow budget tracker) — Complete UI/UX redesign
**Technology Stack:** Electron 34.5.8 + React 19.2.0 + Vite 7.2.4 + Tailwind CSS v4 (to be added)
**Researched:** 2025-01-29
**Context:** Migrating from 2127-line monolithic App.jsx with custom CSS to componentized architecture with Tailwind CSS v4

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or major functionality breaks.

### Pitfall 1: CSP Breaks Tailwind's JIT During Development
**What goes wrong:** Tailwind CSS v4 with Vite uses inline styles during development for JIT (Just-In-Time) compilation. Electron's Content Security Policy with `style-src 'self'` blocks these inline styles, breaking the entire UI. Developers see blank screens or unstyled components and waste hours debugging CSP vs Tailwind interactions.

**Why it happens:** 
- Current CSP in `electron/main.cjs` allows `'unsafe-inline'` (line 99), which is permissive
- Tailwind CSS v4 generates inline `<style>` tags during dev mode for instant feedback
- Production builds compile to external CSS files, so the issue only appears inconsistently
- Electron's CSP is more restrictive than browser defaults

**Consequences:** 
- Development environment completely broken — no visual feedback
- False assumption that Tailwind isn't working, leading to configuration thrashing
- Time wasted trying Tailwind v3 or other CSS frameworks
- Team may abandon Tailwind entirely, losing utility-first benefits

**Prevention:**
1. **Keep `'unsafe-inline'` during development** but document the risk
2. **Use CSP nonces for production** — Vite plugin `vite-plugin-csp` can inject nonces
3. **Test production builds early** — verify CSP doesn't break compiled CSS
4. **Configure Vite to externalize styles in dev mode:**
   ```javascript
   // vite.config.js
   export default defineConfig({
     css: {
       devSourcemap: true, // Keep for debugging
     },
     build: {
       cssCodeSplit: false, // Single CSS file for CSP compatibility
     }
   })
   ```

**Detection:** Warning signs before it bites:
- Console errors: `Refused to apply inline style because it violates CSP directive`
- UI renders but has no styling in Electron, works fine in browser
- Tailwind classes not applied in dev mode but work in production build

**Phase assignment:** **Phase 1 (Setup)** — Must configure CSP + Tailwind compatibility before any UI work begins

---

### Pitfall 2: Breaking localStorage During Component Refactoring
**What goes wrong:** Refactoring App.jsx (2127 lines) into smaller components inadvertently breaks localStorage persistence. State initialization happens in wrong order, causing data loss on app restart. User loses all transactions, categories, and import profiles with no warning.

**Why it happens:**
- Current code has tightly coupled localStorage load/save in `useEffect` (lines 171-212 in App.jsx)
- Moving state to custom hooks (`useTransactionData`, `useCategoryManagement`) changes initialization order
- Parent component renders before child hooks load localStorage data
- Race conditions between Google Drive sync and localStorage read
- No schema validation — localStorage could contain corrupted data from previous version

**Consequences:**
- **Data loss** — User's financial data disappears silently
- **Corrupted state** — Partial data loaded, creating inconsistent UI
- **Sync conflicts** — Google Drive backup out of sync with local state
- **User trust destroyed** — Budget tracker that loses transactions is unusable

**Prevention:**
1. **Extract localStorage logic to a dedicated hook FIRST:**
   ```javascript
   // hooks/useLocalStorage.js
   function useLocalStorage(key, initialValue) {
     const [storedValue, setStoredValue] = useState(() => {
       try {
         const item = localStorage.getItem(key);
         return item ? JSON.parse(item) : initialValue;
       } catch (error) {
         console.error('Error reading localStorage:', error);
         return initialValue;
       }
     });

     const setValue = (value) => {
       try {
         setStoredValue(value);
         localStorage.setItem(key, JSON.stringify(value));
       } catch (error) {
         console.error('Error writing localStorage:', error);
       }
     };

     return [storedValue, setValue];
   }
   ```

2. **Add data migration layer:**
   ```javascript
   const SCHEMA_VERSION = 1;
   
   function migrateData(data) {
     if (!data.version || data.version < SCHEMA_VERSION) {
       // Apply migrations
       return { ...data, version: SCHEMA_VERSION };
     }
     return data;
   }
   ```

3. **Implement backup before refactoring:**
   ```javascript
   // Before any changes
   function backupLocalStorage() {
     const backup = localStorage.getItem('moneyFlow');
     localStorage.setItem('moneyFlow_backup_' + Date.now(), backup);
   }
   ```

4. **Test localStorage persistence after EVERY refactor step:**
   - Load app → verify data appears
   - Close app → verify data persisted
   - Restart app → verify data still intact

**Detection:** Warning signs before data loss:
- Empty dashboard after restart (but data was there before)
- Console errors: `JSON.parse` failures, `undefined` state values
- Google Drive sync showing "no local data to backup"
- Toast notifications about "failed to load saved data"

**Phase assignment:** 
- **Phase 1 (Setup)** — Extract localStorage hook, add migrations
- **Phase 2 (Refactor)** — Test persistence after each component extraction
- **Every subsequent phase** — Regression test localStorage after changes

---

### Pitfall 3: Recharts ResponsiveContainer Breaks in Electron Window Resize
**What goes wrong:** Recharts components don't redraw when Electron window is resized. Charts appear stretched, clipped, or overlapping UI elements. `ResponsiveContainer` relies on browser resize events that Electron handles differently than standard browsers.

**Why it happens:**
- `ResponsiveContainer` listens to `window.resize` event
- Electron windows fire resize events at different rates than browser windows
- Chart dimensions calculate once on mount, then never update
- React 19's concurrent rendering can batch resize events, causing missed updates
- Dashboard has multiple charts (bar, area, pie) — all fail simultaneously

**Consequences:**
- Charts unusable on different screen sizes (laptop → external monitor)
- User resizes window, charts become unreadable
- Looks broken/unprofessional — defeats purpose of clean redesign
- Charts overlap data tables, destroying layout

**Prevention:**
1. **Force Recharts remount on window resize:**
   ```javascript
   function useWindowSize() {
     const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

     useEffect(() => {
       let timeoutId;
       const handleResize = () => {
         clearTimeout(timeoutId);
         timeoutId = setTimeout(() => {
           setSize({ width: window.innerWidth, height: window.innerHeight });
         }, 150); // Debounce for performance
       };

       window.addEventListener('resize', handleResize);
       return () => {
         clearTimeout(timeoutId);
         window.removeEventListener('resize', handleResize);
       };
     }, []);

     return size;
   }

   // In chart component
   const { width } = useWindowSize();
   return <ResponsiveContainer key={width}> {/* Forces remount */}
   ```

2. **Use explicit dimensions instead of ResponsiveContainer:**
   ```javascript
   // More reliable in Electron
   <BarChart width={containerWidth} height={400} data={data}>
   ```

3. **Add Electron-specific resize handler in preload:**
   ```javascript
   // electron/preload.cjs
   window.electronAPI.onWindowResize(() => {
     window.dispatchEvent(new Event('resize'));
   });
   ```

4. **Test on multiple window sizes during development:**
   - 800×600 (minimum)
   - 1920×1080 (common desktop)
   - 2560×1440 (high-DPI)
   - Snap window to half-screen (Windows behavior)

**Detection:** Warning signs:
- Charts look perfect on first render, break after resize
- `ResponsiveContainer` console warnings about parent dimensions
- Charts have incorrect `viewBox` or `preserveAspectRatio` values
- Browser DevTools works fine, Electron app broken

**Phase assignment:** **Phase 3 (Dashboard Redesign)** — Implement during chart restyling, test immediately

---

### Pitfall 4: React 19 Concurrent Rendering Breaks Existing Callback Chains
**What goes wrong:** Refactoring App.jsx while React 19's concurrent rendering is active causes race conditions in callback chains. User actions (import file, add transaction, sync Google Drive) trigger callbacks in unpredictable order. State updates interleave, causing partial saves, duplicate transactions, or UI freezes.

**Why it happens:**
- React 19 introduced concurrent features by default (no opt-in needed)
- Current code has deeply nested callbacks: `handleFile → parseRows → categorizeTransactions → mergeTransactions → saveToLocalStorage`
- Concurrent rendering can interrupt these chains, restart them, or run multiple chains in parallel
- `useEffect` dependencies may fire multiple times with stale closure values
- Refs used for persistence (`useRef`) don't trigger re-renders, causing UI/state desync

**Consequences:**
- **Data corruption:** Transactions imported twice or partially
- **Lost user actions:** Click "add transaction", nothing happens
- **UI desync:** Dashboard shows old data, localStorage has new data
- **Google Drive sync fails:** Callback interrupted mid-upload

**Prevention:**
1. **Use `useTransition` for non-urgent updates:**
   ```javascript
   import { useTransition } from 'react';

   function TransactionList() {
     const [isPending, startTransition] = useTransition();

     const handleImport = (file) => {
       startTransition(() => {
         // Non-urgent: import can be interrupted for user interactions
         processImportFile(file);
       });
     };
   }
   ```

2. **Wrap critical mutations in `flushSync`:**
   ```javascript
   import { flushSync } from 'react-dom';

   const handleAddTransaction = (transaction) => {
     flushSync(() => {
       // Critical: must complete immediately, no interruptions
       setTransactions(prev => [...prev, transaction]);
       localStorage.setItem('moneyFlow', JSON.stringify(state));
     });
   };
   ```

3. **Stabilize callback references with `useCallback`:**
   ```javascript
   // Current code has unstable callbacks
   const handleConfirm = useCallback((data) => {
     // Callback definition
   }, [dependencies]); // Explicitly list dependencies
   ```

4. **Audit all `useEffect` for stale closures:**
   ```javascript
   // BAD: captures stale `transactions` value
   useEffect(() => {
     saveToLocalStorage(transactions);
   }, []); // Missing dependency

   // GOOD: always uses fresh value
   useEffect(() => {
     saveToLocalStorage(transactions);
   }, [transactions]);
   ```

**Detection:** Warning signs:
- ESLint warnings: `react-hooks/exhaustive-deps`
- Transactions appear, then disappear, then reappear
- Multiple toast notifications for single action
- "Cannot read property of undefined" in callbacks
- Actions work sometimes, fail other times (nondeterministic)

**Phase assignment:** 
- **Phase 2 (Refactor App.jsx)** — Audit all callbacks during extraction
- **Phase 4+ (UI components)** — Verify no new race conditions introduced

---

### Pitfall 5: Tailwind Purge Deletes Dynamically Generated Classes
**What goes wrong:** Tailwind CSS v4's content detection purges classes that are conditionally applied or dynamically constructed. Chart colors, status badges, category pills lose styling in production build. Classes work in dev mode but disappear in built app.

**Why it happens:**
- Tailwind scans source files for class names at build time
- Dynamic class construction is invisible to static analysis:
  ```javascript
  // Purged in production
  const color = type === 'income' ? 'green' : 'red';
  className={`text-${color}-500`} // Tailwind can't detect this
  ```
- Category colors from `COLORS` array (constants/index.js) not in JSX
- Recharts custom colors defined as variables, not Tailwind classes
- Modals conditionally render classes based on state

**Consequences:**
- **Production build broken:** Charts colorless, categories unstyled, UI unreadable
- **Hard to debug:** Works in dev, breaks in production
- **Wasted time:** Rebuilding multiple times, checking Vite config
- **Rollback required:** Deploy broken build to discover issue

**Prevention:**
1. **Use safelist for dynamic classes:**
   ```javascript
   // tailwind.config.js
   export default {
     content: [
       './index.html',
       './src/**/*.{js,jsx}',
     ],
     safelist: [
       // Category colors
       'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
       'text-blue-500', 'text-green-500', 'text-red-500',
       // Chart colors - keep all used shades
       { pattern: /bg-(blue|green|red|yellow|purple|pink|indigo)-(100|200|500|600)/ },
     ],
   }
   ```

2. **Avoid string concatenation for classes:**
   ```javascript
   // BAD: Purged
   className={`text-${color}-500`}

   // GOOD: Full strings visible to Tailwind
   const colorClasses = {
     income: 'text-green-500 bg-green-100',
     expense: 'text-red-500 bg-red-100',
   };
   className={colorClasses[type]}
   ```

3. **Keep color constants in sync with Tailwind:**
   ```javascript
   // constants/index.js
   export const COLORS = [
     'rgb(59 130 246)', // Tailwind blue-500
     'rgb(16 185 129)', // Tailwind green-500
     'rgb(239 68 68)',  // Tailwind red-500
   ];
   ```

4. **Test production build before committing:**
   ```bash
   npm run electron:preview
   # Check every colored element: charts, badges, categories, buttons
   ```

**Detection:** Warning signs:
- Elements have correct HTML structure but no colors
- Tailwind classes present in DOM but no CSS rules applied
- DevTools shows classes like `text-green-500` with no matching styles
- Production CSS bundle much smaller than expected

**Phase assignment:** 
- **Phase 1 (Setup)** — Configure safelist before writing any Tailwind classes
- **Phase 3+ (UI work)** — Test production build after adding dynamic classes

---

## Moderate Pitfalls

Issues causing significant rework but not catastrophic.

### Pitfall 6: CSS Specificity Wars During Migration
**What goes wrong:** Mixing custom CSS (App.css, index.css) with Tailwind creates specificity conflicts. Tailwind classes don't override existing styles, or vice versa. Developer adds `!important` to force overrides, creating specificity spiral. Styles become unpredictable.

**Why it happens:**
- Current CSS has high specificity selectors: `.stat-card.income`, `.transaction-list tbody tr:hover`
- Tailwind utilities are single-class selectors (low specificity)
- CSS cascade rules mean existing styles win over Tailwind
- Developer tries `!important` in Tailwind config, breaks other styles
- No clear migration path — gradually adding Tailwind creates hybrid mess

**Consequences:**
- Tailwind classes ignored, forcing inline styles
- Duplicate styles (Tailwind + custom CSS) increase bundle size
- Impossible to predict which style wins
- Redesign looks inconsistent — some components styled, others not

**Prevention:**
1. **Use Tailwind layers correctly:**
   ```css
   /* index.css - wrap existing styles */
   @layer base {
     /* Global resets and base styles */
     button { font-family: inherit; }
   }

   @layer components {
     /* Complex components that need custom CSS */
     .stat-card { /* ... */ }
   }

   @layer utilities {
     /* Custom utilities beyond Tailwind */
   }
   ```

2. **Remove CSS incrementally by component:**
   - Phase 1: Convert `StatCard` to Tailwind → delete `.stat-card` styles
   - Phase 2: Convert `TransactionList` → delete `.transaction-list` styles
   - Don't leave orphaned CSS — delete as you migrate

3. **Use Tailwind's `@apply` for complex patterns:**
   ```css
   /* Temporary bridge during migration */
   .stat-card {
     @apply bg-white rounded-lg p-4 shadow-md;
   }
   /* Later: move to JSX as className="bg-white rounded-lg p-4 shadow-md" */
   ```

4. **Disable existing CSS per-component:**
   ```javascript
   // During migration
   // import './App.css'; // Commented out temporarily
   import './App.tailwind.css'; // New Tailwind-only file
   ```

**Detection:** Warning signs:
- DevTools shows strikethrough on Tailwind classes (overridden)
- Need `!important` to make Tailwind classes work
- Multiple CSS rules applying to same element
- Hover states not working (specificity too low)

**Phase assignment:** 
- **Phase 2 (Refactor)** — Convert extracted components to Tailwind immediately
- **Phase 3-6 (UI redesign)** — Migrate CSS progressively, component by component

---

### Pitfall 7: Electron Native Scrollbars Conflict with Tailwind Overrides
**What goes wrong:** Tailwind's scrollbar utilities (`overflow-auto`, `scrollbar-thin`) conflict with Electron's native scrollbar rendering. Custom scrollbar styles in index.css (`::-webkit-scrollbar`) break or look inconsistent across Windows versions. Scrollbars disappear or become impossible to grab.

**Why it happens:**
- Electron uses Chromium's scrollbar rendering (platform-specific)
- Custom `::-webkit-scrollbar` styles only work on WebKit-based browsers
- Tailwind's `overflow-*` utilities reset scrollbar properties
- Windows 7/8/10/11 have different native scrollbar styles
- High-DPI displays render scrollbars at wrong sizes

**Consequences:**
- Scrollbars invisible on some Windows versions
- User can't scroll transaction list or category manager
- Inconsistent UX — some scrollbars styled, others native
- Accessibility issue — keyboard users can't navigate lists

**Prevention:**
1. **Use Tailwind's `scrollbar` plugin for consistency:**
   ```javascript
   // tailwind.config.js
   export default {
     plugins: [
       require('tailwind-scrollbar')({ nocompatible: true }),
     ],
   }

   // Then in JSX
   className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
   ```

2. **Keep native scrollbars for accessibility:**
   ```css
   /* Remove custom scrollbar styles for accessibility */
   /* ::-webkit-scrollbar { } */ // Delete this
   
   /* Use Tailwind classes instead */
   .transaction-list {
     overflow-y: auto; /* Native scrollbar */
   }
   ```

3. **Test on Windows 7, 10, 11 if possible:**
   - Electron 34 still supports Windows 7
   - Scrollbar styles differ significantly between versions

4. **Add keyboard navigation as fallback:**
   ```javascript
   // Don't rely solely on scrollbars
   const handleKeyDown = (e) => {
     if (e.key === 'ArrowDown') containerRef.current.scrollBy(0, 40);
     if (e.key === 'ArrowUp') containerRef.current.scrollBy(0, -40);
   };
   ```

**Detection:** Warning signs:
- Scrollbars have zero width (invisible but functional)
- DevTools shows scrollbar styles but nothing renders
- Scrollbar thumb too small to grab with mouse
- Different appearance in Electron vs browser DevTools

**Phase assignment:** **Phase 4 (Transaction List)** — Redesign scrollbars during table overhaul

---

### Pitfall 8: Accessibility Regressions from Visual Redesign
**What goes wrong:** Focus on visual aesthetics breaks existing keyboard navigation and screen reader support. Modal focus traps disappear, form labels lost, color contrast fails WCAG standards. App becomes unusable for accessibility tools users.

**Why it happens:**
- Current code has basic accessibility (`:focus-visible` in index.css)
- Tailwind classes remove semantic HTML (replacing `<button>` with `<div className="cursor-pointer">`)
- Visual-only indicators (color changes) without ARIA labels
- Modal redesigns forget to restore focus to trigger element
- High-contrast mode broken by Tailwind's fixed colors

**Consequences:**
- Keyboard users can't navigate UI (tab order broken)
- Screen readers announce incorrect information or nothing at all
- Violates WCAG 2.1 standards (legal risk in some jurisdictions)
- Reduces user base — excludes users with disabilities

**Prevention:**
1. **Audit accessibility after EVERY component redesign:**
   ```bash
   # Use axe-core or similar
   npm install -D axe-core
   # Manual testing: Tab through entire UI, verify focus visible
   ```

2. **Preserve semantic HTML:**
   ```javascript
   // BAD: Non-semantic
   <div onClick={handleClick} className="cursor-pointer">Add</div>

   // GOOD: Semantic + accessible
   <button onClick={handleClick} className="cursor-pointer">Add Transaction</button>
   ```

3. **Add ARIA labels for icon-only buttons:**
   ```javascript
   // Current code uses Lucide icons
   <button aria-label="Delete transaction">
     <Trash2 size={16} />
   </button>
   ```

4. **Test focus management in modals:**
   ```javascript
   // Modal component must:
   // 1. Focus first interactive element on open
   // 2. Trap focus inside modal (Tab doesn't escape)
   // 3. Return focus to trigger element on close
   useEffect(() => {
     const firstInput = modalRef.current?.querySelector('input, button');
     firstInput?.focus();
   }, [isOpen]);
   ```

5. **Check color contrast:**
   ```javascript
   // Use Tailwind's color system with sufficient contrast
   // BAD: text-gray-400 on bg-gray-100 (low contrast)
   // GOOD: text-gray-700 on bg-white (4.5:1 ratio)
   ```

**Detection:** Warning signs:
- Tab key doesn't move focus visibly between elements
- Screen reader announces "clickable" instead of "button"
- Modal opens but focus stays on background
- Colors look washed out in high-contrast mode

**Phase assignment:** 
- **Phase 5 (Modals)** — Critical for modal focus trap redesign
- **All phases** — Test with keyboard-only navigation before considering phase complete

---

### Pitfall 9: Performance Degradation with Tailwind's Large Class Strings
**What goes wrong:** Refactored components have className strings with 20+ Tailwind utilities. React's reconciliation algorithm slows down diffing these massive strings. App feels laggy, especially when rendering 100+ transactions in a list. Bundle size increases from class name duplication.

**Why it happens:**
- Tailwind encourages utility-first → long className strings
- Transaction list renders many rows with identical class strings
- React diffs every className string character-by-character
- No class name deduplication → "bg-white p-4 rounded shadow" repeated 100 times in DOM
- Vite bundles all class strings as literals (no optimization)

**Consequences:**
- Slow scrolling through transaction list (janky 30fps instead of smooth 60fps)
- High memory usage from duplicated class strings
- Larger HTML bundle size in production
- Poor UX — redesign makes app slower, not faster

**Prevention:**
1. **Extract repeated class strings to constants:**
   ```javascript
   // Don't repeat inline
   const CARD_CLASSES = 'bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow';

   {transactions.map(t => (
     <div key={t.id} className={CARD_CLASSES}>
       {/* ... */}
     </div>
   ))}
   ```

2. **Use `@apply` for frequently reused patterns:**
   ```css
   /* styles/components.css */
   @layer components {
     .card {
       @apply bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow;
     }
   }
   ```

3. **Virtualize long lists:**
   ```javascript
   // For transaction list with 100+ items
   import { useVirtualizer } from '@tanstack/react-virtual';

   const virtualizer = useVirtualizer({
     count: transactions.length,
     getScrollElement: () => containerRef.current,
     estimateSize: () => 60, // Row height
   });

   // Only render visible rows
   {virtualizer.getVirtualItems().map(virtualRow => (
     <TransactionRow key={virtualRow.index} transaction={transactions[virtualRow.index]} />
   ))}
   ```

4. **Profile before and after Tailwind migration:**
   ```javascript
   // React DevTools Profiler
   import { Profiler } from 'react';

   <Profiler id="TransactionList" onRender={(id, phase, actualDuration) => {
     console.log(`${id} (${phase}) took ${actualDuration}ms`);
   }}>
     <TransactionList />
   </Profiler>
   ```

**Detection:** Warning signs:
- DevTools Profiler shows increased render times after adding Tailwind
- `className` strings in React DevTools are 100+ characters
- Scrolling feels sluggish (monitor FPS in Performance tab)
- Bundle size increased significantly (check `npm run build` output)

**Phase assignment:** 
- **Phase 4 (Transaction List)** — Critical for list with many rows
- **Phase 3 (Dashboard)** — Less critical (fewer repeated elements)

---

### Pitfall 10: Drag Regions Break After Adding Tailwind to Header
**What goes wrong:** Adding Tailwind classes to app header makes window un-draggable. User can't move Electron window by dragging title bar. `-webkit-app-region: drag` CSS property conflicts with Tailwind's resets or gets overridden by utility classes.

**Why it happens:**
- Electron requires `-webkit-app-region: drag` on header for window dragging
- Tailwind's preflight reset may override `-webkit-app-region`
- Adding `cursor-pointer` or other Tailwind utilities on header elements sets `-webkit-app-region: no-drag` implicitly
- React event handlers (`onClick`) on draggable area block native drag behavior

**Consequences:**
- Window stuck in place — user can't reposition it
- Non-standard UX for desktop app (expects draggable title bar)
- Buttons in header area become unclickable (drag intercepts clicks)

**Prevention:**
1. **Explicitly set drag regions in CSS:**
   ```css
   /* index.css or App.css */
   .app-header {
     -webkit-app-region: drag;
     -webkit-user-select: none; /* Prevent text selection during drag */
   }

   .app-header button,
   .app-header input,
   .app-header a {
     -webkit-app-region: no-drag; /* Interactive elements can't be drag handles */
   }
   ```

2. **Add Tailwind plugin for drag regions:**
   ```javascript
   // tailwind.config.js
   export default {
     plugins: [
       function({ addUtilities }) {
         addUtilities({
           '.drag': { '-webkit-app-region': 'drag' },
           '.no-drag': { '-webkit-app-region': 'no-drag' },
         });
       },
     ],
   }

   // Then use in JSX
   <header className="app-header drag">
     <button className="no-drag">Settings</button>
   </header>
   ```

3. **Test window dragging immediately after header redesign:**
   - Try dragging by clicking empty space in header
   - Try clicking buttons (should work, not drag window)
   - Test on Windows (different drag behavior than macOS)

**Detection:** Warning signs:
- Can't drag window by clicking header
- Header buttons don't respond to clicks
- DevTools shows `-webkit-app-region: no-drag` on header
- Cursor doesn't change when hovering over header

**Phase assignment:** **Phase 5 (Navigation Redesign)** — When redesigning header/navigation

---

## Minor Pitfalls

Issues causing annoyance but quick to fix.

### Pitfall 11: Vite HMR Breaks with Tailwind During Development
**What goes wrong:** Hot Module Replacement (HMR) stops working after adding Tailwind CSS v4. Every code change requires full page reload, slowing down development. Vite's dev server sometimes crashes with PostCSS errors.

**Why it happens:**
- Tailwind CSS v4 uses PostCSS for processing
- Vite's HMR doesn't always detect CSS changes in `@import` statements
- Circular dependencies between CSS files break HMR
- PostCSS plugins not configured correctly in Vite config

**Prevention:**
1. **Configure PostCSS correctly:**
   ```javascript
   // vite.config.js
   export default defineConfig({
     plugins: [react()],
     css: {
       postcss: {
         plugins: [
           require('tailwindcss'),
           require('autoprefixer'),
         ],
       },
     },
   });
   ```

2. **Use single entry point for CSS:**
   ```css
   /* index.css - single source of truth */
   @import 'tailwindcss/base';
   @import 'tailwindcss/components';
   @import 'tailwindcss/utilities';

   /* Don't import Tailwind in multiple files */
   ```

3. **Restart Vite after Tailwind config changes:**
   ```bash
   # Vite doesn't watch tailwind.config.js by default
   # Add to vite.config.js:
   server: {
     watch: {
       ignored: ['!**/tailwind.config.js'],
     },
   }
   ```

**Detection:** Warning signs:
- Changes to JSX require full reload instead of hot update
- Tailwind classes don't update until manual refresh
- Console errors: "PostCSS plugin failed" or "Circular dependency"

**Phase assignment:** **Phase 1 (Setup)** — Fix during initial Tailwind configuration

---

### Pitfall 12: Font Loading Breaks Tailwind Typography Plugin
**What goes wrong:** Current app imports Google Fonts via `@import` in index.css (line 1). Tailwind's typography plugin or custom font stack conflicts with this, causing FOUT (Flash of Unstyled Text) or fonts not loading at all.

**Why it happens:**
- `@import` in CSS is blocking (delays page render)
- Tailwind's preflight may override font-family settings
- Google Fonts URL in CSP but font files block due to CORS
- Font loading race condition with Tailwind styles

**Prevention:**
1. **Preload fonts in HTML:**
   ```html
   <!-- index.html -->
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
   ```

2. **Configure Tailwind font family:**
   ```javascript
   // tailwind.config.js
   export default {
     theme: {
       extend: {
         fontFamily: {
           sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
         },
       },
     },
   }
   ```

3. **Remove `@import` from index.css:**
   ```css
   /* Delete this line from index.css */
   /* @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); */
   ```

**Detection:** Warning signs:
- Fonts load, then flash to different font, then back
- Console warning about font-face not loading
- Fonts work in browser, fail in Electron build

**Phase assignment:** **Phase 1 (Setup)** — Migrate font loading before Tailwind setup

---

### Pitfall 13: Recharts Tooltip Styling Inconsistent with Tailwind Theme
**What goes wrong:** Recharts tooltips use inline styles that don't match Tailwind's design tokens. Tooltips have different colors, fonts, shadows than rest of UI. Custom tooltip components break chart responsiveness.

**Why it happens:**
- Recharts has own theming system (not Tailwind-aware)
- Custom tooltips require explicit styling with inline styles or CSS
- Tooltip colors hardcoded in Recharts (doesn't read CSS variables)

**Prevention:**
1. **Create custom Recharts tooltip component:**
   ```javascript
   function CustomTooltip({ active, payload, label }) {
     if (!active || !payload) return null;

     return (
       <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
         <p className="text-sm font-medium text-gray-900">{label}</p>
         {payload.map((entry, index) => (
           <p key={index} className="text-sm text-gray-600">
             {entry.name}: {entry.value}
           </p>
         ))}
       </div>
     );
   }

   <BarChart>
     <Tooltip content={<CustomTooltip />} />
   </BarChart>
   ```

2. **Map Tailwind colors to Recharts:**
   ```javascript
   // constants/index.js
   import resolveConfig from 'tailwindcss/resolveConfig';
   import tailwindConfig from '../tailwind.config.js';

   const fullConfig = resolveConfig(tailwindConfig);
   export const CHART_COLORS = [
     fullConfig.theme.colors.blue[500],
     fullConfig.theme.colors.green[500],
     fullConfig.theme.colors.red[500],
   ];
   ```

**Detection:** Warning signs:
- Tooltips have different font than rest of app
- Tooltip shadows don't match design system
- Tooltips overflow chart container

**Phase assignment:** **Phase 3 (Dashboard Redesign)** — Style tooltips during chart restyling

---

### Pitfall 14: Toast Notifications Lost in Tailwind Transition
**What goes wrong:** Existing toast notification system (App.jsx lines with `showToast`) breaks during refactoring. Toasts don't appear, appear in wrong position, or lack animations. User loses feedback on import success/failure.

**Why it happens:**
- Toast component hardcoded positioning in App.css
- Tailwind's positioning utilities conflict with custom CSS
- Z-index issues — modals cover toasts or vice versa
- Animation keyframes in index.css not compatible with Tailwind transitions

**Prevention:**
1. **Migrate Toast to Tailwind classes first:**
   ```javascript
   // components/Toast.jsx
   export default function Toast({ message, type, onClose }) {
     return (
       <div className={`
         fixed bottom-4 right-4 z-50
         bg-white border-l-4 rounded-lg shadow-lg p-4
         transform transition-all duration-300 ease-in-out
         ${type === 'success' ? 'border-green-500' : 'border-red-500'}
         animate-slideUp
       `}>
         <p className="text-sm font-medium text-gray-900">{message}</p>
       </div>
     );
   }
   ```

2. **Add Tailwind animation:**
   ```javascript
   // tailwind.config.js
   export default {
     theme: {
       extend: {
         animation: {
           slideUp: 'slideUp 0.3s ease-out',
         },
         keyframes: {
           slideUp: {
             '0%': { opacity: '0', transform: 'translateY(10px)' },
             '100%': { opacity: '1', transform: 'translateY(0)' },
           },
         },
       },
     },
   }
   ```

3. **Preserve z-index hierarchy:**
   ```javascript
   // Define z-index scale in Tailwind config
   // Modal: z-50, Toast: z-60, Dropdown: z-40
   ```

**Detection:** Warning signs:
- Toasts visible in DevTools but not on screen (z-index issue)
- Toasts appear without animation (keyframes lost)
- Import succeeds but user sees no confirmation

**Phase assignment:** **Phase 2 (Refactor)** — Extract Toast component early with Tailwind

---

### Pitfall 15: Class Name Conflicts Between Tailwind and Existing CSS
**What goes wrong:** Tailwind class names collide with existing custom classes in App.css. For example, custom `.shadow` class conflicts with Tailwind's `.shadow` utility. Styles become unpredictable depending on CSS load order.

**Why it happens:**
- Existing CSS uses generic class names (`.shadow`, `.card`, `.button`)
- Tailwind has utilities with same names
- CSS cascade depends on import order (index.css vs App.css)
- Specificity ties resolved by order, not intent

**Prevention:**
1. **Prefix custom classes:**
   ```css
   /* App.css - add prefix to avoid conflicts */
   .mf-shadow { /* MoneyFlow prefix */ }
   .mf-card { }
   .mf-button { }
   ```

2. **Audit existing classes before adding Tailwind:**
   ```bash
   # Search for potential conflicts
   grep -r "className=" src/ | grep -E "\.(shadow|card|button|input|container)"
   ```

3. **Use CSS Modules for component-specific styles:**
   ```javascript
   // StatCard.module.css
   .card { /* Scoped automatically */ }

   // StatCard.jsx
   import styles from './StatCard.module.css';
   <div className={styles.card}>
   ```

**Detection:** Warning signs:
- DevTools shows multiple CSS rules with same class name
- Styles different in different browsers (load order varies)
- Removing custom CSS breaks Tailwind utilities

**Phase assignment:** **Phase 1 (Setup)** — Audit and rename conflicting classes before Tailwind install

---

## Phase-Specific Warnings

Pitfalls mapped to roadmap phases where they're most likely to occur.

| Phase | Likely Pitfall | Mitigation Strategy |
|-------|---------------|---------------------|
| **Phase 1: Setup & Tailwind Install** | CSP breaks Tailwind JIT (Pitfall #1) | Configure CSP + Tailwind compatibility before any UI work |
| **Phase 1: Setup & Tailwind Install** | Vite HMR breaks (Pitfall #11) | Test HMR immediately after PostCSS config |
| **Phase 1: Setup & Tailwind Install** | Class name conflicts (Pitfall #15) | Audit existing CSS, rename conflicts |
| **Phase 1: Setup & Tailwind Install** | Font loading issues (Pitfall #12) | Migrate Google Fonts to HTML preload |
| **Phase 2: Refactor App.jsx** | localStorage data loss (Pitfall #2) | Extract localStorage hook first, backup data |
| **Phase 2: Refactor App.jsx** | React 19 callback races (Pitfall #4) | Audit all useEffect, useCallback dependencies |
| **Phase 2: Refactor App.jsx** | Toast notifications lost (Pitfall #14) | Migrate Toast component early |
| **Phase 3: Dashboard Redesign** | Recharts ResponsiveContainer (Pitfall #3) | Implement window resize handler immediately |
| **Phase 3: Dashboard Redesign** | Recharts tooltip styling (Pitfall #13) | Create custom tooltip with Tailwind |
| **Phase 3: Dashboard Redesign** | Tailwind purge deletes chart colors (Pitfall #5) | Safelist all dynamic classes |
| **Phase 4: Transaction List** | Performance with large lists (Pitfall #9) | Extract class constants, consider virtualization |
| **Phase 4: Transaction List** | Scrollbar styling conflicts (Pitfall #7) | Use Tailwind scrollbar plugin |
| **Phase 5: Navigation/Modals** | Drag regions break (Pitfall #10) | Add `-webkit-app-region` utilities |
| **Phase 5: Navigation/Modals** | Accessibility regressions (Pitfall #8) | Test focus trap, keyboard navigation |
| **Phase 5: Navigation/Modals** | Modal z-index issues (Pitfall #14) | Define z-index hierarchy |
| **All Phases** | CSS specificity wars (Pitfall #6) | Migrate CSS incrementally, delete old styles |
| **All Phases** | Accessibility regressions (Pitfall #8) | Keyboard-test every component |

---

## Validation Checklist

Use this checklist after completing each phase to catch pitfalls early:

### Phase 1 (Setup)
- [ ] HMR works with Tailwind changes (no full reload needed)
- [ ] CSP doesn't block Tailwind dev mode inline styles
- [ ] Production build has styled components (Tailwind not purged)
- [ ] Google Fonts load without FOUT
- [ ] No class name conflicts between Tailwind and existing CSS

### Phase 2 (Refactor)
- [ ] localStorage data persists across app restarts
- [ ] Toast notifications appear and animate correctly
- [ ] No ESLint warnings about missing useEffect dependencies
- [ ] Google Drive sync still works after refactoring

### Phase 3 (Dashboard)
- [ ] Charts resize correctly when Electron window resized
- [ ] Chart colors match Tailwind theme (not hardcoded)
- [ ] Recharts tooltips styled consistently with UI
- [ ] All chart colors present in production build (not purged)

### Phase 4 (Transaction List)
- [ ] Scrolling 100+ transactions is smooth (60fps)
- [ ] Scrollbars visible and grabbable on Windows
- [ ] List performance acceptable (< 50ms render time)
- [ ] Keyboard navigation works (arrow keys, tab)

### Phase 5 (Modals/Navigation)
- [ ] Can drag Electron window by header
- [ ] Buttons in header still clickable (not intercepted by drag)
- [ ] Modal focus trap works (Tab doesn't escape)
- [ ] Focus returns to trigger element on modal close
- [ ] Z-index hierarchy correct (modal > toast > dropdown)

### All Phases
- [ ] Keyboard-only navigation works (no mouse needed)
- [ ] Screen reader announces elements correctly
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] No console errors or warnings
- [ ] localStorage data intact after phase changes

---

## Emergency Recovery Procedures

If a critical pitfall occurs, follow these steps:

### Data Loss (Pitfall #2)
1. **Stop immediately** — don't make more changes
2. Check `localStorage` backup:
   ```javascript
   // In browser DevTools console
   Object.keys(localStorage).filter(k => k.includes('moneyFlow'))
   // Look for backup keys
   ```
3. Restore from Google Drive if available:
   ```javascript
   // Use existing sync mechanism
   await window.electronAPI.googleDrive.restoreBackup();
   ```
4. Add data migration layer before continuing:
   ```javascript
   const SCHEMA_VERSION = 1;
   function migrate(data) { /* ... */ }
   ```

### UI Completely Broken (Pitfall #1, #5)
1. **Check production build:**
   ```bash
   npm run electron:preview
   # If dev works but production broken → Tailwind purge issue
   ```
2. **Temporarily disable Tailwind:**
   ```javascript
   // vite.config.js
   css: {
     postcss: {
       plugins: [], // Empty to disable Tailwind
     },
   }
   ```
3. **Restore previous commit:**
   ```bash
   git log --oneline -10
   git checkout <last-working-commit>
   ```

### Performance Degraded (Pitfall #9)
1. **Profile render times:**
   ```javascript
   import { Profiler } from 'react';
   <Profiler id="App" onRender={(id, phase, actualDuration) => {
     if (actualDuration > 50) console.warn(`Slow render: ${id} ${actualDuration}ms`);
   }}>
   ```
2. **Remove Tailwind classes temporarily:**
   - Replace long className strings with simple class
   - Measure performance improvement
3. **Add virtualization:**
   ```bash
   npm install @tanstack/react-virtual
   ```

---

## Sources & Confidence

**Confidence Level: HIGH** for Electron + React patterns, **MEDIUM** for Tailwind CSS v4 specifics

### Primary Sources (HIGH Confidence)
- **Codebase Analysis:** Direct inspection of App.jsx, electron/main.cjs, package.json, existing CSS
- **React 19 Documentation:** Concurrent rendering patterns, useTransition, flushSync usage
- **Electron Documentation:** CSP configuration, window dragging, security best practices
- **Recharts Documentation:** ResponsiveContainer behavior, custom tooltip patterns

### Secondary Sources (MEDIUM Confidence)
- **Tailwind CSS v4 Documentation:** Content detection, purge configuration (v4 beta, behavior may change)
- **Vite Documentation:** PostCSS integration, HMR behavior with CSS preprocessors
- **Community Experience:** Common Electron + Tailwind gotchas (Stack Overflow, GitHub issues)

### Areas Needing Validation (LOW Confidence)
- **Tailwind CSS v4 + Electron CSP interaction:** v4 is in beta, specific CSP behavior may change before stable release
- **React 19 + Recharts compatibility:** Both recently released, edge cases may exist
- **Windows 7 scrollbar behavior:** Support ending soon, testing difficult

### Recommendations for Further Research
- **Before Phase 1:** Verify Tailwind CSS v4 stable release notes for CSP changes
- **Before Phase 3:** Check Recharts changelog for React 19 compatibility fixes
- **Before Phase 4:** Test virtualization libraries (@tanstack/react-virtual) with Electron

---

*Research completed: 2025-01-29*  
*Next review: After Tailwind CSS v4 stable release or if React 19.3+ introduces breaking changes*
