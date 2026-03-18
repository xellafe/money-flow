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
  ChevronDown,
  Cloud,
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
import { AppLayout } from './components/layout/AppLayout';
import { SettingsView } from './views/SettingsView';
import { DashboardView } from './views/DashboardView';

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
    newTransaction, setNewTransaction,
  } = useModals();

  const { view, setView, sidebarCollapsed, toggleSidebar } = useViewState();

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
    dashboardCategoryFilter, setDashboardCategoryFilter,
    transactionsCategoryFilter, setTransactionsCategoryFilter,
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
    let filtered = selectedYear !== null
      ? transactions.filter((t) => new Date(t.date).getFullYear() === selectedYear)
      : [...transactions];

    if (selectedMonth !== null) {
      filtered = filtered.filter(
        (t) => new Date(t.date).getMonth() === selectedMonth,
      );
    }

    let dashboardFiltered = filtered;

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
    let monthlyFiltered = selectedYear !== null
      ? transactions.filter((t) => new Date(t.date).getFullYear() === selectedYear)
      : [...transactions];
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

    // Previous period stats for % change calculation
    let prevIncome = null;
    let prevExpenses = null;
    if (selectedMonth !== null && selectedYear !== null) {
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const prevTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
      });
      prevIncome = prevTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      prevExpenses = prevTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
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
      prevIncome,
      prevExpenses,
    };
  }, [
    transactions,
    selectedMonth,
    selectedYear,
    searchQuery,
    dashboardCategoryFilter,
    transactionsCategoryFilter,
  ]);

  // Months that actually have transactions in the selected year (for period selector)
  const availableMonths = useMemo(() => {
    const base = selectedYear !== null
      ? transactions.filter(t => new Date(t.date).getFullYear() === selectedYear)
      : transactions;
    return new Set(base.map(t => new Date(t.date).getMonth()));
  }, [transactions, selectedYear]);

  // Period navigation handlers (must be before early return to follow rules of hooks)
  const handlePrevYear = useCallback(() => {
    setSelectedYear(y => (y ?? new Date().getFullYear()) - 1);
    setSelectedMonth(null);
  }, [setSelectedYear, setSelectedMonth]);

  const handleNextYear = useCallback(() => {
    setSelectedYear(y => (y ?? new Date().getFullYear()) + 1);
    setSelectedMonth(null);
  }, [setSelectedYear, setSelectedMonth]);

  const handleSelectMonth = useCallback((month) => {
    if (selectedYear === null) setSelectedYear(new Date().getFullYear());
    setSelectedMonth(prev => (prev === month ? null : month));
  }, [selectedYear, setSelectedYear, setSelectedMonth]);

  // Mostra nulla finché i dati iniziali non sono caricati
  if (!isInitialized) {
    return null;
  }

  return (
    <AppLayout
      view={view}
      setView={setView}
      collapsed={sidebarCollapsed}
      onToggle={toggleSidebar}
      onAddTransaction={() => setShowAddTransaction(true)}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      onPrevYear={handlePrevYear}
      onNextYear={handleNextYear}
      onSelectMonth={handleSelectMonth}
      availableMonths={availableMonths}
    >
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
          <DashboardView
            stats={stats}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            dashboardCategoryFilter={dashboardCategoryFilter}
            onCategoryFilterChange={setDashboardCategoryFilter}
            onTransactionsCategoryChange={setTransactionsCategoryFilter}
          />
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

      {/* Settings View */}
      {view === 'settings' && <SettingsView />}

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
    </AppLayout>
  );
}
