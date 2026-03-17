import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { DEFAULT_CATEGORIES } from '../constants';

/**
 * Hook per gestire le transazioni, persistenza localStorage, backup Electron e operazioni CRUD
 * @param {Object} options
 * @param {Object} options.categories - Categorie correnti (da useCategories)
 * @param {Object} options.importProfiles - Profili import (da useCategories)
 * @param {Function} options.setCategories - Setter categorie (per importBackup)
 * @param {Function} options.setImportProfiles - Setter profili (per importBackup)
 * @param {Function} options.showToast - Callback toast
 * @param {Function} options.setConfirmDelete - Setter modale conferma (da useModals)
 * @param {Object} options.newTransaction - Dati form nuova transazione (da useModals)
 * @param {Function} options.setShowAddTransaction - Setter visibilità form (da useModals)
 * @param {Function} options.setNewTransaction - Setter form data (da useModals)
 * @param {Function} options.setEditingTx - Setter editing categoria (da useModals)
 * @param {Function} options.setEditingDescription - Setter editing descrizione (da useModals)
 * @param {Function} options.setNewDescription - Setter nuova descrizione (da useModals)
 */
export function useTransactionData({
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
}) {
  // --- State (lazy localStorage initializers) ---

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
      return saved.transactions || [];
    } catch {
      console.error('Error loading transactions from localStorage');
      return [];
    }
  });

  const [categoryResolutions, setCategoryResolutions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
      return saved.categoryResolutions || {};
    } catch {
      return {};
    }
  });

  // --- Memos ---

  // Anni disponibili
  const years = useMemo(
    () =>
      [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a),
    [transactions],
  );

  // --- Effects ---

  // Salva dati su localStorage
  useEffect(() => {
    if (
      transactions.length > 0 ||
      Object.keys(importProfiles).length > 0 ||
      Object.keys(categoryResolutions).length > 0
    ) {
      try {
        localStorage.setItem(
          'moneyFlow',
          JSON.stringify({
            transactions,
            categories,
            importProfiles,
            categoryResolutions,
          }),
        );
      } catch (error) {
        console.error('Errore salvataggio:', error);
      }
    }
  }, [transactions, categories, importProfiles, categoryResolutions]);

  // Backup automatico alla chiusura dell'app (solo Electron)
  const backupDataRef = useRef({ transactions, categories, importProfiles, categoryResolutions });

  useEffect(() => {
    backupDataRef.current = { transactions, categories, importProfiles, categoryResolutions };
  }, [transactions, categories, importProfiles, categoryResolutions]);

  useEffect(() => {
    if (window.electronAPI?.onRequestBackupData) {
      const cleanup = window.electronAPI.onRequestBackupData(() => {
        window.electronAPI.sendBackupDataForClose(backupDataRef.current);
      });
      return cleanup;
    }
  }, []);

  // --- Callbacks ---

  // Export data (Excel)
  const exportData = useCallback(() => {
    const dataToExport = transactions.map(t => ({
      Data: new Date(t.date).toLocaleDateString('it-IT'),
      Descrizione: t.description,
      Categoria: t.category,
      Importo: t.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transazioni');
    XLSX.writeFile(
      wb,
      `moneyflow-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showToast('File Excel esportato con successo');
  }, [transactions, showToast]);

  // Export backup (JSON completo)
  const exportBackup = useCallback(() => {
    const backup = {
      version: '1.2',
      exportDate: new Date().toISOString(),
      transactions,
      categories,
      importProfiles,
      categoryResolutions,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup esportato con successo');
  }, [transactions, categories, importProfiles, categoryResolutions, showToast]);

  // Import backup (JSON)
  const importBackup = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.transactions || !Array.isArray(backup.transactions)) {
          showToast('File di backup non valido', 'error');
          return;
        }

        if (transactions.length > 0) {
          const confirmed = window.confirm(
            `Questo sostituirà tutti i dati attuali (${transactions.length} transazioni).\nVuoi continuare?`,
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
        if (backup.categoryResolutions) {
          setCategoryResolutions(backup.categoryResolutions);
        }

        localStorage.setItem(
          'moneyFlow',
          JSON.stringify({
            transactions: backup.transactions,
            categories: backup.categories || categories,
            importProfiles: backup.importProfiles || importProfiles,
            categoryResolutions: backup.categoryResolutions || categoryResolutions,
          }),
        );

        showToast(
          `Backup ripristinato: ${backup.transactions.length} transazioni`,
        );
      } catch (error) {
        console.error('Errore import backup:', error);
        showToast('Errore nel ripristino del backup', 'error');
      }
    },
    [transactions, categories, importProfiles, categoryResolutions, showToast, setCategories, setImportProfiles],
  );

  // Delete transaction
  const deleteTransaction = useCallback(
    (id) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      setConfirmDelete(null);
      showToast('Transazione eliminata');
    },
    [showToast, setConfirmDelete],
  );

  // Clear all data
  const clearAllData = useCallback(() => {
    setTransactions([]);
    localStorage.removeItem('moneyFlow');
    setConfirmDelete(null);
    showToast('Tutti i dati sono stati eliminati');
  }, [showToast, setConfirmDelete]);

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
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bankId: null,
      date: new Date(date).toISOString(),
      description: description.trim(),
      amount: parsedAmount,
      category: category || 'Altro',
      note: 'Inserito manualmente',
    };
    setTransactions(prev =>
      [tx, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)),
    );
    setNewTransaction({
      date: '',
      description: '',
      amount: '',
      category: 'Altro',
    });
    setShowAddTransaction(false);
    showToast('Transazione aggiunta');
  }, [newTransaction, showToast, setNewTransaction, setShowAddTransaction]);

  // Update categoria transazione
  const updateTxCategory = useCallback(
    (id, category) => {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        setCategoryResolutions(prev => ({
          ...prev,
          [tx.description]: category,
        }));
      }
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, category } : t)),
      );
      setEditingTx(null);
    },
    [transactions, setEditingTx],
  );

  // Update descrizione transazione
  const updateTxDescription = useCallback(
    (id, description) => {
      if (!description.trim()) {
        setEditingDescription(null);
        setNewDescription('');
        return;
      }
      setTransactions(prev =>
        prev.map(t =>
          t.id === id ? { ...t, description: description.trim() } : t,
        ),
      );
      setEditingDescription(null);
      setNewDescription('');
      showToast('Descrizione aggiornata');
    },
    [showToast, setEditingDescription, setNewDescription],
  );

  return {
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
  };
}

export default useTransactionData;
