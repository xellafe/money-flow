# MoneyFlow — UI/UX Redesign

## What This Is

MoneyFlow è un'applicazione desktop (Electron + React 19) per la gestione del budget personale. Importa transazioni da file Excel/CSV di banche italiane (Illimity, Fineco, PayPal), le categorizza automaticamente e le visualizza con grafici interattivi. **v1.0 spedita:** il redesign completo porta l'interfaccia a uno stile light clean & minimal con Tailwind CSS v4, navigazione sidebar animata, dashboard con grafici interattivi, lista transazioni con inline editing, e sistema modale unificato con Radix Dialog.

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

- [ ] **UPD-03**: Toast non-bloccante con pulsante "Installa e riavvia" se update disponibile
- [ ] **UPD-04**: Sezione "Aggiornamenti" in SettingsView con versione corrente e stato
- [ ] **UPD-05**: Pulsante "Controlla aggiornamenti" con feedback visivo (loading, found, up-to-date, error)

### Validated

- [x] **UPD-01**: Configurare electron-updater con GitHub Releases come provider — *Validated in Phase 09: update-infrastructure*
- [x] **UPD-02**: Check aggiornamenti automatico all'avvio dell'app — *Validated in Phase 09: update-infrastructure*
- [x] **UPD-06**: IPC bridge main ↔ renderer per eventi update (check, progress, ready, error) — *Validated in Phase 09: update-infrastructure*

### Out of Scope

- Migrazione a IndexedDB/SQLite — complessità alta, fuori dal focus UI; deferred
- Sistema di apprendimento categorie (ML) — fuori scope v1 redesign
- Mobile app — desktop-only (Electron)
- Nuove funzionalità business (budget goals, forecast) — solo redesign UI/UX esistente
- Date range picker nella TransactionFilterBar — deferred to v1.1 (AppHeader-only decision)

## Current Milestone: v1.1 Auto-Update

**Goal:** Aggiungere il sistema di aggiornamento automatico via GitHub Releases con check all'avvio e controllo manuale dalla schermata Impostazioni.

**Target features:**
- electron-updater integrato con GitHub Releases
- Check automatico all'avvio → toast non-bloccante con "Installa e riavvia"
- Sezione "Aggiornamenti" in SettingsView con versione attuale, stato e pulsante manuale
- IPC bridge main ↔ renderer per eventi update

## Context

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
| Barrel import per componenti UI | Normalizzazione import in tutto il codebase | ✓ Good — src/ui/index.js come punto unico |

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
*Last updated: 2026-04-03 — Phase 10 complete: update UI delivered (UpdateBanner, SettingsView Aggiornamenti, useUpdateStatus hook)*