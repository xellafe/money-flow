import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MONTHS_IT } from '../../constants';

const VIEW_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Transazioni',
  settings:     'Impostazioni',
};

/**
 * @param {{
 *   view: string,
 *   onAddTransaction: () => void,
 *   selectedMonth: number|null,
 *   selectedYear: number|null,
 *   onPrevMonth: () => void,
 *   onNextMonth: () => void,
 *   onClearPeriod: () => void
 * }} props
 */
export function AppHeader({
  view,
  onAddTransaction,
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onClearPeriod,
}) {
  const isTutti = selectedMonth === null && selectedYear === null;

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">
        {VIEW_TITLES[view] ?? 'MoneyFlow'}
      </h1>

      {/* Period selector — only visible on dashboard view */}
      {view === 'dashboard' && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2"
            aria-label="Mese precedente"
          >
            <ChevronLeft size={16} />
          </button>

          {selectedMonth !== null && selectedYear !== null && (
            <motion.span
              key={`${selectedMonth}-${selectedYear}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="text-sm font-semibold text-gray-700 min-w-[120px] text-center"
            >
              {MONTHS_IT[selectedMonth]} {selectedYear}
            </motion.span>
          )}

          <button
            onClick={onNextMonth}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2"
            aria-label="Mese successivo"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={onClearPeriod}
            aria-pressed={isTutti}
            className={
              isTutti
                ? 'px-3 py-1 rounded-md text-sm font-semibold bg-brand-500 text-white cursor-pointer'
                : 'px-3 py-1 rounded-md text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-150'
            }
          >
            Tutti
          </button>
        </div>
      )}

      {/* Add transaction button — only visible on transactions view */}
      {view === 'transactions' && (
        <button
          onClick={onAddTransaction}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors duration-150 cursor-pointer"
        >
          <Plus size={16} />
          Aggiungi transazione
        </button>
      )}
    </header>
  );
}
