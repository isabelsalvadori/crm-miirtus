import { Skeleton } from "@/components/ui/skeleton";

export default function EventoPerfilLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-4 w-24" />

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <Skeleton className="h-7 w-1/2" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-4 w-full" />
        <div className="mt-5 flex gap-3 border-t border-black/5 pt-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="mt-3 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-black/5 p-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
