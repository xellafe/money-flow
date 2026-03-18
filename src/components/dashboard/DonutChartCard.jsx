import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { getChartColors } from '../../utils/chartColors';
import { SkeletonChart } from './SkeletonChart';

/**
 * Custom tooltip for DonutChart
 */
function CustomDonutTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white shadow-md rounded-lg p-3 border border-gray-200">
      <p className="text-sm font-semibold text-gray-700">{data.name}</p>
      <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
      <p className="text-xs text-gray-400">{data.count} transazioni</p>
    </div>
  );
}

/**
 * Category breakdown donut chart with cross-filter click handler.
 * @param {{ categoryData: Array, selectedCategory: string|null, onCategorySelect: (name: string|null) => void, isLoading?: boolean }} props
 */
export function DonutChartCard({ categoryData, selectedCategory, onCategorySelect, isLoading = false }) {
  // Resolve CSS colors once at mount
  const chartColors = useMemo(() => getChartColors(), []);

  // Recharts resize workaround
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

  // Calculate center amount
  const centerAmount = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return 0;
    if (selectedCategory) {
      const cat = categoryData.find(c => c.name === selectedCategory);
      return cat ? cat.value : 0;
    }
    return categoryData.reduce((sum, c) => sum + c.value, 0);
  }, [categoryData, selectedCategory]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full max-w-sm">
        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <SkeletonChart height={240} />
      </div>
    );
  }

  // Empty state
  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full max-w-sm">
        <p className="text-sm font-semibold text-gray-700 mb-4">Spese per categoria</p>
        <div className="h-[240px] flex flex-col items-center justify-center">
          <PieChartIcon size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Nessuna spesa per questo periodo</p>
        </div>
      </div>
    );
  }

  const handleSegmentClick = (entry) => {
    // Toggle: if clicking the selected one, deselect; otherwise select it
    onCategorySelect(selectedCategory === entry.name ? null : entry.name);
  };

  const handleCenterClick = () => {
    if (selectedCategory) {
      onCategorySelect(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full max-w-sm">
      <p className="text-sm font-semibold text-gray-700 mb-4">Spese per categoria</p>

      <div className="relative" aria-label="Grafico spese per categoria">
        <ResponsiveContainer key={chartKey} width="100%" height={240}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onClick={(_, index) => handleSegmentClick(categoryData[index])}
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={chartColors[index % chartColors.length]}
                  opacity={selectedCategory && selectedCategory !== entry.name ? 0.5 : 1}
                  stroke={selectedCategory === entry.name ? '#1f2937' : 'none'}
                  strokeWidth={selectedCategory === entry.name ? 2 : 0}
                  style={{ cursor: 'pointer', transition: 'opacity 100ms' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${entry.name}: ${formatCurrency(entry.value)}`}
                  aria-pressed={selectedCategory === entry.name}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSegmentClick(entry);
                    }
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomDonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ pointerEvents: selectedCategory ? 'auto' : 'none' }}
          onClick={handleCenterClick}
        >
          <span className="text-3xl font-semibold text-gray-800">
            {formatCurrency(centerAmount)}
          </span>
          <span className="text-xs font-normal text-gray-500">
            {selectedCategory
              ? selectedCategory.substring(0, 16)
              : 'Totale uscite'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
