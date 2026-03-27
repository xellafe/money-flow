/**
 * Skeleton placeholder row matching TransactionRow grid layout.
 * Used during initial mount loading state in TransactionsView.
 */
export function SkeletonTransactionRow() {
  return (
    <div
      className="grid grid-cols-[1fr_120px_40px] px-4 py-3 items-center border-b border-gray-100"
      aria-hidden="true"
    >
      {/* Col 1: date + description + badge placeholders */}
      <div className="flex flex-col gap-1">
        <div className="animate-pulse bg-gray-200 rounded h-3 w-24" />
        <div className="animate-pulse bg-gray-200 rounded h-4 w-48 mt-1" />
        <div className="animate-pulse bg-gray-200 rounded h-5 w-20 mt-1" />
      </div>
      {/* Col 2: amount placeholder */}
      <div className="flex justify-end">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-16" />
      </div>
      {/* Col 3: empty (no delete shimmer) */}
      <div className="w-10" />
    </div>
  );
}
