"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `${pathname}?${params.toString()}`;
  };

  const linkClass =
    "rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
  const disabledClass =
    "rounded-lg border border-black/5 bg-white px-3 py-1.5 text-sm font-medium text-gray-300";

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-sm text-gray-500">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} scroll={false} className={linkClass}>
            Anterior
          </Link>
        ) : (
          <span className={disabledClass}>Anterior</span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} scroll={false} className={linkClass}>
            Próxima
          </Link>
        ) : (
          <span className={disabledClass}>Próxima</span>
        )}
      </div>
    </div>
  );
}
