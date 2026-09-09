"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIODO_OPTIONS } from "../constants";

export function PeriodoFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const periodo = searchParams.get("periodo") || "mes_atual";
  const [inicio, setInicio] = useState(searchParams.get("inicio") ?? "");
  const [fim, setFim] = useState(searchParams.get("fim") ?? "");

  const apply = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const controlClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={periodo}
        onChange={(event) => apply({ periodo: event.target.value })}
        className={controlClass}
        aria-label="Filtrar por período"
      >
        {PERIODO_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {periodo === "personalizado" && (
        <>
          <input
            type="date"
            value={inicio}
            onChange={(event) => {
              setInicio(event.target.value);
              apply({ inicio: event.target.value, fim });
            }}
            className={controlClass}
            aria-label="Data inicial"
          />
          <span className="text-sm text-gray-400">até</span>
          <input
            type="date"
            value={fim}
            onChange={(event) => {
              setFim(event.target.value);
              apply({ inicio, fim: event.target.value });
            }}
            className={controlClass}
            aria-label="Data final"
          />
        </>
      )}
    </div>
  );
}
