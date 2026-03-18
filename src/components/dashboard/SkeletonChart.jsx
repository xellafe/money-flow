/**
 * Shimmer placeholder for chart containers during load.
 * @param {{ height?: number }} props - height in pixels (default 300)
 */
export function SkeletonChart({ height = 300 }) {
  return (
    <div
      className="rounded-lg bg-gray-200 animate-pulse w-full"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
