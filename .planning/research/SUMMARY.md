# Project Research Summary

**Project:** MoneyFlow v1.2 — Security & Privacy Milestone
**Domain:** Electron desktop app security — safeStorage encryption, CSP hardening, privacy compliance
**Researched:** 2026-06-10 (STACK) · 2026-04-19 (FEATURES) · 2026-04-03 (ARCHITECTURE) · 2026-04-10 (PITFALLS)
**Confidence:** HIGH — all findings verified against live codebase, live npm audit, and Electron runtime tests

---

## Executive Summary

MoneyFlow v1.2 is a security & privacy hardening milestone for an already-shipped Electron 34 + React 19 desktop personal finance app. The central finding across all four research threads is that **approximately 80% of the required infrastructure already exists in production code**: `safeStorage` is live in `electron/googleDrive.cjs` (protects OAuth tokens), the CSP is already implemented via `session.webRequest.onHeadersReceived`, `nodeIntegration: false` and `contextIsolation: true` are already correctly set, and the IPC bridge pattern is already proven. This milestone is primarily an **extension and hardening of existing patterns**, not a greenfield security implementation. Risk is significantly lower than it would appear from the feature list alone.

The recommended approach is to build in five distinct phases ordered by risk and dependency: begin with the zero-code-risk dependency audit (SEC-05), then fix the confirmed 1-line CSP production bug (SEC-04), then add the pure-React privacy policy UI (SEC-03), then implement the most complex change — migrating localStorage to encrypted electron-store (SEC-01) — and finally wrap Drive backups in AES-256-GCM using the same key (SEC-02). This ordering means every early phase ships independent value without blocking on the riskiest change. **Zero new npm packages are required for any phase.**

The primary risks are: (1) the first-launch data migration in SEC-01, where a missing atomic flag will cause users to see an empty transaction list after updating — this must be solved with a migration flag file before any read-path changes; (2) the machine-specific DPAPI key for Drive backups means encrypted backups cannot be restored on a different machine — this is acceptable for v1.2 but requires explicit user-facing warnings; and (3) `npm audit fix --force` would silently break the `electron-store` v8 `encryptionKey` API used in production — the rule is `npm audit fix` only, never `--force`.

---

## Key Findings

### Recommended Stack

No new dependencies. All cryptographic capabilities are available as Electron/Node.js built-ins. This is a hard constraint that all four researchers independently confirmed.

**Core technologies (all already in `package.json` or Electron built-ins):**

| Capability | Source | Role |
|-----------|--------|------|
| `electron.safeStorage` | Electron 34 built-in | OS-backed key protection (DPAPI/Keychain/libsecret) — protects the AES key, NOT the data directly |
| `node:crypto` AES-256-GCM | Node.js built-in | Data encryption at rest (local store + Drive backup) — authenticated encryption with tamper detection |
| `electron-store` v8.2.0 | Already in `dependencies` | Encrypted app data store (replaces raw localStorage) — SEC-01 persistence layer |
| `session.webRequest.onHeadersReceived` | Electron built-in (already in use) | CSP delivery mechanism — already implemented, just needs 1-line fix |
| Radix Dialog + Tailwind CSS v4 | Already in `dependencies` | Privacy policy modal UI — no new UI library needed |

**Critical version constraint:** `electron-store` must stay on v8.x. v9 dropped the `encryptionKey` constructor option currently used in `googleDrive.cjs`. `npm audit fix --force` would blindly upgrade this. Never use `--force`.

**Explicitly rejected packages:** `keytar` (superseded by safeStorage), `node-forge` (deprecated), `tweetnacl`/`libsodium-wrappers` (overkill), `crypto-js` (browser-only), `helmet` (Express middleware, wrong context).

---

### Expected Features

**Must have — table stakes (all 5 are mandatory for milestone completion):**

