"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  STATUS_DESPESA_OPTIONS,
  STATUS_RECEITA_OPTIONS,
} from "../constants";
import type { CategoriaLite, OptionLite } from "../types";
import { PeriodoFilter } from "./periodo-filter";

export function MovimentacoesFilters({
  tipo,
  categorias,
  produtos,
  projetos,
  mostrarPeriodo = true,
  somentePendentes = false,
}: {
  /** Quando fixo (Receitas/Despesas), some o filtro de status errado pro tipo. */
  tipo?: "receita" | "despesa";
  categorias: CategoriaLite[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  /** A Receber/A Pagar ignoram período (mostram tudo que está pendente) — não faz sentido exibir o filtro. */
  mostrarPeriodo?: boolean;
  /** A Receber/A Pagar já filtram por pendente — só Previsto/Atrasado fazem sentido aqui. */
  somentePendentes?: boolean;
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
      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
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

  const statusOptionsBase = tipo === "despesa" ? STATUS_DESPESA_OPTIONS : STATUS_RECEITA_OPTIONS;
  const statusOptions = somentePendentes
    ? statusOptionsBase.filter((o) => o.value === "previsto" || o.value === "atrasado")
    : statusOptionsBase;
  const controlClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por descrição"
          className={`${controlClass} lg:flex-1`}
          aria-label="Buscar movimentações"
        />
        <select
          value={searchParams.get("categoria") ?? ""}
          onChange={(event) => apply({ categoria: event.target.value })}
          className={controlClass}
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("status") ?? ""}
          onChange={(event) => apply({ status: event.target.value })}
          className={controlClass}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("vinculo") ?? ""}
          onChange={(event) => apply({ vinculo: event.target.value })}
          className={controlClass}
          aria-label="Filtrar por vínculo"
        >
          <option value="">Todos os vínculos</option>
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

      {mostrarPeriodo && <PeriodoFilter />}
    </div>
  );
}
