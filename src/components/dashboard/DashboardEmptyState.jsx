import { Wallet } from 'lucide-react';

/**
 * Empty state shown in DashboardView when no transactions exist.
 * @param {{ onImport: () => void }} props
 */
export function DashboardEmptyState({ onImport }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <Wallet size={64} className="text-gray-300" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-gray-700">Nessuna transazione</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Importa un file Excel o CSV per iniziare a monitorare le tue finanze.
      </p>
      <button
        onClick={onImport}
        className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
      >
        Importa transazioni
      </button>
    </div>
  );
}
