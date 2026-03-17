import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { BUILTIN_IMPORT_PROFILES } from '../constants';
import { parseDate, parseAmount, categorize } from '../utils';

/**
 * Hook per gestire l'importazione file, wizard, conflitti e drag-and-drop
 * @param {Object} options
 * @param {Array} options.transactions - Transazioni correnti (per rilevamento duplicati)
 * @param {Function} options.setTransactions - Setter transazioni (per risolvere conflitti)
 * @param {Object} options.categories - Categorie correnti (per categorizzazione)
 * @param {Object} options.importProfiles - Profili import custom (da useCategories)
 * @param {Function} options.setImportProfiles - Setter profili (per wizard)
 * @param {Function} options.showToast - Callback toast
 */
export function useImportLogic({
  transactions,
  setTransactions,
  categories,
  importProfiles,
  setImportProfiles,
  showToast,
}) {
  // --- State ---
  const [wizardData, setWizardData] = useState(null);
  const [importConflicts, setImportConflicts] = useState(null);
  const [paypalData, setPaypalData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Memos ---

  // Tutti i profili disponibili (built-in + custom)
  const allProfiles = useMemo(
    () => ({
      ...BUILTIN_IMPORT_PROFILES,
      ...importProfiles,
    }),
    [importProfiles],
  );

  // --- Callbacks ---

  // Auto-detect del formato file
  const detectProfile = useCallback(
    (columns) => {
      for (const [key, profile] of Object.entries(allProfiles)) {
        const hasDate = columns.includes(profile.dateColumn);
        const hasDesc = columns.includes(profile.descriptionColumn);
        const hasAmount =
          profile.amountType === 'single'
            ? columns.includes(profile.amountColumn)
            : columns.includes(profile.incomeColumn) ||
              columns.includes(profile.expenseColumn);

        if (hasDate && hasDesc && hasAmount) {
          return { key, profile };
        }
      }
      return null;
    },
    [allProfiles],
  );

  // Processa le righe con un profilo specifico
  const processRowsWithProfile = useCallback(
    (rows, profile) => {
      return rows
        .map((r, i) => {
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
          const bankId = profile.idColumn ? r[profile.idColumn] : null;

          if (!desc || amt === 0) return null;

          return {
            id:
              bankId ||
              `${date.getTime()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            bankId: bankId || null,
            date: date.toISOString(),
            description: desc,
            amount: amt,
            category: categorize(desc, categories),
            note: '',
          };
        })
        .filter(t => t !== null && !isNaN(t.amount) && t.amount !== 0);
    },
    [categories],
  );

  // Funzione per processare transazioni importate con rilevamento conflitti
  const processImportedTransactions = useCallback(
    (newTx, profileName) => {
      const existingByDateAmount = {};
      transactions.forEach(t => {
        const key = `${t.date}-${t.amount}`;
        if (!existingByDateAmount[key]) existingByDateAmount[key] = [];
        existingByDateAmount[key].push(t);
      });

      const existingExact = new Set(
        transactions.map(
          t => t.bankId || `${t.date}-${t.amount}-${t.description}`,
        ),
      );

      const unique = [];
      const conflicts = [];

      newTx.forEach(t => {
        const exactKey = t.bankId || `${t.date}-${t.amount}-${t.description}`;

        if (existingExact.has(exactKey)) {
          return;
        }

        const dateAmountKey = `${t.date}-${t.amount}`;
        const possibleMatches = existingByDateAmount[dateAmountKey] || [];

        const conflict = possibleMatches.find(
          existing => existing.description !== t.description,
        );

        if (conflict) {
          conflicts.push({ existing: conflict, new: t });
        } else {
          unique.push(t);
        }
      });

      if (conflicts.length > 0) {
        setImportConflicts({ conflicts, newTransactions: unique, profileName });
      } else if (unique.length === 0) {
        showToast('Nessuna nuova transazione trovata', 'error');
      } else {
        setTransactions(prev =>
          [...prev, ...unique].sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          ),
        );
        showToast(`Importate ${unique.length} transazioni (${profileName})`);
      }
    },
    [transactions, showToast, setTransactions],
  );

  // Import file - principale
  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      setLoading(true);
      try {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        const headerRowsToTry = [0, 17, 1, 2];
        let rows = [];
        let columns = [];
        let usedHeaderRow = 0;

        for (const headerRow of headerRowsToTry) {
          try {
            const testRows = XLSX.utils.sheet_to_json(sheet, {
              range: headerRow,
            });
            if (testRows.length > 0) {
              const testCols = Object.keys(testRows[0]);
              const validCols = testCols.filter(
                c => c && isNaN(c) && c.trim().length > 0,
              );
              if (validCols.length >= 2) {
                rows = testRows;
                columns = testCols;
                usedHeaderRow = headerRow;
                break;
              }
            }
          } catch {
            // Continua con il prossimo
          }
        }

        if (rows.length === 0) {
          showToast('Il file non contiene dati validi', 'error');
          setLoading(false);
          return;
        }

        const detected = detectProfile(columns, rows);

        if (detected) {
          const newTx = processRowsWithProfile(rows, detected.profile);
          processImportedTransactions(newTx, detected.profile.name);
        } else {
          setWizardData({
            columns,
            sampleData: rows.slice(0, 5),
            rawRows: rows,
            headerRow: usedHeaderRow,
          });
        }
      } catch (error) {
        console.error('Errore import:', error);
        showToast("Errore durante l'importazione del file", 'error');
      } finally {
        setLoading(false);
      }
    },
    [
      detectProfile,
      processRowsWithProfile,
      processImportedTransactions,
      showToast,
    ],
  );

  // Carica CSV PayPal per arricchire transazioni
  const handlePayPalFile = useCallback(
    async (file) => {
      if (!file) return;

      try {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          showToast('Il file CSV non contiene dati', 'error');
          return;
        }

        // Verifica che sia un CSV PayPal
        const firstRow = rows[0];
        if (!firstRow['Data'] || !firstRow['Totale']) {
          showToast('Il file non sembra essere un export PayPal', 'error');
          return;
        }

        setPaypalData(rows);
      } catch (error) {
        console.error('Errore lettura CSV PayPal:', error);
        showToast('Errore durante la lettura del file', 'error');
      }
    },
    [showToast],
  );

  // Applica arricchimento PayPal
  const applyPayPalEnrichment = useCallback(
    (updates) => {
      if (!updates || updates.length === 0) {
        setPaypalData(null);
        return;
      }

      setTransactions(prev => {
        const newTx = [...prev];
        updates.forEach(({ txIndex, newDescription }) => {
          if (newTx[txIndex]) {
            newTx[txIndex] = { ...newTx[txIndex], description: newDescription };
          }
        });
        return newTx;
      });

      showToast(`Arricchite ${updates.length} transazioni con dati PayPal`);
      setPaypalData(null);
    },
    [showToast, setTransactions],
  );

  // Callback quando l'utente risolve i conflitti
  const handleConflictResolve = useCallback(
    (toReplace, toAdd) => {
      if (!importConflicts) return;

      const { newTransactions, conflicts } = importConflicts;
      const idsToReplace = new Set(toReplace.map(c => c.existing.id));
      const replacements = toReplace.map(c => c.new);
      const additions = toAdd.map(c => c.new);

      setTransactions(prev => {
        const filtered = prev.filter(t => !idsToReplace.has(t.id));
        const updated = [
          ...filtered,
          ...newTransactions,
          ...replacements,
          ...additions,
        ];
        return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      const skipped = conflicts.length - toReplace.length - toAdd.length;
      const parts = [];
      if (newTransactions.length > 0)
        parts.push(`${newTransactions.length} nuove`);
      if (toReplace.length > 0) parts.push(`${toReplace.length} sostituite`);
      if (toAdd.length > 0) parts.push(`${toAdd.length} aggiunte`);
      if (skipped > 0) parts.push(`${skipped} saltate`);

      showToast(parts.join(', ') || 'Nessuna modifica');
      setImportConflicts(null);
    },
    [importConflicts, showToast, setTransactions],
  );

  // Callback quando il wizard conferma un profilo
  const handleWizardConfirm = useCallback(
    (profile) => {
      if (!wizardData) return;

      const profileKey = profile.name.toLowerCase().replace(/\s+/g, '-');
      setImportProfiles(prev => ({
        ...prev,
        [profileKey]: { ...profile, headerRow: wizardData.headerRow },
      }));

      const newTx = processRowsWithProfile(wizardData.rawRows, profile);
      processImportedTransactions(newTx, profile.name);

      setWizardData(null);
    },
    [wizardData, processRowsWithProfile, processImportedTransactions, setImportProfiles],
  );

  // Drag and drop
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return {
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
  };
}

export default useImportLogic;
