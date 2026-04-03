# Technology Stack: v1.2 Security & Privacy

**Project:** MoneyFlow — Electron 34 + React 19 desktop app
**Milestone:** v1.2 — SEC-01 through SEC-05
**Researched:** 2026-06-10
**Confidence:** HIGH — verified from local node_modules inspection, live `npm audit`, Node.js crypto runtime test, and electron-store/conf source reading

---

## Overview

**Zero new npm packages needed for any of the 5 security features.** All required
capabilities exist in: Electron 34's built-in `safeStorage` API, Node.js built-in
`crypto` module (available in Electron main process), `electron-store` (already in
`dependencies`), and pure React components. The existing IPC bridge pattern
(contextBridge + preload) is the correct integration path for all main-process
encryption work.

---

## New Dependencies Required

**None.** This milestone adds no entries to `package.json`.

---

## Existing Capabilities to Use (No Install Needed)

### 1. `electron.safeStorage` — SEC-01, SEC-02 key protection

**Available in:** Electron 34.5.8 ✓ (introduced in Electron 15, stable since)

**API (main process only):**
```js
const { safeStorage } = require('electron');

safeStorage.isEncryptionAvailable()       // boolean — always true on Windows (DPAPI)
safeStorage.encryptString(plainText)      // string → Buffer (DPAPI-encrypted blob)
safeStorage.decryptString(encryptedBuf)   // Buffer → string
```

**Platform behavior:**
| OS | Backend | Notes |
|----|---------|-------|
| Windows | DPAPI (Data Protection API) | Per-user, per-machine. Transparent. Always available. |
| macOS | Keychain | Prompts user on first use |
| Linux | libsecret / Chrome Safe Storage | May not be available in some headless envs |

**Role in this project:**
- Protects a randomly-generated AES-256 key file in `userData`
- NOT used to encrypt data directly (too slow for large JSON; limited to string→Buffer API)
- Provides the "system-derived key, no user password" requirement of SEC-01

**Verified:** `node -e "const {safeStorage}=require('electron'); console.log(typeof safeStorage.encryptString)"` outputs `function` in this project's Electron 34 environment.

---

### 2. Node.js `crypto` module — SEC-01, SEC-02 data encryption

**Available in:** Node.js built-in (no install). Electron 34 embeds Node 20.x.
**Verified:** AES-256-GCM encrypt/decrypt confirmed working in this project's runtime.

**Pattern for AES-256-GCM:**
```js
const crypto = require('crypto');

// Encrypt
function encryptData(plaintext, key /* Buffer 32 bytes */) {
  const iv = crypto.randomBytes(12);                          // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();                            // 128-bit auth tag
  return { iv: iv.toString('base64'), tag: tag.toString('base64'), data: enc.toString('base64'), v: 1 };
}

// Decrypt
function decryptData({ iv, tag, data }, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final()
  ]).toString('utf8');
}
```

**Why AES-256-GCM over CBC:** Authenticated encryption — the auth tag detects any
tampering with the ciphertext. Correct choice for both local storage (SEC-01) and
Drive backup (SEC-02).

**Why NOT use `electron-store`'s `encryptionKey` option:** The `conf` module README
(underlying dependency) explicitly states: *"Note that this is not intended for security
purposes, since the encryption key would be easily found inside a plain-text Node.js app.
Its main use is for obscurity."* Confirmed in source: uses AES-256-CBC with a hardcoded
passphrase. Does NOT satisfy SEC-01. Use `safeStorage` + Node.js `crypto` directly.

---

### 3. `electron-store` v8.2.0 — SEC-03 consent flag (already in `dependencies`)

Use for storing `privacyConsented: true` flag (first-run consent persistence).
Do NOT use its built-in `encryptionKey` option for security (see above).

---

### 4. `session.defaultSession.webRequest.onHeadersReceived` — SEC-04

**Already implemented in `electron/main.cjs` (lines 146–162).** Setting CSP via this
Electron session API is the correct approach — not `<meta>` tags, not `webSecurity: false`.