| Feature | Complexity | Key Insight |
|---------|------------|-------------|
| **SEC-01:** Local data encrypted at rest | HIGH | Most invasive change — touches 2 hooks + App.jsx + adds new main process module. ~150 lines net new. |
| **SEC-02:** Drive backups encrypted before upload | MEDIUM | Depends on SEC-01 key infrastructure. Backward-compat required for pre-v1.2 plaintext backups. ~60 lines. |
| **SEC-03:** Privacy policy on first launch | LOW | Policy text already written (`PRIVACY_POLICY_IT.md`). New modal + Settings section. ~80 lines. |
| **SEC-04:** Remove `script-src 'unsafe-inline'` from production CSP | LOW | **Confirmed production bug.** Fix is 1 line in `main.cjs`. Must also add `style-src-attr 'unsafe-inline'` for Framer Motion. |
| **SEC-05:** npm audit fix (non-breaking) | LOW | `npm audit fix` (no `--force`). Resolves ~11 of 19 vulns. xlsx and electron deferred with documented rationale. |

**Total estimated scope:** ~300 lines net new across all 5 features.

**Should have — differentiators (include in scope):**
- "Dati cifrati ✓ (AES-256-GCM)" badge in Settings → low-effort trust signal, zero extra code beyond SEC-01 completion
- Backup encryption indicator in SyncSettings modal → single status line

**Defer to v2+:**
- User-chosen password for encryption (safeStorage-derived key is strictly better for single-user app)
- Cross-device restore mechanism (requires password-based KDF, out of v1.2 scope)
- Export unencrypted JSON copy (useful but out of scope)
- xlsx → exceljs replacement (no drop-in with Italian bank format support)
- Electron 34 → 41 upgrade (3 major versions, dedicated v1.3 milestone)

**Anti-features (explicitly avoid):**
- `npm audit fix --force` — breaks electron-store v8 API
- `nodeIntegration: true` as a debug workaround — never acceptable
- `webSecurity: false` as a CSP debug workaround — never acceptable
- Encrypting in the renderer using Web Crypto — exposes the safeStorage key to the renderer process
- Privacy modal that loads content from a network URL — must be bundled locally

---

### Architecture Approach

The architecture follows a strict **main-process-owns-all-crypto** principle. `safeStorage` is a main-process-only API; the encryption key must never cross the IPC boundary to the renderer. A new shared module `electron/storage.cjs` centralizes key management and AES-256-GCM operations, and is `require()`d by both `main.cjs` (for local data IPC handlers) and `googleDrive.cjs` (for Drive backup encryption). The renderer accesses storage exclusively through three new async IPC channels (`storage:get`, `storage:set`, `storage:delete`) exposed via `preload.cjs`. A renderer-side `src/utils/storage.js` wrapper provides a clean API with an automatic `localStorage` fallback for dev/test environments without Electron context.

**Major components — new or significantly modified:**

| Component | Type | Role | Phase |
|-----------|------|------|-------|
| `electron/storage.cjs` | New main-process module | Shared encryption key + electron-store + AES-256-GCM Drive crypto | SEC-01/02 |
| `src/utils/storage.js` | New renderer utility | Async IPC wrapper with localStorage fallback | SEC-01 |
| `src/components/PrivacyPolicyModal.jsx` | New React component | Non-dismissable first-run consent modal | SEC-03 |
| `src/components/PrivacyPolicySection.jsx` | New React component | Privacy policy in Settings view | SEC-03 |
| `electron/main.cjs` | Modified | CSP fix (1 line + 2 new directives); 3 new IPC handlers (15 lines) | SEC-04 + SEC-01 |
| `electron/preload.cjs` | Modified | Add `storage` bridge (5 lines) | SEC-01 |
| `electron/googleDrive.cjs` | Modified | Remove duplicate key fn; encrypt in `uploadBackup`; decrypt in `downloadBackup` | SEC-01/02 |
| `src/App.jsx` | Modified | Async storage init + `isStorageLoaded` gate; privacy consent check; pass `initialAppData` to hooks | SEC-01 + SEC-03 |
| `src/hooks/useTransactionData.js` | Modified | Remove `useState` lazy localStorage reads; accept `initialAppData` prop; update save/clear/import | SEC-01 |
| `src/hooks/useCategories.js` | Modified | Remove `useState` lazy localStorage reads; accept `initialAppData` prop | SEC-01 |

