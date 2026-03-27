import { Trash2 } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { formatCurrency } from '../../utils';

/**
 * Single transaction row with STACKED layout per CONTEXT.md Decision A.
 * Col 1: Date (small/muted) + Description (prominent) + CategoryBadge stacked vertically
 * Col 2: Amount (income green / expense red)
 * Col 3: Delete button
 *
 * @param {{
 *   tx: { id: string, date: string, description: string, amount: number, category: string },
 *   categories: Object,
 *   isEditingDescription: boolean,
 *   isEditingCategory: boolean,
 *   newDescription: string,
 *   onDescriptionChange: (value: string) => void,
 *   onDescriptionSave: (id: string, description: string) => void,
 *   onDescriptionCancel: () => void,
 *   onCategoryChange: (id: string, category: string) => void,
 *   onCategoryBlur: () => void,
 *   onEditDescription: () => void,
 *   onEditCategory: () => void,
 *   onDelete: () => void,
 * }} props
 */
export function TransactionRow({
  tx,
  categories,
  isEditingDescription,
  isEditingCategory,
  newDescription,
  onDescriptionChange,
  onDescriptionSave,
  onDescriptionCancel,
  onCategoryChange,
  onCategoryBlur,
  onEditDescription,
  onEditCategory,
  onDelete,
}) {
  // Format date as "15 mar 2025" Italian locale
  const dateStr = new Date(tx.date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Amount formatting with sign
  const amountDisplay = `${tx.amount >= 0 ? '+' : ''}${formatCurrency(tx.amount)}`;
  const amountColorClass = tx.amount >= 0 ? 'text-income-500' : 'text-expense-500';

  return (
    <div className="grid grid-cols-[1fr_120px_40px] px-4 py-3 items-center border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
      {/* Col 1: STACKED — Date + Description + CategoryBadge (per CONTEXT.md Decision A) */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-gray-400">{dateStr}</span>

        {isEditingDescription ? (
          <input
            type="text"
            value={newDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={() => onDescriptionSave(tx.id, newDescription)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onDescriptionSave(tx.id, newDescription);
              if (e.key === 'Escape') onDescriptionCancel();
            }}
            autoFocus
            placeholder="Inserisci descrizione…"
            aria-label="Modifica descrizione"
            className="text-sm text-gray-800 bg-white border border-brand-500 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        ) : (
          <span
            onClick={onEditDescription}
            className="text-sm text-gray-800 font-normal truncate cursor-pointer hover:text-brand-600 transition-colors duration-150"
            title="Clicca per modificare"
          >
            {tx.description}
          </span>
        )}

        {/* CategoryBadge below description (per CONTEXT.md Decision A) */}
        <span className="mt-1">
          {isEditingCategory ? (
            <select
              value={tx.category}
              onChange={(e) => onCategoryChange(tx.id, e.target.value)}
              onBlur={onCategoryBlur}
              autoFocus
              aria-label="Modifica categoria"
              className="text-xs bg-white border border-brand-500 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {Object.keys(categories)
                .sort((a, b) => a.localeCompare(b, 'it'))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              <option value="Altro">Altro</option>
            </select>
          ) : (
            <CategoryBadge category={tx.category} onClick={onEditCategory} />
          )}
        </span>
      </div>

      {/* Col 2: Amount */}
      <div className={`text-sm font-semibold tabular-nums text-right ${amountColorClass}`}>
        {amountDisplay}
      </div>

      {/* Col 3: Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-gray-300 hover:text-expense-500 transition-colors duration-150 cursor-pointer justify-self-end"
        aria-label="Elimina transazione"
        title="Elimina transazione"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
