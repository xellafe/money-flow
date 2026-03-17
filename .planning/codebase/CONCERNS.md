# Codebase Concerns

**Analysis Date:** 2024-12-19

## Tech Debt

**Monolithic App Component:**
- Issue: `src/App.jsx` contains 2,127 lines with all core logic (state management, data processing, UI rendering, backup handling)
- Files: `src/App.jsx`
- Impact: Difficult to test, maintain, and debug; high risk of cascading bugs when modifying features; performance issues due to large re-render scope
- Fix approach: Extract business logic into custom hooks (`useTransactionData`, `useImportLogic`, `useCategoryManagement`, `useSyncState`); create presenter/container components; separate data processing utilities from UI components

**No Input Validation on File Import:**
- Issue: File import processing (`handleFile` function lines 339-408) assumes file data structure without comprehensive validation
- Files: `src/App.jsx` lines 345-374
- Impact: Malformed Excel files could cause app crashes or corrupted data in localStorage; error handling uses generic try-catch without specific error messages
- Fix approach: Add schema validation for imported rows before processing; implement row-level validation with specific error reporting; add pre-processing to detect and sanitize unexpected column formats

**LocalStorage as Primary Database:**
- Issue: All user data (transactions, categories, profiles, resolutions) persisted only to browser localStorage without structured DB
- Files: `src/App.jsx` lines 171-212 (load/save logic); entire data layer
- Impact: No migration path for schema changes; data loss if localStorage quota exceeded; no conflict resolution for concurrent edits; no audit trail for data modifications
- Fix approach: Implement IndexedDB for larger data capacity; create versioned schema with migration system; add data backup/restore with timestamps; consider SQLite for Electron app

**Hardcoded OAuth Configuration:**
- Issue: OAuth port (8095), scopes, and credentials path hardcoded in `electron/googleDrive.cjs`
- Files: `electron/googleDrive.cjs` lines 14-38
- Impact: Cannot easily change OAuth configuration for different environments; credentials path not flexible; port conflicts possible if another app uses port 8095
- Fix approach: Move to environment variables or config file; make port configurable with fallback; add validation that port is available before starting server

**Manual Category Keyword Management:**
- Issue: Keywords for auto-categorization are static and require manual updates; no learning mechanism to improve categorization over time
- Files: `src/constants/index.js` lines 50-62 (hardcoded categories); `src/utils/index.js` lines 59-86 (categorization logic)
- Impact: Users must manually update keywords when new merchants appear; categorization becomes less useful over time; no pattern detection from user corrections
- Fix approach: Store user corrections as learning data; implement feedback loop to suggest new keywords; add ML-lite keyword extraction from descriptions; track manual category changes as implicit rules

**Conflict Resolution Without Persistence:**
- Issue: Category conflict resolutions stored but import conflicts are in-memory only; resolution logic not reused across similar scenarios
- Files: `src/App.jsx` lines 738-764 (confirmCategoryConflicts); `src/App.jsx` lines 467-499 (handleConflictResolve)
- Impact: Same conflicts may occur repeatedly when importing similar data; resolution patterns not learned; inconsistent handling of edge cases
- Fix approach: Persist conflict resolution rules; implement pattern matching for similar conflicts; auto-resolve conflicts using stored rules on subsequent imports

**No Error Recovery for Failed Google Drive Operations:**
- Issue: Network failures during Google Drive sync not explicitly handled; failed uploads don't trigger retry; state inconsistencies possible
- Files: `electron/googleDrive.cjs` lines 531-575 (uploadBackup); `src/hooks/useGoogleDrive.js` lines 147-177 (uploadBackup callback)
- Impact: Lost backup data if upload fails silently; no user indication of sync failure; manual recovery required; data might diverge between local and cloud
- Fix approach: Implement exponential backoff retry logic; persist pending sync operations; add explicit error states with user actions (retry, save locally); implement checksum verification for successful uploads

---

## Known Bugs

