import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { SkeletonStatCard } from './SkeletonStatCard';

/**
 * Displays a single financial KPI (Income or Expenses) with semantic colors and % change.
 * @param {{ type: 'income'|'expense', amount: number, percentChange: number|null, isLoading?: boolean }} props
 */
export function DashboardStatCard({ type, amount, percentChange, isLoading = false }) {
  if (isLoading) {
    return <SkeletonStatCard />;
  }

  const isIncome = type === 'income';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const label = isIncome ? 'Entrate' : 'Uscite';

  // Tailwind classes based on type
  const borderColor = isIncome ? 'border-l-income-500' : 'border-l-expense-500';
  const textColor = isIncome ? 'text-income-500' : 'text-expense-500';
  const hoverBg = isIncome ? 'hover:bg-income-50' : 'hover:bg-expense-50';
  const iconColor = isIncome ? 'text-income-500' : 'text-expense-500';

  // % change display
  let changeText = null;
  if (percentChange === null) {
    changeText = 'Nessun confronto disponibile';
  } else {
    const sign = percentChange >= 0 ? '+' : '';
    changeText = `${sign}${percentChange.toFixed(0)}% vs periodo precedente`;
  }

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm p-6
        border-l-4 ${borderColor}
        ${hoverBg}
        hover:shadow-md hover:-translate-y-px transition-all duration-150
        cursor-default
      `}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2">
        <Icon size={18} className={iconColor} />
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </div>

      {/* Amount */}
      <p className={`text-2xl font-semibold ${textColor} mt-2`}>
        {formatCurrency(amount)}
      </p>

      {/* % change */}
      <p className={`text-xs font-normal mt-1 ${percentChange === null ? 'text-gray-400' : 'text-gray-500'}`}>
        {changeText}
      </p>
    </div>
  );
}
