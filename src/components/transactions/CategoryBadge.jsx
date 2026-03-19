import { Tag } from 'lucide-react';
import { getCategoryColor } from '../../utils/categoryColors';

/**
 * Colored pill badge for transaction category.
 * Color is deterministic from category name (hash-based).
 * @param {{ category: string, onClick?: () => void }} props
 */
export function CategoryBadge({ category, onClick }) {
  const { bg, text } = getCategoryColor(category);

  const baseClasses = `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-normal ${bg} ${text}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} hover:opacity-80 transition-opacity duration-150 cursor-pointer`}
        title="Clicca per modificare categoria"
        aria-label={`Modifica categoria ${category}`}
      >
        <Tag size={12} aria-hidden="true" />
        {category}
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      <Tag size={12} aria-hidden="true" />
      {category}
    </span>
  );
}