**CSV File Encoding Issues:**
- Symptoms: Special characters (é, ü, ñ) from CSV imports may display incorrectly or cause parsing errors
- Files: `src/App.jsx` line 416-424 (handlePayPalFile); file reading uses default encoding
- Trigger: Importing CSV files with non-ASCII characters from non-English locale bank exports
- Workaround: Pre-convert CSV to UTF-8 before importing, or use Excel format instead

**Date Parsing Ambiguity:**
- Symptoms: Dates in DD/MM/YYYY format sometimes parsed as MM/DD/YYYY, creating transactions with wrong dates or invalid dates
- Files: `src/utils/index.js` lines 20-30 (parseDate function)
- Trigger: Importing data with dates that are valid in both formats (e.g., 01/02/2024 could be Jan 2 or Feb 1)
- Workaround: Manually verify dates after import; use explicit header row detection to match bank format

**OAuth Token Expiry Not Gracefully Handled:**
- Symptoms: User sees stale "authenticated" status after token expires; sync operations fail with cryptic error messages
- Files: `electron/googleDrive.cjs` lines 77-91 (isAuthenticated check); `src/hooks/useGoogleDrive.js` lines 49-68 (checkAuthStatus)
- Trigger: App left idle for extended period; Google revokes token due to security policy
- Workaround: Manual sign-out and sign-in; restart app to refresh token state

**Missing Transactions in PayPal Enrichment:**
- Symptoms: Some PayPal CSV rows are skipped silently during enrichment without explanation
- Files: `src/components/modals/PayPalEnrichWizard.jsx` (enrichment logic not visible in provided code)
- Trigger: PayPal rows with missing Date or Totale columns; amount format mismatch between bank and PayPal
- Workaround: Manually check transaction list against PayPal CSV; apply descriptions manually

---

## Security Considerations

**Hardcoded OAuth Encryption Key:**
- Risk: `electron/googleDrive.cjs` line 16 uses static encryption key `'moneyflow-secure-key-2026'` for electron-store token encryption
- Files: `electron/googleDrive.cjs` line 16
- Current mitigation: Tokens encrypted at rest in electron-store config directory
- Recommendations: 
  - Generate per-instance encryption key derived from machine ID or user credentials
  - Consider using OS credential store (Windows Credential Manager, macOS Keychain) instead of electron-store
  - Document risk that tokens can be decrypted if user's machine is compromised
  - Add clear user warning about local storage risks in UI

**Insufficient Content Security Policy:**
- Risk: CSP allows `'unsafe-inline'` for scripts and styles (lines 97-99 in electron/main.cjs)
- Files: `electron/main.cjs` lines 95-104
- Current mitigation: Code not user-injectable (desktop app), but allows malicious dependencies to inject code
- Recommendations:
  - Remove `'unsafe-inline'` from script-src; externalize inline styles to CSS file
  - Implement nonce-based CSP for dynamic content if needed
  - Add subresource integrity checks for external Google APIs

**No Data Encryption at Rest:**
- Risk: LocalStorage data readable in plaintext; if device compromised, financial data exposed
- Files: `src/App.jsx` lines 199-207 (localStorage.setItem)
- Current mitigation: None; relies on OS-level security
- Recommendations:
  - Implement transparent encryption layer for sensitive data before saving to localStorage
  - Use crypto-js or similar for in-browser encryption
  - Add optional password protection for exported backup files
  - Document that financial data is not encrypted locally

**Google OAuth Scope Overreach:**
- Risk: Requesting `userinfo.email` and `userinfo.profile` scopes but only using email in backups
- Files: `electron/googleDrive.cjs` lines 30-34 (SCOPES definition)
- Current mitigation: Scopes are Google-approved
- Recommendations:
  - Remove `userinfo.profile` if not used; request minimal scopes
  - Document why each scope is needed
  - Add user consent message before first sign-in explaining data access

**No Rate Limiting on Import Operations:**
- Risk: Rapid repeated file imports could lead to memory exhaustion; no protection against accidental bulk imports
- Files: `src/App.jsx` line 339-408 (handleFile); line 411-440 (handlePayPalFile)
- Current mitigation: Single file at a time due to UI constraints
- Recommendations:
  - Add file size validation with clear limits
  - Implement debouncing for file selection changes
  - Add confirmation dialog for large imports (>10MB or >5000 rows)

