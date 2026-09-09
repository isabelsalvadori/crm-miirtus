import { Skeleton } from "@/components/ui/skeleton";

export default function EventosLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-44" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-20" />
            <Skeleton className="mt-4 h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
