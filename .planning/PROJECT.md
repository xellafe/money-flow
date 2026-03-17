# MoneyFlow — UI/UX Redesign

## What This Is

MoneyFlow è un'applicazione desktop (Electron + React 19) per la gestione del budget personale. Permette di importare transazioni da file Excel/CSV di banche italiane (Illimity, Fineco), categorizzarle automaticamente e visualizzarle con grafici. Il redesign porta l'interfaccia a uno stile **light clean & minimal** (ispirazione Notion/Apple), con Tailwind CSS come sistema di styling e refactor dei componenti per maggiore manutenibilità.

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

### Active

- [ ] Aggiunta Tailwind CSS v4 come sistema di styling principale
- [ ] Refactor `App.jsx` monolitico (2127 righe) in componenti/hook separati
- [ ] Redesign Dashboard: layout cards moderne, grafici ridisegnati, stat highlights
- [ ] Redesign Lista Transazioni: tabella pulita, filtri accessibili, paginazione migliorata
- [ ] Redesign navigazione: sidebar fissa con icone Lucide, breadcrumb/tab chiaro
- [ ] Redesign Modali: stile consistente, animazioni di apertura/chiusura, focus trap
- [ ] UX — filtri: date picker, ricerca inline, filtro categoria accessibile dalla sidebar
- [ ] UX — micro-animazioni: hover states, transizioni di pagina, skeleton loading
- [ ] Design system: token colori, tipografia, spacing coerenti in tutto il codebase
- [ ] Responsive layout per diverse dimensioni finestra Electron

### Out of Scope

- Migrazione a IndexedDB/SQLite — complessità alta, fuori dal focus UI; deferred
- Sistema di apprendimento categorie (ML) — fuori scope v1 redesign
- Mobile app — desktop-only (Electron)
- Nuove funzionalità business (budget goals, forecast) — solo redesign UI/UX esistente

## Context

**Stack attuale:**
- React 19.2.0, Vite 7.2.4, Electron 34.5.8
- CSS custom in `src/App.css` e `src/index.css` — nessun framework UI
- Lucide React 0.563.0 per icone (già usato)
- Recharts 3.7.0 per grafici (mantenuto)
- `App.jsx` è il collo di bottiglia: 2127 righe, tutto in un file

**Problemi noti dell'UI attuale:**
- Nessun design system — stili sparsi e inconsistenti
- Layout rigido, poco leggibile su schermi piccoli
- Modali senza animazioni, accessibilità limitata
- Dashboard poco gerarchica visivamente

**Decisioni chiave già prese:**
- Tailwind CSS v4 (utility-first, ottimo con Vite)
- Mantenere Recharts (già integrato, basta reskin colori/stili)
- Mantenere Lucide React (già usato, icone coerenti)
- NON aggiungere component library esterna (shadcn richiede più setup per Electron)

## Constraints

- **Tech stack**: React 19 + Electron — nessuna modifica alla struttura Electron/IPC
- **Compatibilità**: Windows 7+ (Electron gestisce, ma no CSS feature moderne non supportate da Chromium embedded)
- **Dipendenze**: Preferire utility Tailwind; non aggiungere nuove librerie UI salvo necessità specifica
- **Funzionalità**: Il redesign NON deve rompere funzionalità esistenti (import, sync, CRUD)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tailwind CSS v4 | Utility-first, ottima integrazione Vite, no CSS specificity issues | — Pending |
| Refactor App.jsx in hook + componenti | Riduce rischio bugs durante redesign, codice più manutenibile | — Pending |
| Stile light clean minimal | Richiesta utente — massima leggibilità per dati finanziari | — Pending |
| Mantenere Recharts | Già funzionante, solo theming | — Pending |
| NO shadcn/ui | Evita overhead setup per Electron, Tailwind da solo è sufficiente | — Pending |

---
*Last updated: 2026-03-17 after initialization*