---

## Performance Bottlenecks

**Inefficient Category Recalculation:**
- Problem: `stats` useMemo recalculates all category groupings on every filter change; operations O(n) with no indexing
- Files: `src/App.jsx` lines 801-996 (stats useMemo hook)
- Cause: Every transaction filtered and grouped from scratch; no caching of intermediate results; multiple iterations over same data
- Improvement path: 
  - Implement IndexedDB with indexed queries by year/month/category for O(log n) lookups
  - Memoize category groupings separately; invalidate only when transactions or categories change
  - Pre-compute monthly aggregations; use computed cache for dashboard statistics

**Large Transaction Rendering:**
- Problem: All filtered transactions rendered in pagination, but full DOM tree created for pagination calculation
- Files: `src/App.jsx` lines 1821-2127 (Transactions view rendering); ITEMS_PER_PAGE = 50
- Cause: Pagination calculated on filtered array without virtual scrolling; DOM queries for each transaction item
- Improvement path:
  - Implement react-window or react-virtual for virtual scrolling (only render visible rows)
  - Add indexed search with binary search for pagination offsets
  - Limit initial render to first page; lazy-load subsequent pages

**Redundant Google Drive API Calls:**
- Problem: `refreshUserInfo`, `refreshBackupInfo` called sequentially after every action; no deduplication
- Files: `src/hooks/useGoogleDrive.js` lines 21-46 (refresh functions); lines 61-62 (called together in checkAuthStatus)
- Cause: Each function makes separate API call; no request batching; called in parallel without Promise.all
- Improvement path:
  - Batch user info and backup info into single API call
  - Implement request deduplication (if same request pending, reuse Promise)
  - Add aggressive caching with manual invalidation on state change

**Unoptimized Chart Re-renders:**
- Problem: Recharts components re-render with full data on every filter change, even if chart type unchanged
- Files: `src/App.jsx` lines 1535-1691 (charts section)
- Cause: AreaChart, BarChart, LineChart receive new prop objects on every render; no memoization
- Improvement path:
  - Memoize chart data structures; only recompute when underlying transactions change
  - Wrap chart components in React.memo to prevent unnecessary re-renders
  - Use useMemo for chart data transformation before passing to Recharts

---

## Fragile Areas

**Import Profile Detection Logic:**
- Files: `src/App.jsx` lines 224-242 (detectProfile)
- Why fragile: Detection based on simple column name matching; fails if bank changes column order, adds headers, or renames columns slightly
- Safe modification: Add fuzzy column name matching (similarity scoring); allow users to define column name variations for their bank; add detailed logging of detection attempts
- Test coverage: No visible test files for import logic; high risk of regression when adding new bank formats

**PayPal Enrichment Matching:**
- Files: `src/components/modals/PayPalEnrichWizard.jsx` (not fully visible but referenced in code)
- Why fragile: Matching PayPal transactions to bank transactions by date and amount alone is ambiguous (same amount/date possible for different transactions); no tie-breaker logic
- Safe modification: Add description substring matching as tie-breaker; show user previews of matches before applying; implement undo mechanism
- Test coverage: No unit tests visible for matching algorithm

**Electron IPC Message Ordering:**
- Files: `electron/main.cjs` lines 52-70 (window close handler); `src/App.jsx` lines 145-152 (backup listener setup)
- Why fragile: Race condition possible if window closes before listener registered; no timeout protection if backup message never arrives
- Safe modification: Ensure listener is registered before any window creation; add explicit ACK messages; implement deterministic timeout
- Test coverage: No integration tests for Electron lifecycle

**Category Conflict Resolution State:**
- Files: `src/App.jsx` lines 127, 739-764 (categoryConflicts state and handler)
- Why fragile: Complex state management with manual resolution objects; easy to introduce inconsistencies if transaction IDs change or descriptions are modified during conflict resolution
- Safe modification: Implement immutable state updates; add validation that txIds still exist; implement transaction serialization for UI stability
- Test coverage: No unit tests for conflict resolution logic

