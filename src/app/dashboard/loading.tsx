import { Skeleton } from "@/components/ui/skeleton";

export default function InicioLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
