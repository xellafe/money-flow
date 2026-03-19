import { useState } from 'react';
import { Check } from 'lucide-react';
import { ModalShell } from '../ui';

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
    <ModalShell title="Conflitto categorie" onClose={onClose} size="sm">
      <p className="text-gray-600 mb-4">
        Alcune transazioni matchano keyword di più categorie. 
        Di default viene usata la keyword più lunga (più specifica).
        Puoi modificare la scelta per ogni transazione.
      </p>

      <div className="space-y-4 mb-6">
        {conflicts.map((conflict) => (
          <div key={conflict.txId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-800 mb-2">{conflict.description}</p>
            <p className="text-sm text-gray-500 mb-3">
              Categorie trovate: {conflict.matches.map(m => `${m.category} (${m.keyword})`).join(', ')}
            </p>
            <div className="flex flex-col gap-2">
              {conflict.matches.map(m => (
                <label
                  key={m.category}
                  className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border ${
                    choices[conflict.txId] === m.category
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    checked={choices[conflict.txId] === m.category}
                    onChange={() => setChoices(prev => ({ ...prev, [conflict.txId]: m.category }))}
                    className="accent-brand-600"
                  />
                  <span>{m.category}</span>
                  <span className="text-gray-500 text-sm">({m.keyword})</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={onClose}
        >
          Annulla
        </button>
        <button
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
          onClick={handleConfirm}
        >
          <Check size={16} /> Applica modifica
        </button>
      </div>
    </ModalShell>
  );
}
