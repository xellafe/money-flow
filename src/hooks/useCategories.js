import { useState, useCallback } from 'react';
import { DEFAULT_CATEGORIES } from '../constants';
import { findMatchingCategories } from '../utils';

/**
 * Hook per gestire le categorie, keyword mapping e conflitti
 * @param {Object} options
 * @param {Function} options.showToast - Callback per mostrare notifiche toast
 */
export function useCategories({ showToast }) {
  const [categories, setCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
      return saved.categories
        ? { ...DEFAULT_CATEGORIES, ...saved.categories }
        : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [importProfiles, setImportProfiles] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moneyFlow') || '{}');
      return saved.importProfiles || {};
    } catch {
      return {};
    }
  });

  const [categoriesChanged, setCategoriesChanged] = useState(false);
  const [categoryConflicts, setCategoryConflicts] = useState(null);

  // Aggiungi nuova categoria
  const addCategory = useCallback((name) => {
    if (!name.trim()) return;
    if (categories[name]) {
      showToast("Categoria già esistente", "error");
      return;
    }
    setCategories(prev => ({ ...prev, [name.trim()]: [] }));
    setCategoriesChanged(true);
    showToast(`Categoria "${name}" creata`);
  }, [categories, showToast]);

  // Elimina categoria
  const deleteCategory = useCallback((name) => {
    setCategories(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
    setCategoriesChanged(true);
    showToast(`Categoria "${name}" eliminata`);
  }, [showToast]);

  // Aggiungi keyword a categoria
  const addKeyword = useCallback((category, keyword) => {
    if (!keyword.trim()) return;
    const upperKeyword = keyword.trim().toUpperCase();
    if (categories[category]?.includes(upperKeyword)) {
      showToast("Keyword già presente", "error");
      return;
    }
    setCategories(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), upperKeyword],
    }));
    setCategoriesChanged(true);
    showToast(`Keyword "${upperKeyword}" aggiunta`);
  }, [categories, showToast]);

  // Rimuovi keyword da categoria
  const removeKeyword = useCallback((category, keyword) => {
    setCategories(prev => ({
      ...prev,
      [category]: prev[category].filter(k => k !== keyword),
    }));
    setCategoriesChanged(true);
  }, []);

  // Ri-categorizza tutte le transazioni
  // Takes transactions, categoryResolutions, setTransactions as FUNCTION params
  // (not constructor params) because useCategories runs before useTransactionData
  const recategorizeAll = useCallback((transactions, categoryResolutions, setTransactions) => {
    const conflicts = [];
    const updated = transactions.map(t => {
      const savedResolution = categoryResolutions[t.description];
      if (savedResolution) {
        return { ...t, category: savedResolution };
      }

      const matches = findMatchingCategories(t.description, categories);
      if (matches.length <= 1) {
        return {
          ...t,
          category: matches.length === 1 ? matches[0].category : "Altro",
        };
      }

      const best = matches.reduce((a, b) =>
        a.keyword.length >= b.keyword.length ? a : b,
      );
      conflicts.push({
        txId: t.id,
        description: t.description,
        matches,
        currentChoice: best.category,
      });
      return { ...t, category: best.category };
    });

    setTransactions(updated);
    setCategoriesChanged(false);

    if (conflicts.length > 0) {
      setCategoryConflicts(conflicts);
    } else {
      showToast("Transazioni ri-categorizzate");
    }
  }, [categories, showToast]);

  return {
    categories, setCategories,
    importProfiles, setImportProfiles,
    categoriesChanged, setCategoriesChanged,
    categoryConflicts, setCategoryConflicts,
    addCategory,
    deleteCategory,
    addKeyword,
    removeKeyword,
    recategorizeAll,
  };
}

export default useCategories;
