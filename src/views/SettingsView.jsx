import { Loader2 } from 'lucide-react';

/**
 * Settings view with modal trigger buttons for CategoryManager and SyncSettings
 * @param {Object} props
 * @param {Function} props.onShowCategoryManager - Opens CategoryManager modal
 * @param {Function} props.onShowSyncSettings - Opens SyncSettings modal
 * @param {Object} props.updateStatus - Update state from useUpdateStatus hook
 */
export function SettingsView({ onShowCategoryManager, onShowSyncSettings, updateStatus = {} }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Impostazioni</h2>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Categorie
          </h3>
          <button
            onClick={onShowCategoryManager}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            Gestione Categorie
          </button>
        </section>

        <section>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Sincronizzazione
          </h3>
          <button
            onClick={onShowSyncSettings}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            Sincronizzazione Drive
          </button>
        </section>

        {updateStatus.checkForUpdates && (
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Aggiornamenti
            </h3>

            {/* Version row — always visible */}
            <p className="text-sm text-gray-500 mb-3">
              Versione corrente: <span className="text-gray-700">{updateStatus.appVersion}</span>
            </p>

            {/* State machine for action area */}
            {updateStatus.status === 'idle' && (
              <button
                onClick={updateStatus.checkForUpdates}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              >
                Controlla aggiornamenti
              </button>
            )}

            {updateStatus.status === 'checking' && (
              <button
                disabled
                className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-not-allowed opacity-50"
              >
                <Loader2 size={14} className="animate-spin inline-block mr-1" aria-hidden="true" />
                Controlla aggiornamenti
              </button>
            )}

            {updateStatus.status === 'up-to-date' && (
              <>
                <p className="text-sm text-gray-500 mb-3">Sei già aggiornato</p>
                <button
                  onClick={updateStatus.checkForUpdates}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  Controlla aggiornamenti
                </button>
              </>
            )}

            {(updateStatus.status === 'available' || updateStatus.status === 'downloading') && (
              <p role="status" aria-live="polite" className="text-sm text-gray-600">
                Versione {updateStatus.version} disponibile —{' '}
                download <span className="font-semibold">{updateStatus.progress}%</span> completato
              </p>
            )}

            {updateStatus.status === 'ready' && (
              <>
                <p className="text-sm text-gray-500 mb-3">Aggiornamento pronto</p>
                <button
                  onClick={updateStatus.installUpdate}
                  disabled={updateStatus.isInstalling}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Installa e riavvia
                </button>
              </>
            )}

            {updateStatus.status === 'error' && (
              <>
                <p className="text-sm text-red-500 mb-1">Impossibile controllare gli aggiornamenti</p>
                <p className="text-sm text-gray-500 mb-3">
                  {updateStatus.error}{' '}
                  <button
                    onClick={updateStatus.checkForUpdates}
                    className="text-blue-500 hover:text-blue-600 underline cursor-pointer"
                  >
                    Riprova
                  </button>
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
