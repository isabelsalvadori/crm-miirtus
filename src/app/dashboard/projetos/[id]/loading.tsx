import { Skeleton } from "@/components/ui/skeleton";

export default function ProjetoPerfilLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-4 w-24" />

      {/* Header */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <Skeleton className="mt-6 h-2 w-full rounded-full" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Fases */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-16" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Tarefas (Kanban) */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-20" />
        <div className="mt-4 flex flex-col gap-4 md:flex-row">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Produtos relacionados */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
