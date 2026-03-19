import { useState } from 'react';
import { ModalShell } from '../ui';

/**
 * Modal per risolvere conflitti durante l'import
 * @param {Object} props
 * @param {Object[]} props.conflicts - Array di conflitti { existing, new }
 * @param {Function} props.onResolve - Callback con (toReplace, toAdd)
 * @param {Function} props.onCancel - Callback annullamento
 */
export default function ConflictResolver({ conflicts, onResolve, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedDecisions, setResolvedDecisions] = useState([]);

  const conflict = conflicts[currentIndex];

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('it-IT');

  const formatAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}€${Math.abs(amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`;
  };

  const handleResolve = (decision) => {
    const newDecisions = [...resolvedDecisions, { ...conflict, decision }];
    if (currentIndex < conflicts.length - 1) {
      setResolvedDecisions(newDecisions);
      setCurrentIndex(currentIndex + 1);
    } else {
      const toReplace = newDecisions.filter(c => c.decision === 'replace');
      const toAdd = newDecisions.filter(c => c.decision === 'add');
      onResolve(toReplace, toAdd);
    }
  };

  return (
    <ModalShell title="Risolvi conflitti" onClose={onCancel} size="lg">
      <p className="text-sm text-gray-500 mb-4">
        Conflitto {currentIndex + 1} di {conflicts.length}
      </p>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Esistente</span>
          <div className="mt-1 p-3 bg-white rounded border border-gray-200">
            <p className="font-medium text-gray-800">{conflict.existing.description}</p>
            <p className="text-sm text-gray-500">
              {formatDate(conflict.existing.date)} •{' '}
              <span className={conflict.existing.amount >= 0 ? 'text-income-500' : 'text-expense-500'}>
                {formatAmount(conflict.existing.amount)}
              </span>
            </p>
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Nuovo</span>
          <div className="mt-1 p-3 bg-white rounded border border-gray-200">
            <p className="font-medium text-gray-800">{conflict.new.description}</p>
            <p className="text-sm text-gray-500">
              {formatDate(conflict.new.date)} •{' '}
              <span className={conflict.new.amount >= 0 ? 'text-income-500' : 'text-expense-500'}>
                {formatAmount(conflict.new.amount)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={() => handleResolve('skip')}
        >
          Salta
        </button>
        <div className="flex gap-3">
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            onClick={() => handleResolve('keep')}
          >
            Mantieni originale
          </button>
          <button
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            onClick={() => handleResolve('replace')}
          >
            Usa nuovo
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
