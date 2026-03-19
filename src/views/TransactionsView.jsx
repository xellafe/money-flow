import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ArrowUpDown, Inbox, SearchX } from 'lucide-react';
import { TransactionRow, TransactionFilterBar } from '../components/transactions';
import { ITEMS_PER_PAGE } from '../constants';

/**
 * Sortable column header button.
 */
function SortableHeader({ column, label, sortColumn, sortDirection, onSort }) {
  const isActive = sortColumn === column;
  const Icon = !isActive
    ? ArrowUpDown
    : sortDirection === 'asc'
    ? ChevronUp
    : ChevronDown;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 text-xs font-normal uppercase tracking-wide transition-colors duration-150
        ${isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
      aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <Icon size={14} className={isActive ? 'text-brand-500' : 'text-gray-300'} aria-hidden="true" />
    </button>
  );
}

/**
 * Empty state component with two variants.
 */
function EmptyState({ hasActiveFilters, onClearFilters, onImport }) {
  const Icon = hasActiveFilters ? SearchX : Inbox;
  const heading = hasActiveFilters ? 'Nessun risultato' : 'Nessuna transazione';
  const body = hasActiveFilters
    ? 'Nessuna transazione corrisponde ai filtri attivi. Prova a rimuoverli.'
    : 'Importa il tuo estratto conto per iniziare a tracciare le tue finanze.';
  const cta = hasActiveFilters
    ? { label: 'Rimuovi filtri', onClick: onClearFilters, style: 'secondary' }
    : { label: 'Importa transazioni', onClick: onImport, style: 'primary' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center gap-4 py-24 text-center"
    >
      <Icon size={48} className="text-gray-300" aria-hidden="true" />
      <h3 className="text-base font-semibold text-gray-700">{heading}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{body}</p>
      <button
        type="button"
        onClick={cta.onClick}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
          cta.style === 'primary'
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        {cta.label}
      </button>
    </motion.div>
  );
}

/**
 * Pagination bar with counter and navigation.
 */
function PaginationBar({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <span className="text-xs font-normal text-gray-500">
        Mostrando {start.toLocaleString('it-IT')}–{end.toLocaleString('it-IT')} di {totalItems.toLocaleString('it-IT')} transazioni
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          ← Precedente
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Successiva →
        </button>
      </div>
    </div>
  );
}

/**
 * Transaction list view: filter bar, sortable header, paginated rows, empty state.
 * @param {{
 *   transactions: Array,
 *   allCategories: string[],
 *   categories: Object,
 *   searchQuery: string,
 *   setSearchQuery: Function,
 *   transactionsCategoryFilter: string|null,
 *   setTransactionsCategoryFilter: Function,
 *   sortColumn: string,
 *   setSortColumn: Function,
 *   sortDirection: string,
 *   setSortDirection: Function,
 *   currentPage: number,
 *   setCurrentPage: Function,
 *   selectedMonth: number|null,
 *   selectedYear: number|null,
 *   editingTx: string|null,
 *   setEditingTx: Function,
 *   editingDescription: string|null,
 *   setEditingDescription: Function,
 *   newDescription: string,
 *   setNewDescription: Function,
 *   updateTxCategory: Function,
 *   updateTxDescription: Function,
 *   setConfirmDelete: Function,
 *   onImport: Function,
 * }} props
 */