**Key architectural patterns:**
- **Single shared encryption key**: `getOrCreateEncryptionKey()` extracted from `googleDrive.cjs` into `storage.cjs` — one DPAPI-protected 32-byte key for both local store and Drive backups
- **Lazy store initialization**: `getStore()` uses `if (!appStore)` guard — `app.getPath()` can only be called after `app.ready()`; never call at module require-time
- **`isStorageLoaded` gate**: prevents the save `useEffect` from firing with empty state before initial async load completes — single most important correctness invariant in SEC-01
- **Backward-compatible Drive format**: download handler checks `parsed.v === 1 && parsed.iv` before attempting decrypt; falls back to treating as legacy plaintext for pre-v1.2 backups

---

### Critical Pitfalls

All pitfalls verified against actual source code, not hypothetical. Severity ratings reflect impact to real user data.

**TOP 5 — must read before implementing:**

1. **First-launch migration race (SEC-01) — DATA LOSS risk**
   On first launch after the v1.2 update, the encrypted store doesn't exist yet. `storageGet('moneyFlow')` returns `null`. Without a migration path, the app boots with an empty transaction list even though data exists in the old plaintext `localStorage`. **Prevention:** In `App.jsx loadAppData()`, after getting `null` from the encrypted store, check `localStorage.getItem('moneyFlow')`, migrate the data atomically (`storageSet` → `localStorage.removeItem`), then mark with a `.storage-migrated-v1` flag file. Never delete plaintext data until round-trip decrypt is verified.

2. **Machine-specific DPAPI key breaks cross-device restore (SEC-02) — SILENT FAILURE risk**
   The safeStorage-derived key is DPAPI-bound to the current Windows user profile on the current machine. A Drive backup encrypted with this key cannot be decrypted on a new machine or after OS reinstall. **Prevention for v1.2:** Accept this limitation. Add explicit UI warning: *"I backup cifrati possono essere ripristinati solo su questo computer."* Add version envelope detection in `downloadBackup()` for pre-v1.2 plaintext backups. Document as known limitation in release notes.

3. **`npm audit fix --force` silently breaks electron-store v8 (SEC-05) — BREAKAGE risk**
   Running `--force` blindly upgrades `electron-store` v8 → v9+. The `encryptionKey` constructor option (currently used in `googleDrive.cjs`) was removed in v9. The app continues to build but tokens are no longer encrypted. **Prevention:** `npm audit fix` only, never `--force`. Accept the electron and xlsx audit findings with documented rationale.

4. **`safeStorage.encryptString()` returns a Buffer — contextBridge drops it (SEC-01) — SILENT DATA LOSS**
   `contextBridge.exposeInMainWorld` uses structured clone, which cannot serialize Node.js `Buffer` objects — they arrive as `{}` or `null` in the renderer. **Prevention:** Always `.toString('base64')` before returning any `safeStorage` result through IPC. Always `Buffer.from(base64, 'base64')` before calling `safeStorage.decryptString()`.

5. **Framer Motion inline styles blocked by CSP (SEC-04) — VISUAL BREAKAGE in prod**
   `style-src 'self'` (no `unsafe-inline`) blocks Framer Motion's inline `style=""` attributes in production. Every animation snaps to final state. This is invisible in dev (where `unsafe-inline` is active for styles). **Prevention:** Add `"style-src-attr 'unsafe-inline'; "` as a permanent directive (not dev-only). Inline style attributes cannot execute JavaScript — this is safe.

