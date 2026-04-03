# Architecture: Security & Privacy Integration

**Project:** MoneyFlow v1.2 — Security & Privacy Milestone  
**Researched:** 2026-04-03  
**Confidence:** HIGH (based on direct inspection of all five target files + codebase analysis)

---

## Executive Summary

Five security features (SEC-01 through SEC-05) integrate across three process boundaries: Electron main, IPC bridge (preload), and React renderer. The most architecturally significant change is **SEC-01 (safeStorage encryption)**, which requires migrating the renderer hooks from synchronous `localStorage` reads to async IPC-backed storage. Everything else is additive or localized.

**Critical discovery:** `safeStorage` and `electron-store` with `encryptionKey` are **already in use** in `googleDrive.cjs` (lines 7 and 22–40) for OAuth token encryption. The entire encryption infrastructure pattern already exists — SEC-01 is an extension of this pattern, not a greenfield implementation. This reduces risk significantly.

**Critical constraint:** `safeStorage` is a **main-process-only API**. The encryption key must never cross the IPC boundary to the renderer. All encrypt/decrypt operations happen in main. The renderer sends and receives plaintext over the already-isolated contextBridge.

---

## Current State Audit

### What already exists (not to build from scratch)

| Item | Location | Notes |
|------|----------|-------|
| `safeStorage` import + usage | `electron/googleDrive.cjs` line 7 | Already encrypts the electron-store key |
| `getOrCreateEncryptionKey()` | `electron/googleDrive.cjs` lines 22–34 | DPAPI/Keychain-backed 32-byte hex key |
| `electron-store` v8.2.0 | dependency + `googleDrive.cjs` | Used for OAuth tokens with `encryptionKey` |
| `contextIsolation: true` | `electron/main.cjs` line 98 | Already set correctly |
| `nodeIntegration: false` | `electron/main.cjs` line 97 | Already set correctly |
| CSP via `onHeadersReceived` | `electron/main.cjs` lines 144–162 | Exists, but has prod bug (see SEC-04) |
| `connect-src googleapis.com` | CSP in `main.cjs` | Already includes Drive + OAuth endpoints |

### What is broken or missing

| Item | Location | Gap |
|------|----------|-----|
| `script-src 'unsafe-inline'` in prod | `main.cjs` line 153 | No dev/prod guard (unlike `style-src`) |
| App data stored as plaintext JSON | `localStorage('moneyFlow')` | Accessed directly in hooks, no encryption |
| Drive backup unencrypted | `googleDrive.cjs` line 557 | `JSON.stringify(data)` sent raw to Drive |
| No privacy consent mechanism | — | No first-run modal, no Settings section |
| No `object-src 'none'` or `base-uri 'self'` | CSP in `main.cjs` | Missing hardening directives |

---

## New Components / Modules

### 1. `electron/storage.cjs` — Encrypted App Data Store

**Purpose:** Centralized persistence layer for all app data (`moneyFlow` key). Replaces direct `localStorage` usage. Wraps `electron-store` with the same encryption pattern as `googleDrive.cjs`.

**Key design decisions:**
- Uses `getOrCreateEncryptionKey()` — extract this function here instead of duplicating; `googleDrive.cjs` will `require('./storage.cjs')` to share it.
- Separate store instance from `google-auth` store (different `name:`), but same encryption key derivation.
- Exposes `encryptForDrive(obj)` / `decryptFromDrive(str)` for SEC-02.

