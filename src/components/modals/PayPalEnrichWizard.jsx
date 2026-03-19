import { useState, useMemo, useEffect } from 'react';
import { Check, AlertCircle, CreditCard } from 'lucide-react';
import { ModalShell } from '../ui';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Configurazione colonne CSV PayPal
 */
const PAYPAL_CONFIG = {
  dateColumn: 'Data',
  nameColumn: 'Nome',
  typeColumn: 'Tipo',
  statusColumn: 'Stato',
  totalColumn: 'Totale',
  descriptionColumn: 'Descrizione',
  // Tipi di transazione da ignorare (non sono spese/entrate reali)
  ignoredTypes: [
    'Versamento generico con carta',
    'Bonifico bancario sul conto PayPal',
    'Trasferimento avviato dall\'utente',
  ],
  // Stati da ignorare
  ignoredStatuses: [
    'In sospeso',
    'Rimosso',
  ],
};

/**
 * Parsa una data nel formato DD/MM/YYYY o da Excel serial date
 */
function parsePayPalDate(dateValue) {
  if (!dateValue) return null;
  
  // Se è già un oggetto Date
  if (dateValue instanceof Date) return dateValue;
  
  // Se è un numero (Excel serial date)
  if (typeof dateValue === 'number') {
    // Excel serial date: giorni dal 1 gennaio 1900
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
  }
  
  // Se è una stringa
  if (typeof dateValue === 'string') {
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Prova parsing generico
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return null;
}

/**
 * Parsa un importo nel formato italiano (virgola come decimale)
 * PayPal a volte esporta importi in centesimi (es. -2399 invece di -23.99)
 */
function parsePayPalAmount(amountStr) {
  if (!amountStr) return 0;
  // Rimuovi spazi e converti virgola in punto
  const cleaned = amountStr.toString().replace(/\s/g, '').replace(',', '.');
  let amount = parseFloat(cleaned) || 0;
  
  // Se l'importo non ha decimali e il valore assoluto è > 100,
  // probabilmente è in centesimi (es. -2399 = -23.99€)
  // Controlliamo se la stringa originale contiene un separatore decimale
  const hasDecimal = amountStr.toString().includes(',') || amountStr.toString().includes('.');
  if (!hasDecimal && Math.abs(amount) >= 100) {
    amount = amount / 100;
  }
  
  return amount;
}

/**
 * Confronta due date (stessa data o ±3 giorni)
 */
function datesMatch(date1, date2, toleranceDays = 3) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= toleranceDays;
}

/**
 * Confronta due importi (con tolleranza per arrotondamenti)
 */
function amountsMatch(amount1, amount2, tolerance = 0.02) {
  return Math.abs(Math.abs(amount1) - Math.abs(amount2)) <= tolerance;
}

/**
 * Step slide animation variants for wizard transitions
 */
const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: (direction) => ({
    x: direction > 0 ? -30 : 30,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  }),
};

/**
 * Wizard per arricchire le transazioni bancarie con i dati PayPal
 */
