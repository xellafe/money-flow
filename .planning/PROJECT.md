# MoneyFlow — Desktop Budget App

## What This Is

MoneyFlow è un'applicazione desktop (Electron + React 19) per la gestione del budget personale. Importa transazioni da file Excel/CSV di banche italiane (Illimity, Fineco, PayPal), le categorizza automaticamente e le visualizza con grafici interattivi. **v1.1 spedita:** sistema di aggiornamento automatico via GitHub Releases con check all'avvio, toast non-bloccante "Installa e riavvia", sezione Aggiornamenti in Settings con controllo manuale, e gestione completa degli errori IPC.

## Core Value

L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

## Requirements

### Validated

- ✓ Importazione transazioni da Excel/CSV (Illimity, Fineco, PayPal, generic) — existing
- ✓ Auto-categorizzazione keyword-based con gestione conflitti — existing
- ✓ Dashboard analytics con grafici (Recharts: bar, area, pie) — existing
- ✓ CRUD transazioni manuali (add, edit, delete) — existing
- ✓ Gestione categorie (add, edit, delete, keyword mapping) — existing
- ✓ Sincronizzazione Google Drive (OAuth, backup/restore, auto-backup alla chiusura) — existing
- ✓ Import profiles personalizzabili — existing
- ✓ Persistenza locale via localStorage — existing
- ✓ Toast notifications — existing
- ✓ Tailwind CSS v4 come sistema di styling principale — v1.0
- ✓ Refactor App.jsx monolitico (2127 righe) in 6 hook separati — v1.0
- ✓ Design system: token colori, tipografia, spacing coerenti — v1.0
- ✓ Redesign navigazione: sidebar fissa animata (240px/64px), AppHeader contestuale — v1.0
- ✓ Redesign Dashboard: stat cards, AreaChart + DonutChart, period selector, cross-filter — v1.0
- ✓ Redesign Lista Transazioni: tabella sortable, inline editing, ricerca debounced, filter chips — v1.0
- ✓ Redesign Modali: Radix Dialog + ModalShell, scale/fade 200ms, focus trap, 7 modali migrate — v1.0
- ✓ UX polish: toast animato, skeleton loading, empty states, page transitions, cursor coerente — v1.0

### Active

- [ ] **SEC-01**: Cifratura trasparente dati locali con chiave derivata dal sistema (Electron `safeStorage`)
- [ ] **SEC-02**: Backup Google Drive cifrati prima dell'upload, decifrati al restore
- [ ] **SEC-03**: Privacy policy in-app — schermata in Settings + consenso a primo avvio
- [ ] **SEC-04**: Electron security hardening — CSP nel renderer, `nodeIntegration: false`, `contextIsolation: true`
- [ ] **SEC-05**: Dependency audit — `npm audit`, fix vulnerabilità critiche
- ✓ **UPD-01**: electron-updater configurato con GitHub Releases come provider — v1.1
- ✓ **UPD-02**: Check aggiornamenti automatico all'avvio (3s delay, prod-only guard) — v1.1
- ✓ **UPD-03**: Toast non-bloccante "Installa e riavvia" quando download completato — v1.1
- ✓ **UPD-04**: Sezione "Aggiornamenti" in SettingsView con versione corrente e stato — v1.1
- ✓ **UPD-05**: Pulsante "Controlla aggiornamenti" con feedback visivo (loading, found, up-to-date, error) — v1.1
- ✓ **UPD-06**: IPC bridge main ↔ renderer (8 metodi preload, 3 IPC handlers, 5 push events) — v1.1
- ✓ **UPD-07/08/09**: Gestione errori IPC completa — errori background/download raggiungono renderer via single forwarding point — v1.1

### Out of Scope

- Migrazione a IndexedDB/SQLite — complessità alta, fuori dal focus UI; deferred
- Sistema di apprendimento categorie (ML) — fuori scope v1 redesign
- Mobile app — desktop-only (Electron)
- Nuove funzionalità business (budget goals, forecast) — solo redesign UI/UX esistente
- Date range picker nella TransactionFilterBar — deferred to v1.1 (AppHeader-only decision)

## Current Milestone: v1.2 Security & Privacy

**Goal:** Proteggere i dati finanziari con cifratura trasparente, rafforzare la sicurezza Electron, e integrare la privacy policy nell'app.