```js
// electron/storage.cjs — new file

const { safeStorage, app } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Generates or loads a persistent, system-protected encryption key.
 * Shared between app-data store and Drive backup encryption.
 * Exported so googleDrive.cjs can require() this instead of duplicating.
 */
function getOrCreateEncryptionKey() {
  try {
    const keyFile = path.join(app.getPath('userData'), '.store-key');
    if (fs.existsSync(keyFile)) {
      return safeStorage.decryptString(fs.readFileSync(keyFile));
    }
    const newKey = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyFile, safeStorage.encryptString(newKey), { mode: 0o600 });
    return newKey;
  } catch {
    // Volatile fallback: safeStorage unavailable (CI, headless, etc.)
    return crypto.randomBytes(32).toString('hex');
  }
}

// Lazily initialized — app.getPath() must be called after app.ready()
let appStore = null;

function getStore() {
  if (!appStore) {
    appStore = new Store({
      name: 'moneyflow-data',
      encryptionKey: getOrCreateEncryptionKey(),
    });
  }
  return appStore;
}

function getData(key) {
  return getStore().get(key, null);
}

function setData(key, value) {
  getStore().set(key, value);
}

function deleteData(key) {
  getStore().delete(key);
}

// --- Drive backup encryption (SEC-02) ---
// AES-256-GCM envelope around the backup JSON.
// The key is the same installation key — tie Drive backup to this machine.

const ALGORITHM = 'aes-256-gcm';

function encryptForDrive(obj) {
  const key = Buffer.from(getOrCreateEncryptionKey(), 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const json = JSON.stringify(obj);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  });
}

function decryptFromDrive(str) {
  const { iv, tag, data } = JSON.parse(str);
  const key = Buffer.from(getOrCreateEncryptionKey(), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf8'));
}

module.exports = {
  getOrCreateEncryptionKey,
  getData,
  setData,
  deleteData,
  encryptForDrive,
  decryptFromDrive,
};
```

**Note on key reuse for Drive:** The encryption key is DPAPI-protected and installation-specific. A Drive backup encrypted with this key is only decryptable on the same machine. This is intentional for v1.2 scope — cross-device restore would require a separate key export/import UX that is out of scope. Document this limitation clearly in the UX.

---

### 2. `src/utils/storage.js` — Renderer-side Async Storage Wrapper

**Purpose:** Single point of contact for storage in the renderer. Calls IPC when in Electron, falls back to plain `localStorage` otherwise (dev/test environments without Electron context).

```js
// src/utils/storage.js — new file

/**
 * Async storage wrapper: IPC in Electron, localStorage fallback in browser/test.
 */

export async function storageGet(key) {
  if (window.electronAPI?.storage) {
    return window.electronAPI.storage.get(key);
  }
  // Fallback (dev server without Electron)
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export async function storageSet(key, value) {
  if (window.electronAPI?.storage) {
    return window.electronAPI.storage.set(key, value);
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('storageSet fallback failed:', e);
  }
}

export async function storageDelete(key) {
  if (window.electronAPI?.storage) {
    return window.electronAPI.storage.delete(key);
  }
  localStorage.removeItem(key);
}
```

---

### 3. `src/components/PrivacyPolicyModal.jsx` — First-run Consent Modal

**Purpose:** Displayed on first launch if `localStorage.getItem('privacy_accepted')` is absent. User must accept to proceed.

**Design decisions:**
- **Consent flag stored in `localStorage` (not IPC storage):** `privacy_accepted` is not sensitive personal data — it's a preference flag. Storing it in plain `localStorage` avoids async init dependencies and means consent can be checked synchronously before any data loads. This is intentional and correct.
- Uses Radix Dialog (already in deps) for focus trap and accessibility, consistent with existing modals.
- Displays policy text (Italian, from `PRIVACY_POLICY_IT.md` content) with scrollable body.
- "Accept" button: sets `localStorage.setItem('privacy_accepted', 'true')` and closes. No "Decline" — app requires consent to function per GDPR Article 7 approach for transparent data controllers.
- Renders above everything else (z-index) — not dismissable via Escape or overlay click.

**Key props:**
```jsx
<PrivacyPolicyModal
  isOpen={!privacyAccepted}
  onAccept={() => {
    localStorage.setItem('privacy_accepted', 'true');
    setPrivacyAccepted(true);
  }}
/>
```

---

