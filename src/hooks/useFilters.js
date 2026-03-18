import { useState, useEffect } from 'react';

/**
 * Hook per gestire lo stato dei filtri, paginazione e navigazione view
 * @param {Object} options
 * @param {number[]} options.years - Anni disponibili dalle transazioni (default: [])
 */
export function useFilters({ years = [] } = {}) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dashboardTypeFilter, setDashboardTypeFilter] = useState('all');
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState([]);
  const [transactionsCategoryFilter, setTransactionsCategoryFilter] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showCategoryPercentage, setShowCategoryPercentage] = useState(false);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, searchQuery, transactionsCategoryFilter]);

  // Auto-update selectedYear quando cambiano gli anni disponibili
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  return {
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    dashboardTypeFilter, setDashboardTypeFilter,
    dashboardCategoryFilter, setDashboardCategoryFilter,
    transactionsCategoryFilter, setTransactionsCategoryFilter,
    expandedCategory, setExpandedCategory,
    showCategoryPercentage, setShowCategoryPercentage,
  };
}

export default useFilters;
