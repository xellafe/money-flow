import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardStatCard } from '../components/dashboard/DashboardStatCard';
import { SkeletonStatCard } from '../components/dashboard/SkeletonStatCard';
import { AreaChartCard } from '../components/dashboard/AreaChartCard';
import { DonutChartCard } from '../components/dashboard/DonutChartCard';
import { DashboardEmptyState } from '../components/dashboard/DashboardEmptyState';
import { MONTHS_IT } from '../constants';

/**
 * Root layout container for the dashboard.
 * Composes stat cards, area chart, and donut chart with skeleton loading.
 * @param {{
 *   stats: { income: number, expenses: number, categoryData: Array, monthlyData: Array, prevIncome?: number, prevExpenses?: number },
 *   selectedMonth: number|null,
 *   selectedYear: number|null,
 *   dashboardCategoryFilter: string[],
 *   onCategoryFilterChange: (categories: string[]) => void,
 *   onTransactionsCategoryChange: (category: string|null) => void
 * }} props
 */
export function DashboardView({
  stats,
  selectedMonth,
  selectedYear,
  dashboardCategoryFilter,
  onCategoryFilterChange,
  onTransactionsCategoryChange,
  hasTransactions,  // NEW: shows empty state when false
  onImport,         // NEW: CTA callback for file import
}) {
  // Skeleton loading state: show on mount and on period change
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    // Clear category filter when period changes
    onCategoryFilterChange([]);
    // DASH-07: clear transaction list filter when period changes
    onTransactionsCategoryChange(null);
    // Minimum 300ms skeleton display
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedMonth, selectedYear, onCategoryFilterChange, onTransactionsCategoryChange]);

  // Calculate % change vs previous period
  const incomeChange = useMemo(() => {
    if (stats.prevIncome === undefined || stats.prevIncome === null) return null;
    if (stats.prevIncome === 0) return null;
    return ((stats.income - stats.prevIncome) / stats.prevIncome) * 100;
  }, [stats.income, stats.prevIncome]);

  const expensesChange = useMemo(() => {
    if (stats.prevExpenses === undefined || stats.prevExpenses === null) return null;
    if (stats.prevExpenses === 0) return null;
    return ((stats.expenses - stats.prevExpenses) / stats.prevExpenses) * 100;
  }, [stats.expenses, stats.prevExpenses]);

  // Map dashboardCategoryFilter (array) to selected category name (string|null)
  const selectedCategory = Array.isArray(dashboardCategoryFilter) && dashboardCategoryFilter.length > 0
    ? dashboardCategoryFilter[0]
    : null;

  const handleCategorySelect = useCallback((categoryName) => {
    // setDashboardCategoryFilter expects array: [name] or []
    if (categoryName) {
      onCategoryFilterChange([categoryName]);
      // DASH-07: also filter the transaction list to this category
      onTransactionsCategoryChange(categoryName);
    } else {
      onCategoryFilterChange([]);
      // DASH-07: clear transaction list filter when deselecting
      onTransactionsCategoryChange(null);
    }
  }, [onCategoryFilterChange, onTransactionsCategoryChange]);

  // Empty state when no transactions
  if (!hasTransactions) {
    return (
      <div className="p-6 flex-1 flex items-center justify-center">
        <DashboardEmptyState onImport={onImport} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-6 pb-8 flex flex-col gap-6"
    >
      {/* Period label */}
      <h3 className="text-base font-semibold text-gray-700">
        {selectedMonth !== null && selectedYear !== null
          ? `${MONTHS_IT[selectedMonth]} ${selectedYear}`
          : selectedYear !== null
            ? `Anno ${selectedYear}`
            : 'Tutti gli anni'}
      </h3>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton-income"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SkeletonStatCard />
            </motion.div>
          ) : (
            <motion.div
              key="content-income"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0 }}
            >
              <DashboardStatCard
                type="income"
                amount={stats.income}
                percentChange={incomeChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton-expense"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SkeletonStatCard />
            </motion.div>
          ) : (
            <motion.div
              key="content-expense"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
            >
              <DashboardStatCard
                type="expense"
                amount={stats.expenses}
                percentChange={expensesChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Area chart */}
      <AreaChartCard
        monthlyData={stats.monthlyData}
        isLoading={isLoading}
        selectedYear={selectedYear}
      />

      {/* Donut chart */}
      <div className="flex justify-end">
        <DonutChartCard
          categoryData={stats.categoryData}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
}