### 4. `src/components/PrivacyPolicySection.jsx` — Settings Integration

**Purpose:** New section in `SettingsView` showing policy text, last update date, and an "Export my data" reminder (GDPR Article 20 — already implemented via exportBackup).

**Minimal surface area:** No new navigation required — adds to the existing Settings page. A collapsible accordion or a scrollable card.

---

## Modified Files

### `electron/main.cjs` — 4 Changes

#### Change 1: Import storage module

```js
// ADD at top, after googleDrive require
const storage = require('./storage.cjs');
```

#### Change 2: Add IPC handlers for storage (after Google Drive handlers, before auto-updater handlers)

```js
// ============================================
// IPC Handlers per Storage Cifrato
// ============================================

ipcMain.handle('storage:get', async (event, key) => {
  return storage.getData(key);
});

ipcMain.handle('storage:set', async (event, key, value) => {
  storage.setData(key, value);
  return true;
});

ipcMain.handle('storage:delete', async (event, key) => {
  storage.deleteData(key);
  return true;
});
```

#### Change 3: Fix CSP — `script-src` should be conditional like `style-src`

**Current (line 153):**
```js
"script-src 'self' 'unsafe-inline'; " +
```

**Fixed:**
```js
`script-src 'self'${isDev ? " 'unsafe-inline'" : ""}; ` +
```

Add hardening directives:
```js
"object-src 'none'; " +
"base-uri 'self'; " +
```

The full corrected CSP block:
```js
'Content-Security-Policy': [
  "default-src 'self'; " +
  `script-src 'self'${isDev ? " 'unsafe-inline'" : ""}; ` +
  `style-src 'self'${styleUnsafe}; ` +
  `style-src-elem 'self'${styleUnsafe}; ` +
  "font-src 'self' data:; " +
  "img-src 'self' data: https:; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "connect-src 'self' http://localhost:* ws://localhost:* " +
  "https://www.googleapis.com https://oauth2.googleapis.com"
]
```

**Why `'unsafe-inline'` for scripts is safe to remove in prod:** Vite produces hashed JS bundles with `<script src="...">` references. There are no inline scripts in the production build. Tailwind v4 at build time produces a single CSS file. The `unsafe-inline` was overly broad protection that also covered potential XSS vectors.

#### Change 4: `backup-data-for-close` handler — no change needed

The renderer still sends plaintext via `sendBackupDataForClose`. The `uploadBackup()` function in `googleDrive.cjs` will handle encryption internally (see below). The IPC handler itself doesn't change:

```js
// No change needed — data flows: renderer plaintext → IPC → googleDrive.uploadBackup() → encrypt → Drive
ipcMain.on('backup-data-for-close', async (event, data) => {
  // ... unchanged
  await googleDrive.uploadBackup(data); // uploadBackup now encrypts internally
});
```

---

### `electron/googleDrive.cjs` — 3 Changes

#### Change 1: Remove duplicated `getOrCreateEncryptionKey` — use shared module

**Remove lines 22–34** (the function definition).  
**Add at top:**
```js
const { getOrCreateEncryptionKey, encryptForDrive, decryptFromDrive } = require('./storage.cjs');
```

**Also remove** the `safeStorage` and `crypto` imports from `googleDrive.cjs` since they're now in `storage.cjs`. **But keep `crypto` if it's used elsewhere** — verify no other usage before removing.

#### Change 2: Encrypt in `uploadBackup(data)` (line 553–586)

**Current:**
```js
const content = JSON.stringify(data, null, 2);
```

**New:**
```js
// Cifra i dati prima dell'upload (SEC-02)
const content = encryptForDrive(data);
```

The `mimeType` changes from `'application/json'` to `'text/plain'` or keep as `'application/json'` since the outer envelope is still valid JSON (`encryptForDrive` returns a JSON string).

#### Change 3: Decrypt in `downloadBackup()` (line 592–611)

