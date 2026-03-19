import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { FilterChip } from './FilterChip';
import { MONTHS_IT } from '../../constants';

/**
 * Filter bar with debounced search input, category dropdown, and active filter chips.
 * @param {{
 *   searchQuery: string,
 *   setSearchQuery: (q: string) => void,
 *   transactionsCategoryFilter: string|null,
 *   setTransactionsCategoryFilter: (c: string|null) => void,
 *   allCategories: string[],
 *   selectedMonth: number|null,
 *   selectedYear: number|null,
 * }} props
 */
export function TransactionFilterBar({
  searchQuery,
  setSearchQuery,
  transactionsCategoryFilter,
  setTransactionsCategoryFilter,
  allCategories,
  selectedMonth,
  selectedYear,
}) {
  // Local input value for instant UI response
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sync inputValue when searchQuery changes externally (e.g., cleared by parent)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce: update parent searchQuery 200ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        setSearchQuery(inputValue);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, searchQuery, setSearchQuery]);

  // Clear search immediately (no debounce)
  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips = [];

    if (transactionsCategoryFilter) {
      chips.push({
        key: 'category',
        label: `Categoria: ${transactionsCategoryFilter.length > 24 ? transactionsCategoryFilter.slice(0, 24) + '…' : transactionsCategoryFilter}`,
        onDismiss: () => setTransactionsCategoryFilter(null),
      });
    }

    if (searchQuery.trim()) {
      const truncated = searchQuery.length > 20 ? searchQuery.slice(0, 20) + '…' : searchQuery;
      chips.push({
        key: 'search',
        label: `Ricerca: "${truncated}"`,
        onDismiss: handleClearSearch,
      });
    }

    // Year/month chips are read-only (controlled by AppHeader)
    if (selectedYear !== null) {
      if (selectedMonth !== null) {
        chips.push({
          key: 'period',
          label: `${MONTHS_IT[selectedMonth]} ${selectedYear}`,
          readOnly: true,
        });
      } else {
        chips.push({
          key: 'year',
          label: `Anno: ${selectedYear}`,
          readOnly: true,
        });
      }
    }

    return chips;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionsCategoryFilter, searchQuery, selectedMonth, selectedYear, setTransactionsCategoryFilter]);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Filter controls row */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          {inputValue ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="Cancella ricerca"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Cerca transazioni…"
            aria-label="Cerca transazioni"
            className="w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 pl-9 pr-8 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={transactionsCategoryFilter || ''}
          onChange={(e) => setTransactionsCategoryFilter(e.target.value || null)}
          className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
          aria-label="Filtra per categoria"
        >
          <option value="">Tutte le categorie</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter chips row */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onDismiss={chip.onDismiss}
              readOnly={chip.readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
