// Costanti dell'applicazione

export const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// Profili di import predefiniti
export const BUILTIN_IMPORT_PROFILES = {
  'illimity': {
    name: 'Illimity Bank',
    headerRow: 17, // 0-indexed (riga 18)
    dateColumn: 'Data operazione',
    descriptionColumn: 'Causale',
    amountType: 'split', // 'single' o 'split'
    incomeColumn: 'Entrate',
    expenseColumn: 'Uscite',
    idColumn: 'Id Transazione',
  },
  'generic-it': {
    name: 'Generico Italiano',
    headerRow: 0,
    dateColumn: 'Data',
    descriptionColumn: 'Descrizione',
    amountType: 'single',
    amountColumn: 'Importo',
    idColumn: null,
  },
  'generic-en': {
    name: 'Generic English',
    headerRow: 0,
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountType: 'single',
    amountColumn: 'Amount',
    idColumn: null,
  },
  'fineco': {
    name: 'Fineco',
    headerRow: 0,
    dateColumn: 'Data',
    descriptionColumn: 'Descrizione Operazione',
    amountType: 'split',
    incomeColumn: 'Entrate',
    expenseColumn: 'Uscite',
    idColumn: 'Numero Operazione',
  },
};

export const DEFAULT_CATEGORIES = {
  'Spesa alimentare': ['CONAD','COOP','ESSELUNGA','LIDL','EUROSPIN','CARREFOUR','PAM','PENNY','MD ','ALDI','SUPERMERCATO','ALIMENTARI','DESPAR'],
  'Ristorazione': ['RISTORANTE','PIZZERIA','BAR ','CAFE','MCDONALD','BURGER','SUSHI','PUB','TAVOLA CALDA','TRATTORIA'],
  'Trasporti': ['TRENITALIA','ITALO','ATM','BENZINA','CARBURANTE','ENI','Q8','TAMOIL','IP ','AUTOSTRAD','TELEPASS','UBER','TAXI','BUS'],
  'Abbonamenti': ['NETFLIX','SPOTIFY','AMAZON PRIME','DISNEY','DAZN','NOW TV','APPLE','GOOGLE STORAGE','PLAYSTATION','XBOX'],
  'Utenze': ['ENEL','ENI GAS','A2A','HERA','IREN','SORGENIA','FASTWEB','TIM','VODAFONE','WINDTRE','ILIAD','TARI','ACQUA'],
  'Salute': ['FARMACIA','PARAFARMACIA','MEDICO','DENTISTA','OCULISTA','OTTICO','OSPEDALE','ASL','TICKET'],
  'Shopping': ['ZALANDO','AMAZON','EBAY','ZARA','H&M','DECATHLON','IKEA','MEDIAWORLD','UNIEURO','FELTRINELLI'],
  'Casa': ['LEROY MERLIN','BRICO','OBI','CASTORAMA','MONDO CONVENIENZA','MAISON'],
  'Stipendio': ['STIPENDIO','SALARY','EMOLUMENTO','COMPENSO','ACCREDITO'],
  'Bonifici in entrata': ['BONIFICO A VOSTRO FAVORE','BONIF SEPA A VS FAVORE'],
  'Commissioni': ['COMMISSIONE','CANONE','SPESE CONTO','IMPOSTA BOLLO'],
};

export const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const ITEMS_PER_PAGE = 50;