**Current:**
```js
return {
  data: response.data,
  modifiedTime: existingFile.modifiedTime,
  fileId: existingFile.id,
};
```

**New (with backward compatibility for pre-v1.2 unencrypted backups):**
```js
let backupData = response.data;

// Supporto backward: tenta decifratura se è formato v1.2 cifrato
if (typeof backupData === 'string') {
  try {
    const parsed = JSON.parse(backupData);
    if (parsed.v === 1 && parsed.iv && parsed.data) {
      // Formato cifrato v1.2
      backupData = decryptFromDrive(backupData);
    } else {
      // JSON non cifrato (formato pre-v1.2)
      backupData = parsed;
    }
  } catch {
    // Fallback: già oggetto (googleapis auto-parsed JSON)
  }
} else if (typeof backupData === 'object' && backupData.v === 1 && backupData.iv) {
  // googleapis ha già parsato il JSON cifrato
  backupData = decryptFromDrive(JSON.stringify(backupData));
}

return {
  data: backupData,
  modifiedTime: existingFile.modifiedTime,
  fileId: existingFile.id,
};
```

**Note:** The googleapis Drive client `files.get({ alt: 'media' })` with JSON content will auto-parse the response body. The encrypted envelope is itself JSON, so `response.data` will be the parsed object `{ v: 1, iv: "...", ... }`. Handle both cases.

---

### `electron/preload.cjs` — Add storage bridge

Add the `storage` section in `contextBridge.exposeInMainWorld('electronAPI', {...})`:

```js
// Add after googleDrive block, before onRequestBackupData

// Encrypted storage bridge (SEC-01)
storage: {
  get: (key) => ipcRenderer.invoke('storage:get', key),
  set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
  delete: (key) => ipcRenderer.invoke('storage:delete', key),
},
```

No changes to the Google Drive backup bridge — `uploadBackup` and `downloadBackup` APIs are unchanged from the renderer's perspective (encryption is transparent at the `googleDrive.cjs` level).

---

### `src/hooks/useTransactionData.js` — Async storage migration

**This is the highest-risk migration.** The current synchronous lazy `useState` initializers must become async `useEffect` loads. The key safety invariant: **never save before initial load completes** (would wipe data with empty state).

**Pattern changes:**

```js
// BEFORE: synchronous lazy init
const [transactions, setTransactions] = useState(() => {
  const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
  return saved.transactions || [];
});

// AFTER: empty init + async load via useEffect in App.jsx
// useTransactionData receives initialData prop
export function useTransactionData({ initialAppData, ...rest }) {
  const [transactions, setTransactions] = useState(
    () => initialAppData?.transactions || []
  );
  const [categoryResolutions, setCategoryResolutions] = useState(
    () => initialAppData?.categoryResolutions || {}
  );
  // ... rest unchanged
}
```

**Why pass `initialData` from App.jsx vs. each hook reading independently:**
- Single IPC call at startup (not two calls racing each other)
- No coordination problem between useTransactionData and useCategories (they both read from `'moneyFlow'`)
- `isStorageLoaded` gate lives in one place

**The save effect adds `isStorageLoaded` guard:**
```js
// Existing useEffect (lines 68–88) — add guard:
useEffect(() => {
  if (!isStorageLoaded) return; // ← NEW: prevent overwriting before data loads
  if (transactions.length > 0 || ...) {
    storageSet('moneyFlow', { transactions, categories, importProfiles, categoryResolutions });
  }
}, [isStorageLoaded, transactions, categories, importProfiles, categoryResolutions]);
```

**`clearAllData` change:**
```js
// BEFORE:
localStorage.removeItem('moneyFlow');
// AFTER:
storageDelete('moneyFlow');
```

**`importBackup` change:**
```js
// BEFORE:
localStorage.setItem('moneyFlow', JSON.stringify({ ... }));
// AFTER:
await storageSet('moneyFlow', { transactions: backup.transactions, ... });
```

---