export default function PayPalEnrichWizard({ 
  transactions, 
  paypalData, 
  onConfirm, 
  onCancel 
}) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = back
  const [selectedMatches, setSelectedMatches] = useState({});

  // Filtra transazioni PayPal valide
  const validPayPalTransactions = useMemo(() => {
    const filtered = paypalData.filter(row => {
      const type = row[PAYPAL_CONFIG.typeColumn];
      const status = row[PAYPAL_CONFIG.statusColumn];
      const rawTotal = row[PAYPAL_CONFIG.totalColumn];
      const amount = parsePayPalAmount(rawTotal);
      
      // Ignora tipi non validi
      if (PAYPAL_CONFIG.ignoredTypes.some(t => type?.includes(t))) {
        return false;
      }
      
      // Ignora stati non validi
      if (PAYPAL_CONFIG.ignoredStatuses.includes(status)) {
        return false;
      }
      
      // Deve avere un importo
      if (amount === 0) {
        return false;
      }
      
      return true;
    });
    
    return filtered;
  }, [paypalData]);

  // Trova match tra transazioni bancarie e PayPal
  const matches = useMemo(() => {
    const result = [];
    const usedPayPalIndices = new Set();

    // Cerca transazioni che potrebbero essere PayPal
    transactions.forEach((tx, txIndex) => {
      const desc = tx.description?.toLowerCase() || '';
      const isPayPal = desc.includes('paypal');
      
      if (!isPayPal) return;

      // Cerca match nel CSV PayPal
      for (let i = 0; i < validPayPalTransactions.length; i++) {
        if (usedPayPalIndices.has(i)) continue;

        const ppRow = validPayPalTransactions[i];
        const ppDate = parsePayPalDate(ppRow[PAYPAL_CONFIG.dateColumn]);
        const ppAmount = parsePayPalAmount(ppRow[PAYPAL_CONFIG.totalColumn]);
        const txDate = new Date(tx.date);
        const txAmount = tx.amount;

        const dateOk = datesMatch(txDate, ppDate);
        const amountOk = amountsMatch(txAmount, ppAmount);

        // Match per data e importo
        if (dateOk && amountOk) {
          const ppName = ppRow[PAYPAL_CONFIG.nameColumn] || '';
          const ppDesc = ppRow[PAYPAL_CONFIG.descriptionColumn] || '';
          const ppType = ppRow[PAYPAL_CONFIG.typeColumn] || '';
          
          // Costruisci nuova descrizione
          let newDescription = ppName;
          if (ppDesc) newDescription += ` - ${ppDesc}`;
          if (!newDescription.trim()) newDescription = ppType;

          result.push({
            txIndex,
            ppIndex: i,
            transaction: tx,
            paypalRow: ppRow,
            newDescription: newDescription.trim(),
            ppName,
            ppDesc,
            ppType,
          });

          usedPayPalIndices.add(i);
          break; // Un solo match per transazione
        }
      }
    });

    return result;
  }, [transactions, validPayPalTransactions]);

  // Inizializza selezione con tutti i match
  useEffect(() => {
    const initial = {};
    matches.forEach((_, idx) => {
      initial[idx] = true;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedMatches(initial);
  }, [matches]);

  const toggleMatch = (idx) => {
    setSelectedMatches(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const selectAll = () => {
    const all = {};
    matches.forEach((_, idx) => { all[idx] = true; });
    setSelectedMatches(all);
  };

  const deselectAll = () => {
    setSelectedMatches({});
  };

  const goNext = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const selectedCount = Object.values(selectedMatches).filter(Boolean).length;

  const handleConfirm = () => {
    const updates = matches
      .filter((_, idx) => selectedMatches[idx])
      .map(match => ({
        txIndex: match.txIndex,
        newDescription: match.newDescription,
      }));
    onConfirm(updates);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  return (
    <ModalShell title="Arricchisci transazioni PayPal" onClose={onCancel} size="lg">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {step === 1 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <CreditCard size={20} />
                <span className="text-sm text-gray-600">
                  Analizzati <strong>{validPayPalTransactions.length}</strong> transazioni PayPal
                </span>
              </div>
              {matches.length > 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-800 mb-1">
                    Trovate {matches.length} corrispondenze
                  </p>
                  <p className="text-sm text-gray-600">
                    Nel passo successivo potrai selezionare quali descrizioni aggiornare con i dati PayPal.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-gray-700 mb-1">Nessuna corrispondenza trovata</p>
                  <p className="text-sm">
                    Assicurati che le transazioni bancarie contengano &quot;PayPal&quot; nella descrizione
                    e che le date/importi corrispondano.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Trovate <strong>{matches.length}</strong> corrispondenze. Seleziona quelle da applicare.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                  >
                    Seleziona tutti
                  </button>
                  <button
                    onClick={deselectAll}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                  >
                    Deseleziona tutti
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 w-10"></th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Data</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Importo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Descrizione attuale</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 w-8">→</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Nuova descrizione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {matches.map((match, idx) => (
                        <tr
                          key={idx}
                          onClick={() => toggleMatch(idx)}
                          className={`cursor-pointer transition-colors ${
                            selectedMatches[idx] ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedMatches[idx]}
                              onChange={() => toggleMatch(idx)}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-700">{formatDate(match.transaction.date)}</td>
                          <td className={`px-4 py-3 text-right ${
                            match.transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatAmount(match.transaction.amount)}
                          </td>
                          <td className="px-4 py-3 max-w-[180px] truncate text-gray-600">
                            {match.transaction.description}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-400">→</td>
                          <td className="px-4 py-3 font-medium text-brand-600">
                            {match.newDescription}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mb-6">
              <div className={`p-4 rounded-lg border mb-4 ${
                selectedCount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Check size={20} className={selectedCount > 0 ? 'text-green-700' : 'text-gray-400'} />
                  <span className={`font-medium ${selectedCount > 0 ? 'text-green-800' : 'text-gray-600'}`}>
                    {selectedCount > 0
                      ? `${selectedCount} ${selectedCount === 1 ? 'modifica pronta' : 'modifiche pronte'} da applicare`
                      : 'Nessuna modifica selezionata'}
                  </span>
                </div>
                {selectedCount > 0 && (
                  <p className="text-sm text-green-700">
                    Le descrizioni selezionate verranno aggiornate con i dati PayPal.
                  </p>
                )}
              </div>
              {selectedCount > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-y-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Data</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Nuova descrizione</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {matches.filter((_, idx) => selectedMatches[idx]).map((match, i) => (
                          <tr key={i} className="bg-white">
                            <td className="px-4 py-2 text-gray-600">{formatDate(match.transaction.date)}</td>
                            <td className="px-4 py-2 font-medium text-brand-600">{match.newDescription}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={goBack}
          disabled={step === 1}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Indietro
        </button>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Annulla
          </button>
          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={matches.length === 0 && step === 1}
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continua
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Applica modifiche
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
