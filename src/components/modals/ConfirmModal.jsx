import { ModalShell } from '../ui';

/**
 * Modal di conferma per azioni distruttive
 * @param {Object} props
 * @param {string} props.title - Titolo del modal
 * @param {string} props.message - Messaggio di conferma
 * @param {Function} props.onConfirm - Callback conferma
 * @param {Function} props.onCancel - Callback annullamento
 */
export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <ModalShell title={title} onClose={onCancel} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={onCancel}
        >
          Annulla
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={onConfirm}
        >
          Conferma eliminazione
        </button>
      </div>
    </ModalShell>
  );
}
