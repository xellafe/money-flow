import { Plus } from 'lucide-react';

const VIEW_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Transazioni',
  settings:     'Impostazioni',
};

export function AppHeader({ view, onAddTransaction }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">
        {VIEW_TITLES[view] ?? 'MoneyFlow'}
      </h1>

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
