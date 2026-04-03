# Requirements: MoneyFlow v1.2 — Security & Privacy

**Created:** 2026-04-03
**Milestone:** v1.2 Security & Privacy
**Status:** Active

---

## v1.2 Requirements

### Dependency Audit

- [ ] **SEC-01**: L'app non ha vulnerabilità npm fixabili in produzione — `npm audit fix` applicato, vulns residue documentate con rationale accettato

### Electron Hardening

- [ ] **SEC-02**: La CSP in produzione non include `script-src 'unsafe-inline'` (fix del bug confermato in `main.cjs` line 153 — già presente in prod)
- [ ] **SEC-03**: La CSP include le direttive `object-src 'none'`, `base-uri 'self'`, e `style-src-attr 'unsafe-inline'` (per Framer Motion inline styles)
- [ ] **SEC-04**: `setPermissionRequestHandler` configurato — blocca richieste di permessi non previste (camera, microfono, notifiche, ecc.)

### Privacy Policy

- [ ] **SEC-05**: L'utente vede una schermata di consenso privacy al primo avvio dopo l'aggiornamento; il flag di consenso è persistito in localStorage
- [ ] **SEC-06**: La privacy policy è leggibile in-app dalla sezione Settings in qualsiasi momento (contenuto da `PRIVACY_POLICY_IT.md` esistente)

### Local Encryption

- [ ] **SEC-07**: I dati finanziari in localStorage (transazioni, categorie, profili import) sono cifrati a riposo con AES-256-GCM tramite chiave derivata da `safeStorage` (DPAPI su Windows, Keychain su macOS)
- [ ] **SEC-08**: Al primo avvio dopo l'update, i dati plaintext esistenti vengono migrati automaticamente al formato cifrato senza perdita di dati (flag `.storage-migrated-v1` atomico)
- [ ] **SEC-09**: Se `safeStorage` non è disponibile (ambienti dev/CI headless), l'app funziona in modalità non cifrata senza crash

### Drive Backup Encryption

- [ ] **SEC-10**: Il backup JSON caricato su Google Drive è cifrato con AES-256-GCM usando una chiave derivata dall'account Google (`PBKDF2` da `google_user_id` OAuth `sub`)
- [ ] **SEC-11**: I backup sono ripristinabili su qualsiasi macchina con lo stesso account Google (restore cross-device ✓) — la chiave backup è account-bound, non machine-bound
- [ ] **SEC-12**: I backup legacy non cifrati già presenti su Drive vengono rilevati (envelope check) e ripristinati senza corruzione dati
- [ ] **SEC-13**: La UI indica che i backup sono protetti e legati all'account Google (es. tooltip/nota in Settings > Google Drive)

---

## Future Requirements (Deferred)

- Electron v34 → v41 upgrade — major-version jump con breaking changes; valutare in v1.3 dependency health milestone
- Sostituzione `xlsx@0.18.5` con `exceljs` — SheetJS CE non manutenuto su npm; nessun fix CVE disponibile; rischio locale-only accettato per v1.2
- Export/import chiave locale — consente migrazione manuale dati cifrati tra macchine; fuori scope v1.2
- Password master opzionale — per utenti che vogliono protezione extra oltre a safeStorage; fuori scope v1.2

## Out of Scope

- Cifratura end-to-end con chiave nota solo all'utente — richiederebbe password master, complessità UX alta; non richiesto
- Audit di sicurezza esterno / penetration test — fuori scope per un'app desktop single-user
- GDPR compliance formale — app personale single-user; privacy policy esistente è sufficiente
- Sincronizzazione multi-dispositivo in tempo reale — fuori scope (Drive è backup, non sync)

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| SEC-01 | Phase 12 | TBD | Pending |
| SEC-02 | Phase 13 | TBD | Pending |
| SEC-03 | Phase 13 | TBD | Pending |
| SEC-04 | Phase 13 | TBD | Pending |
| SEC-05 | Phase 14 | TBD | Pending |
| SEC-06 | Phase 14 | TBD | Pending |
| SEC-07 | Phase 15 | TBD | Pending |
| SEC-08 | Phase 15 | TBD | Pending |
| SEC-09 | Phase 15 | TBD | Pending |
| SEC-10 | Phase 16 | TBD | Pending |
| SEC-11 | Phase 16 | TBD | Pending |
| SEC-12 | Phase 16 | TBD | Pending |
| SEC-13 | Phase 16 | TBD | Pending |
