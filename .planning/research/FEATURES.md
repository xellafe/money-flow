# Feature Landscape — Security & Privacy

**Milestone:** v1.2 Security & Privacy
**Domain:** Electron desktop security, local encryption, privacy compliance
**Researched:** 2026-04-19
**App stack:** React 19, Electron 34.5.8, Vite 7, Tailwind CSS v4, IPC bridge with contextIsolation
**Existing infra:** localStorage persistence, Google Drive sync (OAuth2 + upload/download), IPC bridge, SettingsView with section+button pattern, safeStorage already used in googleDrive.cjs for token protection

---

## Codebase State: What Already Exists

Key findings before the feature list — these shape implementation decisions.

### safeStorage — Already Wired in googleDrive.cjs

`safeStorage` is **already in use** in `electron/googleDrive.cjs` to protect OAuth tokens:

```js
function getOrCreateEncryptionKey() {
  try {
    const keyFile = path.join(app.getPath('userData'), '.store-key');
    if (fs.existsSync(keyFile)) {
      return safeStorage.decryptString(fs.readFileSync(keyFile));   // subsequent launches
    }
    const newKey = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyFile, safeStorage.encryptString(newKey), { mode: 0o600 });
    return newKey;   // first launch
  } catch {
    return crypto.randomBytes(32).toString('hex');   // volatile fallback (dev / safeStorage unavailable)
  }
}
```

This is exactly the pattern needed for SEC-01 local encryption. The encryption key derivation, OS keystore binding, and fallback strategy are **already proven in production**. SEC-01 extends this pattern to localStorage, not replaces it.

### CSP — Already Implemented via session API (not meta tag)

CSP is already set in `electron/main.cjs` using `session.defaultSession.webRequest.onHeadersReceived`:

```js
'Content-Security-Policy': [
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +      // ← 'unsafe-inline' present in both dev and prod
  `style-src 'self'${styleUnsafe}; ` +          // ← unsafe-inline only in dev for Tailwind HMR
  "font-src 'self' data:; " +
  "img-src 'self' data: https:; " +
  "connect-src 'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://oauth2.googleapis.com"
]
```

**Active issue:** `script-src 'self' 'unsafe-inline'` is present in **production**. `'unsafe-inline'` in script-src defeats XSS protection entirely. This is the primary CSP hardening target (SEC-04).

### Privacy Policy Files — Already Written

`PRIVACY_POLICY.md` and `PRIVACY_POLICY_IT.md` exist at repo root. SEC-03 is "show these in-app" + "record first-launch consent" — not writing a new policy.

### npm audit — 19 Vulnerabilities

```
direct critical: electron (high, fix = major bump to v41), electron-builder (high, fix available), xlsx (high, NO FIX)
transitive/devOnly: @electron/rebuild, app-builder-lib, axios, tar, lodash, flatted,
                    @xmldom/xmldom, rollup, @isaacs/brace-expansion, minimatch, picomatch,
                    brace-expansion, ajv, qs, dmg-builder, electron-builder-squirrel-windows
```

- `xlsx` (SheetJS) has Prototype Pollution + ReDoS advisories with **no fix available** (maintainer has not patched the npm version)
- `electron` high severity fix requires major bump 34→41 (likely breaking for devDependency tooling)
- Most transitive vulnerabilities are in **build-time devDependencies** (electron-builder chain), not in the distributed app

---

## Table Stakes

Features that MUST exist for v1.2 to be complete. Missing any = milestone not done.

| Feature | Why Table Stakes | Complexity | Depends On |
|---------|-----------------|------------|------------|
| **SEC-01: localStorage encrypted at rest** | Financial data (transactions, categories, credentials) in plaintext localStorage is unacceptable for a personal finance app. Any user with filesystem access can read it. | Medium | safeStorage pattern (already proven in googleDrive.cjs) |
| **SEC-02: Drive backups encrypted before upload** | Backup JSON on Google Drive is plaintext today. Google Drive appData folder is private but not encrypted. Encrypting before upload means the backup is meaningless without the per-installation key. | Medium | SEC-01 key infrastructure |
| **SEC-03: Privacy policy shown on first launch** | App collects nothing, but it uses Google OAuth — GDPR/Italian law requires user awareness before any data leaves the device. The policy is already written; it needs to be surfaced. | Low | SettingsView (already exists), localStorage for "accepted" flag |
| **SEC-04: Remove `unsafe-inline` from script-src** | The single most impactful CSP change. With `unsafe-inline` in script-src, CSP provides zero XSS protection. Even in an Electron app with no external content, this is bad practice. | Low-Medium | main.cjs CSP (already exists, session API) |
| **SEC-05: Fix critical npm audit items** | `electron-builder` high severity has a fix. Auditing and fixing what can be fixed without breaking the app is hygiene. | Low-Medium | npm, package.json |