### `src/hooks/useCategories.js` — Remove localStorage reads

**Both `useState` initializers** that read from `localStorage.getItem('moneyFlow')` change to use `initialAppData` prop:

```js
// BEFORE:
const [categories, setCategories] = useState(() => {
  const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
  return saved.categories ? { ...DEFAULT_CATEGORIES, ...saved.categories } : DEFAULT_CATEGORIES;
});

// AFTER:
export function useCategories({ initialAppData, showToast }) {
  const [categories, setCategories] = useState(() => {
    const saved = initialAppData?.categories;
    return saved ? { ...DEFAULT_CATEGORIES, ...saved } : DEFAULT_CATEGORIES;
  });
  const [importProfiles, setImportProfiles] = useState(
    () => initialAppData?.importProfiles || {}
  );
  // ... rest unchanged
}
```

No write operations need to change in useCategories — writes happen via the save effect in useTransactionData (which already includes `categories` and `importProfiles`).

---

### `src/App.jsx` — Add storage init + privacy consent check

Two additions at the top of the component:

```jsx
// 1. Storage initialization
const [appData, setAppData] = useState(null);
const [isStorageLoaded, setIsStorageLoaded] = useState(false);

useEffect(() => {
  async function loadAppData() {
    const data = await storageGet('moneyFlow');
    setAppData(data || {});
    setIsStorageLoaded(true);
  }
  loadAppData();
}, []);

// 2. Privacy consent
const [privacyAccepted, setPrivacyAccepted] = useState(
  () => localStorage.getItem('privacy_accepted') === 'true'
);
```

Show a loading skeleton until `isStorageLoaded` is true, then render the full app. Pass `appData` to the hooks:

```jsx
const { transactions, ... } = useTransactionData({
  initialAppData: appData,
  isStorageLoaded,
  ...
});
```

---

## Data Flow Changes

### Before (v1.1)

```
[React Hook] ←→ localStorage('moneyFlow') [plaintext JSON in browser storage]
[React Hook] → window.electronAPI.googleDrive.uploadBackup(data)
            → IPC → googleDrive.uploadBackup(data) → JSON.stringify → Drive [plaintext]
```

### After (v1.2)

```
App.jsx mount
  → storageGet('moneyFlow')
  → IPC('storage:get')
  → main.cjs handler
  → electron-store.get() [AES-256-GCM decrypt via DPAPI key]
  → returns plaintext object to renderer
  → passed as initialAppData to hooks

[Hook state change] → storageSet('moneyFlow', plaintext)
  → IPC('storage:set')
  → main.cjs handler
  → electron-store.set() [AES-256-GCM encrypt via DPAPI key]
  → stored in %APPDATA%\MoneyFlow\moneyflow-data.json [ciphertext]

[Drive upload]
  renderer → sendBackupDataForClose(plaintext) OR uploadBackup IPC (plaintext)
  → main.cjs
  → googleDrive.uploadBackup(plaintext)
  → encryptForDrive(plaintext) [AES-256-GCM, same key]
  → Drive stores JSON envelope { v:1, iv, tag, data } [ciphertext]

[Drive download]
  → googleDrive.downloadBackup()
  → decryptFromDrive(envelope)
  → returns plaintext object to renderer via IPC
```

### Privacy flow

```
App.jsx mount
  → check localStorage('privacy_accepted')
  → if null → show PrivacyPolicyModal (blocks UI, non-dismissable)
  → user clicks "Accetta" → localStorage.setItem('privacy_accepted', 'true')
  → modal closes, app renders normally
```

---

## Build Order (Phase Dependencies)

### Recommended Sequence

