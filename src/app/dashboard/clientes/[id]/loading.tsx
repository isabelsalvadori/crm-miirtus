import { Skeleton } from "@/components/ui/skeleton";

export default function ClientePerfilLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-4 w-20" />

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-black/5 bg-white p-6 shadow-sm"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-3 h-20 w-full" />
        </div>
      ))}
    </div>
  );
}
