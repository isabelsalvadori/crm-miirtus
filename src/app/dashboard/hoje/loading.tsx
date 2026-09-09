import { Skeleton } from "@/components/ui/skeleton";

function SecaoSkeleton({ linhas = 3 }: { linhas?: number }) {
  return (
    <div>
      <div className="border-b border-black/10 pb-2">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: linhas }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HojeLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="border-b border-black/10 pb-4">
        <Skeleton className="h-6 w-80 max-w-full" />
      </div>
      <SecaoSkeleton linhas={2} />
      <SecaoSkeleton linhas={3} />
      <SecaoSkeleton linhas={2} />
      <SecaoSkeleton linhas={3} />
    </div>
  );
}
