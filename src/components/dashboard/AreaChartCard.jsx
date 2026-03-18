import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils';
import { SkeletonChart } from './SkeletonChart';

// Resolved semantic colors from @theme
const INCOME_COLOR = '#059669';  // --color-income-500
const EXPENSE_COLOR = '#f43f5e'; // --color-expense-500

/**
 * Custom tooltip for AreaChart
 */
function CustomAreaTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white shadow-md rounded-lg p-3 border border-gray-200">
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

/**
 * Full-width trend chart showing Income vs Expenses over 12 months.
 * @param {{ monthlyData: Array, isLoading?: boolean, selectedYear: number|null }} props
 */
export function AreaChartCard({ monthlyData, isLoading = false, selectedYear }) {
  // Recharts resize workaround for Electron (debounced key change forces remount)
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setChartKey(k => k + 1), 200);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <SkeletonChart height={300} />
      </div>
    );
  }

  // Check for empty data
  const hasData = monthlyData.some(m => m.Entrate > 0 || m.Uscite > 0);

  const title = selectedYear !== null
    ? `Andamento ${selectedYear}`
    : 'Andamento';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>

      {!hasData ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-gray-400">Nessun dato per questo periodo</p>
        </div>
      ) : (
        <div aria-label={`Grafico andamento entrate e uscite ${selectedYear ?? ''}`}>
          <ResponsiveContainer key={chartKey} width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={INCOME_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXPENSE_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Entrate"
                stroke={INCOME_COLOR}
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Uscite"
                stroke={EXPENSE_COLOR}
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
