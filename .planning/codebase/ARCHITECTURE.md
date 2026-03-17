# Architecture

**Analysis Date:** 2024-12-19

## Pattern Overview

**Overall:** Single-Page Application (SPA) with Electron Desktop Wrapper and IPC-based System Integration

**Key Characteristics:**
- Centralized state management in main React component (`App.jsx`)
- Hybrid architecture: React frontend + Electron desktop shell
- Local-first data persistence with optional cloud sync (Google Drive)
- Event-driven IPC bridge between Electron main and renderer processes
- Spreadsheet-style data processing pipeline with conflict resolution

## Layers

**Presentation Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `src/components/`, `src/App.jsx`
- Contains: React components, UI modals, forms, charts (Recharts)
- Depends on: Utilities for formatting, custom hooks
- Used by: Main entry point

**State Management Layer:**
- Purpose: Manage application data (transactions, categories, import profiles)
- Location: `src/App.jsx` (centralized via `useState`)
- Contains: Transaction collection, category mappings, import profiles, UI view state
- Depends on: localStorage API, utility functions
- Used by: All presentation components

**Integration Layer:**
- Purpose: Bridge between web frontend and Electron desktop environment
- Location: `electron/preload.cjs`, `electron/main.cjs`, `src/hooks/useGoogleDrive.js`
- Contains: IPC handlers, Google Drive API integration, auto-backup logic
- Depends on: Electron IPC, Google APIs
- Used by: React components via `window.electronAPI`

**Utilities & Helpers:**
- Purpose: Pure functions for data transformation and validation
- Location: `src/utils/index.js`, `src/constants/index.js`
- Contains: Currency formatting, date parsing, category matching, ID generation
- Depends on: No external dependencies
- Used by: All application layers

**Business Logic:**
- Purpose: Handle complex workflows like file import, conflict resolution, categorization
- Location: `src/App.jsx` (callbacks and effect hooks)
- Contains: Import wizards, duplicate detection, category auto-assignment
- Depends on: Utils, XLSX library, category definitions
- Used by: Modal components and user event handlers

## Data Flow

**Application Initialization:**

1. `main.jsx` → Renders React app into `#root` DOM element
2. `App.jsx` → Initializes component, loads persisted state from `localStorage`
3. `useGoogleDrive()` hook → Checks Electron availability, verifies Google Drive auth
4. UI renders with loaded data or empty state
5. `setIsInitialized(true)` → Signals readiness

**User Imports Excel File:**

1. User drops file or selects via file input → `handleFile(file)` callback
2. XLSX parses spreadsheet into array of objects (rows)
3. `detectProfile()` → Auto-detects matching import profile by column headers
4. `ImportWizard` modal opens with preview of detected profile
5. User confirms or adjusts profile → `handleWizardConfirm(profile)`
6. `processRowsWithProfile()` → Transforms rows into transaction objects
7. `processImportedTransactions()` → Detects duplicates and conflicts
8. If conflicts exist: `ConflictResolver` modal shows duplicates for manual resolution
9. Resolved transactions added to state → Auto-save to `localStorage`
10. Toast notification confirms success

**Transaction Management:**

1. Add manual transaction → Form input → `addManualTransaction()` callback
2. Auto-categorize via `categorize()` function matching description keywords
3. Transaction added to state array with unique ID
4. Editable via inline editing (description field)
5. Deletable via `ConfirmModal` confirmation
6. All changes persisted to `localStorage` immediately

**Category Management:**

1. User opens `CategoryManager` modal
2. Can add/edit/delete category keywords
3. Changes trigger `setCategoryResolutions()` → memorizes auto-resolution choices
4. `CategoryConflictResolver` prevents data loss when merging categories
5. Changes saved to state and `localStorage`

**Dashboard Analytics:**

1. `useMemo(stats)` → Calculates filtered aggregations based on selections
2. Filters: month, year, search query, category, type (income/expense)
3. Generates: total income, total expense, category breakdown
4. Recharts visualizes: pie chart (categories), bar chart (monthly), area chart (trends)
5. All calculations happen on client-side, no server round-trip

**Cloud Synchronization (Electron Only):**

1. User clicks "Sync Settings" → `SyncSettings` modal
2. Initiates Google OAuth flow via `googleDrive.signIn()`
3. `electron/googleDrive.cjs` handles auth token exchange
4. User can upload backup (current state → Google Drive)
5. User can download backup (Google Drive → local state)
6. **Auto-backup on close:** When window closes, `request-backup-data` IPC message sent
7. React sends current state via `sendBackupDataForClose()` 
8. Electron main process performs async upload before app exits
9. Timeout prevents hanging (10s max)

