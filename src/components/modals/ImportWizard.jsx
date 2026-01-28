import { useState } from 'react';
import { Settings, Check } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">
          <Settings size={20} /> Configura formato import
        </h3>
        
        <p className="modal-message">
          Non ho riconosciuto il formato di questo file. Configura la mappatura delle colonne.
        </p>

        <div className="wizard-form">
          <div className="wizard-field">
            <label>Nome profilo (per riutilizzarlo in futuro)</label>
            <input 
              type="text" 
              value={profileName} 
              onChange={e => setProfileName(e.target.value)}
              placeholder="Es: La mia banca"
            />
          </div>

          <div className="wizard-field">
            <label>Colonna Data *</label>
            <select value={dateColumn} onChange={e => setDateColumn(e.target.value)}>
              <option value="">-- Seleziona --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div className="wizard-field">
            <label>Colonna Descrizione *</label>
            <select value={descriptionColumn} onChange={e => setDescriptionColumn(e.target.value)}>
              <option value="">-- Seleziona --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div className="wizard-field">
            <label>Tipo importo</label>
            <div className="wizard-radio-group">
              <label>
                <input 
                  type="radio" 
                  checked={amountType === 'single'} 
                  onChange={() => setAmountType('single')}
                />
                Colonna unica (+ e -)
              </label>
              <label>
                <input 
                  type="radio" 
                  checked={amountType === 'split'} 
                  onChange={() => setAmountType('split')}
                />
                Colonne separate (Entrate/Uscite)
              </label>
            </div>
          </div>

          {amountType === 'single' ? (
            <div className="wizard-field">
              <label>Colonna Importo *</label>
              <select value={amountColumn} onChange={e => setAmountColumn(e.target.value)}>
                <option value="">-- Seleziona --</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="wizard-field">
                <label>Colonna Entrate</label>
                <select value={incomeColumn} onChange={e => setIncomeColumn(e.target.value)}>
                  <option value="">-- Nessuna --</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div className="wizard-field">
                <label>Colonna Uscite</label>
                <select value={expenseColumn} onChange={e => setExpenseColumn(e.target.value)}>
                  <option value="">-- Nessuna --</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="wizard-field">
            <label>Colonna ID Transazione (opzionale, per deduplicazione)</label>
            <select value={idColumn} onChange={e => setIdColumn(e.target.value)}>
              <option value="">-- Nessuna --</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          {sampleData.length > 0 && (
            <div className="wizard-preview">
              <label>Anteprima dati:</label>
              <div className="wizard-preview-table">
                <table>
                  <thead>
                    <tr>
                      {columns.slice(0, 5).map(col => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {columns.slice(0, 5).map(col => <td key={col}>{String(row[col] || '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Annulla</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!isValid}>
            <Check size={16} /> Salva e Importa
          </button>
        </div>
      </div>
    </div>
  );
}
