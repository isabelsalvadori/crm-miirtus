"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ORIGEM_OPTIONS, STATUS_OPTIONS } from "../constants";

export function ClientesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

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

  // Busca com debounce.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const timer = setTimeout(() => apply({ q }), 350);
    return () => clearTimeout(timer);
  }, [q, apply, searchParams]);

  const status = searchParams.get("status") ?? "";
  const origem = searchParams.get("origem") ?? "";

  const inputClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Buscar por nome ou e-mail"
        className={`${inputClass} sm:flex-1`}
        aria-label="Buscar clientes"
      />
      <select
        value={status}
        onChange={(event) => apply({ status: event.target.value })}
        className={inputClass}
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={origem}
        onChange={(event) => apply({ origem: event.target.value })}
        className={inputClass}
        aria-label="Filtrar por origem"
      >
        <option value="">Todas as origens</option>
        {ORIGEM_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
