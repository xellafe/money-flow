/**
 * Hash-based category color utility.
 * Provides deterministic pastel badge colors for category names.
 */

/**
 * 10-color palette for category badges.
 * Full Tailwind class strings required for JIT purge detection.
 */
export const BADGE_PALETTE = [
  { bg: 'bg-blue-100',    text: 'text-blue-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100',   text: 'text-amber-700' },
  { bg: 'bg-rose-100',    text: 'text-rose-700' },
  { bg: 'bg-violet-100',  text: 'text-violet-700' },
  { bg: 'bg-pink-100',    text: 'text-pink-700' },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700' },
  { bg: 'bg-lime-100',    text: 'text-lime-700' },
  { bg: 'bg-orange-100',  text: 'text-orange-700' },
  { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
];

/**
 * Returns deterministic {bg, text} Tailwind class pair for a category name.
 * Uses djb2 hash % palette length. Same name → same color every time.
 * @param {string} name - Category name
 * @returns {{ bg: string, text: string }}
 */
export function getCategoryColor(name) {
  if (!name) return BADGE_PALETTE[0];
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    // djb2: hash * 33 XOR char code
    hash = ((hash << 5) + hash) ^ name.charCodeAt(i);
  }
  return BADGE_PALETTE[Math.abs(hash) % BADGE_PALETTE.length];
}