export function TransactionsView({
  transactions,
  allCategories,
  categories,
  searchQuery,
  setSearchQuery,
  transactionsCategoryFilter,
  setTransactionsCategoryFilter,
  sortColumn,
  setSortColumn,
  sortDirection,
  setSortDirection,
  currentPage,
  setCurrentPage,
  selectedMonth,
  selectedYear,
  editingTx,
  setEditingTx,
  editingDescription,
  setEditingDescription,
  newDescription,
  setNewDescription,
  updateTxCategory,
  updateTxDescription,
  setConfirmDelete,
  onImport,
}) {
  // Sort handler: 3-state toggle (ASC → DESC → reset to date DESC)
  const handleSort = useCallback((column) => {
    if (column !== sortColumn) {
      // New column: start at ASC
      setSortColumn(column);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      // Same column ASC → DESC
      setSortDirection('desc');
    } else {
      // Same column DESC → reset to default
      setSortColumn('date');
      setSortDirection('desc');
    }
    setCurrentPage(1);
  }, [sortColumn, sortDirection, setSortColumn, setSortDirection, setCurrentPage]);

  // Sort transactions
  // Categoria sort removed: Decision A stacked layout eliminates separate category column header (TRNS-02 scoped to date + importo only)
  const sorted = useMemo(() => {
    const arr = [...transactions];
    arr.sort((a, b) => {
      let va, vb;
      if (sortColumn === 'date') {
        va = new Date(a.date);
        vb = new Date(b.date);
      } else if (sortColumn === 'amount') {
        va = a.amount;
        vb = b.amount;
      } else {
        return 0;
      }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [transactions, sortColumn, sortDirection]);

  // Paginate
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [sorted, currentPage]
  );

  // Check if any filters are active (for empty state variant)
  const hasActiveFilters = !!(searchQuery.trim() || transactionsCategoryFilter);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setTransactionsCategoryFilter(null);
    setCurrentPage(1);
  }, [setSearchQuery, setTransactionsCategoryFilter, setCurrentPage]);

  // Inline edit handlers
  const handleEditDescription = useCallback((tx) => {
    setEditingDescription(tx.id);
    setNewDescription(tx.description);
  }, [setEditingDescription, setNewDescription]);

  const handleDescriptionSave = useCallback((id, description) => {
    if (description.trim()) {
      updateTxDescription(id, description);
    }
    setEditingDescription(null);
    setNewDescription('');
  }, [updateTxDescription, setEditingDescription, setNewDescription]);

  const handleDescriptionCancel = useCallback(() => {
    setEditingDescription(null);
    setNewDescription('');
  }, [setEditingDescription, setNewDescription]);

  const handleCategoryChange = useCallback((id, category) => {
    updateTxCategory(id, category);
    setEditingTx(null);
  }, [updateTxCategory, setEditingTx]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col h-full bg-gray-50"
    >
      {/* Filter bar */}
      <TransactionFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        transactionsCategoryFilter={transactionsCategoryFilter}
        setTransactionsCategoryFilter={setTransactionsCategoryFilter}
        allCategories={allCategories}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {transactions.length === 0 ? (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onImport={onImport}
          />
        ) : (
          <>
            {/* Sticky header — matches stacked row layout per CONTEXT.md Decision A */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="grid grid-cols-[1fr_120px_40px] px-4 py-2">
                {/* Col 1: Combined sortable by Date (stacked content sorts by date) */}
                <SortableHeader
                  column="date"
                  label="Transazione"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                {/* Col 2: Amount */}
                <div className="text-right">
                  <SortableHeader
                    column="amount"
                    label="Importo"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </div>
                {/* Col 3: Delete column - no header */}
                <div></div>
              </div>
            </div>

            {/* Transaction rows */}
            <div className="bg-white">
              <AnimatePresence initial={false} mode="popLayout">
                {paginated.map((tx) => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TransactionRow
                      tx={tx}
                      categories={categories}
                      isEditingDescription={editingDescription === tx.id}
                      isEditingCategory={editingTx === tx.id}
                      newDescription={newDescription}
                      onDescriptionChange={setNewDescription}
                      onDescriptionSave={handleDescriptionSave}
                      onDescriptionCancel={handleDescriptionCancel}
                      onCategoryChange={handleCategoryChange}
                      onCategoryBlur={() => setEditingTx(null)}
                      onEditDescription={() => handleEditDescription(tx)}
                      onEditCategory={() => setEditingTx(tx.id)}
                      onDelete={() => setConfirmDelete({ type: 'single', id: tx.id })}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {transactions.length > ITEMS_PER_PAGE && (
        <PaginationBar
          currentPage={currentPage}
          totalItems={transactions.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </motion.div>
  );
}
