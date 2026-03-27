import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

/**
 * Modal for manually adding a new transaction.
 * Uses ModalShell wrapper and binds to useModals newTransaction state.
 *
 * @param {{
 *   newTransaction: { date: string, description: string, amount: string, category: string },
 *   setNewTransaction: (tx: object) => void,
 *   onConfirm: () => void,
 *   onClose: () => void,
 *   categories: string[],
 * }} props
 */
export default function AddTransactionModal({
  newTransaction,
  setNewTransaction,
  onConfirm,
  onClose,
  categories,
}) {
  // Set default date to today when modal opens
  useEffect(() => {
    if (!newTransaction.date) {
      const today = new Date().toISOString().slice(0, 10);
      setNewTransaction((prev) => ({ ...prev, date: today }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => {
    setNewTransaction((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const isValid = newTransaction.description?.trim().length > 0;

  // Sort categories alphabetically with 'Altro' at end
  const sortedCategories = [...categories].sort((a, b) => {
    if (a === 'Altro') return 1;
    if (b === 'Altro') return -1;
    return a.localeCompare(b, 'it');
  });

  return (
    <ModalShell title="Nuova transazione" onClose={onClose} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) onConfirm();
        }}
        className="flex flex-col gap-4"
      >
        {/* Data field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Data
          </label>
          <input
            type="date"
            value={newTransaction.date}
            onChange={handleChange('date')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Importo field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Importo
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={newTransaction.amount}
            onChange={handleChange('amount')}
            placeholder="es. -45.50"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Descrizione field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Descrizione
          </label>
          <input
            type="text"
            value={newTransaction.description}
            onChange={handleChange('description')}
            placeholder="Descrizione…"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Categoria field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Categoria
          </label>
          <select
            value={newTransaction.category}
            onChange={handleChange('category')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
          >
            {sortedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} />
            Aggiungi
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
