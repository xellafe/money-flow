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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Annulla</button>
          <button className="btn-danger" onClick={onConfirm}>Elimina</button>
        </div>
      </div>
    </div>
  );
}
