import { useState } from 'react';
import { Check } from 'lucide-react';
import { ModalShell } from '../ui';

/**
 * Wizard per configurare la mappatura colonne durante l'import
 * @param {Object} props
 * @param {string[]} props.columns - Colonne disponibili nel file
 * @param {Object[]} props.sampleData - Dati di esempio
 * @param {Function} props.onConfirm - Callback con il profilo configurato
 * @param {Function} props.onCancel - Callback annullamento
 */
export default function ImportWizard({ columns, sampleData, onConfirm, onCancel }) {
  const [profileName, setProfileName] = useState('');
  const [dateColumn, setDateColumn] = useState('');
  const [descriptionColumn, setDescriptionColumn] = useState('');
  const [amountType, setAmountType] = useState('single');
  const [amountColumn, setAmountColumn] = useState('');
  const [incomeColumn, setIncomeColumn] = useState('');
  const [expenseColumn, setExpenseColumn] = useState('');
  const [idColumn, setIdColumn] = useState('');

  const isValid = profileName.trim() && dateColumn && descriptionColumn && 
    (amountType === 'single' ? amountColumn : (incomeColumn || expenseColumn));

  const handleConfirm = () => {
    const profile = {
      name: profileName.trim(),
      headerRow: 0,
      dateColumn,
      descriptionColumn,
      amountType,
      ...(amountType === 'single' ? { amountColumn } : { incomeColumn, expenseColumn }),
      idColumn: idColumn || null,
    };
    onConfirm(profile);
  };

  return (
    <ModalShell title="Importa transazioni" onClose={onCancel} size="lg">
      <p className="text-gray-600 mb-6">
        Non ho riconosciuto il formato di questo file. Configura la mappatura delle colonne.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome profilo (per riutilizzarlo in futuro)
          </label>
          <input
            type="text"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            placeholder="Es: La mia banca"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colonna Data *
          </label>
          <select
            value={dateColumn}
            onChange={e => setDateColumn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="">-- Seleziona --</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colonna Descrizione *
          </label>
          <select
            value={descriptionColumn}
            onChange={e => setDescriptionColumn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="">-- Seleziona --</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo importo
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={amountType === 'single'}
                onChange={() => setAmountType('single')}
                className="accent-brand-600"
              />
              <span className="text-sm text-gray-700">Colonna singola</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={amountType === 'split'}
                onChange={() => setAmountType('split')}
                className="accent-brand-600"
              />
              <span className="text-sm text-gray-700">Entrate/Uscite separate</span>
            </label>
          </div>
        </div>

        {amountType === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colonna Importo *
            </label>
            <select
              value={amountColumn}
              onChange={e => setAmountColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            >
              <option value="">-- Seleziona --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colonna Entrate
              </label>
              <select
                value={incomeColumn}
                onChange={e => setIncomeColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
              >
                <option value="">-- Nessuna --</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colonna Uscite
              </label>
              <select
                value={expenseColumn}
                onChange={e => setExpenseColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
              >
                <option value="">-- Nessuna --</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colonna ID Transazione (opzionale, per deduplicazione)
          </label>
          <select
            value={idColumn}
            onChange={e => setIdColumn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="">-- Nessuna --</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        {sampleData.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anteprima dati:
            </label>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.slice(0, 5).map(col => (
                      <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sampleData.slice(0, 3).map((row, i) => (
                    <tr key={i} className="bg-white">
                      {columns.slice(0, 5).map(col => (
                        <td key={col} className="px-3 py-2 text-gray-700">{String(row[col] || '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={onCancel}
        >
          Annulla
        </button>
        <button
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={handleConfirm}
          disabled={!isValid}
        >
          <Check size={16} /> Importa file
        </button>
      </div>
    </ModalShell>
  );
}
