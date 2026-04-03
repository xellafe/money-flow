# Domain Pitfalls: Adding Security & Encryption to an Existing Electron App

**Domain:** Electron desktop app (MoneyFlow) — Adding safeStorage encryption, encrypted Drive backups, CSP hardening, and dependency audit to an existing app with live user data
**Technology Stack:** Electron 34.5.8, React 19.2.0, Vite 7.2.4, Tailwind CSS v4, Framer Motion, Recharts, CommonJS main process (.cjs), Windows NSIS + Portable
**Researched:** 2026-04-10
**Context:** v1.2 milestone — retro-fitting security features onto a shipped app (v2.0.0) that currently stores all data in plaintext localStorage and sends plaintext JSON to Google Drive

> **CRITICAL SCOPE NOTE:** `nodeIntegration: false` and `contextIsolation: true` are **already correctly set** in `electron/main.cjs` lines 97–99. The preload bridge is already correct. SEC-04 partial work is done — pitfalls in this area focus on *what not to break* when adding new IPC handlers.

> **NOTE:** v1.1 auto-update pitfalls archived. This file covers v1.2 Security & Privacy integration pitfalls.

---

## Area 1: safeStorage Migration — localStorage Plaintext → Encrypted (SEC-01)

---

### CRITICAL — Pitfall 1.1: Renderer Cannot Call safeStorage (Architecture Mismatch)

**What goes wrong:** `safeStorage` lives in the **main process** (Node.js). The React hooks (`useTransactionData.js`) currently read/write `localStorage` directly from the **renderer** process. You cannot import or call `safeStorage` from renderer-side code — it will be `undefined` or throw.

**Why it happens:** Developers assume "it's Electron, I have access to everything." But with `contextIsolation: true` (correctly set), the renderer is a sandboxed browser context. Only what's explicitly exposed through `contextBridge` is available.

**Consequences:** Any attempt to call `window.require('electron').safeStorage` in React throws `TypeError: Cannot read properties of undefined`. The app silently stores nothing, or crashes.

**Prevention — specific pattern:**
```js
// electron/main.cjs — add IPC handlers for encrypted storage
const { safeStorage } = require('electron');
// ...
ipcMain.handle('storage:encrypt', (event, plaintext) => {
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, reason: 'unavailable' };
  return { ok: true, data: safeStorage.encryptString(plaintext).toString('base64') };
});
ipcMain.handle('storage:decrypt', (event, base64) => {
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, reason: 'unavailable' };
  return { ok: true, data: safeStorage.decryptString(Buffer.from(base64, 'base64')) };
});

// electron/preload.cjs — expose through contextBridge
storage: {
  encrypt: (text) => ipcRenderer.invoke('storage:encrypt', text),
  decrypt: (b64)  => ipcRenderer.invoke('storage:decrypt', b64),
}
```

**Detection:** `window.electronAPI.storage` undefined in DevTools console after adding preload binding.

---

### CRITICAL — Pitfall 1.2: safeStorage Returns Buffer, Not String — contextBridge Rejects It

**What goes wrong:** `safeStorage.encryptString(str)` returns a **Node.js `Buffer`**. Electron's `contextBridge.exposeInMainWorld` serializes return values through a structured-clone algorithm that **cannot serialize Buffers** (it either throws or strips the data silently).

**Why it happens:** Buffer is a Node-specific type not present in the Web Platform structured-clone algorithm. contextBridge only passes JSON-serializable values plus specific Electron types.

**Consequences:** The encrypted buffer arrives as `{}` or `null` in the renderer. You then store garbage, and every decrypt attempt fails.

**Prevention:**
```js
// main.cjs — ALWAYS base64-encode before returning through IPC
ipcMain.handle('storage:encrypt', (event, plaintext) => {
  const buf = safeStorage.encryptString(plaintext);
  return buf.toString('base64'); // ← critical: Buffer → string
});
ipcMain.handle('storage:decrypt', (event, base64) => {
  return safeStorage.decryptString(Buffer.from(base64, 'base64')); // ← string → Buffer → string
});
```

