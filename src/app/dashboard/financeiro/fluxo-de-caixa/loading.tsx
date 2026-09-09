import { Skeleton } from "@/components/ui/skeleton";

export default function FluxoDeCaixaLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex gap-4 border-b border-black/5 pb-2.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-4 py-3">
          <Skeleton className="h-3 w-full" />
        </div>
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-black/5 px-4 py-4 last:border-0"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