---

## Feature Deep-Dives

### SEC-01: Transparent Local Encryption (safeStorage)

**How safeStorage derives a key:**
- `safeStorage` does NOT generate the key — it *protects* a key you generate
- The app generates 32 random bytes (`crypto.randomBytes(32).toString('hex')`) on first launch
- `safeStorage.encryptString(key)` wraps that key using the OS keychain (DPAPI on Windows, Keychain on macOS, libsecret/kwallet on Linux)
- The wrapped key is stored on disk at `userData/.store-key` (chmod 600)
- **The actual encryption key never exists on disk in plaintext** — only the safeStorage-wrapped form
- `safeStorage.isEncryptionAvailable()` → `boolean` — must check before use; returns `false` in some headless / CI environments

**First launch:**
1. Check if `userData/.store-key` exists → no
2. Generate 32 random bytes → hex string (64 chars)
3. `safeStorage.encryptString(key)` → OS-protected Buffer
4. Write Buffer to `userData/.store-key` (mode 0o600)
5. Use the key for all encrypt/decrypt operations this session

**Subsequent launches:**
1. Read `userData/.store-key` from disk
2. `safeStorage.decryptString(buffer)` → recover the hex key
3. Use the key — user sees nothing, fully transparent

**safeStorage unavailable (dev / Linux without keyring):**
- `safeStorage.isEncryptionAvailable()` → `false`
- Fallback: `crypto.randomBytes(32).toString('hex')` — volatile key in memory
- Data is encrypted/decrypted within the session, but key is lost on close
- On next launch: new volatile key → cannot decrypt previous session's data
- **This is already the behavior in googleDrive.cjs** — auth tokens are lost on close in this scenario, which is acceptable
- For localStorage: same fallback means data is effectively unencrypted across sessions in the volatile path — must be documented, not cause a crash

**IPC architecture — two options:**

*Option A (simpler): Encrypt/decrypt at the IPC boundary*
- Renderer keeps localStorage as-is (plaintext strings)
- New IPC handlers: `storage:encrypt(plaintext)` → ciphertext, `storage:decrypt(ciphertext)` → plaintext
- Renderer calls these before writing to / after reading from localStorage
- Main process holds the key — renderer never sees it

*Option B (more secure): Route all I/O through IPC*
- localStorage calls replaced by IPC calls `storage:write(key, value)` / `storage:read(key)`
- Main process holds key AND storage — renderer gets/sets via IPC
- More invasive (touches all 6 hooks), but renderer never handles plaintext on disk

**Recommendation: Option A** — much less invasive, still achieves the goal (data encrypted at rest), and fits the existing pattern.

---

### SEC-02: Encrypted Drive Backups

**Encrypt-before-upload flow:**
```
Renderer: sendBackupDataForClose(allData)         ← existing IPC, no change
    ↓
main.cjs: ipcMain.on('backup-data-for-close')
    │   plaintext = JSON.stringify(allData)
    │   key = getOrCreateEncryptionKey()           ← same function, same key as SEC-01
    │   { iv, authTag, ciphertext } = aes256gcm.encrypt(plaintext, key)
    │   wrappedData = { encrypted: true, iv, authTag, ciphertext }
    └── googleDrive.uploadBackup(wrappedData)      ← googleDrive.cjs: unchanged API
```

**Decrypt-after-download flow:**
```
ipcMain.handle('google-drive:download-backup')
    │   result = await googleDrive.downloadBackup()
    │   if (!result.encrypted) return { success: true, data: result }  // legacy unencrypted
    │   key = getOrCreateEncryptionKey()
    │   plaintext = aes256gcm.decrypt(result, key)
    └── return { success: true, data: JSON.parse(plaintext) }
```

**Is it the same key as SEC-01?** Yes. `getOrCreateEncryptionKey()` in googleDrive.cjs is already a shared per-installation key. Reusing it means:
- Single key to manage (no second `.store-key` file)
- **Known trade-off:** If user reinstalls the app, `userData` is wiped, key is lost, Drive backup is unrecoverable without the old key. This is the expected behavior for transparent (no-password) encryption — document it, don't try to work around it.