---

## Scaling Limits

**LocalStorage Capacity:**
- Current capacity: 5-10MB browser limit; typical MoneyFlow backup ~1-2MB per 10,000 transactions
- Limit: App breaks with quota exceeded error when localStorage full; no graceful degradation
- Scaling path: 
  - Migrate to IndexedDB (typically 50MB+)
  - Implement archiving (move old transactions to separate store)
  - Add data compression (e.g., Protocol Buffers instead of JSON)
  - Consider cloud-first architecture for larger datasets

**Memory Usage with Large Datasets:**
- Current capacity: Fine for <50,000 transactions on modern machines
- Limit: Entire transaction array held in React state; stats computation becomes slow >100,000 transactions; browser tab may become unresponsive
- Scaling path:
  - Implement pagination/lazy loading at storage layer (not just UI)
  - Use SharedArrayBuffer for background stats computation (worker thread)
  - Archive old data; only load current fiscal year
  - Consider server-side aggregation for historical analysis

**Google Drive API Rate Limiting:**
- Current capacity: ~1000 requests/100s per app; typical usage ~3 requests per sync (check auth, get backup info, upload)
- Limit: High-frequency syncs could hit rate limits; no backoff or request queuing
- Scaling path:
  - Implement exponential backoff retry (already partially done)
  - Add request queuing to batch operations
  - Use Google Drive webhooks for change notifications instead of polling
  - Cache backup info locally for longer periods

---

## Dependencies at Risk

**electron-store Encryption Key Management:**
- Risk: Hardcoded encryption key is weak; supports only sync operations; no promise-based API
- Impact: Token security relies on static key; could be replaced with better alternatives
- Migration plan: 
  - Replace with Keytar (uses OS credential stores)
  - Or use @secure-electron-store (better key management)
  - Verify all token operations support async/await

**xlsx (SheetJS) Size and Complexity:**
- Risk: Large dependency (~5MB minified); external code for parsing untrusted file formats; no type definitions
- Impact: Bundle size affects Electron app distribution; parsing errors from malformed files not always recoverable
- Migration plan:
  - Consider Papa Parse for CSV-only use case (smaller)
  - Evaluate unpoly or lightweight alternatives for Excel
  - Add file validation before parsing

**recharts Rendering Performance:**
- Risk: Recharts re-renders entire chart on prop change; no granular update mechanism; limited performance optimization options
- Impact: Dashboard becomes slow with many categories; no way to optimize chart updates
- Migration plan:
  - Consider Chart.js with React wrapper for better performance
  - Evaluate D3 for more control (higher complexity)
  - Or implement chart data caching with manual refresh triggers

**lucide-react Icon Updates:**
- Risk: Major version changes could introduce breaking changes to icon APIs
- Impact: Icons may disappear or break in builds
- Migration plan:
  - Pin version in package.json
  - Create icon wrapper component to abstract lucide-react imports
  - Keep changelog of icon changes

---

## Missing Critical Features

**No Duplicate Transaction Detection:**
- Problem: Users can import same transaction multiple times, leading to duplicate entries; only basic deduplication by exact match
- Blocks: Accurate financial reporting; trust in data integrity
- Recommendation: Implement fuzzy matching for duplicates (same amount ±0.01, same date ±1 day, similar description); add UI to mark duplicates and merge them; implement undo for accidentally removed transactions

**No Multi-Account Support:**
- Problem: All transactions treated as single account; no way to track multiple bank accounts separately
- Blocks: Users with multiple accounts cannot use MoneyFlow for full financial tracking
- Recommendation: Add account selection; store account name with each transaction; implement account-specific filtering and aggregation; allow account transfers

**No Budget/Spending Limits:**
- Problem: Dashboard shows historical data only; no alerts for overspending or budget tracking
- Blocks: Users cannot use app for proactive financial management
- Recommendation: Add budget entity with alerts; implement category-level spending limits; add notifications when limit approaches; show variance from budget on dashboard

