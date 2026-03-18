const CHART_VAR_NAMES = [
  '--color-chart-01', '--color-chart-02', '--color-chart-03',
  '--color-chart-04', '--color-chart-05', '--color-chart-06',
  '--color-chart-07', '--color-chart-08', '--color-chart-09',
  '--color-chart-10',
];

/**
 * Reads chart color tokens from CSS at runtime.
 * Call once per component mount via useMemo(() => getChartColors(), []).
 * @returns {string[]} Array of 10 hex color strings
 */
export function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  return CHART_VAR_NAMES.map(v => style.getPropertyValue(v).trim());
}