**Additional important pitfalls:**
- **AES-GCM nonce reuse (SEC-02):** Always `crypto.randomBytes(12)` for the IV. Never hardcode or increment. Nonce reuse breaks GCM authentication guarantee.
- **`useEffect` write path is sync; IPC is async (SEC-01):** Debounce IPC writes with 300ms and a `useRef` for latest state to prevent data races on rapid state changes.
- **`nodeIntegration: true` as debug workaround (SEC-04):** The actual bug is always a missing `preload.cjs` bridge entry. Fix: add the IPC handler to preload, never enable `nodeIntegration`.
- **`getOrCreateEncryptionKey()` called before `app.ready()` (SEC-01):** `safeStorage` requires post-ready. Wrap store initialization in a lazy getter (`getStore()`) — never call `new Store({ encryptionKey: ... })` at module scope in `googleDrive.cjs`.
- **Encrypting in the renderer (SEC-01/02):** Routing crypto through `window.crypto.subtle` exposes the key in renderer memory. All encrypt/decrypt must happen in the main process.

---

## Implications for Roadmap

All four research files independently arrived at the same phase order. This is strong consensus.

**Suggested phase structure: 5 phases, ordered SEC-05 → SEC-04 → SEC-03 → SEC-01 → SEC-02**

---

### Phase 1 (SEC-05): Dependency Audit — Clean Baseline
**Rationale:** Zero code-change risk. Establishes a known-clean dependency state before adding any new code. The one dangerous action (`npm audit fix --force`) is well-defined and must be avoided.
**Delivers:** Resolved ~11/19 npm audit vulnerabilities. Documented acceptance rationale for `xlsx` (no upstream fix, local-file-only low risk) and `electron` (defer to v1.3 upgrade milestone).
**Actions:** `npm audit fix` (safe only), write audit acceptance rationale in docs.
**Pitfalls to avoid:** Never `--force`. Never upgrade electron-store beyond v8.x.
**Needs deep research phase:** ❌ No — well-understood, npm is the only tool.

---

### Phase 2 (SEC-04): CSP Hardening — 1-Line Production Bug Fix
**Rationale:** Confirmed production bug. Fix is 1 line. Ships immediate security improvement with zero risk to data or user flows. No dependency on crypto infrastructure.
**Delivers:** `script-src` removes `'unsafe-inline'` in production (matches existing `styleUnsafe` pattern). Adds `object-src 'none'` and `base-uri 'self'`. Adds `style-src-attr 'unsafe-inline'` to preserve Framer Motion animations.
**Actions:** Edit `electron/main.cjs` line 153. Verify with `npm run build` + DevTools CSP check.
**Pitfalls to avoid:** Must verify `dist/index.html` has no inline scripts before shipping. Must preserve `ws://localhost:*` in `connect-src` (Vite HMR). Must add `style-src-attr 'unsafe-inline'` or Framer Motion breaks silently in prod.
**Needs deep research phase:** ❌ No — CSP directives well-documented; bug location confirmed.

---

### Phase 3 (SEC-03): Privacy Policy In-App
**Rationale:** Pure React UI work. Zero IPC or crypto dependency. The consent flag intentionally lives in plain `localStorage` (not sensitive data) — does not block on or depend on the SEC-01 encrypted store.
**Delivers:** First-launch non-dismissable consent modal (Radix Dialog). Settings → Privacy section. Policy text bundled as local string constant from `PRIVACY_POLICY_IT.md`.
**Actions:** New `PrivacyPolicyModal.jsx`, new `PrivacyPolicySection.jsx`, modify `App.jsx` (consent check), modify `SettingsView.jsx` (new section).
**Pitfalls to avoid:** Modal must NOT be dismissable via Escape or backdrop click. Policy must NOT load from network. Do NOT store consent flag in encrypted store (chicken-and-egg init problem).
**Needs deep research phase:** ❌ No — established pattern, all components exist.

---

