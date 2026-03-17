# External Integrations

**Analysis Date:** 2025-01-15

## APIs & External Services

**Google OAuth2 & APIs:**
- Service: Google Identity Platform (OAuth2)
  - What it's used for: User authentication and authorization
  - SDK: `googleapis` 170.1.0, `google-auth-library` 10.5.0
  - Auth: Configured via `electron/google-credentials.json` (OAuth2 credentials)
  - Scopes required:
    - `https://www.googleapis.com/auth/drive.appdata` - Access to app-specific Google Drive folder
    - `https://www.googleapis.com/auth/userinfo.email` - User email
    - `https://www.googleapis.com/auth/userinfo.profile` - User profile info

- Service: Google Drive API
  - What it's used for: Cloud backup and restore of application data
  - Implementation: `electron/googleDrive.cjs`
  - OAuth Port: 8095 (local callback server)
  - Redirect URI: `http://localhost:8095/callback`
  - Storage: Files stored in `appDataFolder` (hidden app-specific folder on Google Drive)
  - Backup file: `moneyflow-backup.json`

## Data Storage

**Databases:**
- None (no dedicated database backend)

**Local/Client Storage:**
- Browser localStorage (web mode)
  - Stores: Transaction data, categories, user preferences
  - Scope: Per domain
  
- electron-store (Electron mode)
  - Location: System user data directory
  - Encryption: Enabled with key `'moneyflow-secure-key-2026'`
  - Stores: OAuth tokens

**File Storage:**
- Google Drive (cloud backup only when authenticated)
  - File format: JSON (`moneyflow-backup.json`)
  - Scope: App-data folder (private to application)
  - Operations: Upload, download, delete via Google Drive API
  
- Local filesystem (import/export)
  - Formats: `.xlsx`, `.xls`, `.csv` (via xlsx library)
  - Operations: Import bank statements, export transaction data

**Caching:**
- None detected
- In-memory state management via React hooks (`useState`, `useCallback`)

## Authentication & Identity

**Auth Provider:**
- Google OAuth2 (for desktop sync features only)

**Implementation:**
- Method: Authorization Code Flow with PKCE not explicitly used
- Flow: 
  1. User clicks "Accedi con Google" button (`src/components/GoogleSignInButton.jsx`)
  2. Local HTTP server spins up on port 8095
  3. Browser opens Google consent screen
  4. Authorization code returned to `http://localhost:8095/callback`
  5. Code exchanged for access + refresh tokens
  6. Tokens stored encrypted in electron-store
  
- Token Refresh:
  - Automatic refresh via `google-auth-library`
  - `refresh_token` required for persistent authentication
  - Tokens saved to store when refreshed

**Sign-In Flow:**
- Component: `src/hooks/useGoogleDrive.js` - React hook managing auth state
  - States: `isElectron`, `isAuthenticated`, `hasDrivePermission`, `isLoading`, `error`
  - Methods: `signIn()`, `cancelSignIn()`, `signOut()`, `checkAuthStatus()`
  
- IPC Handlers: `electron/main.cjs` (lines 155-274)
  - `google-drive:is-authenticated` - Check auth status
  - `google-drive:sign-in` - Initiate login
  - `google-drive:sign-out` - Logout and clear tokens
  - Returns success/error/cancelled status

**Notes:**
- Web mode (Vite dev): Google authentication not available
- Electron mode only: Full OAuth support
- No user accounts created in app - identity tied entirely to Google account

## Monitoring & Observability

**Error Tracking:**
- None detected
- Errors logged to browser console via `console.error()`

**Logs:**
- Browser console logging: `console.log()`, `console.error()`
- No centralized logging service
- Electron main process logs to Node.js console

## CI/CD & Deployment

**Hosting:**
- Desktop application - standalone Electron executable
- Distribution: GitHub (repository maintained)
- Auto-updates: Not configured (no mechanism for OTA updates)

**CI Pipeline:**
- GitHub Actions workflows directory exists (`.github/workflows/`)
- Workflows not examined (may contain build/test/release automation)

**Release Management:**
- npm scripts for versioning:
  - `npm run release:patch` - Bump patch version, push, push tags
  - `npm run release:minor` - Bump minor version, push, push tags
  - `npm run release:major` - Bump major version, push, push tags
