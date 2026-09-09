"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "../constants";
import type { OptionLite } from "../types";

export function TarefasFilters({
  produtos,
  projetos,
}: {
  produtos: OptionLite[];
  projetos: OptionLite[];
}) {
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
      params.delete("tarefa");
      params.delete("nova");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const timer = setTimeout(() => apply({ q }), 350);
    return () => clearTimeout(timer);
  }, [q, apply, searchParams]);

  const control =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Buscar por título"
        className={`${control} lg:flex-1`}
        aria-label="Buscar tarefas"
      />
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(event) => apply({ status: event.target.value })}
        className={control}
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("prioridade") ?? ""}
        onChange={(event) => apply({ prioridade: event.target.value })}
        className={control}
        aria-label="Filtrar por prioridade"
      >
        <option value="">Todas as prioridades</option>
        {PRIORIDADE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("contexto") ?? ""}
        onChange={(event) => apply({ contexto: event.target.value })}
        className={control}
        aria-label="Filtrar por contexto"
      >
        <option value="">Todos os contextos</option>
        <option value="sem_vinculo">Sem vínculo</option>
        {produtos.length > 0 && (
          <optgroup label="Produtos">
            {produtos.map((p) => (
              <option key={p.id} value={`produto:${p.id}`}>
                {p.nome}
              </option>
            ))}
          </optgroup>
        )}
        {projetos.length > 0 && (
          <optgroup label="Projetos">
            {projetos.map((p) => (
              <option key={p.id} value={`projeto:${p.id}`}>
                {p.nome}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
