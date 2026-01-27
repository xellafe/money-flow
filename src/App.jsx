import { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, LineChart, Line, Legend 
} from 'recharts';
import { 
  Upload, TrendingUp, TrendingDown, Tag, Search, Trash2, 
  Download, FileSpreadsheet, X, Check, AlertCircle, Loader2, Plus, Edit2,
  Save, FolderOpen, Settings, ChevronDown, MoreVertical, Menu
} from 'lucide-react';
import './App.css';

// Costanti
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];

// Profili di import predefiniti
const BUILTIN_IMPORT_PROFILES = {
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

const DEFAULT_CATEGORIES = {
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

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

// Formattazione valuta
const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(value);
};

// Componente Toast
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', opacity: 0.7 }}>
        <X size={16} />
      </button>
    </div>
  );
}

// Componente Modal conferma
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Annulla</button>
          <button className="btn-danger" onClick={onConfirm}>Elimina</button>
        </div>
      </div>
    </div>
  );
}

// Componente Wizard mappatura colonne
function ImportWizard({ columns, sampleData, onConfirm, onCancel, existingProfiles }) {
  const [profileName, setProfileName] = useState('');
  const [headerRow, setHeaderRow] = useState(0);
  const [dateColumn, setDateColumn] = useState('');
  const [descriptionColumn, setDescriptionColumn] = useState('');
  const [amountType, setAmountType] = useState('single');
  const [amountColumn, setAmountColumn] = useState('');
  const [incomeColumn, setIncomeColumn] = useState('');
  const [expenseColumn, setExpenseColumn] = useState('');
  const [idColumn, setIdColumn] = useState('');

  const isValid = profileName.trim() && dateColumn && descriptionColumn && 
    (amountType === 'single' ? amountColumn : (incomeColumn || expenseColumn));

  const handleConfirm = () => {
    const profile = {
      name: profileName.trim(),
      headerRow,
      dateColumn,
      descriptionColumn,
      amountType,
      ...(amountType === 'single' ? { amountColumn } : { incomeColumn, expenseColumn }),
      idColumn: idColumn || null,
    };
    onConfirm(profile);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">
          <Settings size={20} /> Configura formato import
        </h3>
        
        <p className="modal-message">
          Non ho riconosciuto il formato di questo file. Configura la mappatura delle colonne.
        </p>

        <div className="wizard-form">
          <div className="wizard-field">
            <label>Nome profilo (per riutilizzarlo in futuro)</label>
            <input 
              type="text" 
              value={profileName} 
              onChange={e => setProfileName(e.target.value)}
              placeholder="Es: La mia banca"
            />
          </div>

          <div className="wizard-field">
            <label>Colonna Data *</label>
            <select value={dateColumn} onChange={e => setDateColumn(e.target.value)}>
              <option value="">-- Seleziona --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div className="wizard-field">
            <label>Colonna Descrizione *</label>
            <select value={descriptionColumn} onChange={e => setDescriptionColumn(e.target.value)}>
              <option value="">-- Seleziona --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div className="wizard-field">
            <label>Tipo importo</label>
            <div className="wizard-radio-group">
              <label>
                <input 
                  type="radio" 
                  checked={amountType === 'single'} 
                  onChange={() => setAmountType('single')}
                />
                Colonna unica (+ e -)
              </label>
              <label>
                <input 
                  type="radio" 
                  checked={amountType === 'split'} 
                  onChange={() => setAmountType('split')}
                />
                Colonne separate (Entrate/Uscite)
              </label>
            </div>
          </div>

          {amountType === 'single' ? (
            <div className="wizard-field">
              <label>Colonna Importo *</label>
              <select value={amountColumn} onChange={e => setAmountColumn(e.target.value)}>
                <option value="">-- Seleziona --</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="wizard-field">
                <label>Colonna Entrate</label>
                <select value={incomeColumn} onChange={e => setIncomeColumn(e.target.value)}>
                  <option value="">-- Nessuna --</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div className="wizard-field">
                <label>Colonna Uscite</label>
                <select value={expenseColumn} onChange={e => setExpenseColumn(e.target.value)}>
                  <option value="">-- Nessuna --</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="wizard-field">
            <label>Colonna ID Transazione (opzionale, per deduplicazione)</label>
            <select value={idColumn} onChange={e => setIdColumn(e.target.value)}>
              <option value="">-- Nessuna --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          {sampleData.length > 0 && (
            <div className="wizard-preview">
              <label>Anteprima dati:</label>
              <div className="wizard-preview-table">
                <table>
                  <thead>
                    <tr>
                      {columns.slice(0, 5).map(col => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {columns.slice(0, 5).map(col => <td key={col}>{String(row[col] || '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Annulla</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!isValid}>
            <Check size={16} /> Salva e Importa
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente per gestione conflitti import
function ConflictResolver({ conflicts, onResolve, onCancel }) {
  const [decisions, setDecisions] = useState(
    conflicts.reduce((acc, c, i) => ({ ...acc, [i]: 'skip' }), {})
  );

  const handleDecision = (index, decision) => {
    setDecisions(prev => ({ ...prev, [index]: decision }));
  };

  const handleConfirm = () => {
    const resolved = conflicts.map((c, i) => ({ ...c, decision: decisions[i] }));
    const toReplace = resolved.filter(c => c.decision === 'replace');
    const toAdd = resolved.filter(c => c.decision === 'add');
    onResolve(toReplace, toAdd);
  };

  const selectAll = (decision) => {
    setDecisions(conflicts.reduce((acc, _, i) => ({ ...acc, [i]: decision }), {}));
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">
          <AlertCircle size={20} /> Conflitti rilevati
        </h3>
        
        <p className="modal-message">
          Ho trovato <strong>{conflicts.length}</strong> transazioni con stessa data e importo ma descrizione diversa. 
          Potrebbero essere transazioni rinominate o movimenti separati.
        </p>

        <div className="conflict-actions-top">
          <button className="btn-small" onClick={() => selectAll('skip')}>
            Salta tutti
          </button>
          <button className="btn-small" onClick={() => selectAll('replace')}>
            Sostituisci tutti
          </button>
          <button className="btn-small" onClick={() => selectAll('add')}>
            Aggiungi tutti
          </button>
        </div>

        <div className="conflict-list">
          {conflicts.map((conflict, i) => (
            <div key={i} className="conflict-item">
              <div className="conflict-info">
                <div className="conflict-date">
                  {new Date(conflict.existing.date).toLocaleDateString('it-IT')}
                </div>
                <div className="conflict-amount">
                  {formatCurrency(conflict.existing.amount)}
                </div>
              </div>
              <div className="conflict-descriptions">
                <div className="conflict-existing">
                  <span className="conflict-label">Attuale:</span>
                  <span className="conflict-text">{conflict.existing.description}</span>
                </div>
                <div className="conflict-new">
                  <span className="conflict-label">Nuova:</span>
                  <span className="conflict-text">{conflict.new.description}</span>
                </div>
              </div>
              <div className="conflict-decision">
                <label className={decisions[i] === 'skip' ? 'selected' : ''}>
                  <input
                    type="radio"
                    checked={decisions[i] === 'skip'}
                    onChange={() => handleDecision(i, 'skip')}
                  />
                  Mantieni
                </label>
                <label className={decisions[i] === 'replace' ? 'selected' : ''}>
                  <input
                    type="radio"
                    checked={decisions[i] === 'replace'}
                    onChange={() => handleDecision(i, 'replace')}
                  />
                  Sostituisci
                </label>
                <label className={decisions[i] === 'add' ? 'selected' : ''}>
                  <input
                    type="radio"
                    checked={decisions[i] === 'add'}
                    onChange={() => handleDecision(i, 'add')}
                  />
                  Aggiungi
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Annulla import</button>
          <button className="btn-primary" onClick={handleConfirm}>
            <Check size={16} /> Conferma
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente per gestione conflitti categoria
function CategoryConflictResolver({ conflicts, onResolve, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">
          <AlertCircle size={20} /> Conflitti di categoria
        </h3>
        
        <p className="modal-message">
          Alcune transazioni matchano keyword di più categorie. 
          Di default viene usata la keyword più lunga (più specifica).
          Puoi modificare la scelta per ogni transazione.
        </p>

        <div className="conflict-list">
          {conflicts.map((conflict) => (
            <div key={conflict.txId} className="conflict-item">
              <div className="conflict-descriptions">
                <div className="conflict-existing">
                  <span className="conflict-text" style={{ fontWeight: 500 }}>{conflict.description}</span>
                </div>
                <div className="conflict-new" style={{ marginTop: '0.5rem' }}>
                  <span className="conflict-label">Categorie trovate:</span>
                  <span className="conflict-text">
                    {conflict.matches.map(m => `${m.category} (${m.keyword})`).join(', ')}
                  </span>
                </div>
              </div>
              <div className="conflict-decision" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                {conflict.matches.map(m => (
                  <label key={m.category} className={conflict.currentChoice === m.category ? 'selected' : ''}>
                    <input
                      type="radio"
                      checked={conflict.currentChoice === m.category}
                      onChange={() => onResolve(conflict.txId, m.category)}
                    />
                    {m.category} <small style={{ color: 'var(--color-gray-500)' }}>({m.keyword})</small>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            <Check size={16} /> Conferma
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Stat Card
function StatCard({ label, value, icon: Icon, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-label">
        {Icon && <Icon size={18} />}
        {label}
      </div>
      <div className={`stat-value ${type}`}>{formatCurrency(value)}</div>
    </div>
  );
}

export default function MoneyFlow() {
  // State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [importProfiles, setImportProfiles] = useState({});
  const [view, setView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingTx, setEditingTx] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [editingDescription, setEditingDescription] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  // State per wizard import
  const [wizardData, setWizardData] = useState(null); // { columns, sampleData, rawRows, file }
  // State per conflitti import
  const [importConflicts, setImportConflicts] = useState(null); // { conflicts, newTransactions, profileName }
  // State per risoluzioni conflitti categoria memorizzate (descrizione -> categoria)
  const [categoryResolutions, setCategoryResolutions] = useState({});
  // State per dropdown menu
  const [openDropdown, setOpenDropdown] = useState(null); // 'file' | 'actions' | null
  // State per nuova transazione manuale
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  // State per modale gestione categorie
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ date: '', description: '', amount: '', category: 'Altro' });
  // State per paginazione transazioni
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  // State per filtri dashboard
  const [dashboardTypeFilter, setDashboardTypeFilter] = useState('all'); // 'all' | 'income' | 'expenses'
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState([]); // array di categorie selezionate
  // State per segnalare modifiche categorie non applicate
  const [categoriesChanged, setCategoriesChanged] = useState(false);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, searchQuery, view]);
  // State per conflitti categoria durante ricategorizzazione
  const [categoryConflicts, setCategoryConflicts] = useState(null); // [{ txId, description, matches: [{category, keyword}] }]

  // Toast helper (definito prima perché usato negli useEffect)
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Carica dati salvati
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moneyFlow');
      if (saved) {
        const data = JSON.parse(saved);
        setTransactions(data.transactions || []);
        if (data.categories) setCategories({...DEFAULT_CATEGORIES, ...data.categories});
        if (data.importProfiles) setImportProfiles(data.importProfiles);
        if (data.categoryResolutions) setCategoryResolutions(data.categoryResolutions);
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      showToast('Errore nel caricamento dei dati salvati', 'error');
    }
  }, [showToast]);

  // Salva dati
  useEffect(() => {
    if (transactions.length > 0 || Object.keys(importProfiles).length > 0 || Object.keys(categoryResolutions).length > 0) {
      try {
        localStorage.setItem('moneyFlow', JSON.stringify({ transactions, categories, importProfiles, categoryResolutions }));
      } catch (error) {
        console.error('Errore salvataggio:', error);
      }
    }
  }, [transactions, categories, importProfiles, categoryResolutions]);

  // Trova tutte le categorie che matchano una descrizione
  const findMatchingCategories = useCallback((description) => {
    const desc = description.toUpperCase();
    const matches = [];
    for (const [cat, keywords] of Object.entries(categories)) {
      for (const k of keywords) {
        if (desc.includes(k.toUpperCase())) {
          matches.push({ category: cat, keyword: k });
          break; // Una sola keyword per categoria
        }
      }
    }
    return matches;
  }, [categories]);

  // Auto-categorizza (prende la prima, o la keyword più lunga in caso di conflitto)
  const categorize = useCallback((description) => {
    const matches = findMatchingCategories(description);
    if (matches.length === 0) return 'Altro';
    if (matches.length === 1) return matches[0].category;
    // Più match: prendi quello con la keyword più lunga (più specifica)
    const best = matches.reduce((a, b) => a.keyword.length >= b.keyword.length ? a : b);
    return best.category;
  }, [findMatchingCategories]);

  // Parse Excel date
  const parseDate = useCallback((val) => {
    if (!val) return new Date();
    if (typeof val === 'number') {
      return new Date((val - 25569) * 86400 * 1000);
    }
    if (typeof val === 'string') {
      const parts = val.split('/');
      if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]);
    }
    return new Date(val);
  }, []);

  // Parse amount (gestisce formati italiani con virgola)
  const parseAmount = useCallback((val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    // Rimuove tutto tranne numeri, virgola, punto e segno meno
    const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }, []);

  // Tutti i profili disponibili (built-in + custom)
  const allProfiles = useMemo(() => ({
    ...BUILTIN_IMPORT_PROFILES,
    ...importProfiles
  }), [importProfiles]);

  // Auto-detect del formato file
  const detectProfile = useCallback((columns, rows) => {
    // Prova tutti i profili disponibili
    for (const [key, profile] of Object.entries(allProfiles)) {
      const hasDate = columns.includes(profile.dateColumn);
      const hasDesc = columns.includes(profile.descriptionColumn);
      const hasAmount = profile.amountType === 'single' 
        ? columns.includes(profile.amountColumn)
        : columns.includes(profile.incomeColumn) || columns.includes(profile.expenseColumn);
      
      if (hasDate && hasDesc && hasAmount) {
        return { key, profile };
      }
    }
    return null;
  }, [allProfiles]);

  // Processa le righe con un profilo specifico
  const processRowsWithProfile = useCallback((rows, profile) => {
    return rows.map((r, i) => {
      const desc = r[profile.descriptionColumn] || '';
      
      let amt = 0;
      if (profile.amountType === 'split') {
        const entrate = parseAmount(r[profile.incomeColumn]);
        const uscite = parseAmount(r[profile.expenseColumn]);
        amt = entrate > 0 ? entrate : -Math.abs(uscite);
      } else {
        amt = parseAmount(r[profile.amountColumn]);
      }
      
      const date = parseDate(r[profile.dateColumn]);
      
      // ID dalla banca o generato
      const bankId = profile.idColumn ? r[profile.idColumn] : null;
      
      if (!desc || amt === 0) return null;
      
      return {
        id: bankId || `${date.getTime()}-${i}-${Math.random().toString(36).substr(2,9)}`,
        bankId: bankId || null,
        date: date.toISOString(),
        description: desc,
        amount: amt,
        category: categorize(desc),
        note: ''
      };
    }).filter(t => t !== null && !isNaN(t.amount) && t.amount !== 0);
  }, [parseAmount, parseDate, categorize]);

  // Import file - principale
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      
      // Prova vari header rows (0, 17 per Illimity, ecc.)
      const headerRowsToTry = [0, 17, 1, 2];
      let rows = [];
      let columns = [];
      let usedHeaderRow = 0;
      
      for (const headerRow of headerRowsToTry) {
        try {
          const testRows = XLSX.utils.sheet_to_json(sheet, { range: headerRow });
          if (testRows.length > 0) {
            const testCols = Object.keys(testRows[0]);
            // Verifica che le colonne abbiano nomi sensati (non vuoti o numeri)
            const validCols = testCols.filter(c => c && isNaN(c) && c.trim().length > 0);
            if (validCols.length >= 2) {
              rows = testRows;
              columns = testCols;
              usedHeaderRow = headerRow;
              break;
            }
          }
        } catch (e) {
          // Continua con il prossimo
        }
      }
      
      if (rows.length === 0) {
        showToast('Il file non contiene dati validi', 'error');
        setLoading(false);
        return;
      }

      // Prova auto-detect
      const detected = detectProfile(columns, rows);
      
      if (detected) {
        // Formato riconosciuto - processa direttamente
        const newTx = processRowsWithProfile(rows, detected.profile);
        processImportedTransactions(newTx, detected.profile.name);
      } else {
        // Formato non riconosciuto - apri wizard
        setWizardData({
          columns,
          sampleData: rows.slice(0, 5),
          rawRows: rows,
          headerRow: usedHeaderRow
        });
      }
    } catch (error) {
      console.error('Errore import:', error);
      showToast('Errore durante l\'importazione del file', 'error');
    } finally {
      setLoading(false);
    }
  }, [transactions, detectProfile, processRowsWithProfile, showToast]);

  // Funzione per processare transazioni importate con rilevamento conflitti
  const processImportedTransactions = useCallback((newTx, profileName) => {
    // Mappa per lookup veloce: chiave = data+amount (senza descrizione)
    const existingByDateAmount = {};
    transactions.forEach(t => {
      const key = `${t.date}-${t.amount}`;
      if (!existingByDateAmount[key]) existingByDateAmount[key] = [];
      existingByDateAmount[key].push(t);
    });

    // Mappa per match esatto (inclusa descrizione o bankId)
    const existingExact = new Set(
      transactions.map(t => t.bankId || `${t.date}-${t.amount}-${t.description}`)
    );

    const unique = [];
    const conflicts = [];

    newTx.forEach(t => {
      const exactKey = t.bankId || `${t.date}-${t.amount}-${t.description}`;
      
      // Match esatto → skip silenzioso
      if (existingExact.has(exactKey)) {
        return;
      }

      // Controlla conflitti (stessa data+amount, descrizione diversa)
      const dateAmountKey = `${t.date}-${t.amount}`;
      const possibleMatches = existingByDateAmount[dateAmountKey] || [];
      
      const conflict = possibleMatches.find(existing => 
        existing.description !== t.description
      );

      if (conflict) {
        conflicts.push({ existing: conflict, new: t });
      } else {
        unique.push(t);
      }
    });

    // Se ci sono conflitti, mostra il resolver
    if (conflicts.length > 0) {
      setImportConflicts({ conflicts, newTransactions: unique, profileName });
    } else if (unique.length === 0) {
      showToast('Nessuna nuova transazione trovata', 'error');
    } else {
      setTransactions(prev => [...prev, ...unique].sort((a, b) => new Date(b.date) - new Date(a.date)));
      showToast(`Importate ${unique.length} transazioni (${profileName})`);
    }
  }, [transactions, showToast]);

  // Callback quando l'utente risolve i conflitti
  const handleConflictResolve = useCallback((toReplace, toAdd) => {
    if (!importConflicts) return;

    const { newTransactions, conflicts } = importConflicts;
    
    // Crea set di ID da sostituire
    const idsToReplace = new Set(toReplace.map(c => c.existing.id));
    
    // Transazioni sostituite (nuova versione)
    const replacements = toReplace.map(c => c.new);
    
    // Transazioni aggiunte (entrambe coesistono)
    const additions = toAdd.map(c => c.new);
    
    setTransactions(prev => {
      const filtered = prev.filter(t => !idsToReplace.has(t.id));
      const updated = [...filtered, ...newTransactions, ...replacements, ...additions];
      return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const skipped = conflicts.length - toReplace.length - toAdd.length;
    const parts = [];
    if (newTransactions.length > 0) parts.push(`${newTransactions.length} nuove`);
    if (toReplace.length > 0) parts.push(`${toReplace.length} sostituite`);
    if (toAdd.length > 0) parts.push(`${toAdd.length} aggiunte`);
    if (skipped > 0) parts.push(`${skipped} saltate`);
    
    showToast(parts.join(', ') || 'Nessuna modifica');
    
    setImportConflicts(null);
  }, [importConflicts, showToast]);

  // Callback quando il wizard conferma un profilo
  const handleWizardConfirm = useCallback((profile) => {
    if (!wizardData) return;
    
    // Salva il profilo custom
    const profileKey = profile.name.toLowerCase().replace(/\s+/g, '-');
    setImportProfiles(prev => ({
      ...prev,
      [profileKey]: { ...profile, headerRow: wizardData.headerRow }
    }));
    
    // Processa le righe
    const newTx = processRowsWithProfile(wizardData.rawRows, profile);
    processImportedTransactions(newTx, profile.name);
    
    setWizardData(null);
  }, [wizardData, processRowsWithProfile, processImportedTransactions]);

  // Drag and drop
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Export data (Excel)
  const exportData = useCallback(() => {
    const dataToExport = transactions.map(t => ({
      Data: new Date(t.date).toLocaleDateString('it-IT'),
      Descrizione: t.description,
      Categoria: t.category,
      Importo: t.amount
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transazioni');
    XLSX.writeFile(wb, `moneyflow-export-${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('File Excel esportato con successo');
  }, [transactions, showToast]);

  // Export backup (JSON completo con categorie e profili import)
  const exportBackup = useCallback(() => {
    const backup = {
      version: '1.1',
      exportDate: new Date().toISOString(),
      transactions,
      categories,
      importProfiles
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyflow-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup esportato con successo');
  }, [transactions, categories, importProfiles, showToast]);

  // Import backup (JSON)
  const importBackup = useCallback(async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.transactions || !Array.isArray(backup.transactions)) {
        showToast('File di backup non valido', 'error');
        return;
      }
      
      // Conferma prima di sovrascrivere
      if (transactions.length > 0) {
        const confirmed = window.confirm(
          `Questo sostituirà tutti i dati attuali (${transactions.length} transazioni).\nVuoi continuare?`
        );
        if (!confirmed) return;
      }
      
      setTransactions(backup.transactions);
      if (backup.categories) {
        setCategories({ ...DEFAULT_CATEGORIES, ...backup.categories });
      }
      if (backup.importProfiles) {
        setImportProfiles(backup.importProfiles);
      }
      
      // Salva subito nel localStorage
      localStorage.setItem('moneyFlow', JSON.stringify({
        transactions: backup.transactions,
        categories: backup.categories || categories,
        importProfiles: backup.importProfiles || importProfiles
      }));
      
      showToast(`Backup ripristinato: ${backup.transactions.length} transazioni`);
    } catch (error) {
      console.error('Errore import backup:', error);
      showToast('Errore nel ripristino del backup', 'error');
    }
  }, [transactions, categories, showToast]);

  // Delete transaction
  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setConfirmDelete(null);
    showToast('Transazione eliminata');
  }, [showToast]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setTransactions([]);
    localStorage.removeItem('moneyFlow');
    setConfirmDelete(null);
    showToast('Tutti i dati sono stati eliminati');
  }, [showToast]);

  // Aggiungi nuova categoria
  const addCategory = useCallback((name) => {
    if (!name.trim()) return;
    if (categories[name]) {
      showToast('Categoria già esistente', 'error');
      return;
    }
    setCategories(prev => ({ ...prev, [name.trim()]: [] }));
    setNewCategoryName('');
    setCategoriesChanged(true);
    showToast(`Categoria "${name}" creata`);
  }, [categories, showToast]);

  // Elimina categoria
  const deleteCategory = useCallback((name) => {
    setCategories(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
    setCategoriesChanged(true);
    showToast(`Categoria "${name}" eliminata`);
  }, [showToast]);

  // Aggiungi keyword a categoria
  const addKeyword = useCallback((category, keyword) => {
    if (!keyword.trim()) return;
    const upperKeyword = keyword.trim().toUpperCase();
    if (categories[category]?.includes(upperKeyword)) {
      showToast('Keyword già presente', 'error');
      return;
    }
    setCategories(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), upperKeyword]
    }));
    setNewKeyword('');
    setCategoriesChanged(true);
    showToast(`Keyword "${upperKeyword}" aggiunta`);
  }, [categories, showToast]);

  // Rimuovi keyword da categoria
  const removeKeyword = useCallback((category, keyword) => {
    setCategories(prev => ({
      ...prev,
      [category]: prev[category].filter(k => k !== keyword)
    }));
    setCategoriesChanged(true);
  }, []);

  // Ri-categorizza tutte le transazioni (con rilevamento conflitti)
  const recategorizeAll = useCallback(() => {
    const conflicts = [];
    const updated = transactions.map(t => {
      const matches = findMatchingCategories(t.description);
      if (matches.length <= 1) {
        return { ...t, category: matches.length === 1 ? matches[0].category : 'Altro' };
      }
      
      // Controlla se c'è una risoluzione memorizzata per questa descrizione
      const savedResolution = categoryResolutions[t.description];
      if (savedResolution && matches.some(m => m.category === savedResolution)) {
        // Usa la risoluzione memorizzata se la categoria è ancora tra le opzioni
        return { ...t, category: savedResolution };
      }
      
      // Conflitto: più categorie matchano
      // Per ora usa la keyword più lunga, ma registra il conflitto
      const best = matches.reduce((a, b) => a.keyword.length >= b.keyword.length ? a : b);
      conflicts.push({ txId: t.id, description: t.description, matches, currentChoice: best.category });
      return { ...t, category: best.category };
    });
    
    setTransactions(updated);
    setCategoriesChanged(false);
    
    if (conflicts.length > 0) {
      setCategoryConflicts(conflicts);
    } else {
      showToast('Transazioni ri-categorizzate');
    }
  }, [transactions, findMatchingCategories, showToast, categoryResolutions]);

  // Risolvi un conflitto di categoria (e memorizza la scelta)
  const resolveCategoryConflict = useCallback((txId, category) => {
    // Trova la descrizione della transazione per memorizzare la risoluzione
    const conflict = categoryConflicts?.find(c => c.txId === txId);
    if (conflict) {
      setCategoryResolutions(prev => ({
        ...prev,
        [conflict.description]: category
      }));
    }
    
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category } : t));
    setCategoryConflicts(prev => {
      const remaining = prev.filter(c => c.txId !== txId);
      if (remaining.length === 0) {
        showToast('Conflitti risolti (scelte memorizzate)');
        return null;
      }
      return remaining;
    });
  }, [showToast, categoryConflicts]);

  // Chiudi conflitti categoria (applica scelte di default)
  const closeCategoryConflicts = useCallback(() => {
    setCategoryConflicts(null);
    showToast('Transazioni ri-categorizzate (keyword più lunga)');
  }, [showToast]);

  // Aggiungi transazione manuale
  const addManualTransaction = useCallback(() => {
    const { date, description, amount, category } = newTransaction;
    if (!date || !description.trim() || !amount) {
      showToast('Compila tutti i campi obbligatori', 'error');
      return;
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      showToast('Importo non valido', 'error');
      return;
    }
    const tx = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      bankId: null,
      date: new Date(date).toISOString(),
      description: description.trim(),
      amount: parsedAmount,
      category: category || 'Altro',
      note: 'Inserito manualmente'
    };
    setTransactions(prev => [tx, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setNewTransaction({ date: '', description: '', amount: '', category: 'Altro' });
    setShowAddTransaction(false);
    showToast('Transazione aggiunta');
  }, [newTransaction, showToast]);

  // Calcoli statistiche
  const stats = useMemo(() => {
    let filtered = transactions;
    
    // Filtro per anno
    filtered = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
    
    // Filtro per mese
    if (selectedMonth !== null) {
      filtered = filtered.filter(t => new Date(t.date).getMonth() === selectedMonth);
    }
    
    // Dati per dashboard (senza filtro ricerca, ma con filtri dashboard)
    let dashboardFiltered = filtered;
    
    // Filtro per tipo (entrate/uscite)
    if (dashboardTypeFilter === 'income') {
      dashboardFiltered = dashboardFiltered.filter(t => t.amount > 0);
    } else if (dashboardTypeFilter === 'expenses') {
      dashboardFiltered = dashboardFiltered.filter(t => t.amount < 0);
    }
    
    // Filtro per categoria
    if (dashboardCategoryFilter.length > 0) {
      dashboardFiltered = dashboardFiltered.filter(t => dashboardCategoryFilter.includes(t.category));
    }

    const income = dashboardFiltered.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
    const expenses = dashboardFiltered.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
    
    // Raggruppa per categoria
    const byCategory = {};
    dashboardFiltered.filter(t => t.amount < 0).forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t);
    });
    
    const categoryData = Object.entries(byCategory).map(([name, txs]) => ({
      name,
      value: Math.abs(txs.reduce((s, t) => s + t.amount, 0)),
      count: txs.length
    })).sort((a,b) => b.value - a.value);
    
    // Categorie per entrate
    const byCategoryIncome = {};
    dashboardFiltered.filter(t => t.amount > 0).forEach(t => {
      if (!byCategoryIncome[t.category]) byCategoryIncome[t.category] = [];
      byCategoryIncome[t.category].push(t);
    });
    
    const categoryDataIncome = Object.entries(byCategoryIncome).map(([name, txs]) => ({
      name,
      value: txs.reduce((s, t) => s + t.amount, 0),
      count: txs.length
    })).sort((a,b) => b.value - a.value);

    // Dati mensili
    const byMonth = {};
    let monthlyFiltered = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
    if (dashboardTypeFilter === 'income') {
      monthlyFiltered = monthlyFiltered.filter(t => t.amount > 0);
    } else if (dashboardTypeFilter === 'expenses') {
      monthlyFiltered = monthlyFiltered.filter(t => t.amount < 0);
    }
    if (dashboardCategoryFilter.length > 0) {
      monthlyFiltered = monthlyFiltered.filter(t => dashboardCategoryFilter.includes(t.category));
    }
    monthlyFiltered.forEach(t => {
      const month = new Date(t.date).getMonth();
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(t);
    });

    const monthlyData = Array.from({length:12}, (_,i) => {
      const txs = byMonth[i] || [];
      return {
        name: MONTHS_IT[i].substring(0,3),
        Entrate: txs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0),
        Uscite: Math.abs(txs.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))
      };
    });

    // Trend giornaliero
    let dailyData = [];
    if (selectedMonth !== null) {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const byDay = {};
      dashboardFiltered.forEach(t => {
        const day = new Date(t.date).getDate();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(t);
      });
      
      let cumulative = 0;
      dailyData = Array.from({length: daysInMonth}, (_, i) => {
        const day = i + 1;
        const txs = byDay[day] || [];
        const dayTotal = txs.reduce((s,t) => s + t.amount, 0);
        cumulative += dayTotal;
        return { day, Saldo: cumulative, Movimento: dayTotal };
      });
    }
    
    // Lista di tutte le categorie disponibili (per filtro)
    const allCategories = [...new Set(filtered.map(t => t.category))].sort((a, b) => a.localeCompare(b, 'it'));

    // Filtro ricerca (solo per lista transazioni)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    return { income, expenses, balance: income - expenses, categoryData, categoryDataIncome, monthlyData, dailyData, filtered, allCategories };
  }, [transactions, selectedMonth, selectedYear, searchQuery, dashboardTypeFilter, dashboardCategoryFilter]);

  // Update categoria transazione
  const updateTxCategory = useCallback((id, category) => {
    setTransactions(prev => prev.map(t => t.id === id ? {...t, category} : t));
    setEditingTx(null);
  }, []);

  // Update descrizione transazione
  const updateTxDescription = useCallback((id, description) => {
    if (!description.trim()) {
      setEditingDescription(null);
      setNewDescription('');
      return;
    }
    setTransactions(prev => prev.map(t => t.id === id ? {...t, description: description.trim()} : t));
    setEditingDescription(null);
    setNewDescription('');
    showToast('Descrizione aggiornata');
  }, [showToast]);

  // Anni disponibili
  const years = useMemo(() => 
    [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a,b) => b-a),
    [transactions]
  );
  
  // Aggiorna anno se non valido
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  return (
    <div className="app-container" onClick={() => setOpenDropdown(null)}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-logo">MoneyFlow</h1>
          
          <div className="header-controls">
            {transactions.length > 0 && (
              <>
                <div className="dropdown" onClick={e => e.stopPropagation()}>
                  <button className={`btn-secondary dropdown-toggle ${openDropdown === 'file' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'file' ? null : 'file')}>
                    <FileSpreadsheet size={16} /> File <ChevronDown size={14} />
                  </button>
                  {openDropdown === 'file' && (
                    <div className="dropdown-menu">
                      <label className="dropdown-item">
                        <Upload size={16} /> Importa movimenti
                        <input type="file" style={{ display: 'none' }} accept=".xlsx,.xls,.csv"
                          onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ''; setOpenDropdown(null); }} />
                      </label>
                      <button className="dropdown-item" onClick={() => { exportData(); setOpenDropdown(null); }}>
                        <Download size={16} /> Esporta Excel
                      </button>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item" onClick={() => { exportBackup(); setOpenDropdown(null); }}>
                        <Save size={16} /> Backup completo
                      </button>
                      <label className="dropdown-item">
                        <FolderOpen size={16} /> Ripristina backup
                        <input type="file" accept=".json" style={{ display: 'none' }}
                          onChange={e => { if (e.target.files?.[0]) importBackup(e.target.files[0]); e.target.value = ''; setOpenDropdown(null); }} />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="dropdown" onClick={e => e.stopPropagation()}>
                  <button className={`btn-secondary dropdown-toggle ${openDropdown === 'actions' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'actions' ? null : 'actions')}>
                    <Settings size={16} /> Azioni <ChevronDown size={14} />
                  </button>
                  {openDropdown === 'actions' && (
                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={() => { setShowCategoryManager(true); setOpenDropdown(null); }}>
                        <Tag size={16} /> Gestione Categorie
                      </button>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" onClick={() => { if(confirm('Eliminare TUTTI i dati?')) { setTransactions([]); setCategories(DEFAULT_CATEGORIES); } setOpenDropdown(null); }}>
                        <Trash2 size={16} /> Elimina tutti i dati
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {transactions.length > 0 && (view === 'dashboard' || view === 'transactions') && (
        <div className="filters-bar">
          <div className="filters-content">
            <div className="month-buttons">
              <button 
                onClick={() => setSelectedMonth(null)}
                className={`month-btn ${selectedMonth === null ? 'active' : ''}`}
              >
                Tutto
              </button>
              {MONTHS_IT.map((m, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedMonth(i)}
                  className={`month-btn ${selectedMonth === i ? 'active' : ''}`}
                >
                  {m.substring(0,3)}
                </button>
              ))}
            </div>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="year-select"
            >
              {(years.length ? years : [new Date().getFullYear()]).map(y => 
                <option key={y} value={y}>{y}</option>
              )}
            </select>
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <nav className="tab-bar">
          <div className="tab-bar-content">
            <div className="tab-bar-tabs">
              {[['dashboard','Dashboard'],['transactions','Movimenti']].map(([k,l]) => (
                <button key={k} onClick={() => setView(k)} className={`tab-item ${view === k ? 'active' : ''}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      <main className="main-content">
        {/* Drop Zone iniziale */}
        {transactions.length === 0 && (
          <div 
            onDragOver={e => {e.preventDefault(); setDragOver(true);}}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`drop-zone ${dragOver ? 'active' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="drop-zone-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <p className="drop-zone-title">Importazione in corso...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="drop-zone-icon" />
                <p className="drop-zone-title">Trascina qui il tuo file Excel</p>
                <p className="drop-zone-subtitle">Supporta file .xlsx, .xls e .csv</p>
                <label className="btn-primary">
                  <Upload size={18} />
                  Seleziona file
                  <input 
                    type="file" 
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls,.csv" 
                    onChange={e => e.target.files[0] && handleFile(e.target.files[0])} 
                  />
                </label>
              </>
            )}
          </div>
        )}

        {/* Dashboard View */}
        {transactions.length > 0 && view === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Filtri Dashboard */}
            <div className="dashboard-filters">
              <div className="filter-group">
                <span className="filter-label">Mostra:</span>
                <div className="filter-toggle">
                  <button 
                    className={`filter-btn ${dashboardTypeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDashboardTypeFilter('all')}
                  >
                    Tutto
                  </button>
                  <button 
                    className={`filter-btn ${dashboardTypeFilter === 'income' ? 'active' : ''}`}
                    onClick={() => setDashboardTypeFilter('income')}
                  >
                    Entrate
                  </button>
                  <button 
                    className={`filter-btn ${dashboardTypeFilter === 'expenses' ? 'active' : ''}`}
                    onClick={() => setDashboardTypeFilter('expenses')}
                  >
                    Uscite
                  </button>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Categorie:</span>
                <div className="category-filter-chips">
                  {dashboardCategoryFilter.length === 0 ? (
                    <span className="filter-placeholder">Tutte le categorie</span>
                  ) : (
                    dashboardCategoryFilter.map(cat => (
                      <span key={cat} className="filter-chip">
                        {cat}
                        <button onClick={() => setDashboardCategoryFilter(prev => prev.filter(c => c !== cat))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                  <select 
                    className="category-filter-select"
                    value=""
                    onChange={e => {
                      if (e.target.value && !dashboardCategoryFilter.includes(e.target.value)) {
                        setDashboardCategoryFilter(prev => [...prev, e.target.value]);
                      }
                    }}
                  >
                    <option value="">+ Aggiungi</option>
                    {stats.allCategories.filter(c => !dashboardCategoryFilter.includes(c)).sort((a, b) => a.localeCompare(b, 'it')).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {dashboardCategoryFilter.length > 0 && (
                    <button 
                      className="filter-clear" 
                      onClick={() => setDashboardCategoryFilter([])}
                    >
                      Azzera
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <StatCard 
                label="Entrate" 
                value={stats.income} 
                icon={TrendingUp}
                type="positive"
              />
              <StatCard 
                label="Uscite" 
                value={stats.expenses} 
                icon={TrendingDown}
                type="negative"
              />
            </div>

            {/* Charts */}
            <div className="charts-grid">
              {/* Pie Chart */}
              <div className="chart-container">
                <h3 className="chart-title">
                  {dashboardTypeFilter === 'income' ? 'Entrate per categoria' : 
                   dashboardTypeFilter === 'expenses' ? 'Uscite per categoria' : 
                   'Uscite per categoria'}
                </h3>
                {(dashboardTypeFilter === 'income' ? stats.categoryDataIncome : stats.categoryData).length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie 
                        data={dashboardTypeFilter === 'income' ? stats.categoryDataIncome : stats.categoryData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {(dashboardTypeFilter === 'income' ? stats.categoryDataIncome : stats.categoryData).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v) => formatCurrency(v)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span style={{ color: '#374151', fontSize: '12px' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    {dashboardTypeFilter === 'income' ? 'Nessuna entrata nel periodo' : 'Nessuna uscita nel periodo'}
                  </div>
                )}
              </div>

              {/* Bar/Line Chart */}
              <div className="chart-container">
                <h3 className="chart-title">
                  {selectedMonth !== null ? `Trend ${MONTHS_IT[selectedMonth]}` : 'Andamento annuale'}
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  {selectedMonth !== null ? (
                    <LineChart data={stats.dailyData}>
                      <XAxis dataKey="day" tick={{fontSize:11}} />
                      <YAxis tick={{fontSize:11}} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(v) => formatCurrency(v)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  ) : (
                    <BarChart data={stats.monthlyData}>
                      <XAxis dataKey="name" tick={{fontSize:11}} />
                      <YAxis tick={{fontSize:11}} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(v) => formatCurrency(v)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="Entrate" fill="#10b981" radius={[4,4,0,0]} />
                      <Bar dataKey="Uscite" fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Dettaglio categorie</h3>
              </div>
              <div className="card-body">
                {stats.categoryData.length > 0 ? (
                  <div className="category-list">
                    {stats.categoryData.map((cat, i) => (
                      <div key={cat.name} className="category-item">
                        <div className="category-dot" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                        <span className="category-name">{cat.name}</span>
                        <span className="category-count">{cat.count} mov.</span>
                        <span className="category-amount">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Nessuna uscita nel periodo selezionato</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transactions View */}
        {view === 'transactions' && (
          <div className="card card-fullheight" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="card-header">
              <h3 className="card-title">Movimenti ({stats.filtered.length})</h3>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div className="search-wrapper">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => setShowAddTransaction(!showAddTransaction)}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <Plus size={16} /> Aggiungi
                </button>
              </div>
            </div>

            {/* Form nuova transazione */}
            {showAddTransaction && (
              <div className="add-transaction-form">
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={e => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Descrizione *"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  placeholder="Importo *"
                  value={newTransaction.amount}
                  onChange={e => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="form-input"
                  style={{ width: '120px' }}
                />
                <select
                  value={newTransaction.category}
                  onChange={e => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input"
                >
                  {Object.keys(categories).sort((a, b) => a.localeCompare(b, 'it')).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Altro">Altro</option>
                </select>
                <button className="btn-primary" onClick={addManualTransaction} style={{ padding: '0.5rem 0.75rem' }}>
                  <Check size={16} />
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => { setShowAddTransaction(false); setNewTransaction({ date: '', description: '', amount: '', category: 'Altro' }); }}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="transactions-list">
              {stats.filtered.length > 0 ? (
                <>
                {stats.filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className="transaction-date">
                      {new Date(tx.date).toLocaleDateString('it-IT')}
                    </div>
                    <div className="transaction-details">
                      {editingDescription === tx.id ? (
                        <input
                          type="text"
                          value={newDescription}
                          onChange={e => setNewDescription(e.target.value)}
                          onBlur={() => updateTxDescription(tx.id, newDescription)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') updateTxDescription(tx.id, newDescription);
                            if (e.key === 'Escape') { setEditingDescription(null); setNewDescription(''); }
                          }}
                          autoFocus
                          className="search-input"
                          style={{ paddingLeft: '0.5rem', fontSize: '0.875rem', marginBottom: '0.25rem' }}
                        />
                      ) : (
                        <div 
                          className="transaction-description" 
                          onClick={() => { setEditingDescription(tx.id); setNewDescription(tx.description); }}
                          style={{ cursor: 'pointer' }}
                          title="Clicca per modificare"
                        >
                          {tx.description}
                        </div>
                      )}
                      {editingTx === tx.id ? (
                        <select 
                          value={tx.category} 
                          onChange={e => updateTxCategory(tx.id, e.target.value)}
                          onBlur={() => setEditingTx(null)} 
                          autoFocus
                          className="category-select"
                        >
                          {Object.keys(categories).sort((a, b) => a.localeCompare(b, 'it')).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="Altro">Altro</option>
                        </select>
                      ) : (
                        <button 
                          onClick={() => setEditingTx(tx.id)}
                          className="transaction-category"
                        >
                          <Tag size={10} /> {tx.category}
                        </button>
                      )}
                    </div>
                    <div className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </div>
                    <button 
                      className="btn-delete"
                      onClick={() => setConfirmDelete({ type: 'single', id: tx.id })}
                      title="Elimina transazione"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {/* Paginazione bottom */}
                {stats.filtered.length > ITEMS_PER_PAGE && (
                  <div className="pagination">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Precedente
                    </button>
                    <span className="pagination-info">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, stats.filtered.length)} di {stats.filtered.length} movimenti
                    </span>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(stats.filtered.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(stats.filtered.length / ITEMS_PER_PAGE)}
                    >
                      Successiva →
                    </button>
                  </div>
                )}
                </>
              ) : (
                <div className="empty-state">
                  <Search className="empty-state-icon" />
                  <p>Nessuna transazione trovata</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal category-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gestione Categorie</h2>
              <button className="modal-close" onClick={() => setShowCategoryManager(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-gray-500)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Le transazioni vengono categorizzate automaticamente se la descrizione contiene una delle parole chiave.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {categoriesChanged && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={14} /> Rilevate modifiche.
                  </span>
                )}
                <button className="btn-secondary" onClick={recategorizeAll}>
                  Ri-categorizza tutto
                </button>
              </div>
              
              {/* Aggiungi nuova categoria */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Nome nuova categoria..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory(newCategoryName)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', flex: 1, maxWidth: 'none' }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => addCategory(newCategoryName)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <Plus size={16} /> Aggiungi
                </button>
              </div>

              <div className="categories-grid">
                {Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([cat, keywords]) => (
                  <div 
                    key={cat} 
                    className="category-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div className="category-card-title" style={{ marginBottom: 0 }}>{cat}</div>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="btn-delete"
                        title="Elimina categoria"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Aggiungi keyword */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Nuova keyword..."
                        value={editingCategory === cat ? newKeyword : ''}
                        onChange={e => { setEditingCategory(cat); setNewKeyword(e.target.value); }}
                        onKeyDown={e => e.key === 'Enter' && addKeyword(cat, newKeyword)}
                        className="search-input"
                        style={{ paddingLeft: '0.75rem', flex: 1, maxWidth: 'none', fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                      />
                      <button 
                        className="btn-secondary" 
                        onClick={() => addKeyword(cat, newKeyword)}
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    
                    <div className="keywords-list">
                      {keywords.map(k => (
                        <span 
                          key={k} 
                          className="keyword-tag"
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {k}
                          <button
                            onClick={() => removeKeyword(cat, k)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              padding: 0, 
                              cursor: 'pointer',
                              display: 'flex',
                              color: 'var(--color-gray-500)'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {keywords.length === 0 && (
                        <span style={{ color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
                          Nessuna keyword
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirm Modal */}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'all' ? 'Elimina tutti i dati' : 'Elimina transazione'}
          message={confirmDelete.type === 'all' 
            ? 'Sei sicuro di voler eliminare tutte le transazioni? Questa azione non può essere annullata.'
            : 'Sei sicuro di voler eliminare questa transazione?'
          }
          onConfirm={() => confirmDelete.type === 'all' ? clearAllData() : deleteTransaction(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Import Wizard Modal */}
      {wizardData && (
        <ImportWizard
          columns={wizardData.columns}
          sampleData={wizardData.sampleData}
          existingProfiles={allProfiles}
          onConfirm={handleWizardConfirm}
          onCancel={() => setWizardData(null)}
        />
      )}

      {/* Conflict Resolver Modal */}
      {importConflicts && (
        <ConflictResolver
          conflicts={importConflicts.conflicts}
          onResolve={handleConflictResolve}
          onCancel={() => setImportConflicts(null)}
        />
      )}

      {/* Category Conflict Resolver Modal */}
      {categoryConflicts && (
        <CategoryConflictResolver
          conflicts={categoryConflicts}
          onResolve={resolveCategoryConflict}
          onClose={closeCategoryConflicts}
        />
      )}
    </div>
  );
}