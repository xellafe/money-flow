import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Upload,
  TrendingUp,
  TrendingDown,
  Tag,
  Search,
  Trash2,
  Download,
  FileSpreadsheet,
  X,
  Check,
  Loader2,
  Plus,
  Save,
  FolderOpen,
  Settings,
  ChevronDown,
  Cloud,
  CloudOff,
  CreditCard,
} from "lucide-react";

// Constants
import {
  COLORS,
  DEFAULT_CATEGORIES,
  MONTHS_IT,
  ITEMS_PER_PAGE,
} from "./constants";

// Utils
import { formatCurrency } from "./utils";

// Components
import {
  Toast,
  StatCard,
  ConfirmModal,
  ImportWizard,
  ConflictResolver,
  CategoryConflictResolver,
  CategoryManager,
  SyncSettings,
  PayPalEnrichWizard,
  GoogleSignInButton,
} from "./components";

// Hooks
import { useGoogleDrive, useToast, useModals, useFilters, useCategories, useTransactionData, useImportLogic, useViewState } from "./hooks";

import "./App.css";

export default function MoneyFlow() {
  // Hooks
  const { toast, setToast, showToast } = useToast();
  const {
    confirmDelete, setConfirmDelete,
    editingTx, setEditingTx,
    editingDescription, setEditingDescription,
    newDescription, setNewDescription,
    showAddTransaction, setShowAddTransaction,
    showCategoryManager, setShowCategoryManager,
    showSyncSettings, setShowSyncSettings,
    openDropdown, setOpenDropdown,
    newTransaction, setNewTransaction,
  } = useModals();

  const { view, setView } = useViewState();

  const {
    categories, setCategories,
    importProfiles, setImportProfiles,
    categoriesChanged,
    categoryConflicts, setCategoryConflicts,
    addCategory,
    deleteCategory,
    addKeyword,
    removeKeyword,
    recategorizeAll,
  } = useCategories({ showToast });

  const {
    transactions, setTransactions,
    categoryResolutions, setCategoryResolutions,
    years,
    exportData,
    exportBackup,
    importBackup,
    deleteTransaction,
    clearAllData,
    addManualTransaction,
    updateTxCategory,
    updateTxDescription,
  } = useTransactionData({
    categories,
    importProfiles,
    setCategories,
    setImportProfiles,
    showToast,
    setConfirmDelete,
    newTransaction,
    setShowAddTransaction,
    setNewTransaction,
    setEditingTx,
    setEditingDescription,
    setNewDescription,
  });

  const {
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    dashboardTypeFilter, setDashboardTypeFilter,
    dashboardCategoryFilter, setDashboardCategoryFilter,
    transactionsCategoryFilter, setTransactionsCategoryFilter,
    expandedCategory, setExpandedCategory,
    showCategoryPercentage, setShowCategoryPercentage,
  } = useFilters({ years });

  // State per indicare se i dati iniziali sono stati caricati
  const [isInitialized, setIsInitialized] = useState(false);

  // Google Drive sync hook
  const googleDrive = useGoogleDrive();

  // Import logic hook
  const {
    wizardData, setWizardData,
    importConflicts, setImportConflicts,
    paypalData, setPaypalData,
    dragOver, setDragOver,
    loading,
    handleFile,
    handlePayPalFile,
    applyPayPalEnrichment,
    handleConflictResolve,
    handleWizardConfirm,
    onDrop,
  } = useImportLogic({
    transactions,
    setTransactions,
    categories,
    importProfiles,
    setImportProfiles,
    showToast,
  });

  // isInitialized: lazy initializers in hooks load localStorage synchronously;
  // this effect just gates the first render frame
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInitialized(true);
  }, []);

  // Conferma scelte conflitti categoria
  const confirmCategoryConflicts = useCallback(
    (resolutions) => {
      const newResolutions = {};
      resolutions.forEach((r) => {
        newResolutions[r.description] = r.category;
      });
      setCategoryResolutions((prev) => ({
        ...prev,
        ...newResolutions,
      }));

      setTransactions((prev) =>
        prev.map((t) => {
          const resolution = resolutions.find((r) => r.txId === t.id);
          if (resolution) {
            return { ...t, category: resolution.category };
          }
          return t;
        }),
      );

      setCategoryConflicts(null);
      showToast(`${resolutions.length} conflitti risolti (scelte memorizzate)`);
    },
    [showToast, setCategoryResolutions, setTransactions, setCategoryConflicts],
  );

  // Calcoli statistiche
  const stats = useMemo(() => {
    let filtered = transactions;

    filtered = transactions.filter(
      (t) => new Date(t.date).getFullYear() === selectedYear,
    );

    if (selectedMonth !== null) {
      filtered = filtered.filter(
        (t) => new Date(t.date).getMonth() === selectedMonth,
      );
    }

    let dashboardFiltered = filtered;

    if (dashboardTypeFilter === "income") {
      dashboardFiltered = dashboardFiltered.filter((t) => t.amount > 0);
    } else if (dashboardTypeFilter === "expenses") {
      dashboardFiltered = dashboardFiltered.filter((t) => t.amount < 0);
    }

    if (dashboardCategoryFilter.length > 0) {
      dashboardFiltered = dashboardFiltered.filter((t) =>
        dashboardCategoryFilter.includes(t.category),
      );
    }

    const income = dashboardFiltered
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    const expenses = dashboardFiltered
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const byCategory = {};
    dashboardFiltered
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        if (!byCategory[t.category]) byCategory[t.category] = [];
        byCategory[t.category].push(t);
      });

    const categoryData = Object.entries(byCategory)
      .map(([name, txs]) => ({
        name,
        value: Math.abs(txs.reduce((s, t) => s + t.amount, 0)),
        count: txs.length,
        transactions: txs.sort((a, b) => new Date(b.date) - new Date(a.date)),
      }))
      .sort((a, b) => b.value - a.value);

    const byCategoryIncome = {};
    dashboardFiltered
      .filter((t) => t.amount > 0)
      .forEach((t) => {
        if (!byCategoryIncome[t.category]) byCategoryIncome[t.category] = [];
        byCategoryIncome[t.category].push(t);
      });

    const categoryDataIncome = Object.entries(byCategoryIncome)
      .map(([name, txs]) => ({
        name,
        value: txs.reduce((s, t) => s + t.amount, 0),
        count: txs.length,
        transactions: txs.sort((a, b) => new Date(b.date) - new Date(a.date)),
      }))
      .sort((a, b) => b.value - a.value);

    const byMonth = {};
    let monthlyFiltered = transactions.filter(
      (t) => new Date(t.date).getFullYear() === selectedYear,
    );
    if (dashboardTypeFilter === "income") {
      monthlyFiltered = monthlyFiltered.filter((t) => t.amount > 0);
    } else if (dashboardTypeFilter === "expenses") {
      monthlyFiltered = monthlyFiltered.filter((t) => t.amount < 0);
    }
    if (dashboardCategoryFilter.length > 0) {
      monthlyFiltered = monthlyFiltered.filter((t) =>
        dashboardCategoryFilter.includes(t.category),
      );
    }
    monthlyFiltered.forEach((t) => {
      const month = new Date(t.date).getMonth();
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(t);
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const txs = byMonth[i] || [];
      return {
        name: MONTHS_IT[i].substring(0, 3),
        Entrate: txs
          .filter((t) => t.amount > 0)
          .reduce((s, t) => s + t.amount, 0),
        Uscite: Math.abs(
          txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
        ),
      };
    });

    // Dati per stacked area chart - categorie per mese (top 6 + Altre categorie)
    const topCategories = categoryData.slice(0, 6).map(c => c.name);
    const monthlyCategoryData = Array.from({ length: 12 }, (_, i) => {
      const txs = (byMonth[i] || []).filter(t => t.amount < 0);
      const monthData = { name: MONTHS_IT[i].substring(0, 3) };
      
      // Calcola per ogni top category
      topCategories.forEach(cat => {
        monthData[cat] = Math.abs(
          txs.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0)
        );
      });
      
      // Calcola "Altre categorie" per le categorie rimanenti
      const otherAmount = Math.abs(
        txs.filter(t => !topCategories.includes(t.category)).reduce((s, t) => s + t.amount, 0)
      );
      if (otherAmount > 0) {
        monthData['Altre cat.'] = otherAmount;
      }
      
      return monthData;
    });
    
    // Lista categorie per il grafico (aggiungi 'Altre cat.' solo se presente)
    const hasOtherCategories = categoryData.length > 6;
    const chartCategories = hasOtherCategories 
      ? [...topCategories, 'Altre cat.'] 
      : topCategories;

    let dailyData = [];
    if (selectedMonth !== null) {
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
      ).getDate();
      const byDay = {};
      dashboardFiltered.forEach((t) => {
        const day = new Date(t.date).getDate();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(t);
      });

      let cumulative = 0;
      dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const txs = byDay[day] || [];
        const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
        cumulative += dayTotal;
        return { day, Saldo: cumulative, Movimento: dayTotal };
      });
    }

    const allCategories = [...new Set(filtered.map((t) => t.category))].sort(
      (a, b) => a.localeCompare(b, "it"),
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query),
      );
    }

    if (transactionsCategoryFilter) {
      filtered = filtered.filter(
        (t) => t.category === transactionsCategoryFilter,
      );
    }

    return {
      income,
      expenses,
      balance: income - expenses,
      categoryData,
      categoryDataIncome,
      monthlyData,
      monthlyCategoryData,
      chartCategories,
      dailyData,
      filtered,
      allCategories,
    };
  }, [
    transactions,
    selectedMonth,
    selectedYear,
    searchQuery,
    dashboardTypeFilter,
    dashboardCategoryFilter,
    transactionsCategoryFilter,
  ]);

  // Mostra nulla finché i dati iniziali non sono caricati
  if (!isInitialized) {
    return null;
  }

  return (
    <div className="app-container" onClick={() => setOpenDropdown(null)}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-logo">MoneyFlow</h1>

          <div className="header-controls">
            {transactions.length > 0 && (
              <>
                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`btn-secondary dropdown-toggle ${openDropdown === "file" ? "active" : ""}`}
                    onClick={() =>
                      setOpenDropdown(openDropdown === "file" ? null : "file")
                    }
                  >
                    <FileSpreadsheet size={16} /> File <ChevronDown size={14} />
                  </button>
                  {openDropdown === "file" && (
                    <div className="dropdown-menu">
                      <label className="dropdown-item">
                        <Upload size={16} /> Importa movimenti
                        <input
                          type="file"
                          style={{ display: "none" }}
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => {
                            if (e.target.files[0])
                              handleFile(e.target.files[0]);
                            e.target.value = "";
                            setOpenDropdown(null);
                          }}
                        />
                      </label>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          exportData();
                          setOpenDropdown(null);
                        }}
                      >
                        <Download size={16} /> Esporta Excel
                      </button>
                      <div className="dropdown-divider" />
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          exportBackup();
                          setOpenDropdown(null);
                        }}
                      >
                        <Save size={16} /> Backup completo
                      </button>
                      <label className="dropdown-item">
                        <FolderOpen size={16} /> Ripristina backup
                        <input
                          type="file"
                          accept=".json"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files?.[0])
                              importBackup(e.target.files[0]);
                            e.target.value = "";
                            setOpenDropdown(null);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`btn-secondary dropdown-toggle ${openDropdown === "actions" ? "active" : ""}`}
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "actions" ? null : "actions",
                      )
                    }
                  >
                    <Settings size={16} /> Azioni <ChevronDown size={14} />
                  </button>
                  {openDropdown === "actions" && (
                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowCategoryManager(true);
                          setOpenDropdown(null);
                        }}
                      >
                        <Tag size={16} /> Gestione Categorie
                      </button>
                      <label
                        className="dropdown-item"
                        style={{ cursor: "pointer" }}
                      >
                        <CreditCard size={16} /> Arricchisci da PayPal
                        <input
                          type="file"
                          style={{ display: "none" }}
                          accept=".csv"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handlePayPalFile(e.target.files[0]);
                            }
                            e.target.value = "";
                            setOpenDropdown(null);
                          }}
                        />
                      </label>
                      {googleDrive.isElectron && (
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setShowSyncSettings(true);
                            setOpenDropdown(null);
                          }}
                        >
                          <Cloud size={16} /> Sincronizzazione Cloud
                        </button>
                      )}
                      <div className="dropdown-divider" />
                      <button
                        className="dropdown-item danger"
                        onClick={() => {
                          if (confirm("Eliminare TUTTI i dati?")) {
                            setTransactions([]);
                            setCategories(DEFAULT_CATEGORIES);
                          }
                          setOpenDropdown(null);
                        }}
                      >
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

      {transactions.length > 0 &&
        (view === "dashboard" || view === "transactions") && (
          <div className="filters-bar">
            <div className="filters-content">
              <div className="month-buttons">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className={`month-btn ${selectedMonth === null ? "active" : ""}`}
                >
                  Tutto
                </button>
                {MONTHS_IT.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(i)}
                    className={`month-btn ${selectedMonth === i ? "active" : ""}`}
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="year-select"
              >
                {(years.length ? years : [new Date().getFullYear()]).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        )}

      {transactions.length > 0 && (
        <nav className="tab-bar">
          <div className="tab-bar-content">
            <div className="tab-bar-tabs">
              {[
                ["dashboard", "Dashboard"],
                ["transactions", "Movimenti"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`tab-item ${view === k ? "active" : ""}`}
                >
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
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`drop-zone ${dragOver ? "active" : ""}`}
          >
            {loading ? (
              <>
                <Loader2
                  className="drop-zone-icon"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <p className="drop-zone-title">Importazione in corso...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="drop-zone-icon" />
                <p className="drop-zone-title">
                  Trascina qui il tuo file Excel
                </p>
                <p className="drop-zone-subtitle">
                  Supporta file .xlsx, .xls e .csv
                </p>
                <label className="btn-primary">
                  <Upload size={18} />
                  Seleziona file
                  <input
                    type="file"
                    style={{ display: "none" }}
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) =>
                      e.target.files[0] && handleFile(e.target.files[0])
                    }
                  />
                </label>

                {/* Opzioni Google Drive (solo Electron) */}
                {googleDrive.isElectron && (
                  <div
                    style={{
                      marginTop: "2rem",
                      paddingTop: "2rem",
                      borderTop: "1px solid var(--color-gray-200)",
                      width: "100%",
                      maxWidth: "400px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        color: "var(--color-gray-500)",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                      }}
                    >
                      Oppure ripristina da cloud
                    </p>

                    {googleDrive.isAuthenticated ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            color: "var(--color-success)",
                            fontSize: "0.875rem",
                          }}
                        >
                          <Cloud size={16} />
                          <span>
                            Connesso come{" "}
                            {googleDrive.userInfo?.email || "Google"}
                          </span>
                        </div>

                        {googleDrive.backupInfo ? (
                          <button
                            className="btn-secondary"
                            onClick={async () => {
                              const result = await googleDrive.downloadBackup();
                              if (result.success && result.data) {
                                setTransactions(result.data.transactions || []);
                                setCategories(
                                  result.data.categories || DEFAULT_CATEGORIES,
                                );
                                setImportProfiles(
                                  result.data.importProfiles || {},
                                );
                                showToast("Dati ripristinati da Google Drive");
                              } else {
                                showToast(
                                  result.error ||
                                    "Errore durante il ripristino",
                                  "error",
                                );
                              }
                            }}
                            disabled={googleDrive.syncStatus === "syncing"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {googleDrive.syncStatus === "syncing" ? (
                              <Loader2 size={16} className="spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            Ripristina backup (
                            {new Date(
                              googleDrive.backupInfo.modifiedTime,
                            ).toLocaleDateString("it-IT")}
                            )
                          </button>
                        ) : (
                          <p
                            style={{
                              color: "var(--color-gray-400)",
                              fontSize: "0.875rem",
                              margin: 0,
                            }}
                          >
                            Nessun backup trovato su Drive
                          </p>
                        )}
                      </div>
                    ) : (
                      <GoogleSignInButton
                        onClick={async () => {
                          const result = await googleDrive.signIn();
                          if (result.success) {
                            showToast("Connesso a Google Drive");
                          } else {
                            showToast(
                              result.error || "Errore durante la connessione",
                              "error",
                            );
                          }
                        }}
                        disabled={googleDrive.isLoading}
                        isLoading={googleDrive.isLoading}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Dashboard View */}
        {transactions.length > 0 && view === "dashboard" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Filtri Dashboard */}
            <div className="dashboard-filters">
              <div className="filter-group">
                <span className="filter-label">Mostra:</span>
                <div className="filter-toggle">
                  <button
                    className={`filter-btn ${dashboardTypeFilter === "all" ? "active" : ""}`}
                    onClick={() => setDashboardTypeFilter("all")}
                  >
                    Tutto
                  </button>
                  <button
                    className={`filter-btn ${dashboardTypeFilter === "income" ? "active" : ""}`}
                    onClick={() => setDashboardTypeFilter("income")}
                  >
                    Entrate
                  </button>
                  <button
                    className={`filter-btn ${dashboardTypeFilter === "expenses" ? "active" : ""}`}
                    onClick={() => setDashboardTypeFilter("expenses")}
                  >
                    Uscite
                  </button>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Categorie:</span>
                <div className="category-filter-chips">
                  {dashboardCategoryFilter.length === 0 ? (
                    <span className="filter-placeholder">
                      Tutte le categorie
                    </span>
                  ) : (
                    dashboardCategoryFilter.map((cat) => (
                      <span key={cat} className="filter-chip">
                        {cat}
                        <button
                          onClick={() =>
                            setDashboardCategoryFilter((prev) =>
                              prev.filter((c) => c !== cat),
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                  <select
                    className="category-filter-select"
                    value=""
                    onChange={(e) => {
                      if (
                        e.target.value &&
                        !dashboardCategoryFilter.includes(e.target.value)
                      ) {
                        setDashboardCategoryFilter((prev) => [
                          ...prev,
                          e.target.value,
                        ]);
                      }
                    }}
                  >
                    <option value="">+ Aggiungi</option>
                    {stats.allCategories
                      .filter((c) => !dashboardCategoryFilter.includes(c))
                      .sort((a, b) => a.localeCompare(b, "it"))
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
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
            <div
              className="stats-grid"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
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
              {/* Category Bar Chart */}
              <div className="chart-container">
                <h3 className="chart-title">
                  {dashboardTypeFilter === "income"
                    ? "Entrate per categoria"
                    : dashboardTypeFilter === "expenses"
                      ? "Uscite per categoria"
                      : "Uscite per categoria"}
                </h3>
                {(dashboardTypeFilter === "income"
                  ? stats.categoryDataIncome
                  : stats.categoryData
                ).length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    {/* Anno intero + uscite: mostra stacked area chart */}
                    {selectedMonth === null && dashboardTypeFilter !== "income" ? (
                      <AreaChart data={stats.monthlyCategoryData} margin={{ left: -40, right: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        {stats.chartCategories.map((cat, i) => (
                          <Area
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            stackId="1"
                            fill={COLORS[i % COLORS.length]}
                            stroke={COLORS[i % COLORS.length]}
                            fillOpacity={0.8}
                          />
                        ))}
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={(dashboardTypeFilter === "income"
                          ? stats.categoryDataIncome
                          : stats.categoryData
                        ).slice(0, 8)}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fontSize: 11 }}
                          width={70}
                          tickFormatter={(name) => name.length > 12 ? `${name.slice(0, 11)}…` : name}
                        />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          radius={[0, 4, 4, 0]}
                        >
                          {(dashboardTypeFilter === "income"
                            ? stats.categoryDataIncome
                            : stats.categoryData
                          ).slice(0, 8).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    {dashboardTypeFilter === "income"
                      ? "Nessuna entrata nel periodo"
                      : "Nessuna uscita nel periodo"}
                  </div>
                )}
              </div>

              {/* Bar/Line Chart */}
              <div className="chart-container">
                <h3 className="chart-title">
                  {selectedMonth !== null
                    ? `Trend ${MONTHS_IT[selectedMonth]}`
                    : "Andamento annuale"}
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  {selectedMonth !== null ? (
                    <LineChart data={stats.dailyData}>
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(v)}
                        labelFormatter={(day) => `${day} ${MONTHS_IT[selectedMonth]}`}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Saldo"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={stats.monthlyData} margin={{ left: -35, right: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(v)}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="Entrate"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Uscite"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  {dashboardTypeFilter === "income"
                    ? "Dettaglio entrate per categoria"
                    : "Dettaglio uscite per categoria"}
                </h3>
                <button
                  className={`btn btn-sm ${showCategoryPercentage ? "btn-primary" : "btn-secondary"}`}
                  onClick={() =>
                    setShowCategoryPercentage(!showCategoryPercentage)
                  }
                  title={
                    showCategoryPercentage
                      ? "Mostra valori assoluti"
                      : "Mostra percentuali"
                  }
                  style={{
                    height: "32px",
                    textAlign: "center",
                    lineHeight: "1",
                  }}
                >
                  {showCategoryPercentage ? "€" : "%"}
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {(dashboardTypeFilter === "income"
                  ? stats.categoryDataIncome
                  : stats.categoryData
                ).length > 0 ? (
                  <div className="category-list-expandable">
                    {(() => {
                      const categoryList =
                        dashboardTypeFilter === "income"
                          ? stats.categoryDataIncome
                          : stats.categoryData;
                      const total = categoryList.reduce(
                        (sum, cat) => sum + cat.value,
                        0,
                      );
                      return categoryList.map((cat, i) => (
                        <div
                          key={cat.name}
                          className="category-item-expandable"
                        >
                          <div
                            className={`category-item-header ${expandedCategory === cat.name ? "expanded" : ""}`}
                            onClick={() =>
                              setExpandedCategory(
                                expandedCategory === cat.name ? null : cat.name,
                              )
                            }
                          >
                            <div
                              className="category-dot"
                              style={{
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                            <span className="category-name">{cat.name}</span>
                            <span className="category-count">
                              {cat.count} mov.
                            </span>
                            <span className="category-amount">
                              {showCategoryPercentage
                                ? `${((cat.value / total) * 100).toFixed(1)}%`
                                : formatCurrency(cat.value)}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`category-chevron ${expandedCategory === cat.name ? "rotated" : ""}`}
                            />
                          </div>
                          <div className={`category-transactions ${expandedCategory === cat.name ? "expanded" : ""}`}>
                            {cat.transactions.slice(0, 10).map((tx) => (
                              <div
                                key={tx.id}
                                className="category-transaction-item"
                              >
                                <span className="category-tx-date">
                                  {new Date(tx.date).toLocaleDateString(
                                    "it-IT",
                                  )}
                                </span>
                                <span className="category-tx-description">
                                  {tx.description}
                                </span>
                                <span
                                  className={`category-tx-amount ${tx.amount >= 0 ? "positive" : "negative"}`}
                                >
                                  {tx.amount >= 0 ? "+" : ""}
                                  {formatCurrency(tx.amount)}
                                </span>
                              </div>
                            ))}
                            {cat.transactions.length > 10 && (
                              <button
                                className="category-view-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTransactionsCategoryFilter(cat.name);
                                  setView("transactions");
                                }}
                              >
                                Vedi tutti i {cat.transactions.length}{" "}
                                movimenti →
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: "2rem" }}>
                    {dashboardTypeFilter === "income"
                      ? "Nessuna entrata nel periodo"
                      : "Nessuna uscita nel periodo"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transactions View */}
        {view === "transactions" && (
          <div
            className="card card-fullheight"
            style={{ animation: "fadeIn 0.3s ease" }}
          >
            <div className="card-header">
              <h3 className="card-title">
                Movimenti ({stats.filtered.length})
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div className="search-wrapper">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="transactions-category-filter">
                  <select
                    value={transactionsCategoryFilter || ""}
                    onChange={(e) =>
                      setTransactionsCategoryFilter(e.target.value || null)
                    }
                    className="category-filter-select-tx"
                  >
                    <option value="">Tutte le categorie</option>
                    {stats.allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {transactionsCategoryFilter && (
                    <button
                      className="filter-clear-btn"
                      onClick={() => setTransactionsCategoryFilter(null)}
                      title="Rimuovi filtro"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddTransaction(!showAddTransaction)}
                  style={{ padding: "0.5rem 0.75rem" }}
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
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Descrizione *"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="form-input"
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  placeholder="Importo *"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="form-input"
                  style={{ width: "120px" }}
                />
                <select
                  value={newTransaction.category}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="form-input"
                >
                  {Object.keys(categories)
                    .sort((a, b) => a.localeCompare(b, "it"))
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  <option value="Altro">Altro</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={addManualTransaction}
                  style={{ padding: "0.5rem 0.75rem" }}
                >
                  <Check size={16} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddTransaction(false);
                    setNewTransaction({
                      date: "",
                      description: "",
                      amount: "",
                      category: "Altro",
                    });
                  }}
                  style={{ padding: "0.5rem 0.75rem" }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="transactions-list">
              {stats.filtered.length > 0 ? (
                <>
                  {stats.filtered
                    .slice(
                      (currentPage - 1) * ITEMS_PER_PAGE,
                      currentPage * ITEMS_PER_PAGE,
                    )
                    .map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-date">
                          {new Date(tx.date).toLocaleDateString("it-IT")}
                        </div>
                        <div className="transaction-details">
                          {editingDescription === tx.id ? (
                            <input
                              type="text"
                              value={newDescription}
                              onChange={(e) =>
                                setNewDescription(e.target.value)
                              }
                              onBlur={() =>
                                updateTxDescription(tx.id, newDescription)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  updateTxDescription(tx.id, newDescription);
                                if (e.key === "Escape") {
                                  setEditingDescription(null);
                                  setNewDescription("");
                                }
                              }}
                              autoFocus
                              className="search-input"
                              style={{
                                paddingLeft: "0.5rem",
                                fontSize: "0.875rem",
                                marginBottom: "0.25rem",
                              }}
                            />
                          ) : (
                            <div
                              className="transaction-description"
                              onClick={() => {
                                setEditingDescription(tx.id);
                                setNewDescription(tx.description);
                              }}
                              style={{ cursor: "pointer" }}
                              title="Clicca per modificare"
                            >
                              {tx.description}
                            </div>
                          )}
                          {editingTx === tx.id ? (
                            <select
                              value={tx.category}
                              onChange={(e) =>
                                updateTxCategory(tx.id, e.target.value)
                              }
                              onBlur={() => setEditingTx(null)}
                              autoFocus
                              className="category-select"
                            >
                              {Object.keys(categories)
                                .sort((a, b) => a.localeCompare(b, "it"))
                                .map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
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
                        <div
                          className={`transaction-amount ${tx.amount >= 0 ? "positive" : "negative"}`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {formatCurrency(tx.amount)}
                        </div>
                        <button
                          className="btn-delete"
                          onClick={() =>
                            setConfirmDelete({ type: "single", id: tx.id })
                          }
                          title="Elimina transazione"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  {/* Paginazione */}
                  {stats.filtered.length > ITEMS_PER_PAGE && (
                    <div className="pagination">
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        ← Precedente
                      </button>
                      <span className="pagination-info">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          stats.filtered.length,
                        )}{" "}
                        di {stats.filtered.length} movimenti
                      </span>
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(
                              Math.ceil(stats.filtered.length / ITEMS_PER_PAGE),
                              p + 1,
                            ),
                          )
                        }
                        disabled={
                          currentPage >=
                          Math.ceil(stats.filtered.length / ITEMS_PER_PAGE)
                        }
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
        <CategoryManager
          categories={categories}
          categoriesChanged={categoriesChanged}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onAddKeyword={addKeyword}
          onRemoveKeyword={removeKeyword}
          onRecategorize={() => recategorizeAll(transactions, categoryResolutions, setTransactions)}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {/* Sync Settings Modal */}
      {showSyncSettings && (
        <SyncSettings
          isAuthenticated={googleDrive.isAuthenticated}
          hasDrivePermission={googleDrive.hasDrivePermission}
          isLoading={googleDrive.isLoading}
          userInfo={googleDrive.userInfo}
          backupInfo={googleDrive.backupInfo}
          lastSyncTime={googleDrive.lastSyncTime}
          syncStatus={googleDrive.syncStatus}
          error={googleDrive.error}
          onSignIn={async () => {
            const result = await googleDrive.signIn();
            if (result.success) showToast("Connesso a Google Drive");
            else if (!result.cancelled) showToast(result.error, "error");
          }}
          onCancelSignIn={() => {
            googleDrive.cancelSignIn();
          }}
          onSignOut={async () => {
            const result = await googleDrive.signOut();
            if (result.success) showToast("Disconnesso da Google Drive");
          }}
          onUpload={async () => {
            const data = { transactions, categories, importProfiles, categoryResolutions };
            const result = await googleDrive.uploadBackup(data);
            if (result.success) showToast("Backup salvato su Google Drive");
            else showToast(result.error, "error");
          }}
          onDownload={async () => {
            const result = await googleDrive.downloadBackup();
            if (result.success && result.data) {
              if (
                confirm(
                  `Sostituire i dati attuali con il backup di Google Drive?\n(${result.data.transactions?.length || 0} transazioni)`,
                )
              ) {
                setTransactions(result.data.transactions || []);
                setCategories(result.data.categories || DEFAULT_CATEGORIES);
                setImportProfiles(result.data.importProfiles || {});
                setCategoryResolutions(result.data.categoryResolutions || {});
                showToast("Dati ripristinati da Google Drive");
              }
            } else {
              showToast(result.error || "Nessun backup trovato", "error");
            }
          }}
          onDelete={async () => {
            const result = await googleDrive.deleteBackup();
            if (result.success) showToast("Backup eliminato da Google Drive");
            else showToast(result.error, "error");
          }}
          onClose={() => setShowSyncSettings(false)}
        />
      )}

      {/* PayPal Enrich Wizard */}
      {paypalData && (
        <PayPalEnrichWizard
          transactions={transactions}
          paypalData={paypalData}
          onConfirm={applyPayPalEnrichment}
          onCancel={() => setPaypalData(null)}
        />
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
          title={
            confirmDelete.type === "all"
              ? "Elimina tutti i dati"
              : "Elimina transazione"
          }
          message={
            confirmDelete.type === "all"
              ? "Sei sicuro di voler eliminare tutte le transazioni? Questa azione non può essere annullata."
              : "Sei sicuro di voler eliminare questa transazione?"
          }
          onConfirm={() =>
            confirmDelete.type === "all"
              ? clearAllData()
              : deleteTransaction(confirmDelete.id)
          }
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Import Wizard Modal */}
      {wizardData && (
        <ImportWizard
          columns={wizardData.columns}
          sampleData={wizardData.sampleData}
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
          onConfirm={confirmCategoryConflicts}
          onClose={() => setCategoryConflicts(null)}
        />
      )}
    </div>
  );
}
