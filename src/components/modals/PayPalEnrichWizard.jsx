import { useState, useMemo, useEffect } from 'react';
import { X, Check, AlertCircle, Search, Upload, CreditCard } from 'lucide-react';

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
 * Wizard per arricchire le transazioni bancarie con i dati PayPal
 */
export default function PayPalEnrichWizard({ 
  transactions, 
  paypalData, 
  onConfirm, 
  onCancel 
}) {
  const [selectedMatches, setSelectedMatches] = useState({});

  // Filtra transazioni PayPal valide
  const validPayPalTransactions = useMemo(() => {
    console.log('=== Filtro transazioni PayPal ===');
    console.log('Righe CSV totali:', paypalData.length);
    
    const filtered = paypalData.filter(row => {
      const type = row[PAYPAL_CONFIG.typeColumn];
      const status = row[PAYPAL_CONFIG.statusColumn];
      const rawTotal = row[PAYPAL_CONFIG.totalColumn];
      console.log(`  RAW Totale: "${rawTotal}" (tipo: ${typeof rawTotal})`);
      const amount = parsePayPalAmount(rawTotal);
      const name = row[PAYPAL_CONFIG.nameColumn];
      
      // Ignora tipi non validi
      if (PAYPAL_CONFIG.ignoredTypes.some(t => type?.includes(t))) {
        console.log(`  SCARTATO (tipo): "${name}" | ${type}`);
        return false;
      }
      
      // Ignora stati non validi
      if (PAYPAL_CONFIG.ignoredStatuses.includes(status)) {
        console.log(`  SCARTATO (stato): "${name}" | ${status}`);
        return false;
      }
      
      // Deve avere un importo
      if (amount === 0) {
        console.log(`  SCARTATO (importo 0): "${name}"`);
        return false;
      }
      
      console.log(`  VALIDO: ${row[PAYPAL_CONFIG.dateColumn]} | ${amount}€ | "${name}" | ${type}`);
      return true;
    });
    
    console.log('Transazioni PayPal valide:', filtered.length);
    return filtered;
  }, [paypalData]);

  // Trova match tra transazioni bancarie e PayPal
  const matches = useMemo(() => {
    const result = [];
    const usedPayPalIndices = new Set();

    console.log('=== PayPal Matching Debug ===');
    console.log('Transazioni bancarie totali:', transactions.length);
    console.log('Transazioni PayPal valide:', validPayPalTransactions.length);
    
    // Debug: mostra prime 5 transazioni bancarie
    console.log('Prime 5 transazioni bancarie:');
    transactions.slice(0, 5).forEach(tx => {
      console.log(`  ${tx.date} | ${tx.amount}€ | "${tx.description}"`);
    });

    // Conta quante transazioni contengono "paypal"
    const paypalTxs = transactions.filter(tx => tx.description?.toLowerCase().includes('paypal'));
    console.log(`Transazioni bancarie con "paypal" nella descrizione: ${paypalTxs.length}`);

    // Cerca transazioni che potrebbero essere PayPal
    transactions.forEach((tx, txIndex) => {
      const desc = tx.description?.toLowerCase() || '';
      const isPayPal = desc.includes('paypal');
      
      if (!isPayPal) return;

      console.log(`Transazione PayPal bancaria: ${tx.date} | ${tx.amount}€ | "${tx.description}"`);

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
        
        if (dateOk || amountOk) {
          console.log(`  Candidato PP: ${ppRow[PAYPAL_CONFIG.dateColumn]} | ${ppAmount}€ | "${ppRow[PAYPAL_CONFIG.nameColumn]}" | dateOk=${dateOk} amountOk=${amountOk}`);
        }

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <CreditCard size={20} /> Arricchisci da PayPal
          </h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray-500)' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Nessuna corrispondenza trovata.</p>
            <p style={{ fontSize: '0.875rem' }}>
              Assicurati che le transazioni bancarie contengano "PayPal" nella descrizione
              e che le date/importi corrispondano.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>
                Trovate <strong>{matches.length}</strong> corrispondenze. Seleziona quelle da applicare.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={selectAll} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Seleziona tutti
                </button>
                <button className="btn-secondary" onClick={deselectAll} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Deseleziona tutti
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-gray-200)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-gray-100)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '40px' }}></th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Data</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Importo</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Descrizione attuale</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '40px' }}>→</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Nuova descrizione</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => toggleMatch(idx)}
                      style={{ 
                        cursor: 'pointer',
                        background: selectedMatches[idx] ? 'var(--color-success-bg, #ecfdf5)' : 'transparent',
                        borderBottom: '1px solid var(--color-gray-100)'
                      }}
                    >
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={!!selectedMatches[idx]} 
                          onChange={() => toggleMatch(idx)}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>{formatDate(match.transaction.date)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: match.transaction.amount < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {formatAmount(match.transaction.amount)}
                      </td>
                      <td style={{ padding: '0.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.transaction.description}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-gray-400)' }}>→</td>
                      <td style={{ padding: '0.5rem', fontWeight: 500, color: 'var(--color-primary)' }}>
                        {match.newDescription}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onCancel}>
            Annulla
          </button>
          {matches.length > 0 && (
            <button 
              className="btn-primary" 
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              <Check size={16} /> Applica {selectedCount} modifiche
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
