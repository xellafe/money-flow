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
├── App.jsx          # Componente principale
├── App.css          # Stili applicazione
├── index.css        # Stili globali
└── main.jsx         # Entry point
```

## 📝 Formato File Excel Supportato

### Formato Standard
| Data | Descrizione | Importo |
|------|-------------|---------|
| 01/01/2026 | Stipendio | 1500.00 |

### Formato Illimity (header in riga 18)
| Data operazione | Causale | Entrate | Uscite |
|-----------------|---------|---------|--------|
| 01/01/2026 | Bonifico stipendio | 1500.00 | |

## 📄 Licenza

MIT
