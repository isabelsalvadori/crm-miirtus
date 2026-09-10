import { Skeleton } from "@/components/ui/skeleton";

export default function ConteudoLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {Array.from({ length: 6 }).map((_, col) => (
          <section key={col} className="flex min-w-0 flex-col md:w-72 md:shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2 rounded-xl border border-black/5 bg-black/[0.02] p-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
