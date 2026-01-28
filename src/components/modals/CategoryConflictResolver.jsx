import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

/**
 * Modal per risolvere conflitti di categoria durante la ricategorizzazione
 * @param {Object} props
 * @param {Object[]} props.conflicts - Array di conflitti { txId, description, matches, currentChoice }
 * @param {Function} props.onConfirm - Callback con le risoluzioni
 * @param {Function} props.onClose - Callback chiusura
 */
export default function CategoryConflictResolver({ conflicts, onConfirm, onClose }) {
  // Stato locale per le scelte (inizializzato con le scelte di default)
  const [choices, setChoices] = useState(() => {
    const initial = {};
    conflicts.forEach(c => {
      initial[c.txId] = c.currentChoice;
    });
    return initial;
  });

  const handleConfirm = () => {
    // Passa tutte le scelte al genitore
    const resolutions = conflicts.map(c => ({
      txId: c.txId,
      description: c.description,
      category: choices[c.txId]
    }));
    onConfirm(resolutions);
  };

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
                  <label key={m.category} className={choices[conflict.txId] === m.category ? 'selected' : ''}>
                    <input
                      type="radio"
                      checked={choices[conflict.txId] === m.category}
                      onChange={() => setChoices(prev => ({ ...prev, [conflict.txId]: m.category }))}
                    />
                    {m.category} <small style={{ color: 'var(--color-gray-500)' }}>({m.keyword})</small>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            <Check size={16} /> Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
