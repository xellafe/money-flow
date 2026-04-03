# Roadmap: MoneyFlow UI/UX Redesign

**Created:** 2026-03-17
**Last Updated:** 2026-06-10 (v1.2 roadmap created)

## Milestones

- `✅` **v1.0 MVP** — Phases 1–8 (shipped 2026-03-30)
- `✅` **v1.1 Auto-Update** — Phases 9–11 (shipped 2026-04-03)
- `🚧` **v1.2 Security & Privacy** — Phases 12–16 (in progress)

## Phases

<details>
<summary>`✅` v1.0 MVP (Phases 1–8) — SHIPPED 2026-03-30</summary>

- [x] Phase 1: Foundation & Setup (2/2 plans) — completed 2026-03-17
- [x] Phase 2: State Extraction (4/4 plans) — completed 2026-03-17
- [x] Phase 3: Navigation & Layout (2/2 plans) — completed 2026-03-18
- [x] Phase 4: Dashboard Redesign (4/4 plans) — completed 2026-03-18
- [x] Phase 5: Transaction List Redesign (4/4 plans) — completed 2026-03-19
- [x] Phase 6: Modals Redesign (5/5 plans) — completed 2026-03-19
- [x] Phase 7: UX Polish (3/3 plans) — completed 2026-03-27
- [x] Phase 8: v1.0 Cleanup (1/1 plan) — completed 2026-03-30

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>


<details>
<summary>✅ v1.1 Auto-Update (Phases 9-11) - SHIPPED 2026-04-03</summary>

- [x] Phase 9: Update Infrastructure (1/1 plan) - completed 2026-04-03
- [x] Phase 10: Update UI (2/2 plans) - completed 2026-04-03
- [x] Phase 11: Update Error Handling (1/1 plan) - completed 2026-04-03

Full archive: .planning/milestones/v1.1-ROADMAP.md

</details>

---

## v1.2 Security & Privacy — Phases 12–16

### Phases

- [ ] **Phase 12: Dependency Audit** — Resolve fixable npm vulnerabilities; document accepted CVEs with rationale
- [ ] **Phase 13: Electron Security Hardening** — Fix CSP production bug, add missing directives, configure permission request guard
- [ ] **Phase 14: Privacy Policy UI** — First-run consent modal + persistent Settings section
- [ ] **Phase 15: Local Encryption** — AES-256-GCM localStorage encryption via safeStorage, with atomic migration
- [ ] **Phase 16: Drive Backup Encryption** — AES-256-GCM backup encryption keyed to Google account (PBKDF2 from OAuth `sub`), backward-compat with legacy plaintext backups

### Phase Details

#### Phase 12: Dependency Audit
**Goal**: The app has no fixable npm vulnerabilities in production; every remaining CVE is explicitly accepted with rationale
**Depends on**: Nothing (zero code risk, safe first step)
**Requirements**: SEC-01
**Success Criteria** (what must be TRUE):
  1. `npm audit --omit=dev` returns zero fixable critical/high vulnerabilities
  2. `npm audit fix` (no `--force`) completes without errors and audit re-run confirms no regressions to `electron-store` v8 API
  3. A `deferred-vulns.md` file exists documenting every remaining CVE (e.g., `xlsx@0.18.5` no-fix-available, `electron` v34 deferred to v1.3) with explicit rationale
**Plans**: TBD

---

#### Phase 13: Electron Security Hardening
**Goal**: The Electron renderer operates under a complete, correct CSP with no `unsafe-inline` for scripts, with all required directives present, and all unexpected permission requests denied
**Depends on**: Phase 12
**Requirements**: SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. `grep "script-src" electron/main.cjs` confirms `'unsafe-inline'` is absent from the production CSP string (confirmed 1-line bug fixed at line 153)
  2. `grep "object-src\|base-uri\|style-src-attr" electron/main.cjs` confirms all three new directives are present in the CSP
  3. Framer Motion animations render correctly in a production build (confirms `style-src-attr 'unsafe-inline'` is present to permit inline styles without breaking animations)
  4. A permission request (camera, microphone, notifications) triggered via DevTools is denied and a console warning is emitted by `setPermissionRequestHandler`
**Plans**: TBD
**UI hint**: yes

---

#### Phase 14: Privacy Policy UI
**Goal**: Users see a consent screen on first launch after update, and can review the privacy policy at any time from Settings
**Depends on**: Phase 13
**Requirements**: SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. On first launch after update (no consent flag in `localStorage`), a non-dismissable consent modal blocks the app until "Accetto" is clicked
  2. After consenting and relaunching, the modal does not reappear — `localStorage` persists the consent flag across sessions
  3. Settings contains a Privacy Policy section that renders the full `PRIVACY_POLICY_IT.md` content (scrollable, in-app — no external URL)
**Plans**: TBD
**UI hint**: yes

---

#### Phase 15: Local Encryption
**Goal**: All financial data at rest is transparently encrypted using a safeStorage-derived key (AES-256-GCM), with safe fallback for dev/CI and an atomic one-time migration from plaintext
**Depends on**: Phase 14
**Requirements**: SEC-07, SEC-08, SEC-09
**Success Criteria** (what must be TRUE):
  1. After migration, DevTools → Application → Local Storage shows ciphertext blobs (not readable JSON) for transaction, category, and import-profile keys
  2. The file `.storage-migrated-v1` exists in `app.getPath('userData')` after first post-update run; relaunching does not re-run migration (atomic flag prevents double-migration)
  3. All existing transaction and category data is fully intact after migration — record counts and values match pre-update state
  4. On a dev/CI machine where `safeStorage.isEncryptionAvailable()` returns `false`, the app launches and operates normally in unencrypted mode without any crash or error
**Plans**: TBD

---

#### Phase 16: Drive Backup Encryption
**Goal**: Google Drive backups are AES-256-GCM encrypted before upload using a PBKDF2 key derived from the Google OAuth `sub` (account-bound, not machine-bound), with backward-compatibility for legacy plaintext backups
**Depends on**: Phase 15
**Requirements**: SEC-10, SEC-11, SEC-12, SEC-13
**Success Criteria** (what must be TRUE):
  1. The raw backup file on Google Drive is not human-readable — opening it in a text editor shows a `{ v: 1, encrypted: true, iv: "...", data: "..." }` envelope
  2. Restoring the encrypted backup on a second machine logged into the same Google account succeeds with all transaction and category data intact (cross-device restore ✓)
  3. A pre-v1.2 plaintext backup (legacy format, no envelope marker) is detected via envelope check and restored without data corruption or error
  4. Settings → Google Drive section displays a badge or note indicating backups are encrypted and tied to the Google account (e.g., "Backup cifrati AES-256-GCM · account-bound")
**Plans**: TBD
**UI hint**: yes

---

### Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 12. Dependency Audit | 0/? | Not started | — |
| 13. Electron Security Hardening | 0/? | Not started | — |
| 14. Privacy Policy UI | 0/? | Not started | — |
| 15. Local Encryption | 0/? | Not started | — |
| 16. Drive Backup Encryption | 0/? | Not started | — |