**No Data Export/Import Standardization:**
- Problem: Export format is custom JSON; difficult to migrate to other apps; no standard format support
- Blocks: User lock-in; difficult to use data elsewhere
- Recommendation: Support standard formats (OFX, QIF, CSV with standard headers); implement import from Mint.com, YNAB exports; document data format

**No Recurring Transaction Templates:**
- Problem: Users must manually enter recurring transactions (rent, subscriptions); no automation
- Blocks: Tedious to track regular expenses; easy to forget or enter wrong amount
- Recommendation: Add recurring transaction type; implement auto-insertion on schedule; allow rules to auto-categorize recurring entries

**No Mobile Support:**
- Problem: Desktop-only (Electron); users cannot access data or add transactions on mobile
- Blocks: Complete financial management on-the-go
- Recommendation: Consider React Native version or responsive web app; sync with cloud backend; implement offline-first mobile app with sync when online

---

## Test Coverage Gaps

**No Unit Tests for Core Logic:**
- What's not tested: 
  - `parseAmount()`, `parseDate()`, `categorize()`, `findMatchingCategories()` (utils)
  - `detectProfile()`, `processRowsWithProfile()`, `processImportedTransactions()` (import logic)
  - Category conflict resolution rules
  - Transaction filtering and aggregation (stats calculation)
- Files: `src/utils/index.js`, `src/App.jsx` (import and processing functions)
- Risk: Regressions in parsing logic, silent data corruption, import failures
- Priority: **HIGH** - These functions handle untrusted user input and critical data transformations

**No Integration Tests for File Import:**
- What's not tested:
  - End-to-end import workflow with sample Excel files
  - Deduplication logic across multiple imports
  - Conflict detection and resolution
  - Import wizard configuration and profile saving
- Files: `src/App.jsx` (handleFile, handlePayPalFile, import handlers)
- Risk: Breaking changes to import pipeline undetected; user data loss from malformed imports
- Priority: **HIGH** - Most complex and error-prone feature

**No Tests for Google Drive Sync:**
- What's not tested:
  - OAuth token lifecycle (sign-in, expiry, refresh, sign-out)
  - Backup upload/download with various network conditions (timeout, connection loss)
  - Concurrent sync operations
  - Token revocation and cleanup
- Files: `electron/googleDrive.cjs`, `src/hooks/useGoogleDrive.js`, `electron/main.cjs`
- Risk: Data loss during sync; token leaks; authentication loops
- Priority: **HIGH** - Handles sensitive authentication and critical data operations

**No Tests for Electron IPC Communication:**
- What's not tested:
  - Message ordering and delivery guarantees
  - Error handling in IPC handlers
  - Backup on window close race conditions
  - Preload bridge security
- Files: `electron/main.cjs`, `electron/preload.cjs`, `src/App.jsx` (IPC listeners)
- Risk: Silent failures during sync; data loss on app close; security vulnerabilities
- Priority: **MEDIUM** - Critical for Electron app but less likely to change

**No Tests for Category and Profile Management:**
- What's not tested:
  - Category CRUD operations (add, delete, update, keyword management)
  - Profile persistence and loading
  - Category resolution memo persistence
  - Recategorization with conflict detection
- Files: `src/App.jsx` (addCategory, deleteCategory, addKeyword, removeKeyword, recategorizeAll, confirmCategoryConflicts)
- Risk: Category data loss; inconsistent state; lost user-defined keywords
- Priority: **MEDIUM** - Affects user customization but less critical than import logic

**No Tests for Data Persistence:**
- What's not tested:
  - localStorage save/load round-trips
  - Data consistency across browser restarts
  - Schema evolution (backup version compatibility)
  - Import backup restore with validation
- Files: `src/App.jsx` (useEffect load/save logic), backup import/export functions
- Risk: Data corruption on load; loss of custom settings; backup restore failures
- Priority: **MEDIUM** - Important for data integrity

**No E2E Tests:**
- What's not tested: User workflows (import → categorize → export, Google Drive sync workflow)
- Risk: Regressions in critical user paths undetected
- Priority: **MEDIUM** - Would help catch integration issues

---

*Concerns audit: 2024-12-19*