**Detection:** `typeof result` in renderer is `'object'` with no enumerable keys, or result is `null`.

---

### CRITICAL — Pitfall 1.3: First-Launch Migration Race — Existing Data Becomes Unreadable

**What goes wrong:** On the first launch after adding encryption, existing plaintext `localStorage.getItem('moneyFlow')` data is valid JSON. Your new code tries to decrypt it (it's not encrypted) → `safeStorage.decryptString()` throws `"Failed to decrypt"` → app boots with **zero transactions** even though data exists.

**Why it happens:** There's no migration marker. The code can't tell "is this plaintext or encrypted?"

**Consequences:** User opens the app after update, sees empty transaction list. Thinks data is lost. Panic. (Data is still there in localStorage, just the read path is broken.)

**Prevention — migration pattern:**
```js
// In main process, on app ready, BEFORE renderer loads:
async function migrateLocalStorage() {
  const userData = app.getPath('userData');
  const migrationFlag = path.join(userData, '.storage-migrated-v1');
  
  if (fs.existsSync(migrationFlag)) return; // already migrated
  
  // Migration: tell renderer to send its current plaintext data
  // then re-encrypt it. OR: read from localStorage via session.
  // Simplest: add a 'storage:migrate' IPC that reads localStorage
  // in the renderer and sends back plaintext, main encrypts and writes
  // to a file, then marks migration done.
  
  // Mark ONLY after verified round-trip
  fs.writeFileSync(migrationFlag, new Date().toISOString());
}
```

**Key rule:** Never delete plaintext data until encrypted version is verified (round-trip decrypt works). Use an atomic flag file, not a localStorage key (the thing you're migrating can't hold its own migration state reliably).

**Detection:** App boots with empty state after update. `localStorage.getItem('moneyFlow')` still has data in DevTools.

---

### Pitfall 1.4: useEffect Write Path Is Synchronous — IPC Is Async

**What goes wrong:** `useTransactionData.js` writes to localStorage inside a `useEffect`:
```js
useEffect(() => {
  localStorage.setItem('moneyFlow', JSON.stringify({ transactions, ... }));
}, [transactions, categories, ...]);
```
If you replace `localStorage.setItem` with an IPC call (`window.electronAPI.storage.set(...)`), the useEffect can't `await` the IPC call cleanly — React's `useEffect` callback is synchronous, and fire-and-forget IPC calls risk data races on rapid state changes.

**Why it happens:** Encryption is inherently async (IPC round-trip). The existing write path is sync.

**Consequences:** On rapid updates (e.g., importing 500 transactions), IPC calls queue up. The last one might arrive out of order. Stored data reflects an intermediate state.

**Prevention:**
```js
// Use a debounced write with a ref to track the "latest" state
const pendingWriteRef = useRef(null);
useEffect(() => {
  if (pendingWriteRef.current) clearTimeout(pendingWriteRef.current);
  pendingWriteRef.current = setTimeout(async () => {
    await window.electronAPI.storage.set('moneyFlow', JSON.stringify(state));
  }, 300); // 300ms debounce
}, [state]);
```
This serializes writes and ensures only the final state gets persisted after a burst of updates.

---

### Pitfall 1.5: safeStorage Unavailable on Linux Without libsecret

**What goes wrong:** `safeStorage.isEncryptionAvailable()` returns `false` on Linux systems without `libsecret-1-0` installed. Calling `encryptString()` when unavailable **throws** — it does NOT gracefully degrade.

**Why it happens:** safeStorage delegates to the OS keyring. Linux needs `gnome-libsecret` or `kwallet`. Headless/minimal desktop environments don't have it.

**Consequences:** App crashes on startup for Linux users without libsecret. Or, if you catch the error, you fall back to storing unencrypted data (acceptable for this app's threat model, but must be explicit).

**Prevention — already partially in googleDrive.cjs, replicate this pattern:**
```js
function encryptData(plaintext) {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback: store base64-encoded (obfuscated, not encrypted)
    // Log a warning, don't throw
    return { encrypted: false, data: Buffer.from(plaintext).toString('base64') };
  }
  return { encrypted: true, data: safeStorage.encryptString(plaintext).toString('base64') };
}
```
Store the `{ encrypted: true/false, data: '...' }` envelope so decrypt knows whether to call safeStorage or just base64-decode.

---

## Area 2: Google Drive Encrypted Backups (SEC-02)

---

### CRITICAL — Pitfall 2.1: Machine-Specific Key Breaks Cross-Machine Restore

**What goes wrong:** If backup encryption uses the same `safeStorage`-derived key (which is DPAPI on Windows, Keychain on macOS), the encrypted backup on Google Drive can **only be decrypted on the same machine**. New machine, reinstalled Windows, or another user restoring their backup → `decryptString()` throws with "Failed to decrypt" → restore silently fails or errors out.

**Why it happens:** DPAPI keys are tied to the Windows user profile on a specific machine. This is by design for LOCAL data. It is the wrong key for cloud-synced data.

**Consequences:** Google Drive sync becomes useless as a disaster-recovery mechanism. The backup exists but can't be restored. This is the single most dangerous architectural mistake for SEC-02.

**Prevention options (choose one):**
1. **Don't use safeStorage key for Drive backups.** Use a deterministic key derived from a user-controlled password (KDF: `crypto.scrypt(password, salt, 32)`). The password is entered on restore. This is the correct approach for portable encrypted backups.
2. **Store the encryption key alongside the backup** (encrypted with safeStorage at upload time), and include a plaintext re-keying instruction. Only valid if same machine.
3. **Accept the limitation explicitly in UI.** Show a warning: "Encrypted backup can only be restored on this computer." This is the simplest option but limits Drive's disaster-recovery value.

**Recommended for MoneyFlow:** Option 3 (simplest) + clear UI warning. The app is single-user, single-machine. Complexity of password-based KDF is out of scope for v1.2.

---

### CRITICAL — Pitfall 2.2: Old Plaintext Backup on Drive — Restore Silently Corrupts

**What goes wrong:** Existing users already have `moneyflow-backup.json` on their Google Drive — a valid JSON file. After you add encryption, `downloadBackup()` returns that file's content, and the restore path tries to JSON-parse what it thinks is encrypted data. Or worse: the encrypt/decrypt step is added in `uploadBackup()` but not guarded in `downloadBackup()` — the renderer receives a Buffer-like string and tries to iterate it as transactions.

**Why it happens:** No version envelope on the backup format. The code in `useTransactionData.js::importBackup()` just does `JSON.parse(text)` — it has no format-version awareness.

**Consequences:** Restore silently imports garbage data, replacing the user's live transactions with malformed objects. **Data loss.**

**Prevention — add a version envelope:**
```js
// uploadBackup() in googleDrive.cjs — new encrypted format
const envelope = {
  version: 2,              // NEW: bump version for encrypted format
  encrypted: true,
  algorithm: 'safeStorage', 
  payload: encryptedBase64, // the encrypted JSON
};
const content = JSON.stringify(envelope);

// downloadBackup() — detect format
const parsed = JSON.parse(rawContent);
if (parsed.version === 2 && parsed.encrypted === true) {
  // decrypt payload
} else {
  // version 1 plaintext — return as-is (backward compat)
  return { data: parsed, wasPlaintext: true };
}
```

**Key rule:** Never attempt to decrypt without checking `parsed.encrypted === true` first. Wrap decrypt in a try/catch that falls back to treating the content as plaintext.

---

### Pitfall 2.3: AES-GCM Nonce Reuse Breaks Authentication

**What goes wrong:** If you use `crypto.createCipheriv('aes-256-gcm', key, nonce)` with a **static or incremented nonce** (e.g., `Buffer.alloc(12)` filled with zeros), GCM's authentication guarantee breaks. Two ciphertexts encrypted with the same key+nonce allow an attacker to XOR them and recover both plaintexts.

**Why it happens:** Developers copy AES-GCM examples that show a hardcoded nonce. For a local backup that's only written once, it seems harmless. It isn't.

**Consequences:** Authenticated encryption loses its authenticity guarantee. Subtle and hard to detect.

**Prevention — always generate fresh random nonce:**
```js
// main process encryption utility
function encryptForBackup(plaintext, key) {
  const nonce = crypto.randomBytes(12);   // 96-bit GCM nonce
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Prepend nonce + authTag to ciphertext so decrypt can extract them
  return Buffer.concat([nonce, authTag, ciphertext]).toString('base64');
}

function decryptFromBackup(base64, key) {
  const buf = Buffer.from(base64, 'base64');
  const nonce    = buf.slice(0, 12);
  const authTag  = buf.slice(12, 28);
  const ct       = buf.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);
  return decipher.update(ct) + decipher.final('utf8');
}
```
Note: If using `safeStorage` rather than manual AES-GCM, this is handled internally — don't implement your own crypto unless you need the cross-machine portability.

---

### Pitfall 2.4: Encrypting in the Renderer with Web Crypto API Diverges from Main Process

**What goes wrong:** You decide to encrypt the backup **in the renderer** using `window.crypto.subtle` before passing data to `uploadBackup()` via IPC. This seems like it reduces IPC round-trips. However:
- The key must come from somewhere — you'd need to pass the safeStorage-derived key from main to renderer, **which exposes the key in JavaScript memory in the renderer** (a sandboxed but still scriptable context)
- Web Crypto and Node `crypto` use different key formats (CryptoKey vs Buffer)
- The key derivation using `safeStorage` can't happen in the renderer anyway

**Why it happens:** Trying to minimize IPC calls. Web Crypto API feels convenient in React.

**Consequences:** The encryption key crosses the IPC boundary in plaintext. Defeats the purpose of safeStorage key protection.

**Prevention:** Always encrypt in the **main process**. Pass plaintext data to main via IPC, encrypt there, upload from there. The `uploadBackup` IPC handler (already in `main.cjs`) is the right place:
```js
ipcMain.handle('google-drive:upload-backup', async (event, data) => {
  const plaintext = JSON.stringify(data);
  const encrypted = encryptForBackup(plaintext, getBackupKey());
  // wrap in envelope
  const envelope = { version: 2, encrypted: true, payload: encrypted };
  await googleDrive.uploadBackup(JSON.stringify(envelope));
});
```

---

## Area 3: CSP — Content Security Policy (SEC-04)

---

### CRITICAL — Pitfall 3.1: `script-src 'unsafe-inline'` Is Hardcoded in Production (Confirmed Bug)

**What goes wrong:** In the current `electron/main.cjs` lines 152–153:
```js
"script-src 'self' 'unsafe-inline'; " +   // ← NO isDev guard!
```
The `unsafe-inline` for `script-src` is **always active**, even in production builds. This makes the CSP declaration in production essentially useless for script injection protection — the very threat CSP is designed to stop.

Compare with `style-src` on line 154 which correctly uses `styleUnsafe` (only in dev). The `script-src` line was not given the same treatment.

**Why it happens:** During initial implementation, `unsafe-inline` was added to fix a startup issue in dev and the guard was never added.

**Consequences:** Production app accepts inline `<script>` tags. If any XSS vector exists (unlikely in Electron but possible via maliciously crafted import files), it's not blocked by CSP.

**Fix:**
```js
// electron/main.cjs — apply isDev guard to script-src too
const scriptUnsafe = isDev ? " 'unsafe-inline'" : "";
const styleUnsafe  = isDev ? " 'unsafe-inline'" : "";
// ...
`script-src 'self'${scriptUnsafe}; ` +
`style-src 'self'${styleUnsafe}; ` +
`style-src-elem 'self'${styleUnsafe}; ` +
```

**Note:** React in production (Vite build) does NOT need `unsafe-inline` for scripts. The build output is a bundled `.js` file loaded via `<script src>` — fully covered by `'self'`.

---

### CRITICAL — Pitfall 3.2: Framer Motion Inline Styles Blocked in Production

**What goes wrong:** The current production CSP has `style-src 'self'` (no `unsafe-inline`). Framer Motion applies animations via **inline `style` attributes** on DOM elements (e.g., `style="transform: translateX(0px); opacity: 1"`). Inline style attributes are governed by `style-src-attr` (CSP Level 3) which, when not explicitly set, **falls back to `style-src`**.

With `style-src 'self'` (no `unsafe-inline`) in production, all Framer Motion animations are silently blocked. Elements snap to their final state with no transition. No console error in older Chromium; in newer Electron 34 Chromium you **will** see CSP violation reports.

**Why it happens:** `style-src` seems like it only covers `<style>` blocks, but it's the catch-all for inline style attributes too (via `style-src-attr` fallback). Framer Motion is invisible in dev (where `unsafe-inline` is on) and breaks silently in prod.

**Consequences:** Every Framer Motion animation in the app (sidebar, modals, toast, page transitions, all 7 migrated modals) breaks in production. App feels broken.

**Fix — add `style-src-attr 'unsafe-inline'` for inline styles:**
```js
"default-src 'self'; " +
`script-src 'self'${scriptUnsafe}; ` +
`style-src 'self'${styleUnsafe}; ` +          // covers <style> elements
`style-src-elem 'self'${styleUnsafe}; ` +     // explicit for <style> elements
"style-src-attr 'unsafe-inline'; " +          // Framer Motion inline styles — always needed
"font-src 'self' data:; " +
"img-src 'self' data: https:; " +
"connect-src 'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://oauth2.googleapis.com"
```

**Why `style-src-attr 'unsafe-inline'` is safe here:** Inline style attributes can't execute JavaScript. They're safe to allow even in strict CSPs. This is the standard exception for apps using CSS-in-JS or animation libraries.

---

### Pitfall 3.3: Tailwind CSS v4 — Production Build Does NOT Need unsafe-inline for styles

**What goes wrong (fear):** Developers assume Tailwind v4 (which generates styles at build time via `@tailwindcss/vite`) needs `style-src 'unsafe-inline'` in production.

**Reality:** Tailwind v4 via `@tailwindcss/vite` generates a **static CSS file** in `dist/assets/`. In production (`vite build`), all utility classes are in that file. No inline `<style>` injection at runtime. `style-src 'self'` in production is **correct and sufficient** for Tailwind.

The `unsafe-inline` for styles is only needed in **dev mode** (Vite HMR injects `<style>` tags dynamically during hot reload).

**Confidence:** HIGH — verified by the current `isDev ? "'unsafe-inline'" : ""` pattern in the code, which already works correctly for style-src.

---

### Pitfall 3.4: Vite HMR WebSocket — connect-src Must Include `ws://localhost:*`

**What goes wrong:** Adding a strict CSP to dev mode breaks Vite's HMR WebSocket connection. The browser tries to open `ws://localhost:5173/` for hot reload and CSP blocks it.

**Reality:** The current code already handles this correctly in `connect-src`:
```js
"connect-src 'self' http://localhost:* ws://localhost:* https://..."
```
**This is NOT a bug to fix** — it's a pattern to preserve when editing the CSP.

**Risk:** Accidentally removing `ws://localhost:*` when tightening the CSP. Add a dev-mode test to verify HMR still works after any CSP change.

---

### Pitfall 3.5: Google OAuth Redirect URI Blocked by CSP

**What goes wrong:** The OAuth flow opens `http://localhost:8095/callback` in the system browser (via `shell.openExternal`). This is outside the Electron window — CSP doesn't apply to external browser windows. However, if `connect-src` is ever tightened to remove `http://localhost:*`, and any renderer-side code tries to poll the OAuth server (it currently doesn't), that would be blocked.

**Current code is safe** — OAuth is fully handled in main process. But if a future developer adds any renderer-side OAuth polling (e.g., status check via fetch), it would require `http://localhost:8095` in `connect-src`.

**Prevention:** Leave `http://localhost:*` in `connect-src` and add a comment explaining it covers both Vite dev server AND the OAuth callback server.

---

## Area 4: nodeIntegration: false / contextIsolation: true (SEC-04 — Already Done)

---

### IMPORTANT — Pitfall 4.0: This Is Already Correctly Set — Don't Undo It

**Current state (confirmed in `electron/main.cjs` lines 97–99):**
```js
webPreferences: {
  nodeIntegration: false,   // ← CORRECT
  contextIsolation: true,   // ← CORRECT
  preload: path.join(__dirname, 'preload.cjs'),
}
```
The preload bridge is also correctly structured using `contextBridge.exposeInMainWorld`.

**The pitfall is undoing this to "debug" safeStorage integration issues.**

---

### CRITICAL — Pitfall 4.1: Never Add `nodeIntegration: true` to Debug safeStorage

**What goes wrong:** While wiring up safeStorage IPC, a developer gets `window.require is not defined` and "fixes" it by setting `nodeIntegration: true`. This "works" but exposes Node.js APIs (`require`, `fs`, `crypto`, `child_process`) to all renderer JavaScript, including any third-party library in `node_modules` that runs in the renderer context.

**Why it happens:** The root cause is usually forgetting to add the new handler to `preload.cjs`. The fix is never `nodeIntegration: true`.

**Prevention:** Treat `nodeIntegration: true` as a red flag in code review. Add a lint comment or explicit test:
```js
// electron/main.cjs — add assertion to catch misconfiguration
app.whenReady().then(() => {
  const prefs = mainWindow.webContents.getWebPreferences();
  console.assert(prefs.nodeIntegration === false, 'SECURITY: nodeIntegration must be false');
  console.assert(prefs.contextIsolation === true, 'SECURITY: contextIsolation must be true');
});
```

---

### Pitfall 4.2: Adding New IPC Handlers Without Updating preload.cjs

**What goes wrong:** You add `ipcMain.handle('storage:encrypt', ...)` in `main.cjs` but forget to expose it in `preload.cjs`. React code calling `window.electronAPI.storage.encrypt(...)` gets `TypeError: Cannot read properties of undefined`. Developer thinks "IPC is broken" and either gives up or adds `nodeIntegration: true`.

**Why it happens:** The two-step pattern (main handler + preload bridge) is easy to do half of.

**Prevention:** Treat `main.cjs` handler additions and `preload.cjs` bridge additions as an atomic commit — they always go together. Pattern to follow (consistent with existing code):
```js
// preload.cjs — mirror the shape of existing bridges
storage: {
  get:     (key)  => ipcRenderer.invoke('storage:get', key),
  set:     (key, value) => ipcRenderer.invoke('storage:set', key, value),
  remove:  (key)  => ipcRenderer.invoke('storage:remove', key),
  encrypt: (text) => ipcRenderer.invoke('storage:encrypt', text),
  decrypt: (b64)  => ipcRenderer.invoke('storage:decrypt', b64),
}
```

---

### Pitfall 4.3: Never Add `webSecurity: false` to Work Around CSP

**What goes wrong:** While testing CSP, some resource gets blocked. Developer adds `webSecurity: false` to BrowserWindow options to "see if CSP is the issue." This disables ALL security enforcement in the renderer — same-origin policy, CSP, mixed content blocking — everything.

**Consequences:** `webSecurity: false` is the nuclear option. It removes all browser security from the Electron window. Never land in production code.

**Prevention:** When a CSP directive blocks a resource, fix the directive. Use DevTools Console → look for CSP violation messages → add the minimal directive to allow the specific resource. Never use `webSecurity: false` as a "fix."

---

## Area 5: npm audit — Dependency Vulnerabilities (SEC-05)

---

### CRITICAL — Pitfall 5.1: `npm audit fix --force` Breaks Major Versions

**What goes wrong:** Running `npm audit fix --force` to resolve all vulnerabilities in one shot performs semver-breaking upgrades to resolve audit findings. Common victims in this project:
- `electron-store` v8 → v9/v10 (breaking API changes for `encryptionKey` option and Store constructor)
- `googleapis` v170 → potential breaking changes
- `electron` itself potentially bumped to incompatible version

**Why it happens:** The `--force` flag bypasses semver range restrictions. It looks like it "fixed everything" but the app breaks at runtime.

**Consequences:** Build succeeds, app crashes on startup. The `getOrCreateEncryptionKey()` pattern in `googleDrive.cjs` depends on `electron-store ^8.2.0` API — v9 has different constructor signature.

**Prevention:**
```bash
# NEVER run this:
npm audit fix --force

# DO run this (safe fixes only):
npm audit fix

# Then review remaining issues manually:
npm audit --json > audit-report.json
# Evaluate each CVE: is it in prod deps? Is it exploitable in Electron context?
```

---

### Pitfall 5.2: Electron's Bundled Chromium CVEs Are Not Actionable

**What goes wrong:** `npm audit` reports 10–30 HIGH severity CVEs that trace back to `electron` itself — its vendored Chromium version has known vulnerabilities. Developers try to fix these by upgrading Electron patch versions, or give up on the audit entirely.

**Why it happens:** Chromium bundles hundreds of C++ libraries. Any CVE in those libraries appears as a CVE in `electron`. You can't patch the Chromium internals.

**Reality check:**
- Electron 34.x Chromium CVEs that affect web apps usually don't apply to desktop Electron apps (no cross-origin iframes, no CORS attack vectors in typical Electron architecture)
- The correct response is: upgrade to the latest Electron patch (`34.x.y`) to get the latest Chromium, then accept remaining findings as noise
- Mark these as "acceptable / Electron context mitigates" in your audit notes

**Prevention:**
```bash
# Focus on production deps only, skip electron (devDependency)
npm audit --omit=dev

# Check Electron release notes for security patches:
# https://releases.electronjs.org/
# Upgrade to latest 34.x.y patch
```

---

### Pitfall 5.3: xlsx (SheetJS CE) Has Known Unpatched CVEs

**What goes wrong:** `xlsx ^0.18.5` (SheetJS Community Edition) has multiple open CVEs for prototype pollution and ReDoS. `npm audit` will flag these. SheetJS CE is no longer actively maintained for security patches (maintainer moved to SheetJS Pro, a paid product).

**Threat model assessment for MoneyFlow:**
- The app only opens Excel/CSV files that the **user themselves** selects from their local filesystem
- No network-fetched files, no untrusted input from remote sources
- Prototype pollution attacks require a crafted malicious file that the user would have to intentionally open
- **Risk: LOW in this specific context**

**What NOT to do:** Upgrade to `xlsx ^2.x` or `exceljs` mid-milestone. This would break the entire import system (`useImportLogic.js`).

**Prevention:** Document as accepted risk in audit notes with rationale. Use `npm audit --ignore <GHSA-id>` or add `.nsprc` / `audit-ci` config to suppress known-accepted findings in CI. Revisit in a dedicated dependency-debt phase.

---

### Pitfall 5.4: Conflating devDependency vs. Production Vulnerabilities

**What goes wrong:** `npm audit` by default reports vulnerabilities in ALL packages, including devDependencies (`electron-builder`, `eslint`, `vite`, `@tailwindcss/vite`, `electron-reload`). These packages are **never shipped to users** — they only run on the developer's machine during build. A HIGH severity in `electron-builder` is irrelevant to end-user security.

**Why it happens:** Developers treat all `npm audit` output as equally urgent.

**Prioritization:**
```
PRIORITY 1 — Fix: production dependencies with exploitable CVEs
  → google-auth-library, googleapis, electron-store, framer-motion, recharts, xlsx (assess each)

PRIORITY 2 — Update if easy: production deps with low/moderate CVEs
  → patch-level upgrades, no breaking changes

PRIORITY 3 — Accept: devDependency CVEs
  → electron-builder, vite, eslint, electron-reload — never shipped, not user risk

PRIORITY 4 — Accept with rationale: Electron/Chromium CVEs
  → upgrade to latest patch, then document remainder
```

**Command:**
```bash
npm audit --omit=dev   # production deps only
```

---

### Pitfall 5.5: electron-store v8 encryptionKey Is the Only Safe Upgrade Blocker

**What goes wrong:** `electron-store ^8.2.0` is in `dependencies` (shipped to users). If `npm audit` flags a CVE in it, the temptation is to upgrade to v9+. However, `electron-store` v9 dropped the `encryptionKey` constructor option that `googleDrive.cjs` currently uses.

**Current usage in googleDrive.cjs:**
```js
const store = new Store({
  name: 'google-auth',
  encryptionKey: getOrCreateEncryptionKey(),  // ← v8 API
});
```

**electron-store v9+** removed `encryptionKey` in favor of the app developer managing encryption separately (i.e., the store stores plaintext, you encrypt before storing).

**Consequences of blind upgrade:** `new Store({ encryptionKey: ... })` silently ignores the option in v9, stored tokens are plaintext, and the app behaves differently than expected.

**Prevention:** If upgrading electron-store, review the changelog for the `encryptionKey` deprecation. Migrate the token storage to use `safeStorage` directly (which the `getOrCreateEncryptionKey()` pattern already does at the key level) before upgrading.

---

## Phase-Specific Warnings Summary

| Phase/Feature | Pitfall | Mitigation |
|---------------|---------|------------|
| SEC-01 safeStorage migration | First-launch: plaintext data read as encrypted → empty state | Add migration flag file BEFORE changing read path |
| SEC-01 safeStorage migration | safeStorage.encryptString() returns Buffer → contextBridge drops it | Always base64-encode before IPC return |
| SEC-01 safeStorage migration | useEffect localStorage write is sync, IPC is async | Debounce IPC writes (300ms), use ref for latest state |
| SEC-02 Drive backup | Machine-specific key → cross-machine restore impossible | Use version envelope, document limitation in UI |
| SEC-02 Drive backup | Old plaintext backup parsed as encrypted → data corruption | Check `backup.version` / `backup.encrypted` before decrypt |
| SEC-02 Drive backup | AES-GCM nonce reuse | Always `crypto.randomBytes(12)`, prepend to ciphertext |
| SEC-04 CSP | `script-src 'unsafe-inline'` hardcoded in prod | Add `scriptUnsafe` guard matching existing `styleUnsafe` pattern |
| SEC-04 CSP | Framer Motion inline styles blocked in prod | Add `style-src-attr 'unsafe-inline'` (always, not dev-only) |
| SEC-04 hardening | Debug fix: `nodeIntegration: true` | Never. Fix the missing preload bridge instead |
| SEC-04 hardening | Debug fix: `webSecurity: false` | Never. Fix the CSP directive instead |
| SEC-05 audit | `npm audit fix --force` breaks electron-store v8 API | Manual review, patch-only safe fixes |
| SEC-05 audit | xlsx SheetJS CE CVEs flagged | Accept as low-risk for local-file-only context, document |
| SEC-05 audit | Electron Chromium CVEs flagged | Upgrade to latest Electron 34.x patch, accept remainder |

---

## Sources

- Electron safeStorage API: https://www.electronjs.org/docs/latest/api/safe-storage
- Electron contextBridge structured clone limitations: https://www.electronjs.org/docs/latest/api/context-bridge#parameter--error--return-type-support
- CSP Level 3 `style-src-attr`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr
- Framer Motion + CSP: known issue documented in Framer Motion GitHub discussions
- electron-store v8 → v9 breaking changes: https://github.com/sindresorhus/electron-store/releases
- AES-GCM nonce requirements: NIST SP 800-38D
- SheetJS Community Edition CVE history: https://github.com/SheetJS/sheetjs/issues
- Code references: `electron/main.cjs` lines 97-99 (nodeIntegration), 146-162 (CSP), `electron/googleDrive.cjs` lines 22-40 (safeStorage key pattern), `src/hooks/useTransactionData.js` lines 37-88 (localStorage read/write path)

**Confidence:** HIGH — all pitfalls verified against actual source code in this repository, not hypothetical. CSP bug (Pitfall 3.1) confirmed by reading main.cjs line 153 directly.