**Algorithm:** AES-256-GCM using Node.js built-in `crypto`. No new npm dependency. IV must be unique per encryption (16 bytes random). AuthTag (16 bytes) validates integrity. Store as `{ iv: hex, authTag: hex, ciphertext: hex }` JSON.

**Backwards compatibility:** Legacy Drive backups (uploaded before v1.2) are plain JSON. The download handler checks for `result.encrypted === true` flag. If absent, parse directly (raw JSON). This ensures restoring an old backup after upgrading to v1.2 works.

---

### SEC-03: Privacy Policy In-App

**Standard pattern for Electron personal finance apps (observed pattern across apps like GnuCash, MoneyMoney, Copilot):**
1. **First launch blocking modal** — cannot be dismissed without explicit "Ho letto e accetto" click
2. **Settings section** — "Visualizza Privacy Policy" button → reopens the policy (non-blocking this time, with X close)

**State persistence:**
- `localStorage.setItem('privacyPolicyAccepted', 'true')` — simple, renderer-accessible, survives restarts
- Checked on app mount: if absent → show blocking modal before any other interaction
- Once written → never shown again (unless user clears localStorage / reinstalls)
- The "accepted" flag is NOT sensitive data and does not need encryption

**First launch modal requirements:**
- **No X close button** — user must click "Accetto" or "Accetta"
- **No backdrop click dismiss** (Radix Dialog `onPointerDownOutside` + `onEscapeKeyDown` → prevent default)
- Scrollable policy text inside the modal (policy is ~1-2 pages)
- Single primary CTA: "Ho letto e accetto" → writes flag, closes modal

**Settings section:**
- Add "Privacy" section to SettingsView (same `<section>` + uppercase `<h3>` + button pattern)
- Button: "Visualizza Privacy Policy" → opens same modal (non-blocking, with X this time)
- Optional: show "Accettata il {date}" below button

**Rendering the policy text without a markdown parser:**
- `PRIVACY_POLICY_IT.md` → bundle as a JS string constant (`privacy-policy-it.js`)
- Render in `<pre className="whitespace-pre-wrap text-sm">` inside a `<ScrollArea>` — no markdown parser needed
- OR: simple manual HTML version with `<h3>` / `<p>` / `<ul>` — copy-paste from .md (one-time effort)
- **Recommendation:** Bundle as pre-formatted string, render in `<pre>`. Zero dependency, works fine for a legal text.

---

### SEC-04: Electron Security Hardening (CSP)

**Session API vs meta tag — which to use:**
- `session.defaultSession.webRequest.onHeadersReceived` (already in use) is the **correct Electron approach**
- It intercepts at the network layer, covers `file://` protocol requests, applies to all BrowserWindow instances
- A `<meta http-equiv="CSP">` tag in index.html also works for renderer content but is weaker (doesn't cover navigation-level requests, doesn't apply to `file://` in all Electron versions)
- **Keep using session API** — it's already there and correct

**Removing `'unsafe-inline'` from `script-src`:**

Current (prod): `script-src 'self' 'unsafe-inline'`  → what we have
Target (prod):  `script-src 'self'`                   → what we want

**What breaks?**
- Vite in dev: uses inline scripts for HMR → keep `'unsafe-inline'` in dev (already done for style-src, same pattern)
- Vite in prod: bundles all JS into `dist/assets/index-HASH.js` — no inline scripts in the output HTML
- React 19: no inline scripts
- Framer Motion, Recharts, Radix Dialog: no eval or inline scripts (pure JS libraries)
- **Verdict: safe to remove in prod** — must verify by inspecting `dist/index.html` after `npm run build`

**Recommended production CSP:**
```
default-src 'self';
script-src 'self';                          // removed 'unsafe-inline'
style-src 'self';                           // already strict in prod
style-src-elem 'self';                      // already strict in prod
font-src 'self' data:;
img-src 'self' data: https:;
connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com;
                                            // removed http://localhost:* ws://localhost:* (prod only)
```

**What's already correct (no changes needed):**
- `nodeIntegration: false` ✓ (already set in createWindow)
- `contextIsolation: true` ✓ (already set in createWindow)
- `sandbox` is not explicitly set but contextIsolation provides equivalent protection for IPC

