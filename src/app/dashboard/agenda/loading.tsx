import { Skeleton } from "@/components/ui/skeleton";

export default function AgendaLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-black/5 bg-[#F5F1E8]/60">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-2 text-center">
              <Skeleton className="mx-auto h-3 w-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[64px] border-b border-r border-black/5 p-1 sm:min-h-[104px]"
            >
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