**State Management:**

- **Transactions:** Array of transaction objects with `{ id, date, description, amount, category, note, bankId }`
- **Categories:** Object mapping category name to keyword array for auto-detection
- **ImportProfiles:** Custom import profiles saved by user for future use
- **CategoryResolutions:** Mapping of conflict resolutions for consistent behavior
- **UI State:** view type, selected month/year, search query, pagination, modal visibility

**State Persistence:**

- **Primary:** `localStorage.setItem('moneyFlow')` → Serialized JSON blob containing all mutable state
- **Automatic:** Every state change triggers `useEffect()` that saves to localStorage
- **Format:** Versioned backup structure with metadata (version, exportDate)
- **Recovery:** App loads from localStorage on startup; falls back to empty state on error

## Key Abstractions

**Transaction Object:**
- Purpose: Represents a single money flow record
- Examples: `src/App.jsx` lines 80-100 (state definitions)
- Pattern: Immutable-style updates via `setTransactions(prev => [...])`
- Fields: `id` (unique), `date` (ISO string), `description`, `amount` (signed), `category`, `note`, `bankId` (optional)

**ImportProfile:**
- Purpose: Defines how to parse a spreadsheet format
- Examples: `src/constants/index.js` (BUILTIN_IMPORT_PROFILES)
- Pattern: Declarative schema mapping column names to transaction fields
- Flexibility: Built-in profiles (Illimity, Fineco, generic) + user-defined custom

**Category System:**
- Purpose: Auto-assign transactions based on keyword matching
- Examples: `src/utils/index.js` (categorize, findMatchingCategories functions)
- Pattern: Keyword-to-category mapping with longest-match selection
- Resolution: `categoryResolutions` state preserves user decisions for consistency

**Modal Pattern:**
- Purpose: Isolated, reusable dialog components
- Examples: `src/components/modals/`
- Pattern: Props-based isOpen state, onConfirm/onCancel callbacks
- Rendering: Conditional via boolean state in App.jsx

**IPC Bridge (Electron):**
- Purpose: Safe communication between main and renderer processes
- Examples: `electron/preload.cjs` (contextBridge.exposeInMainWorld)
- Pattern: Promise-based async handlers, one-way events
- Security: Context isolation prevents direct Node.js access

## Entry Points

**Web Application Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Bootstraps React root, mounts App component

**Main React Component:**
- Location: `src/App.jsx`
- Triggers: React initialization in main.jsx
- Responsibilities: 
  - State management (transactions, categories, UI state)
  - Event handlers (file upload, transaction CRUD, import/export)
  - View switching (dashboard, transactions, settings)
  - Modal lifecycle management
  - localStorage synchronization

**Electron Main Process:**
- Location: `electron/main.cjs`
- Triggers: App launch (via `electron-main-field` in package.json)
- Responsibilities:
  - Create browser window
  - Set up IPC handlers for Google Drive operations
  - Auto-backup on window close
  - Development hot-reload setup

**Electron Renderer Bridge:**
- Location: `electron/preload.cjs`
- Triggers: Window creation via `webPreferences.preload`
- Responsibilities:
  - Expose safe APIs to renderer via `contextBridge`
  - Handle IPC invoke and event forwarding
  - Provide `window.electronAPI` global

## Error Handling

**Strategy:** Try-catch with user feedback via Toast notifications

**Patterns:**

- **File Import Errors:** Wrapped in try-catch, toast shows "Error loading file"
- **localStorage Errors:** Caught at load and save, logged to console, app continues with empty state
- **Google Drive Auth Errors:** Caught in useGoogleDrive hook, state updated (isAuthenticated → false), error message shown
- **IPC Errors:** Handled in async handler wrappers, returned as `{success: false, error: message}`
- **Data Validation:** Early returns for invalid data (NaN amounts, missing descriptions)

## Cross-Cutting Concerns

**Logging:** 
- Approach: `console.error()` for exceptions, `console.log()` for debug
- No structured logging framework
- Comments used for non-obvious logic (especially utils functions)

**Validation:**
- Approach: Defensive checks before processing (amount !== 0, description length > 0)
- Spreadsheet import validates: header row, column presence, date/amount parsing
- Transaction IDs must be unique (conflict detection via Set)

**Authentication:**
- Approach: Google OAuth 2.0 for Drive sync (Electron only)
- Not required for core app functionality
- Graceful degradation if auth fails: app works offline-only

---

*Architecture analysis: 2024-12-19*
