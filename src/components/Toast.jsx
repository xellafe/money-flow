import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, X } from 'lucide-react';

/**
 * Animated toast notification component.
 * Slides in from the bottom-right with a 300ms entry animation.
 * Auto-dismisses after 3 seconds.
 *
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
    // Positioned by parent container in App.jsx (fixed bottom-6 right-6 z-50)
    // Do NOT add fixed positioning here — it will double-position the toast
    <motion.div
      className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      {type === 'success'
        ? <Check size={18} className="text-green-500 shrink-0" />
        : <AlertCircle size={18} className="text-red-500 shrink-0" />
      }
      <span className="text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        aria-label="Chiudi notifica"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
