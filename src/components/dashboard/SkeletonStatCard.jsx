/**
 * Shimmer placeholder for DashboardStatCard during load.
 * Uses Tailwind animate-pulse for shimmer effect.
 */
export function SkeletonStatCard() {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-gray-200"
      aria-busy="true"
      aria-label="Caricamento statistiche"
    >
      {/* Label placeholder */}
      <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
      {/* Amount placeholder */}
      <div className="h-7 w-32 rounded bg-gray-200 animate-pulse mt-3" />
      {/* % change placeholder */}
      <div className="h-3 w-24 rounded bg-gray-200 animate-pulse mt-2" />
    </div>
  );
}
