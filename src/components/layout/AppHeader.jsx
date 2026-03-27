import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const MONTHS_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

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
 *   selectedYear: number,
 *   onPrevYear: () => void,
 *   onNextYear: () => void,
 *   onSelectMonth: (month: number) => void,
 *   availableMonths: Set<number>,
 * }} props
 */
export function AppHeader({
  view,
  onAddTransaction,
  selectedMonth,
  selectedYear,
  onPrevYear,
  onNextYear,
  onSelectMonth,
  availableMonths,
}) {
  return (
    <header className="flex flex-col border-b border-gray-200 bg-white shrink-0">
      {/* Title row */}
      <div className="h-14 flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-gray-800">
          {VIEW_TITLES[view] ?? 'MoneyFlow'}
        </h1>

        <button
          onClick={onAddTransaction}
          aria-label="Aggiungi transazione"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Aggiungi
        </button>
      </div>

      {/* Period selector row — dashboard and transactions */}
      {(view === 'dashboard' || view === 'transactions') && (
        <div className="flex items-center gap-3 px-6 pb-3">
          {/* Year nav */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onPrevYear}
              className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Anno precedente"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="w-11 text-center text-sm font-semibold text-gray-700 tabular-nums select-none">
              {selectedYear}
            </span>
            <button
              onClick={onNextYear}
              className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Anno successivo"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Month pills — only months with transactions */}
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtra per mese">
            {MONTHS_SHORT.map((label, i) => {
              if (!availableMonths || !availableMonths.has(i)) return null;
              const isActive = selectedMonth === i;
              return (
                <button
                  key={i}
                  onClick={() => onSelectMonth(i)}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? 'px-3 py-1 rounded-full text-xs font-bold border border-gray-900 text-gray-900 bg-white cursor-pointer'
                      : 'px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-500 bg-white hover:border-gray-500 hover:text-gray-700 cursor-pointer transition-colors'
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