- Manual build: `npm run electron:build` produces executable in `release/`

**Distribution Targets:**
- Windows: Portable executable (`.exe`) and NSIS installer
  - Icon: `public/logo.ico`
  - Installation options: Custom directory, desktop shortcut, start menu

## Environment Configuration

**Required env vars:**
- `ELECTRON_DEV=true` - Signals dev mode (set by `npm run electron:dev`)

**Optional Configuration:**
- Google Drive OAuth credentials (`electron/google-credentials.json`)
  - Must contain: `client_id`, `client_secret`, `project_id`
  - Template: `electron/google-credentials.example.json`
  - **Critical**: Not committed to git (`.gitignore`)
  - **Setup**: Follow README.md sections 89-118

**Secrets Location:**
- `electron/google-credentials.json` - OAuth credentials (local file, excluded from VCS)
- electron-store encrypted values - OAuth tokens stored locally with encryption key

**No Environment-Specific Configs:**
- Same code runs on all platforms (desktop/web)
- No separate production config files
- All configuration hardcoded or passed at runtime

## Webhooks & Callbacks

**Incoming:**
- OAuth Callback: `http://localhost:8095/callback`
  - Handler: `electron/googleDrive.cjs` lines 148-320
  - Receives: `code` (authorization code) or `error`
  - Response: HTML success/error page with styled feedback

**Outgoing:**
- None detected
- Application does not expose webhooks
- Only initiated by user actions (sync, backup, restore)

**IPC Communication (Electron Only):**
- `window.electronAPI.googleDrive.*` - Preload bridge in `src/hooks/useGoogleDrive.js`
- `request-backup-data` - Main process → Renderer (on app close)
- `backup-data-for-close` - Renderer → Main process (auto-backup before quit)

## Google Drive Integration Details

**Operations Supported:**
- **Sign In**: OAuth flow with Google consent screen
  - Returns: `{ success, tokens, error, cancelled }`
  
- **Check Authentication**: Verify tokens are valid and not expired
  - Checks: `access_token` and `refresh_token` existence
  - Checks: Token expiry date against `Date.now()`
  
- **Verify Drive Permissions**: Ensure `drive.appdata` scope granted
  - Checks: Requested scopes against granted scopes
  - Used to warn user if permissions not fully granted
  
- **Upload Backup**: Store transaction data to Google Drive
  - Endpoint: Google Drive API `files.create()` or `files.update()`
  - Folder: App-specific hidden folder on Google Drive
  - File: `moneyflow-backup.json`
  - Triggers: Manual sync, automatic on app close
  
- **Download Backup**: Restore data from Google Drive
  - Searches app folder for `moneyflow-backup.json`
  - Returns: JSON data or null if not found
  
- **Get Backup Info**: Retrieve file metadata
  - Returns: Creation date, size, last modified
  - Used in UI: `SyncSettings.jsx` displays sync timestamp
  
- **Delete Backup**: Remove backup file from Google Drive
  - Confirmation required in UI before execution
  
- **Get User Info**: Fetch authenticated user's email and profile name
  - Scope: `userinfo.profile`, `userinfo.email`
  - Used in UI: Display "Logged in as {email}" in sync settings

**Automatic Backup Behavior:**
- Trigger: App close event (lines 53-71 in `electron/main.cjs`)
- Flow:
  1. User attempts to close app
  2. If authenticated with Google Drive, close is prevented temporarily
  3. Main process sends `request-backup-data` IPC message to renderer
  4. Renderer exports current state via `window.electronAPI.sendBackupDataForClose(data)`
  5. Main process uploads data to Google Drive
  6. App closes after upload completes or 10-second timeout
  
- Error Handling: Backup failure doesn't prevent app close (times out after 10s)

**Security Considerations:**
- Tokens encrypted via electron-store with fixed key (should use system keyring for production)
- Context isolation enabled in Electron (`contextIsolation: true`)
- preload script limits renderer access to controlled API surface
- No NodeJS integration in renderer (`nodeIntegration: false`)
- Google API calls happen only in main process (not exposed to renderer directly)
- CSP headers configured to restrict external resource loading

---

*Integration audit: 2025-01-15*