### Phase 4 (SEC-01): Local Encryption — safeStorage Migration
**Rationale:** Highest-complexity phase. Extends the proven `getOrCreateEncryptionKey()` pattern from `googleDrive.cjs` to all app data. Build in strict internal order: `storage.cjs` → IPC handlers + preload → `src/utils/storage.js` → App.jsx init → hook migrations.
**Delivers:** All `localStorage('moneyFlow')` data encrypted with AES-256-GCM using DPAPI-backed key. Transparent to user. One-time data migration on first launch. Hooks refactored to accept `initialAppData` prop.
**Actions:** New `electron/storage.cjs`, new `src/utils/storage.js`, extend `preload.cjs` (5 lines), modify `main.cjs` (3 IPC handlers), refactor `useTransactionData.js` and `useCategories.js`, add async storage init in `App.jsx`.
**Pitfalls to avoid:** Migration atomic flag file required before changing read path. `isStorageLoaded` guard must be first condition in save `useEffect`. Lazy `getStore()` init — no `new Store()` at module scope. Always base64-encode Buffer results before IPC return.
**Needs deep research phase:** ❌ No — architecture fully specified. Needs integration tests.

---

### Phase 5 (SEC-02): Encrypted Drive Backups
**Rationale:** Reuses same `getOrCreateEncryptionKey()` and AES-256-GCM from `storage.cjs`. Requires only Phase 4a (`storage.cjs` export) to exist. Backward compatibility with pre-v1.2 Drive backups is a hard requirement.
**Delivers:** `uploadBackup()` wraps data in AES-256-GCM envelope `{ v:1, iv, tag, data }` before upload. `downloadBackup()` detects encrypted vs. legacy format and decrypts transparently. UI warning about machine-specific key.
**Actions:** Modify `googleDrive.cjs` (remove duplicate key fn, add encrypt, add format-aware decrypt). Add encryption badge in SyncSettings.
**Pitfalls to avoid:** Check `parsed.v === 1 && parsed.iv` before decrypt — never attempt on unknown content. Always `crypto.randomBytes(12)` for GCM IV. Surface machine-specific key limitation clearly in UI. Test all 3 backup states: no backup, pre-v1.2 plaintext, v1.2 encrypted.
**Needs deep research phase:** ❌ No — architecture specified. Integration tests required.

---

### Phase Ordering Rationale Summary

```
SEC-05 first  → zero code risk, clean baseline before writing new code
SEC-04 second → confirmed 1-line prod bug, ships fast, no crypto dependency
SEC-03 third  → pure UI, no crypto dependency, consent flag uses plain localStorage intentionally
SEC-01 fourth → most invasive, builds on proven safeStorage pattern from googleDrive.cjs
SEC-02 last   → depends on storage.cjs from SEC-01; backward-compat testing requires SEC-01 stable
```

All 4 researchers converged on this exact order independently.

### Research Flags

| Phase | Research Needed? | Reason |
|-------|-----------------|--------|
| Phase 1 (SEC-05) | ❌ No | npm audit workflow well-understood |
| Phase 2 (SEC-04) | ❌ No | CSP bug confirmed and fix documented |
| Phase 3 (SEC-03) | ❌ No | Standard Radix Dialog + localStorage pattern |
| Phase 4 (SEC-01) | ❌ No | Architecture fully specified; existing pattern proven in prod |
| Phase 5 (SEC-02) | ❌ No | Architecture fully specified; depends only on Phase 4 module |

No phase requires `/gsd-research-phase` — research is complete for all five. Implementation needs **integration testing**, not more research.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Verified live: `typeof safeStorage.encryptString === 'function'` confirmed in Electron 34.5.8. AES-256-GCM encrypt/decrypt confirmed in project runtime. `npm audit` run live on 2026-06-10. |
| Features | **HIGH** | All 5 features sourced from direct codebase inspection. Privacy policy files confirmed at repo root. CSP bug confirmed by reading `main.cjs` line 153 directly. |
| Architecture | **HIGH** | Based on direct inspection of all 5 target files. Component boundaries, IPC patterns, and data flow verified against actual code. Pre-existing latent bug (module-scope key init) identified and fix documented. |
| Pitfalls | **HIGH** | All critical pitfalls verified against actual code, not hypothetical. safeStorage Buffer serialization issue confirmed against Electron contextBridge docs. Migration race condition confirmed against existing hook code. |

