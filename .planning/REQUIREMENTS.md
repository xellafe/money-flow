# Requirements — MoneyFlow v1.1 Auto-Update

**Milestone:** v1.1 Auto-Update
**Created:** 2026-04-03
**Status:** Active

---

## v1.1 Requirements

### Update Infrastructure

- [x] **UPD-01**: L'app installa `electron-updater` (dependency) e configura `electron-builder` con il provider GitHub Releases (owner/repo specificati nel `publish` block di `package.json`).
- [x] **UPD-02**: Il main process inizializza `autoUpdater` solo in produzione (guarded by `isDev`) e avvia un check automatico all'avvio con 3 secondi di ritardo dopo `createWindow()`.
- [x] **UPD-03**: Il preload espone il namespace `window.electronAPI.updater` con metodi: `checkForUpdates()`, `installUpdate()`, e i cinque listener `on*` con cleanup function.

### Update UX — Notifica Automatica

- [x] **UPD-04**: Quando un aggiornamento è disponibile, l'app mostra un banner non-bloccante (`UpdateBanner`) nell'angolo in basso a destra con la versione disponibile e il pulsante "Installa e riavvia".
- [x] **UPD-05**: Il banner "Installa e riavvia" è visibile solo quando il download è completato (`status === 'ready'`) — non durante il download in corso.
- [x] **UPD-06**: Il pulsante "Installa e riavvia" chiama `quitAndInstall()` solo su azione esplicita dell'utente; l'app non si riavvia mai automaticamente.

### Update UX — Controllo Manuale in Settings

- [x] **UPD-07**: La schermata Impostazioni mostra una sezione "Aggiornamenti" con la versione corrente dell'app (`app.getVersion()` via IPC).
- [x] **UPD-08**: L'utente può cliccare "Controlla aggiornamenti" per avviare un check manuale; il pulsante mostra uno stato di caricamento durante il check.
- [x] **UPD-09**: Dopo il check manuale, la sezione Aggiornamenti mostra uno dei tre stati: "Sei già aggiornato", "Versione X.Y.Z disponibile — download in corso (N%)", "Impossibile controllare gli aggiornamenti" con messaggio di errore.

---

## Future Requirements (Deferred)

- Changelog snippet visibile nella notifica di aggiornamento (richiede parsing di `releaseNotes` da GitHub)
- Preferenza utente per disabilitare il check automatico all'avvio
- GitHub Actions CI per pubblicare release automaticamente (deployment concern, non in-app)

---

## Out of Scope

- Auto-update per la build **portable** — electron-updater non supporta il self-replacement del portable exe; la build portable resta distribuita manualmente
- Aggiornamenti forzati / blocco dell'app fino all'aggiornamento — l'utente deve sempre poter rimandare
- Code signing — fuori scope per uso personale; SmartScreen warning accettabile

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| UPD-01 | Phase 9 | satisfied |
| UPD-02 | Phase 9 | satisfied |
| UPD-03 | Phase 9 | satisfied |
| UPD-04 | Phase 10 | satisfied |
| UPD-05 | Phase 10 | satisfied |
| UPD-06 | Phase 9 | satisfied |
| UPD-07 | Phase 10 | satisfied |
| UPD-08 | Phase 10 | satisfied |
| UPD-09 | Phase 10 | satisfied |
