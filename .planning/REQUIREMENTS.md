# Requirements: MoneyFlow UI/UX Redesign

**Defined:** 2026-03-17
**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: Tailwind CSS v4 installato e configurato con Vite plugin (senza PostCSS)
- [x] **FOUND-02**: Design tokens definiti come CSS variables via `@theme`: colori semantici (`income`, `expense`, `neutral`), tipografia (Inter Variable), spacing scale
- [x] **FOUND-03**: Font Inter Variable bundlato localmente via Fontsource (no CDN)
- [x] **FOUND-04**: CSP in `electron/main.cjs` aggiornata per compatibilità Tailwind v4
- [x] **FOUND-05**: `useTransactionData` hook estratto da App.jsx (stato transazioni, CRUD, persistenza localStorage)
- [x] **FOUND-06**: `useCategories` hook estratto da App.jsx (categorie, keyword mapping, conflitti)
- [x] **FOUND-07**: `useFilters` hook estratto da App.jsx (month/year/search/category filter state)
- [x] **FOUND-08**: `useModals` hook estratto da App.jsx (visibilità modali, dati apertura)
- [ ] **FOUND-09**: `useImportLogic` hook estratto da App.jsx (import profiles, wizard flow, conflict resolution)
- [x] **FOUND-10**: `useToast` hook estratto da App.jsx (notifiche toast)
- [ ] **FOUND-11**: Backup localStorage automatico prima di ogni refactor step (recovery point)

### Navigation & Layout

- [ ] **NAV-01**: Sidebar fissa a sinistra (240px espansa, 64px collassata) con icone Lucide
- [ ] **NAV-02**: Sidebar collassabile via toggle button con animazione smooth (Framer Motion)
- [ ] **NAV-03**: Active state visivo sulla voce di navigazione corrente
- [ ] **NAV-04**: Voci navigazione: Dashboard, Transazioni, Impostazioni
- [ ] **NAV-05**: Header/top bar con titolo della view corrente e azioni contestuali (es. "Aggiungi transazione")
- [ ] **NAV-06**: Layout main content che si adatta alla sidebar espansa/collassata

### Dashboard

- [ ] **DASH-01**: Tre stat cards in evidenza: Saldo totale, Entrate mese, Uscite mese
- [ ] **DASH-02**: Cards con colore semantico (income verde, expense rosso, balance neutro)
- [ ] **DASH-03**: Grafici Recharts con tema Tailwind (colori CSS variables, no hardcoded hex)
- [ ] **DASH-04**: Grafico a ciambella/torta per breakdown categorie (con metric centrale)
- [ ] **DASH-05**: Grafico area/barre per andamento mensile entrate vs uscite
- [ ] **DASH-06**: Selettore periodo (mese/anno) cliccabile in top della dashboard
- [ ] **DASH-07**: Cross-filtering: click su categoria nel grafico filtra la lista transazioni
- [ ] **DASH-08**: Skeleton loading cards durante l'inizializzazione dell'app

### Transactions

- [ ] **TRNS-01**: Tabella transazioni con colonne: Data, Descrizione, Categoria, Importo
- [ ] **TRNS-02**: Sorting cliccabile su ogni colonna (data, importo, categoria)
- [ ] **TRNS-03**: Paginazione pulita con contatore "X-Y di Z transazioni"
- [ ] **TRNS-04**: Barra filtri: ricerca testo inline (search-as-type), filtro categoria dropdown, filtro data range
- [ ] **TRNS-05**: Inline editing: click su descrizione o categoria per editare direttamente nella riga
- [ ] **TRNS-06**: Importo colorato (verde entrate, rosso uscite) con segno esplicito
- [ ] **TRNS-07**: Badge colorato per categoria su ogni riga
- [ ] **TRNS-08**: Empty state quando non ci sono transazioni (illustrazione + CTA importa/aggiungi)

### Modals

- [ ] **MOD-01**: Overlay con backdrop blur e animazione fade (Framer Motion, 200ms)
- [ ] **MOD-02**: Animazione apertura/chiusura modale con scale + fade (200ms)
- [ ] **MOD-03**: Chiusura con ESC e click su backdrop
- [ ] **MOD-04**: Focus trap all'interno della modale (accessibilità)
- [ ] **MOD-05**: Stile consistente per tutti i modali: ImportWizard, CategoryManager, SyncSettings, ConfirmModal, ConflictResolver, CategoryConflictResolver, PayPalEnrichWizard
- [ ] **MOD-06**: Bottoni con stile primario/secondario/distruttivo coerente con design system
- [ ] **MOD-07**: Modali con scrolling interno per contenuto lungo (es. ImportWizard step 2)

