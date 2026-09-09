import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton compartilhado pelas abas de listagem (Receitas, Despesas, A Receber, A Pagar). */
export function TabLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="flex gap-4 border-b border-black/5 pb-2.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-4 py-3">
          <Skeleton className="h-3 w-full" />
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-black/5 px-4 py-4 last:border-0"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
