import { useState, useEffect, useMemo, useCallback } from "react";

// Constants
import {
  DEFAULT_CATEGORIES,
  MONTHS_IT,
} from "./constants";

// Utils
// Components
import {
  Toast,
  ConfirmModal,
  ImportWizard,
  ConflictResolver,
  CategoryConflictResolver,
  CategoryManager,
  SyncSettings,
  PayPalEnrichWizard,
} from "./components";
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { SettingsView } from './views/SettingsView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';

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
    updateTxCategory,
    updateTxDescription,
    addManualTransaction,
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
    sortColumn, setSortColumn,
    sortDirection, setSortDirection,
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
      {/* Page transitions — AnimatePresence mode="wait" */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
          className="flex-1 min-h-0 overflow-hidden"
        >
          {view === 'dashboard' && (
            <DashboardView
              stats={stats}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              dashboardCategoryFilter={dashboardCategoryFilter}
              onCategoryFilterChange={setDashboardCategoryFilter}
              onTransactionsCategoryChange={setTransactionsCategoryFilter}
              hasTransactions={transactions.length > 0}
              onImport={() => document.getElementById('file-input')?.click()}
            />
          )}
          {view === 'transactions' && (
            <TransactionsView
              transactions={stats.filtered}
              allCategories={stats.allCategories}
              categories={categories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              transactionsCategoryFilter={transactionsCategoryFilter}
              setTransactionsCategoryFilter={setTransactionsCategoryFilter}
              sortColumn={sortColumn}
              setSortColumn={setSortColumn}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              editingTx={editingTx}
              setEditingTx={setEditingTx}
              editingDescription={editingDescription}
              setEditingDescription={setEditingDescription}
              newDescription={newDescription}
              setNewDescription={setNewDescription}
              updateTxCategory={updateTxCategory}
              updateTxDescription={updateTxDescription}
              setConfirmDelete={setConfirmDelete}
              onImport={() => document.getElementById('file-input')?.click()}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              onShowCategoryManager={() => setShowCategoryManager(true)}
              onShowSyncSettings={() => setShowSyncSettings(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {showCategoryManager && (
          <CategoryManager
            key="category-manager"
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
      </AnimatePresence>

      {/* Sync Settings Modal */}
      <AnimatePresence>
        {showSyncSettings && (
          <SyncSettings
            key="sync-settings"
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
      </AnimatePresence>

      {/* PayPal Enrich Wizard */}
      <AnimatePresence>
        {paypalData && (
          <PayPalEnrichWizard
            key="paypal-enrich-wizard"
            transactions={transactions}
            paypalData={paypalData}
            onConfirm={applyPayPalEnrichment}
            onCancel={() => setPaypalData(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            key="confirm-modal"
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
      </AnimatePresence>

      {/* Import Wizard Modal */}
      <AnimatePresence>
        {wizardData && (
          <ImportWizard
            key="import-wizard"
            columns={wizardData.columns}
            sampleData={wizardData.sampleData}
            onConfirm={handleWizardConfirm}
            onCancel={() => setWizardData(null)}
          />
        )}
      </AnimatePresence>

      {/* Conflict Resolver Modal */}
      <AnimatePresence>
        {importConflicts && (
          <ConflictResolver
            key="conflict-resolver"
            conflicts={importConflicts.conflicts}
            onResolve={handleConflictResolve}
            onCancel={() => setImportConflicts(null)}
          />
        )}
      </AnimatePresence>

      {/* Category Conflict Resolver Modal */}
      <AnimatePresence>
        {categoryConflicts && (
          <CategoryConflictResolver
            key="category-conflict-resolver"
            conflicts={categoryConflicts}
            onConfirm={confirmCategoryConflicts}
            onClose={() => setCategoryConflicts(null)}
          />
        )}
      </AnimatePresence>

      {/* Hidden file input for import trigger (used by TransactionsView empty state CTA) */}
      <input
        id="file-input"
        type="file"
        style={{ display: 'none' }}
        accept=".xlsx,.xls,.csv"
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
      />
    </AppLayout>
  );
}