**Overall confidence: HIGH**

### Gaps to Address During Implementation

1. **Framer Motion CSP in production build**: `style-src-attr 'unsafe-inline'` fix is documented, but verify by running `npm run build && electron .` and checking animations still render. Risk is known, not a research gap.

2. **googleDrive.cjs module-scope `getOrCreateEncryptionKey()` call**: Pre-existing latent bug (Store initialized before `app.ready()`) must be fixed during SEC-01 by converting to lazy init. Identified — requires care during refactoring.

3. **Electron 34.x patch level**: SEC-05 should verify current version is latest `34.x.y` patch and upgrade if not. Remaining Electron CVEs after patching to latest 34.x documented as "Chromium-context mitigated."

4. **safeStorage on Linux**: `isEncryptionAvailable()` may return `false` in CI or headless Linux. The volatile-key fallback already exists in `googleDrive.cjs` — replicate the same pattern in `storage.cjs`.

---

## Quick Reference: The 5 "Never Do" Rules for v1.2

1. **Never `npm audit fix --force`** — breaks electron-store v8 `encryptionKey` API
2. **Never `nodeIntegration: true`** — fix the missing preload bridge instead
3. **Never `webSecurity: false`** — fix the CSP directive instead
4. **Never call `getOrCreateEncryptionKey()` at module scope** — safeStorage requires `app.ready()`; use lazy `getStore()`
5. **Never encrypt in the renderer** — all safeStorage + AES-256-GCM operations must happen in main process

---

## Sources

### PRIMARY (HIGH confidence — direct codebase + live runtime verification)
- `electron/main.cjs` lines 97–99 — `nodeIntegration: false`, `contextIsolation: true` confirmed
- `electron/main.cjs` lines 146–162 — CSP implementation confirmed; line 153 `unsafe-inline` production bug confirmed
- `electron/googleDrive.cjs` lines 7, 22–40 — safeStorage pattern confirmed live in production
- `electron/preload.cjs` — IPC bridge pattern confirmed
- `node_modules/electron-store` + `node_modules/conf/readme.md` — `encryptionKey` "not for security" confirmed
- `npm audit` live run 2026-06-10 — 19 vulnerabilities; xlsx no upstream fix; electron fix = breaking 34→41
- Electron 34.5.8 runtime — `typeof safeStorage.encryptString === 'function'` confirmed live
- Node.js crypto AES-256-GCM — encrypt/decrypt confirmed working in project runtime
- `PRIVACY_POLICY_IT.md` — confirmed at repo root
- `package.json` — `electron-store: "^8.2.0"` in dependencies confirmed

### PRIMARY (HIGH confidence — official documentation)
- Electron safeStorage API: https://www.electronjs.org/docs/latest/api/safe-storage
- Electron contextBridge structured clone: https://www.electronjs.org/docs/latest/api/context-bridge#parameter--error--return-type-support
- Electron security checklist: https://www.electronjs.org/docs/latest/tutorial/security
- CSP `style-src-attr`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr
- AES-GCM nonce requirements: NIST SP 800-38D

### SECONDARY (MEDIUM confidence)
- electron-store v8 → v9 breaking changes: https://github.com/sindresorhus/electron-store/releases
- xlsx GHSA-4r6h-8v6p-xvw6 (Prototype Pollution): https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
- Framer Motion + CSP inline style issue: Framer Motion GitHub discussions

---

*Research completed: 2026-06-10 (STACK) · 2026-04-19 (FEATURES) · 2026-04-03 (ARCHITECTURE) · 2026-04-10 (PITFALLS)*
*Synthesized: 2026-06-10*
*Ready for roadmap: yes*
