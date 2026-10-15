export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/[0.05] ${className}`}
      aria-hidden
    />
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[380px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-surface p-6 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-2/3 max-w-md" />
          </div>
          <div className="flex gap-3 pt-6">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
        <div className="hidden md:block md:col-span-5">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TrendingPanelSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface p-4">
      <Skeleton className="mb-4 h-4 w-32" />
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CardRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="scrollbar-hide flex gap-3.5 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-[150px] shrink-0 space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MangaCardSkeleton({ count = 6 }: { count?: number }) {
  return <CardRowSkeleton count={count} />;
}

export function MediaDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-4 lg:col-span-3">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
        </div>
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