```
Phase 12: SEC-05 — Dependency Audit
  No code changes. npm audit + fix. Unblocks clean baseline.
  Risk: LOW. Time: ~1h.
  
Phase 13: SEC-04 — CSP & BrowserWindow Hardening
  Single file change (main.cjs). Zero hook/renderer impact.
  Risk: LOW. Time: ~2h (includes testing that app still loads).
  Dependency: none.

Phase 14: SEC-03 — Privacy Policy In-App
  New UI components + localStorage flag. No IPC changes.
  Can be built without SEC-01 complete (uses localStorage for consent flag).
  Risk: LOW. Time: ~3-4h.
  Dependency: none (consent flag uses plain localStorage intentionally).

Phase 15: SEC-01 — safeStorage Encryption (Local Storage)
  New storage.cjs + IPC handlers + preload extension + hook migrations.
  Most complex phase. Build order within phase:
    15a: electron/storage.cjs (no dependencies)
    15b: IPC handlers in main.cjs + preload.cjs additions
    15c: src/utils/storage.js (no dependencies)
    15d: App.jsx storage init (depends on 15b+15c)
    15e: useTransactionData.js migration (depends on 15d)
    15f: useCategories.js migration (depends on 15d)
  Risk: HIGH. Time: ~6-8h. Needs integration tests.

Phase 16: SEC-02 — Encrypted Drive Backups
  Modifies googleDrive.cjs uploadBackup/downloadBackup.
  Requires storage.cjs (SEC-01 Phase 15a) for shared encryptForDrive/decryptFromDrive.
  Risk: MEDIUM. Time: ~3-4h. Must test backward-compat with existing Drive backups.
  Dependency: Phase 15a must be complete (storage.cjs exports encryptForDrive).
```

### Rationale for ordering

- **SEC-05 first**: npm audit has no code risk. Establishes clean baseline before writing new code.
- **SEC-04 before SEC-01**: CSP is a one-line fix. Ship the easy win without waiting for the complex storage migration. No coupling.
- **SEC-03 before SEC-01**: Privacy policy UI is pure React work. The consent flag intentionally stays in plain `localStorage` (not sensitive data), so it doesn't block on or depend on the encrypted store. Building UI work first lets the milestone progress while the risky storage migration is developed carefully.
- **SEC-01 before SEC-02**: The `encryptForDrive`/`decryptFromDrive` functions live in `storage.cjs` (SEC-01). Phase 16 can start as soon as `storage.cjs` is created (the file export is available at Phase 15a), but the full SEC-02 should be tested after SEC-01 is stable since they share the same key.
- **SEC-02 last**: Drive backup format change is a migration concern — backward compatibility for pre-v1.2 Drive backups must be handled. Testing this requires SEC-01 to be working.

---

## Migration Notes

### Breaking changes requiring migration path

#### 1. `useState` lazy initializers in hooks (HIGH RISK)

**Change:** Both `useTransactionData` and `useCategories` remove their `localStorage.getItem('moneyFlow')` calls.

