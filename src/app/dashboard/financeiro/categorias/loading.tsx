import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriasLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-16" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