---

### SEC-05: Dependency Audit

**What "critical" means for a local desktop app:**
- npm `critical` severity = CVSS ≥ 9.0 — typically RCE, privilege escalation, arbitrary file write
- npm `high` severity = CVSS 7.0–8.9
- For MoneyFlow (no server, no network listener, no external content): exploitability requires a malicious file to be imported by the user — the attack surface is narrow
- devDependency vulnerabilities (build chain) are **not shipped** in the distributed app — they are zero user risk

**Audit action plan:**

| Package | Severity | Direct? | Shipped? | Action |
|---------|----------|---------|---------|--------|
| `electron-builder` | high | YES | NO (devDep) | `npm audit fix` |
| `electron` | high | YES | YES | Assess v34→v41 carefully; likely defer (7 major versions) |
| `xlsx` | high | YES | YES | No fix available; mitigate via input validation; document |
| All `electron-builder` transitive | high | NO | NO (devDep build chain) | Auto-fixed by fixing electron-builder |
| `rollup` | high | NO | NO (Vite devDep) | `npm audit fix` |
| `ajv`, `qs` | moderate/low | NO | NO | `npm audit fix` |

**Handling false positives / devOnly packages:**
- Standard practice: `npm audit fix` fixes what it can without breaking changes
- Report what remains as "accepted risk" in an `AUDIT.md` or inline in PITFALLS
- The key distinction: does the vulnerable package end up in the distributed Electron app? If NO (devDep), it's a build-time risk that affects CI, not users

**xlsx mitigation (no npm fix available):**
- Advisory: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9)
- Prototype Pollution: xlsx parses attacker-controlled cells into JS objects — mitigated by parsing only files the user explicitly selects and owns; `Object.freeze(Object.prototype)` at startup as defense-in-depth
- ReDoS: triggered by malformed regex-triggering cell values — MoneyFlow's import logic should validate that cell values are reasonable before processing
- Monitor: https://github.com/SheetJS/sheetjs — if npm release ever patches, upgrade

---

## Differentiators

Nice-to-have polish beyond the 5 required features.

| Feature | Value Proposition | Complexity | Recommendation |
|---------|-------------------|------------|----------------|
| **"Dati cifrati" badge in Settings** | "Dati locali cifrati ✓ (AES-256-GCM)" — reassures user | Low | **Include** — one status line in Settings "Sicurezza" section. Zero extra code beyond SEC-01 completion. |
| **Backup encryption indicator in SyncSettings** | "Backup cifrato prima dell'upload ✓" | Low | **Include** — single line/badge in the existing SyncSettings modal |
| **safeStorage availability indicator** | Show if safeStorage is active or volatile key in use | Low | **Optional** — useful for support/debugging, but confusing for non-technical users |
| **Key rotation warning on reinstall** | "Attenzione: i backup precedenti non saranno recuperabili" on fresh install | Medium | **Defer** — edge case, detecting reinstall vs first-install is non-trivial |
| **Export unencrypted copy** | "Esporta dati non cifrati (JSON)" for migration/portability | Medium | **Defer** — useful but out of scope for v1.2 |

---

## Anti-Features

Patterns to explicitly avoid for v1.2.

| Anti-Feature | Why Avoid | Instead |
|--------------|-----------|---------|
| **User-chosen password for encryption** | UX friction for a single-user app; password recovery is a nightmare; safeStorage-derived key is strictly better | safeStorage per-installation key — zero friction |
| **Cloud key storage / key escrow** | Sends key off-device, defeats the purpose, adds infrastructure | Key stays in OS keychain, never leaves device |
| **Different key for Drive backups vs local data** | Two keys = two key files = extra complexity with no benefit | Same `getOrCreateEncryptionKey()` for both |
| **Blocking app on encryption failure** | If safeStorage unavailable (rare Linux scenario), app must degrade gracefully | Log warning, use volatile key, continue — same as existing googleDrive.cjs behavior |
| **Privacy modal that requires network** | If modal content loads from a URL and network is offline, user is locked out | Bundle policy as local string constant — never requires network |
| **Re-showing privacy modal on every launch** | Once accepted is once accepted | Check `privacyPolicyAccepted` flag; show only on true first launch |
| **Removing `'unsafe-inline'` in dev mode** | Breaks Vite HMR (uses inline scripts) | Remove only in prod; keep in dev with `isDev` guard (matches existing style-src pattern) |
| **`npm audit fix --force`** | Applies breaking major-version bumps blindly; will break electron-builder toolchain | `npm audit fix` only (non-breaking); assess major bumps manually |
| **Replacing xlsx to fix the SheetJS advisory** | No drop-in replacement exists with equivalent Italian bank format support | Accept the advisory, mitigate with input sanitization, document as known risk |

