export function CardSkeleton() {
  return (
    <div className="ledger-card rounded-lg p-5 animate-pulse">
      <div className="h-3 w-20 bg-hairline/60 rounded mb-3" />
      <div className="h-5 w-40 bg-hairline/60 rounded mb-2" />
      <div className="h-3 w-24 bg-hairline/40 rounded mb-4" />
      <div className="h-2 w-full bg-hairline/40 rounded" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