**Migration path:**
- `initialAppData` prop is optional — if `null`/`undefined`, hooks default to empty state (same as today's behavior when localStorage is empty)
- Before `App.jsx` loads `appData` from IPC, it passes `null` as `initialAppData`
- The hooks show empty/loading state until `isStorageLoaded` is true
- The save effect is guarded by `isStorageLoaded` — no data loss from empty state overwriting storage

**Data migration (first run after upgrade):**
- On first launch of v1.2, the encrypted store (`moneyflow-data.json`) doesn't exist yet
- `storageGet('moneyFlow')` returns `null`
- App.jsx detects this and runs a one-time migration: reads from plain `localStorage('moneyFlow')`, calls `storageSet('moneyFlow', migratedData)`, then `localStorage.removeItem('moneyFlow')`
- Subsequent launches use the encrypted store

```js
// In App.jsx loadAppData():
let data = await storageGet('moneyFlow');
if (!data) {
  // First-time migration from plaintext localStorage
  const legacy = localStorage.getItem('moneyFlow');
  if (legacy) {
    data = JSON.parse(legacy);
    await storageSet('moneyFlow', data);
    localStorage.removeItem('moneyFlow');
    console.log('[migration] moneyFlow data migrated to encrypted store');
  }
}
setAppData(data || {});
```

#### 2. Google Drive backup format change (MEDIUM RISK)

**Change:** Encrypted envelope `{ v:1, iv, tag, data }` replaces raw JSON on Drive.

**Migration path:** `downloadBackup()` detects old format (plain object without `v: 1` signature) and returns it as-is. No user action required. On next upload, the backup is re-written in encrypted format.

#### 3. `useTransactionData` / `useCategories` signature change

**Change:** Both hooks accept new `initialAppData` prop.

**Migration path:** Since these are internal hooks consumed only by `App.jsx`, this is not a public API change. `App.jsx` is the only caller — update in the same phase. No external consumers.

---

## Component Inventory

### New Files

| File | Type | Purpose | Phase |
|------|------|---------|-------|
| `electron/storage.cjs` | Main process module | Encrypted electron-store + Drive crypto utils | 15 |
| `src/utils/storage.js` | Renderer utility | Async IPC wrapper for storage (Electron + fallback) | 15 |
| `src/components/PrivacyPolicyModal.jsx` | React component | First-run consent modal (non-dismissable) | 14 |
| `src/components/PrivacyPolicySection.jsx` | React component | Privacy policy display in Settings | 14 |

### Modified Files

| File | Scope of Change | Phase |
|------|----------------|-------|
| `electron/main.cjs` | CSP fix (1 line + 2 new directives); add storage IPC handlers (15 lines) | 13 + 15 |
| `electron/preload.cjs` | Add `storage` bridge (5 lines) | 15 |
| `electron/googleDrive.cjs` | Remove `getOrCreateEncryptionKey` (extract to storage.cjs); encrypt in `uploadBackup`; decrypt in `downloadBackup` | 15a + 16 |
| `src/App.jsx` | Add async storage init + `isStorageLoaded`; add privacy consent check; pass `initialAppData` to hooks | 14 + 15 |
| `src/hooks/useTransactionData.js` | Replace `useState` lazy localStorage reads; add `initialAppData` prop; update save/clear/import to use `storageSet`/`storageDelete` | 15 |
| `src/hooks/useCategories.js` | Replace `useState` lazy localStorage reads; add `initialAppData` prop | 15 |
| `src/views/SettingsView.jsx` | Add `PrivacyPolicySection` component | 14 |

### Unchanged Files

| File | Why unchanged |
|------|--------------|
| `electron/preload.cjs` (Drive methods) | Drive API surface unchanged — encryption transparent |
| `src/hooks/useGoogleDrive.js` | uploadBackup/downloadBackup IPC calls unchanged |
| `src/hooks/useFilters.js` | No storage access |
| `src/hooks/useModals.js` | No storage access |
| `src/hooks/useToast.js` | No storage access |
| `src/hooks/useImportLogic.js` | No direct localStorage access |
| `index.html` | No CSP meta tag needed — response-header approach in main.cjs is correct for Electron |

---

## Architecture Risks

### Risk 1: `isStorageLoaded` guard failure

**Scenario:** A bug causes the save `useEffect` to fire with empty arrays before `isStorageLoaded` is true, wiping the encrypted store.

**Mitigation:**
- The `isStorageLoaded` guard is the single gate — must be first condition in the save effect
- Write an integration smoke test: launch app, verify encrypted store is not reset on first render cycle
- Alternatively, the save effect only fires when data is non-empty (existing guard at line 69 already checks `transactions.length > 0 || Object.keys(importProfiles).length > 0 || ...`). This provides a second layer of protection since migrated data will satisfy these conditions.

### Risk 2: `getOrCreateEncryptionKey` called before `app.ready()`

**Scenario:** `storage.cjs` is required at module level, and `getOrCreateEncryptionKey()` calls `app.getPath('userData')` which throws before `app.ready`.

**Mitigation:** The `getStore()` function uses lazy initialization (`if (!appStore)`). The store is only created when the first `getData()`/`setData()` IPC handler fires, which is after `app.whenReady()`. The `require('./storage.cjs')` at the top of `main.cjs` only loads the module — `getStore()` is not called at require time. Safe.

**BUT:** `googleDrive.cjs` calls `getOrCreateEncryptionKey()` at module scope (line 38: `new Store({ encryptionKey: getOrCreateEncryptionKey() })`). After extracting to `storage.cjs`, this inline call will be replaced by `const store = new Store({ name: 'google-auth', encryptionKey: getOrCreateEncryptionKey() })` at module scope. This fires when `main.cjs` does `require('./googleDrive.cjs')` at line 4, which is before `app.ready()`.

**Fix:** In `googleDrive.cjs`, use the same lazy pattern — initialize the store inside `initializeOAuth()` instead of at module scope. Or: verify that `safeStorage.encryptString` doesn't require `app.ready()`. **Electron docs confirm:** `safeStorage` is only available after `app.ready()`. The existing code in `googleDrive.cjs` works because `initializeOAuth()` is only called inside `app.whenReady().then()` — but the `new Store(...)` at module top runs before ready. **This is a pre-existing latent bug.** For v1.2, wrap both stores in lazy init functions.

### Risk 3: Drive backup backward compatibility

**Scenario:** User has existing unencrypted Drive backup. After v1.2 upgrade, restore fails because decryption is attempted on plaintext.

**Mitigation:** Defensive `downloadBackup()` implementation (see Change 3 above) checks for `v: 1` signature before attempting decryption. Test matrix: (a) no backup, (b) pre-v1.2 plaintext backup, (c) v1.2 encrypted backup. All three must work.

### Risk 4: `script-src 'unsafe-inline'` removal breaking prod

**Scenario:** Vite's production build injects inline scripts (e.g., initial module preload polyfill, or dynamic chunk loading).

**Mitigation:** Run `vite build && electron:preview` and check browser console for CSP violations before shipping. Vite 7 produces clean ES module bundles with no inline scripts. If a violation appears, use a hash-based exemption `'sha256-...'` rather than restoring `'unsafe-inline'`.

---

## Dependency Notes

| Dependency | Current Version | SEC Relevance | Notes |
|-----------|----------------|---------------|-------|
| `electron-store` | 8.2.0 | SEC-01: core | Already installed. `encryptionKey` option confirmed in v8.x |
| `electron` | 34.5.8 | SEC-04: safeStorage | `safeStorage` stable since Electron 15. Available in 34.x. |
| `xlsx` | 0.18.5 | SEC-05 | SheetJS has known CVEs in older versions. Check `npm audit` output. SheetJS moved to a paid model for newer versions — may need to pin or find alternative. |
| `electron-reload` | 2.0.0-alpha.1 | SEC-05 | Dev dependency, alpha. Not in production build. Low risk for sec audit. |
| `framer-motion` | 12.38.0 | — | No SEC impact |

---

## Sources

- Electron `safeStorage` API: https://www.electronjs.org/docs/latest/api/safe-storage
- Electron `contextBridge` / `ipcRenderer`: https://www.electronjs.org/docs/latest/api/context-bridge  
- `electron-store` v8 `encryptionKey` option: https://github.com/sindresorhus/electron-store#encryptionkey
- Electron CSP best practices: https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy
- Node.js `crypto.createCipheriv` AES-256-GCM: https://nodejs.org/api/crypto.html
- Direct codebase inspection: `electron/googleDrive.cjs` lines 7, 22–40 (existing safeStorage usage)
- Direct codebase inspection: `electron/main.cjs` lines 96–103 (BrowserWindow webPreferences), 144–162 (CSP)
- Direct codebase inspection: `src/hooks/useTransactionData.js` lines 37–88 (localStorage read/write pattern)
- Direct codebase inspection: `src/hooks/useCategories.js` lines 11–29 (localStorage read pattern)
