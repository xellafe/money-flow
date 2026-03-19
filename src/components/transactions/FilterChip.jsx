import { X } from 'lucide-react';

/**
 * Filter chip showing active filter state.
 * Dismissible (with × button) or read-only (no × button).
 * @param {{ label: string, onDismiss?: () => void, readOnly?: boolean }} props
 */
export function FilterChip({ label, onDismiss, readOnly = false }) {
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700';

  if (readOnly || !onDismiss) {
    return (
      <span className={`${baseClasses} opacity-75`}>
        {label}
      </span>
    );
  }

  return (
    <span className={baseClasses}>
      {label}
      <button
        type="button"
        onClick={onDismiss}
        className="ml-0.5 hover:text-blue-900 transition-colors duration-150 rounded-full p-0.5 hover:bg-blue-200"
        aria-label={`Rimuovi filtro ${label}`}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}
