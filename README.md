# 💸 MoneyFlow

Applicazione web per il monitoraggio delle entrate e uscite personali, con importazione automatica da file Excel bancari.

## ✨ Funzionalità

### Dashboard
- 📊 Visualizzazione entrate e uscite
- 📈 Grafico a torta per categorie di spesa
- 📉 Andamento mensile con grafico a barre
- 📅 Filtro per mese e anno
- 🔄 Trend giornaliero per mese selezionato

### Gestione Movimenti
- 📥 Import da file Excel (.xlsx, .xls, .csv)
- 🔍 Ricerca transazioni per descrizione o categoria
- ✏️ Modifica descrizione e categoria di ogni movimento
- 🗑️ Eliminazione singola o massiva
- 📤 Export dati in Excel

### Categorie Personalizzate
- ➕ Creazione di nuove categorie
- 🏷️ Aggiunta/rimozione di keyword per auto-categorizzazione
- 🔄 Ri-categorizzazione automatica di tutte le transazioni
- 🗑️ Eliminazione categorie custom

### Import Intelligente
- 🏦 Supporto formato Illimity (header in riga 18)
- 🔄 Deduplicazione automatica
- 📋 Gestione colonne Entrate/Uscite separate
- 🤖 Categorizzazione automatica basata su keyword

## 🛠️ Tecnologie

- **React 19** - Framework UI
- **Vite** - Build tool
- **Recharts** - Grafici interattivi
- **SheetJS (xlsx)** - Lettura/scrittura file Excel
- **Lucide React** - Icone
- **LocalStorage** - Persistenza dati

## 🚀 Installazione

```bash
# Clona il repository
git clone <repo-url>
cd budget-tracker

# Installa dipendenze
npm install

# Avvia in development (solo web)
npm run dev

# Build per produzione (solo web)
npm run build
```

### 🖥️ Electron (App Desktop)

```bash
# Avvia app desktop in development
npm run electron:dev

# Anteprima build desktop
npm run electron:preview

# Build app desktop per distribuzione
npm run electron:build
```

> **Nota:** Il comando `electron:build` genera un eseguibile portable per Windows nella cartella `release/`.

## 📁 Struttura Progetto

```
src/
├── App.jsx              # Componente principale
├── App.css              # Stili applicazione
├── index.css            # Stili globali
├── main.jsx             # Entry point
├── constants/
│   └── index.js         # Costanti e configurazioni (profili import, categorie default)
├── utils/
│   └── index.js         # Funzioni di utilità (parsing, formattazione, categorizzazione)
└── components/
    ├── index.js         # Export centralizzato componenti
    ├── Toast.jsx        # Notifiche toast
    ├── StatCard.jsx     # Card statistiche dashboard
    └── modals/
        ├── index.js             # Export modali
        ├── ConfirmModal.jsx     # Modal conferma eliminazione
        ├── ImportWizard.jsx     # Wizard configurazione import
        ├── ConflictResolver.jsx # Risoluzione conflitti import
        ├── CategoryConflictResolver.jsx  # Risoluzione conflitti categoria
        └── CategoryManager.jsx  # Gestione categorie e keyword
```

## 📝 Formato File Excel Supportato

L'applicazione supporta file `.xlsx`, `.xls` e `.csv` con rilevamento automatico del formato. Sono disponibili profili predefiniti per diverse banche:

### 🏦 Profili Predefiniti

| Profilo | Header | Colonne |
|---------|--------|---------|
| **Illimity Bank** | Riga 18 | Data operazione, Causale, Entrate, Uscite, Id Transazione |
| **Fineco** | Riga 1 | Data, Descrizione Operazione, Entrate, Uscite, Numero Operazione |
| **Generico Italiano** | Riga 1 | Data, Descrizione, Importo |
| **Generic English** | Riga 1 | Date, Description, Amount |

### 📋 Formato Generico Italiano
| Data | Descrizione | Importo |
|------|-------------|---------|
| 01/01/2026 | Stipendio | 1500.00 |
| 02/01/2026 | Spesa supermercato | -85.50 |

### 🏛️ Formato Illimity (header in riga 18)
| Data operazione | Causale | Entrate | Uscite | Id Transazione |
|-----------------|---------|---------|--------|----------------|
| 01/01/2026 | Bonifico stipendio | 1500.00 | | TRX123456 |
| 02/01/2026 | Pagamento POS | | 85.50 | TRX123457 |

### 💳 Formato Fineco
| Data | Descrizione Operazione | Entrate | Uscite | Numero Operazione |
|------|------------------------|---------|--------|-------------------|
| 01/01/2026 | Accredito stipendio | 1500.00 | | 001 |
| 02/01/2026 | Pagamento carta | | 85.50 | 002 |

### ⚙️ Configurazione Personalizzata

Se il formato del tuo file non viene riconosciuto automaticamente, puoi configurare manualmente la mappatura delle colonne tramite l'interfaccia di import.

## 📄 Licenza

MIT