**Target features:**
- Cifratura locale trasparente (`safeStorage`, no password aggiuntiva per l'utente)
- Backup Google Drive cifrati prima dell'upload
- Privacy policy in-app (Settings + consenso primo avvio)
- Electron security hardening (CSP, nodeIntegration, contextIsolation)
- Dependency audit + fix vulnerabilità critiche

## Last Shipped: v1.1 Auto-Update — **2026-04-03**

**Goal:** Aggiungere sistema aggiornamento automatico via GitHub Releases con check all'avvio e controllo manuale da Impostazioni.

**Phases:** 9 (infrastructure) → 10 (UI) → 11 (error handling) — 3 phases, 4 plans, 2026-04-03

**Context:** See `.planning/milestones/v1.1-ROADMAP.md` for full archive.

## Context

**Shipped v1.1 — 2026-04-03**
- 3 phases (9–11), 4 plans
- Auto-update system: electron-updater + IPC bridge + React UI + full error handling
- See `.planning/milestones/v1.1-ROADMAP.md`

**Shipped v1.0 — 2026-03-30**
- 8 phases, 25 plans, ~4,917 LOC (src JSX/JS)
- 170 files changed, 47,230 insertions across 62 days (2026-01-27 → 2026-03-30)
- All 47 requirements satisfied

**Stack attuale:**
- React 19.2.0, Vite 7.2.4, Electron 34.5.8
- Tailwind CSS v4 via @tailwindcss/vite, Inter Variable font (local via Fontsource)
- Framer Motion for animations, Radix Dialog for modals
- Recharts 3.7.0 for charts, Lucide React for icons
- App.jsx decomposed into 6 hooks: useTransactionData, useCategories, useFilters, useModals, useImportLogic, useToast

**Deferred tech debt (v1.1 candidates):**
- 2 residual `selectedYear !== null` patterns in AreaChartCard.jsx and TransactionFilterBar.jsx (logged in deferred-items.md)
- Date range picker for transaction filtering

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tailwind CSS v4 | Utility-first, ottima integrazione Vite, no CSS specificity issues | ✓ Good — zero friction, HMR working |
| Refactor App.jsx in hook + componenti | Riduce rischio bugs durante redesign, codice più manutenibile | ✓ Good — App.jsx ora ~300 righe di pura orchestrazione |
| Stile light clean minimal | Richiesta utente — massima leggibilità per dati finanziari | ✓ Good — coerente con Inter Variable + design tokens |
| Mantenere Recharts | Già funzionante, solo theming | ✓ Good — CSS var integration riuscita |
| NO shadcn/ui | Evita overhead setup per Electron, Tailwind da solo è sufficiente | ✓ Good — Radix Dialog per modali sufficiente |
| Radix Dialog per modali | Focus trap nativo, accessibilità, no custom scroll trapping | ✓ Good — tutti 7 modali migrati con consistenza |
| Framer Motion per animazioni | API dichiarativa, AnimatePresence per mount/unmount | ✓ Good — sidebar, modali, toast, page transitions |
| electron-updater via GitHub Releases | Integrazione nativa Electron, zero infra, free tier sufficiente | ✓ Good — auto-update funzionante end-to-end |
| Single error-forwarding point | Evita doppio-fire: `autoUpdater.on('error')` è l'unico punto che manda `updater:error` al renderer | ✓ Good — D-01+D-02 pattern; dedup richiesto |
| `throw err` in `ipcMain.handle` | `return { success: false }` risolve sempre la promise; solo `throw` fa scattare `.catch()` in renderer | ✓ Good — necessario per mostrare error state in UI |
| useUpdateStatus hook (renderer) | Centralizza tutto lo stato update in un hook; zero prop drilling | ✓ Good — usato sia in UpdateBanner che SettingsView |

## Constraints

- **Tech stack**: React 19 + Electron — nessuna modifica alla struttura Electron/IPC
- **Compatibilità**: Windows 7+ (Electron gestisce, ma no CSS feature moderne non supportate da Chromium embedded)
- **Dipendenze**: Preferire utility Tailwind; non aggiungere nuove librerie UI salvo necessità specifica
- **Funzionalità**: Il redesign NON deve rompere funzionalità esistenti (import, sync, CRUD)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 — v1.2 milestone started: Security & Privacy*