import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '../../utils';

/**
 * Modal per risolvere conflitti durante l'import
 * @param {Object} props
 * @param {Object[]} props.conflicts - Array di conflitti { existing, new }
 * @param {Function} props.onResolve - Callback con (toReplace, toAdd)
 * @param {Function} props.onCancel - Callback annullamento
 */
export default function ConflictResolver({ conflicts, onResolve, onCancel }) {
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