---

## Feature Dependency Graph

```
SEC-05: npm audit fix (independent, no blockers)
    └── Run first — clean slate before adding code

SEC-04: CSP hardening (independent of crypto)
    └── Requires: npm run build + inspect dist/index.html
    └── Edit: electron/main.cjs script-src directive

SEC-03: Privacy policy in-app (independent of crypto)
    └── New: PrivacyPolicyModal component (or extend ModalShell)
    └── Modify: SettingsView.jsx — add "Privacy" section
    └── Modify: App.jsx — check flag on mount, conditionally show modal
    └── State: localStorage.privacyPolicyAccepted flag

SEC-01: Local encryption
    └── Builds on: getOrCreateEncryptionKey() (already in googleDrive.cjs)
    └── New: aes256gcm.cjs utility (Node crypto, no new deps)
    └── New: IPC handlers storage:encrypt / storage:decrypt
    └── Modify: renderer hooks — wrap localStorage writes with IPC encrypt call

SEC-02: Encrypted Drive backups
    └── Requires: SEC-01 (same key, same AES utility)
    └── Modify: googleDrive.cjs uploadBackup — encrypt payload
    └── Modify: main.cjs download handler — decrypt payload
    └── Backwards-compat: detect encrypted flag, fallback for legacy backups
```

**Recommended phase order: SEC-05 → SEC-04 → SEC-03 → SEC-01 → SEC-02**

Rationale: Low-risk / independent items first (audit, CSP, policy). High-impact crypto last, building on the key infrastructure already proven in googleDrive.cjs. SEC-02 strictly depends on SEC-01.

---

## Complexity Summary

| Feature | Complexity | Key Risks | Estimated Scope |
|---------|------------|-----------|-----------------|
| SEC-01 Local encryption | **High** | Touches all hooks that read/write localStorage; decrypt-on-read path must handle legacy unencrypted data; volatile key fallback edge case | ~150 lines (utility + IPC + hook updates) |
| SEC-02 Encrypted Drive backup | **Medium** | Backwards compatibility with legacy unencrypted backups; key-loss-on-reinstall scenario to document | ~60 lines (googleDrive.cjs + main.cjs handler) |
| SEC-03 Privacy policy in-app | **Low** | Rendering policy without a markdown dep; non-dismissible modal UX | ~80 lines (new modal component + SettingsView section) |
| SEC-04 CSP hardening | **Low** | Must verify no inline scripts in prod build before removing `'unsafe-inline'` | ~5 lines in main.cjs |
| SEC-05 Dependency audit | **Low** | `electron` major bump risk; `xlsx` no-fix situation | npm commands + doc update |
| **Total** | **Medium-High** | SEC-01 is the most invasive change | **~300 lines net new** |

---

## Sources

- Electron `safeStorage` API (HIGH — official docs): https://www.electronjs.org/docs/latest/api/safe-storage
- safeStorage already in codebase (HIGH — direct observation): `electron/googleDrive.cjs` lines 7, 22–34
- Existing CSP implementation (HIGH — direct observation): `electron/main.cjs` lines 144–162
- `nodeIntegration: false`, `contextIsolation: true` (HIGH — direct observation): `electron/main.cjs` lines 97–98
- Privacy policy content (HIGH — direct observation): `PRIVACY_POLICY_IT.md` at repo root
- npm audit output (HIGH — run 2026-04-19): 19 vulnerabilities across 3 direct + 16 transitive
- xlsx advisory GHSA-4r6h-8v6p-xvw6 (HIGH — GitHub Advisory Database): https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
- npm audit severity scale (HIGH — official): https://docs.npmjs.com/about-audit-reports
- AES-256-GCM in Node.js crypto (HIGH — Node.js official): built-in module, no new dependency
- Electron security checklist (HIGH — official): https://www.electronjs.org/docs/latest/tutorial/security
- SettingsView section+button pattern (HIGH — direct observation): `src/views/SettingsView.jsx`

