/**
 * Settings view with modal trigger buttons for CategoryManager and SyncSettings
 * @param {Object} props
 * @param {Function} props.onShowCategoryManager - Opens CategoryManager modal
 * @param {Function} props.onShowSyncSettings - Opens SyncSettings modal
 */
export function SettingsView({ onShowCategoryManager, onShowSyncSettings }) {
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
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Sincronizzazione Drive
          </button>
        </section>
      </div>
    </div>
  );
}
