import { motion } from 'framer-motion';
import { ArrowDownToLine, X } from 'lucide-react';

/**
 * Update notification banner — appears when download is complete (status === 'ready').
 * Positioned by parent container in App.jsx (no fixed positioning here).
 *
 * @param {Object} props
 * @param {string} props.version - Available version (e.g. "1.2.0")
 * @param {Function} props.onInstall - Calls installUpdate()
 * @param {Function} props.onDismiss - Calls dismissBanner()
 * @param {boolean} props.isInstalling - Disables install button after first click
 */
export default function UpdateBanner({ version, onInstall, onDismiss, isInstalling = false }) {
  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 text-gray-800 min-w-[260px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      <ArrowDownToLine size={18} className="text-blue-500 shrink-0" />
      <div className="flex flex-col flex-1 gap-0.5">
        <span className="text-sm text-gray-800">Aggiornamento disponibile — v{version}</span>
        <button
          onClick={onInstall}
          disabled={isInstalling}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Installa e riavvia
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        aria-label="Chiudi notifica aggiornamento"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
