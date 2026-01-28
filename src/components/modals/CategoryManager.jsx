import { useState } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal category-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestione Categorie</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-gray-500)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Le transazioni vengono categorizzate automaticamente se la descrizione contiene una delle parole chiave.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {categoriesChanged && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={14} /> Rilevate modifiche.
              </span>
            )}
            <button className="btn-secondary" onClick={onRecategorize}>
              Ri-categorizza tutto
            </button>
          </div>
          
          {/* Aggiungi nuova categoria */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Nome nuova categoria..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              className="search-input"
              style={{ paddingLeft: '1rem', flex: 1, maxWidth: 'none' }}
            />
            <button 
              className="btn-primary" 
              onClick={handleAddCategory}
              style={{ padding: '0.5rem 1rem' }}
            >
              <Plus size={16} /> Aggiungi
            </button>
          </div>

          <div className="categories-grid">
            {Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([cat, keywords]) => (
              <div 
                key={cat} 
                className="category-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="category-card-title" style={{ marginBottom: 0 }}>{cat}</div>
                  <button
                    onClick={() => onDeleteCategory(cat)}
                    className="btn-delete"
                    title="Elimina categoria"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* Aggiungi keyword */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Nuova keyword..."
                    value={editingCategory === cat ? newKeyword : ''}
                    onChange={e => { setEditingCategory(cat); setNewKeyword(e.target.value); }}
                    onKeyDown={e => e.key === 'Enter' && handleAddKeyword(cat)}
                    className="search-input"
                    style={{ paddingLeft: '0.75rem', flex: 1, maxWidth: 'none', fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  />
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleAddKeyword(cat)}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                
                <div className="keywords-list">
                  {keywords.map(k => (
                    <span 
                      key={k} 
                      className="keyword-tag"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {k}
                      <button
                        onClick={() => onRemoveKeyword(cat, k)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          padding: 0, 
                          cursor: 'pointer',
                          display: 'flex',
                          color: 'var(--color-gray-500)'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span style={{ color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
                      Nessuna keyword
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
