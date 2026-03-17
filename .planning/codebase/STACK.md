# Technology Stack

**Analysis Date:** 2025-01-15

## Languages

**Primary:**
- JavaScript (ES Module) - Frontend and backend application code
- JSX - React component markup in `src/**/*.jsx`
- CommonJS (`.cjs`) - Electron main process and preload scripts in `electron/**/*.cjs`

**Configuration:**
- JSON - Configuration files and data structures

## Runtime

**Environment:**
- Node.js (modern - tested with v22.15.1)
- Electron 34.5.8 - Desktop application runtime
  - Runs on Windows, macOS, Linux (configured for Windows distribution)

**Package Manager:**
- npm - with lockfile (`package-lock.json`)

## Frameworks

**Core UI:**
- React 19.2.0 - Component-based UI framework
  - Entry point: `src/main.jsx`
  - Root component: `src/App.jsx` (77.7 KB, monolithic)
  - Uses React Hooks throughout (`src/hooks/useGoogleDrive.js`)

**Desktop Runtime:**
- Electron 34.5.8 - Cross-platform desktop application
  - Main process: `electron/main.cjs`
  - Preload bridge: `electron/preload.cjs`
  - Native context isolation and IPC communication

**Build & Dev:**
- Vite 7.2.4 - Build tool and dev server
  - Config: `vite.config.js`
  - React plugin: `@vitejs/plugin-react` 5.1.1
  - Dev server: `npm run dev` (port 5173)
  - Build output: `dist/` directory

**Build Packaging:**
- electron-builder 26.0.0 - Electron app packaging and distribution
  - Config: `package.json` > `build` section
  - Windows targets: portable + NSIS installer
  - Output: `release/` directory

**Code Quality:**
- ESLint 9.39.1 - JavaScript linting
  - Config: `eslint.config.js` (flat config format)
  - Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - Rules: No unused variables (except uppercase/underscore)

## Key Dependencies

**Critical:**
- googleapis 170.1.0 - Official Google APIs client library
  - Used in: `electron/googleDrive.cjs`
  - Purpose: Google Drive API operations, OAuth2 flows

- google-auth-library 10.5.0 - Google authentication library
  - Used in: `electron/googleDrive.cjs`
  - Purpose: OAuth2 client, token management

- electron-store 8.2.0 - Secure persistent storage for Electron
  - Used in: `electron/googleDrive.cjs`
  - Purpose: Storing OAuth tokens with encryption (key: 'moneyflow-secure-key-2026')

**Charting & Data:**
- recharts 3.7.0 - React charting library
  - Used in: Dashboard components for visualizations (bar, area, trend charts)
  - Chart types: Bar, AreaChart, LineChart

**Data Processing:**
- xlsx 0.18.5 - SheetJS library for Excel file handling
  - Used in: Import wizards in `src/components/modals/ImportWizard.jsx`
  - Formats: `.xlsx`, `.xls`, `.csv` parsing and writing

**UI & Icons:**
- lucide-react 0.563.0 - Icon library
  - Used in: Button components (`src/components/GoogleSignInButton.jsx`)
  - Example: Loader2 spinner icon

**DOM:**
- react-dom 19.2.0 - React DOM rendering
  - Entry: `src/main.jsx` with `createRoot()`

## Configuration

**Environment:**
- Vite development server runs on `http://localhost:5173`
- Electron loads from dev server in dev mode or bundled `dist/index.html` in production
- CSS Security Policy configured in `electron/main.cjs` (lines 92-106)
  - Allows: Google fonts, inline styles, local resources, Google APIs

**Build Configuration:**
- Vite config: `vite.config.js`
  - Base path: `./` (relative for Electron compatibility)
  - React plugin enabled
  
- electron-builder config in `package.json` > `build` section:
  - App ID: `com.moneyflow.app`
  - Product name: `MoneyFlow`
  - Windows icon: `public/logo.ico`
  - NSIS installer with custom installation options

**Scripts:**
- `npm run dev` - Start Vite dev server (web-only)
- `npm run build` - Build React app to `dist/`
- `npm run electron:dev` - Run with Electron (dev mode, hot reload)
- `npm run electron:build` - Build distributable Electron app
- `npm run electron:preview` - Build and preview Electron app
- `npm run lint` - Run ESLint
- `npm run release:{patch|minor|major}` - Version and push to git with tags

## Platform Requirements

**Development:**
- Node.js 14+ (recommended 18+, tested with v22)
- npm 6+
- Windows (for Electron development)
- Optional: Google Cloud credentials for OAuth (stored in `electron/google-credentials.json`, excluded from git)

**Production:**
- Windows 7+ (portable executable or NSIS installer in `release/`)
- Electron provides auto-update capability (not currently configured)
- Standalone executable - no additional runtime required beyond Windows itself

## Storage & Persistence

**Local Data:**
- Browser localStorage - Transaction data, categories, user preferences
- electron-store - OAuth tokens (in encrypted store)

**File System:**
- `dist/` - Bundled web application
- `release/` - Built Electron executables
- `public/` - Static assets (favicon `logo.png`, `logo.ico`)

---

*Stack analysis: 2025-01-15*