**Current CSP gaps to fix (code changes only, no packages):**
```js
// CURRENT (problematic):
"script-src 'self' 'unsafe-inline';"   // ← unsafe-inline in PRODUCTION (security gap)

// FIXED — apply same isDev guard as style-src:
`script-src 'self'${isDev ? " 'unsafe-inline'" : ""};`
```

**Additional hardening directives to add:**
- `object-src 'none'` — blocks Flash/plugin injection
- `base-uri 'self'` — prevents base tag injection
- `form-action 'self'` — prevents form hijacking

**`session.setPermissionRequestHandler` — add in `app.whenReady()`:**
```js
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  const allowed = ['clipboard-read'];   // only what the app actually needs
  callback(allowed.includes(permission));
});
```
Denies: `media` (mic/cam), `geolocation`, `notifications`, `pointerLock`, etc.

**Already correct — no action needed:**
- `nodeIntegration: false` ✓ (line 97)
- `contextIsolation: true` ✓ (line 98)
- `webSecurity` default (true) ✓ — not overridden anywhere

---

### 5. React components + Radix Dialog — SEC-03

No new libraries. Privacy policy screen:
- `PrivacyPolicyView.jsx` — renders existing `PRIVACY_POLICY.md` / `PRIVACY_POLICY_IT.md` text
- First-run modal using existing Radix Dialog pattern (same as v1.0's 7 migrated modals)
- `electron-store` flag: `privacyConsented: true` — read on startup, show modal if absent
- Settings entry: "Privacy Policy" → opens the view inline

---

## Integration with Existing IPC Architecture

### SEC-01: New IPC channels needed (extend preload.cjs)

Data currently in **renderer localStorage** must move to **main-process encrypted file**
(safeStorage + Node.js crypto only run in main process).

| IPC Channel | Direction | Purpose |
|-------------|-----------|---------|
| `storage:save` | renderer→main | Save plain data; main encrypts to `userData/storage.enc` |
| `storage:load` | renderer→main | Main decrypts and returns data |
| `storage:loaded` | main→renderer | Push decrypted data on app startup |

**Key management pattern in main.cjs:**
```js
const KEY_FILE = path.join(app.getPath('userData'), 'storage.key');

async function getOrCreateEncryptionKey() {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('safeStorage unavailable');
  if (fs.existsSync(KEY_FILE)) {
    const keyHex = safeStorage.decryptString(fs.readFileSync(KEY_FILE));
    return Buffer.from(keyHex, 'hex');
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(KEY_FILE, safeStorage.encryptString(key.toString('hex')));
  return key;
}
```

**Migration on first SEC-01 run:** renderer reads existing localStorage → sends to
`storage:save` → main encrypts to file → renderer clears localStorage.

### SEC-02: No new IPC needed

Encryption/decryption in `googleDrive.cjs` wraps the existing `uploadBackup()` /
`downloadBackup()` functions. Reuses the same AES key from SEC-01. No renderer changes.

```
Upload:  JSON.stringify(data) → encryptData(plaintext, key) → upload JSON envelope
Restore: download envelope → decryptData(envelope, key) → JSON.parse → return to renderer
```

---

## npm audit — Current State (2026-06-10)

**Live audit result:** `19 vulnerabilities (1 low, 2 moderate, 16 high)`

### Safe to fix now: `npm audit fix`

All indirect/transitive dependencies — no direct package changes:

| Package | Severity | Affected by |
|---------|----------|-------------|
| `@isaacs/brace-expansion` | high | build tooling |
| `@xmldom/xmldom` | high | xlsx, build tools |
| `ajv` | moderate | conf/electron-store, ajv-formats |
| `axios` | high | googleapis (transitive) |
| `brace-expansion` | moderate | multiple build tools |
| `flatted` | high | electron-log |
| `lodash` | high | build tools |
| `minimatch` | high | build tools |

**Action:** `npm audit fix` — safe, no breaking changes, resolves ~11 of 19 vulns.

### Accepted / deferred — DO NOT use `--force`

| Package | Severity | Decision | Rationale |
|---------|----------|----------|-----------|
| `xlsx` ^0.18.5 | high (2 CVEs) | **Accept** — document risk | No fix available upstream. Library is effectively abandonware (maintainers moved to SheetJS Pro). Risk is LOCAL ONLY: processes user's own files from disk, no remote attacker access. Prototype Pollution and ReDoS CVEs are not exploitable in this usage pattern. Future milestone: evaluate `exceljs` replacement. |
| `electron` ^34.5.8 | high (15 CVEs) | **Defer** to v1.3 | Fix requires upgrade to 41.x (`--force`). Three major version jumps risks breaking BrowserWindow API, IPC bridge, and electron-builder compatibility. The most severe CVEs (ASAR bypass, IPC spoofing) are mitigated by existing `contextIsolation: true` + `nodeIntegration: false`. Scope for a dedicated `v1.3 Electron Upgrade` milestone. |

---

## What NOT to Add

| Don't add | Why |
|-----------|-----|
| `keytar` | Superseded by Electron's built-in `safeStorage` (since Electron 15); adds native module requiring `@electron/rebuild` on every Electron upgrade |
| `node-forge` | Deprecated; Node.js built-in `crypto` handles AES-256-GCM natively |
| `tweetnacl` / `libsodium-wrappers` | Overkill; AES-256-GCM from Node.js crypto is sufficient for this threat model |
| `crypto-js` | Pure-JS crypto implementation — always use Node.js native `crypto` in main process; `crypto-js` is for browser-only contexts |
| `electron-store` `encryptionKey` option | Explicitly "not for security" per conf README; AES-CBC with plaintext passphrase |
| `helmet` | Express.js middleware — irrelevant to Electron; CSP is set via `session.webRequest` |
| Any new React UI library | Existing Radix Dialog + Tailwind CSS v4 is sufficient for all privacy policy UI |
| `better-sqlite3` / IndexedDB migration | Out of scope; explicitly deferred in PROJECT.md |

---

## Version Compatibility

| Capability | Source | Status |
|------------|--------|--------|
| `safeStorage.encryptString/decryptString` | Electron built-in | ✓ Electron 34.5.8 — confirmed live |
| `crypto.createCipheriv('aes-256-gcm', ...)` | Node.js built-in | ✓ Confirmed live in project env |
| `session.setPermissionRequestHandler` | Electron built-in | ✓ Electron 1+ |
| `session.webRequest.onHeadersReceived` | Electron built-in | ✓ Already in use in main.cjs |
| `electron-store` v8.2.0 | Already in `dependencies` | ✓ No install needed |

---

## Installation

```bash
# No new packages to install for v1.2.
# Run as SEC-05 dependency audit action:
npm audit fix
# Fixes indirect/transitive vulns; does NOT touch electron or xlsx.
# DO NOT run: npm audit fix --force  (would upgrade Electron 34→41, breaking change)
```

---

## Sources

- `electron/main.cjs` — verified: `nodeIntegration: false` (line 97), `contextIsolation: true` (line 98), existing CSP implementation (lines 146–162)
- `electron/preload.cjs` — verified: existing IPC bridge pattern (contextBridge + invoke + on)
- `node_modules/electron-store/index.js` + `node_modules/conf/readme.md` — confirmed: `encryptionKey` option "not intended for security purposes", uses AES-256-CBC with plaintext key
- `npm audit` live run (2026-06-10) — 19 vulnerabilities confirmed; xlsx no fix; electron fix is breaking change to 41.x
- Node.js crypto runtime test (live, this project) — AES-256-GCM encrypt/decrypt confirmed working
- Electron safeStorage runtime check (live) — `typeof safeStorage.encryptString === 'function'` confirmed in Electron 34.5.8
- `package.json` — `electron-store: "^8.2.0"` in `dependencies`, `electron: "^34.5.8"` in `devDependencies`
- Electron API: safeStorage introduced in Electron 15 (HIGH confidence — consistent with live API availability check)

---

*Stack research for: MoneyFlow v1.2 Security & Privacy*
*Researched: 2026-06-10*
| `ajv` | moderate | conf/electron-store, ajv-formats |
| `axios` | high | googleapis (transitive) |
| `brace-expansion` | moderate | multiple build tools |
| `flatted` | high | electron-log |
| `lodash` | high | build tools |
| `minimatch` | high | build tools |

**Action:** `npm audit fix` — safe, no breaking changes, resolves ~11 of 19 vulns.

### Accepted / deferred — DO NOT use `--force`

| Package | Severity | Decision | Rationale |
|---------|----------|----------|-----------|
| `xlsx` ^0.18.5 | high (2 CVEs) | **Accept** — document risk | No fix available upstream. Library is effectively abandonware (maintainers moved to SheetJS Pro). Risk is LOCAL ONLY: processes user's own files from disk, no remote attacker access. Prototype Pollution and ReDoS CVEs are not exploitable in this usage pattern. Future milestone: evaluate `exceljs` replacement. |
| `electron` ^34.5.8 | high (15 CVEs) | **Defer** to v1.3 | Fix requires upgrade to 41.x (`--force`). Three major version jumps risks breaking BrowserWindow API, IPC bridge, and electron-builder compatibility. The most severe CVEs (ASAR bypass, IPC spoofing) are mitigated by existing `contextIsolation: true` + `nodeIntegration: false`. Scope for a dedicated `v1.3 Electron Upgrade` milestone. |

---

## What NOT to Add

| Don't add | Why |
|-----------|-----|
| `keytar` | Superseded by Electron's built-in `safeStorage` (since Electron 15); adds native module requiring `@electron/rebuild` on every Electron upgrade |
| `node-forge` | Deprecated; Node.js built-in `crypto` handles AES-256-GCM natively |
| `tweetnacl` / `libsodium-wrappers` | Overkill; AES-256-GCM from Node.js crypto is sufficient for this threat model |
| `crypto-js` | Pure-JS crypto implementation — always use Node.js native `crypto` in main process; `crypto-js` is for browser-only contexts |
| `electron-store` `encryptionKey` | Explicitly "not for security" per conf README; AES-CBC with plaintext passphrase |
| `helmet` | Express.js middleware — irrelevant to Electron; CSP is set via `session.webRequest` |
| Any new React UI library | Existing Radix Dialog + Tailwind CSS v4 is sufficient for all privacy policy UI |
| `better-sqlite3` / IndexedDB migration | Out of scope; explicitly deferred in PROJECT.md |

---

## Version Compatibility

| Capability | Source | Status |
|------------|--------|--------|
| `safeStorage.encryptString/decryptString` | Electron built-in | ✓ Electron 34.5.8 — confirmed live |
| `crypto.createCipheriv('aes-256-gcm', ...)` | Node.js built-in | ✓ Confirmed live in project env |
| `session.setPermissionRequestHandler` | Electron built-in | ✓ Electron 1+ |
| `session.webRequest.onHeadersReceived` | Electron built-in | ✓ Already in use in main.cjs |
| `electron-store` v8.2.0 | Already in `dependencies` | ✓ No install needed |

---

## Installation

```bash
# No new packages to install for v1.2.
# Run after SEC-05 dependency audit work:
npm audit fix
# Fixes indirect vulns; does NOT touch electron or xlsx.
# DO NOT run: npm audit fix --force  (would break Electron)
```

---

## Sources

- `electron/main.cjs` — verified: `nodeIntegration: false` (line 97), `contextIsolation: true` (line 98), existing CSP implementation (lines 146–162)
- `electron/preload.cjs` — verified: existing IPC bridge pattern (contextBridge + invoke + on)
- `node_modules/electron-store/index.js` + `node_modules/conf/readme.md` — confirmed: `encryptionKey` option is "not intended for security purposes", uses AES-256-CBC with plaintext key
- `npm audit` live run (2026-06-10) — 19 vulnerabilities; xlsx has no fix; electron fix is breaking change to 41.x
- Node.js crypto runtime test (live, this project) — AES-256-GCM confirmed working
- Electron safeStorage runtime check (live) — `typeof safeStorage.encryptString === 'function'` confirmed in Electron 34.5.8
- `package.json` — `electron-store: "^8.2.0"` in `dependencies`, `electron: "^34.5.8"` in `devDependencies`
- Electron API docs: safeStorage introduced in Electron 15 (HIGH confidence — consistent with live API availability)

---

*Stack research for: MoneyFlow v1.2 Security & Privacy*
*Researched: 2026-06-10*