### UX Polish

- [ ] **UX-01**: Hover states su tutti gli elementi interattivi (150ms transition)
- [ ] **UX-02**: Skeleton loading per lista transazioni durante caricamento iniziale
- [ ] **UX-03**: Empty state dashboard: nessun dato importato (icona + testo + pulsante "Importa transazioni")
- [ ] **UX-04**: Toast notifications restyled con design system (posizione, animazione slide-in 300ms)
- [ ] **UX-05**: Bottone "Aggiungi transazione" sempre accessibile (in header o sidebar)
- [ ] **UX-06**: Cursore pointer su tutti gli elementi cliccabili
- [ ] **UX-07**: Transizione pagina smooth quando si cambia view (fade 150ms)

## v2 Requirements

### Advanced UX

- **UX2-01**: Keyboard shortcuts (Ctrl+N nuova transazione, Ctrl+F focus ricerca)
- **UX2-02**: Command palette Ctrl+K (cerca transazioni, navigate app)
- **UX2-03**: Bulk selection transazioni (multi-select + categorizza/elimina in massa)
- **UX2-04**: Undo/redo per azioni distruttive (richiede cambio architettura)
- **UX2-05**: Dark mode toggle

### Advanced Dashboard

- **DASH2-01**: Widget drag-and-drop per personalizzare dashboard
- **DASH2-02**: Budget goals visualizzati nella dashboard (progress bar per categoria)
- **DASH2-03**: Forecast spese basato su storico

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile responsive layout | Desktop-only (Electron), aggiunge complessità senza valore |
| Dark mode in v1 | Desiderabile ma non critico; token già predisposti per futura aggiunta |
| Migrazione IndexedDB/SQLite | Fuori scope redesign UI; tech debt separato |
| Sistema apprendimento categorie (ML) | Fuori scope v1 redesign |
| Real-time bank sync | Architettura diversa, fuori scope |
| Nuove funzionalità business (budget goals, forecast) | Solo redesign UI/UX esistente |
| shadcn/ui component library | Overhead setup per Electron non giustificato; Tailwind + Radix direttamente |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 2 | Complete |
| FOUND-06 | Phase 2 | Complete |
| FOUND-07 | Phase 2 | Complete |
| FOUND-08 | Phase 2 | Complete |
| FOUND-09 | Phase 2 | Pending |
| FOUND-10 | Phase 2 | Complete |
| FOUND-11 | Phase 2 | Pending |
| NAV-01 | Phase 3 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 3 | Pending |
| NAV-04 | Phase 3 | Pending |
| NAV-05 | Phase 3 | Pending |
| NAV-06 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| DASH-06 | Phase 4 | Pending |
| DASH-07 | Phase 4 | Pending |
| DASH-08 | Phase 4 | Pending |
| TRNS-01 | Phase 5 | Pending |
| TRNS-02 | Phase 5 | Pending |
| TRNS-03 | Phase 5 | Pending |
| TRNS-04 | Phase 5 | Pending |
| TRNS-05 | Phase 5 | Pending |
| TRNS-06 | Phase 5 | Pending |
| TRNS-07 | Phase 5 | Pending |
| TRNS-08 | Phase 5 | Pending |
| MOD-01 | Phase 6 | Pending |
| MOD-02 | Phase 6 | Pending |
| MOD-03 | Phase 6 | Pending |
| MOD-04 | Phase 6 | Pending |
| MOD-05 | Phase 6 | Pending |
| MOD-06 | Phase 6 | Pending |
| MOD-07 | Phase 6 | Pending |
| UX-01 | Phase 7 | Pending |
| UX-02 | Phase 7 | Pending |
| UX-03 | Phase 7 | Pending |
| UX-04 | Phase 7 | Pending |
| UX-05 | Phase 7 | Pending |
| UX-06 | Phase 7 | Pending |
| UX-07 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after initial definition*
