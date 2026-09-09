import { Skeleton } from "@/components/ui/skeleton";

export default function ProdutoPerfilLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-4 w-24" />

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>

        <Skeleton className="mt-6 h-16 w-full" />
      </div>

      {Array.from({ length: 4 }).map((_, index) => (
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
