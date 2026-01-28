import { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

/**
 * Componente Toast per notifiche
 * @param {Object} props
 * @param {string} props.message - Messaggio da mostrare
 * @param {'success'|'error'} props.type - Tipo di toast
 * @param {Function} props.onClose - Callback per chiusura
 */
export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', opacity: 0.7 }}>
        <X size={16} />
      </button>
    </div>
  );
}
