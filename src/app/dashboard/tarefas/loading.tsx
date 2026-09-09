import { Skeleton } from "@/components/ui/skeleton";

export default function TarefasLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {Array.from({ length: 4 }).map((_, col) => (
          <section key={col} className="flex min-w-0 flex-col md:w-72 md:shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2 rounded-xl border border-black/5 bg-black/[0.02] p-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
