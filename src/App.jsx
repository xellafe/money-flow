import { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, LineChart, Line, Legend 
} from 'recharts';
import { 
  Upload, TrendingUp, TrendingDown, Tag, Search, Trash2, 
  Download, FileSpreadsheet, X, Check, AlertCircle, Loader2, Plus, Edit2
} from 'lucide-react';
import './App.css';

// Costanti
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];

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
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      showToast('Errore nel caricamento dei dati salvati', 'error');
    }
  }, [showToast]);

  // Salva dati
  useEffect(() => {
    if (transactions.length > 0) {
      try {
        localStorage.setItem('moneyFlow', JSON.stringify({ transactions, categories }));
      } catch (error) {
        console.error('Errore salvataggio:', error);
      }
    }
  }, [transactions, categories]);

  // Auto-categorizza
  const categorize = useCallback((description) => {
    const desc = description.toUpperCase();
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => desc.includes(k.toUpperCase()))) return cat;
    }
    return 'Altro';
  }, [categories]);

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

  // Verifica se le righe contengono dati validi
  const hasValidData = useCallback((rows) => {
    if (!rows || rows.length === 0) return false;
    const firstRow = rows[0];
    // Controlla se ci sono colonne riconosciute
    const knownColumns = ['Causale', 'Descrizione Operazione', 'Descrizione', 'Importo', 'Entrate', 'Uscite', 'Data operazione', 'Data'];
    return knownColumns.some(col => col in firstRow);
  }, []);

  // Import file
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      
      // Prova prima il formato standard (header in riga 1)
      let rows = XLSX.utils.sheet_to_json(sheet);
      
      // Se non trova dati validi, prova con header in riga 18 (formato Illimity/banche)
      if (rows.length === 0 || !hasValidData(rows)) {
        rows = XLSX.utils.sheet_to_json(sheet, { range: 17 }); // 17 = riga 18 (0-indexed)
      }
      
      if (rows.length === 0) {
        showToast('Il file non contiene dati validi', 'error');
        setLoading(false);
        return;
      }

      const newTx = rows.map((r, i) => {
        // Supporta vari formati di colonne
        const desc = r['Causale'] || r['Descrizione Operazione'] || r['Descrizione'] || r['Description'] || '';
        
        // Gestisce colonne Entrate/Uscite separate o colonna Importo singola
        let amt = 0;
        if (r['Entrate'] !== undefined || r['Uscite'] !== undefined) {
          const entrate = parseAmount(r['Entrate']);
          const uscite = parseAmount(r['Uscite']);
          amt = entrate > 0 ? entrate : -Math.abs(uscite);
        } else {
          amt = parseAmount(r['Importo'] || r['Amount'] || 0);
        }
        
        const dateVal = r['Data operazione'] || r['Data Operazione'] || r['Data'] || r['Data Valuta'] || r['Date'];
        const date = parseDate(dateVal);
        
        // Salta righe senza descrizione o importo
        if (!desc || amt === 0) return null;
        
        return {
          id: `${date.getTime()}-${i}-${Math.random().toString(36).substr(2,9)}`,
          date: date.toISOString(),
          description: desc,
          amount: amt,
          category: categorize(desc),
          note: ''
        };
      }).filter(t => t !== null && !isNaN(t.amount) && t.amount !== 0);

      // Deduplica
      const existing = new Set(transactions.map(t => `${t.date}-${t.amount}-${t.description}`));
      const unique = newTx.filter(t => !existing.has(`${t.date}-${t.amount}-${t.description}`));
      
      if (unique.length === 0) {
        showToast('Nessuna nuova transazione trovata', 'error');
        return;
      }

      setTransactions(prev => [...prev, ...unique].sort((a,b) => new Date(b.date) - new Date(a.date)));
      showToast(`Importate ${unique.length} transazioni`);
    } catch (error) {
      console.error('Errore import:', error);
      showToast('Errore durante l\'importazione del file', 'error');
    } finally {
      setLoading(false);
    }
  }, [transactions, categorize, parseDate, parseAmount, hasValidData, showToast]);

  // Drag and drop
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Export data
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
    XLSX.writeFile(wb, `budget-export-${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('File esportato con successo');
  }, [transactions, showToast]);

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
    showToast(`Categoria "${name}" creata`);
  }, [categories, showToast]);

  // Elimina categoria
  const deleteCategory = useCallback((name) => {
    if (DEFAULT_CATEGORIES[name]) {
      showToast('Non puoi eliminare le categorie predefinite', 'error');
      return;
    }
    setCategories(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
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
    showToast(`Keyword "${upperKeyword}" aggiunta`);
  }, [categories, showToast]);

  // Rimuovi keyword da categoria
  const removeKeyword = useCallback((category, keyword) => {
    setCategories(prev => ({
      ...prev,
      [category]: prev[category].filter(k => k !== keyword)
    }));
  }, []);

  // Ri-categorizza tutte le transazioni
  const recategorizeAll = useCallback(() => {
    setTransactions(prev => prev.map(t => ({
      ...t,
      category: categorize(t.description)
    })));
    showToast('Transazioni ri-categorizzate');
  }, [categorize, showToast]);

  // Calcoli statistiche
  const stats = useMemo(() => {
    let filtered = transactions;
    
    // Filtro per anno
    filtered = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
    
    // Filtro per mese
    if (selectedMonth !== null) {
      filtered = filtered.filter(t => new Date(t.date).getMonth() === selectedMonth);
    }
    
    // Filtro per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    const income = filtered.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
    
    // Raggruppa per categoria
    const byCategory = {};
    filtered.filter(t => t.amount < 0).forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t);
    });
    
    const categoryData = Object.entries(byCategory).map(([name, txs]) => ({
      name,
      value: Math.abs(txs.reduce((s, t) => s + t.amount, 0)),
      count: txs.length
    })).sort((a,b) => b.value - a.value);

    // Dati mensili
    const byMonth = {};
    transactions.filter(t => new Date(t.date).getFullYear() === selectedYear).forEach(t => {
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
      filtered.forEach(t => {
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

    return { income, expenses, balance: income - expenses, categoryData, monthlyData, dailyData, filtered };
  }, [transactions, selectedMonth, selectedYear, searchQuery]);

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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-logo">
            <span>�</span> MoneyFlow
          </h1>
          
          <div className="header-controls">
            {transactions.length > 0 && (
              <>
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="year-select"
                >
                  {(years.length ? years : [new Date().getFullYear()]).map(y => 
                    <option key={y} value={y}>{y}</option>
                  )}
                </select>
                
                <button className="btn-secondary" onClick={exportData}>
                  <Download size={16} /> Esporta
                </button>
              </>
            )}
            
            <nav className="nav-tabs">
              {[['dashboard','Dashboard'],['transactions','Movimenti'],['categories','Categorie']].map(([k,l]) => (
                <button 
                  key={k} 
                  onClick={() => setView(k)}
                  className={`nav-tab ${view === k ? 'active' : ''}`}
                >
                  {l}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

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
            {/* Month selector */}
            <div className="month-selector">
              <button 
                onClick={() => setSelectedMonth(null)}
                className={`month-btn ${selectedMonth === null ? 'active' : ''}`}
              >
                Tutto {selectedYear}
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
                <h3 className="chart-title">Uscite per categoria</h3>
                {stats.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie 
                        data={stats.categoryData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {stats.categoryData.map((_, i) => (
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
                  <div className="chart-empty">Nessuna uscita nel periodo</div>
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

            {/* Import more */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <label className="import-link">
                <Upload size={16} />
                Importa altri movimenti
                <input 
                  type="file" 
                  style={{ display: 'none' }}
                  accept=".xlsx,.xls,.csv"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])} 
                />
              </label>
            </div>
          </div>
        )}

        {/* Transactions View */}
        {view === 'transactions' && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
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
                <label className="btn-secondary">
                  <Upload size={14} /> Importa
                  <input 
                    type="file" 
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls,.csv"
                    onChange={e => e.target.files[0] && handleFile(e.target.files[0])} 
                  />
                </label>
              </div>
            </div>
            
            <div className="transactions-list">
              {stats.filtered.length > 0 ? (
                stats.filtered.map(tx => (
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
                          {Object.keys(categories).map(c => (
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
                ))
              ) : (
                <div className="empty-state">
                  <Search className="empty-state-icon" />
                  <p>Nessuna transazione trovata</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories View */}
        {view === 'categories' && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="card-header">
              <h3 className="card-title">Regole di categorizzazione</h3>
              <button className="btn-secondary" onClick={recategorizeAll}>
                Ri-categorizza tutto
              </button>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-gray-500)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Le transazioni vengono categorizzate automaticamente se la descrizione contiene una delle parole chiave.
              </p>
              
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
                {Object.entries(categories).map(([cat, keywords]) => (
                  <div key={cat} className="category-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div className="category-card-title" style={{ marginBottom: 0 }}>{cat}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setEditingCategory(editingCategory === cat ? null : cat)}
                          className="btn-delete"
                          style={{ color: 'var(--color-primary)' }}
                          title="Modifica keywords"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!DEFAULT_CATEGORIES[cat] && (
                          <button
                            onClick={() => deleteCategory(cat)}
                            className="btn-delete"
                            title="Elimina categoria"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Aggiungi keyword (visibile solo in editing) */}
                    {editingCategory === cat && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Nuova keyword..."
                          value={newKeyword}
                          onChange={e => setNewKeyword(e.target.value)}
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
                    )}
                    
                    <div className="keywords-list">
                      {keywords.map(k => (
                        <span 
                          key={k} 
                          className="keyword-tag"
                          style={{ 
                            cursor: editingCategory === cat ? 'pointer' : 'default',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {k}
                          {editingCategory === cat && (
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
                          )}
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
        )}

        {/* Clear all button */}
        {transactions.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              className="btn-secondary"
              style={{ color: 'var(--color-danger)' }}
              onClick={() => setConfirmDelete({ type: 'all' })}
            >
              <Trash2 size={14} /> Elimina tutti i dati
            </button>
          </div>
        )}
      </main>

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
    </div>
  );
}
