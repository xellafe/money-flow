# Deferred Items — Phase 01 Foundation Setup

## Pre-existing Issues (out of scope for current plan)

### 1. Lint error in PayPalEnrichWizard.jsx

**File:** `src/components/modals/PayPalEnrichWizard.jsx`
**Line:** 200
**Error:** `react-hooks/set-state-in-effect` — Calling `setState()` synchronously within an effect body
**Discovered during:** Plan 01-01 Task 2 (CSS rewrite)
**Status:** Pre-existing, not caused by Tailwind/CSS changes
**Action needed:** Refactor `setSelectedMatches(initial)` call inside `useEffect` to use a functional update or `useLayoutEffect`, or restructure to initialize state from `matches` directly

```jsx
// Line 198-201 in PayPalEnrichWizard.jsx
useEffect(() => {
  const initial = matches.map(() => false);
  matches.forEach((match, idx) => {
    initial[idx] = true;
  });
  setSelectedMatches(initial);  // <-- calling setState synchronously in effect
}, [matches]);
```
