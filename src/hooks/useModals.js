import { useState } from 'react';

/**
 * Hook per gestire la visibilità delle modali e lo stato dei form
 */
export function useModals() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [editingDescription, setEditingDescription] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: '', description: '', amount: '', category: 'Altro',
  });

  return {
    confirmDelete, setConfirmDelete,
    editingTx, setEditingTx,
    editingDescription, setEditingDescription,
    newDescription, setNewDescription,
    showAddTransaction, setShowAddTransaction,
    showCategoryManager, setShowCategoryManager,
    showSyncSettings, setShowSyncSettings,
    newTransaction, setNewTransaction,
  };
}

export default useModals;
