import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ModalShell } from '../ui';

/**
 * Modal per la gestione delle categorie
 * @param {Object} props
 * @param {Object} props.categories - Oggetto categorie { nome: [keywords] }
 * @param {boolean} props.categoriesChanged - Flag modifiche non applicate
 * @param {Function} props.onAddCategory - Callback per aggiungere categoria
 * @param {Function} props.onDeleteCategory - Callback per eliminare categoria
 * @param {Function} props.onAddKeyword - Callback per aggiungere keyword
 * @param {Function} props.onRemoveKeyword - Callback per rimuovere keyword
 * @param {Function} props.onRecategorize - Callback per ri-categorizzare tutto
 * @param {Function} props.onClose - Callback chiusura
 */
export default function CategoryManager({ 
  categories, 
  categoriesChanged,
  onAddCategory, 
  onDeleteCategory, 
  onAddKeyword, 
  onRemoveKeyword,
  onRecategorize,
  onClose 
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleAddKeyword = (category) => {
    if (newKeyword.trim()) {
      onAddKeyword(category, newKeyword.trim());
      setNewKeyword('');
      setEditingCategory(null);
    }
  };

  return (
    <ModalShell title="Gestione Categorie" onClose={onClose} size="lg">
      <p className="text-sm text-gray-500 mb-4">
        Le transazioni vengono categorizzate automaticamente se la descrizione contiene una delle parole chiave.
      </p>

      {categoriesChanged && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <p className="text-amber-800 text-sm mb-2">
            Hai modificato le categorie. Vuoi ricategorizzare le transazioni esistenti?
          </p>
          <button
            onClick={onRecategorize}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Ricategorizza transazioni
          </button>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          placeholder="Nome nuova categoria"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleAddCategory}
          disabled={!newCategoryName.trim()}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={16} /> Aggiungi categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([cat, keywords]) => (
          <div key={cat} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">{cat}</h4>
              <button
                onClick={() => onDeleteCategory(cat)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Elimina categoria"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.map(k => (
                <span key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700">
                  {k}
                  <button
                    onClick={() => onRemoveKeyword(cat, k)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {keywords.length === 0 && (
                <span className="text-xs text-gray-400">Nessuna keyword</span>
              )}
            </div>

            {/* Add keyword input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuova keyword"
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={editingCategory === cat ? newKeyword : ''}
                onChange={e => { setEditingCategory(cat); setNewKeyword(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleAddKeyword(cat);
                  }
                }}
              />
              <button
                onClick={() => handleAddKeyword(cat)}
                className="p-1 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                title="Aggiungi keyword"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
