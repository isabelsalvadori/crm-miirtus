"use client";

import { useRouter } from "next/navigation";
import { formatCurrency, formatData, formaPagamentoLabel } from "../constants";
import type { MovimentacaoFull } from "../types";
import { StatusBadge } from "./badges";
import { useMergeHref } from "./use-merge-href";

export function MovimentacoesTable({
  movimentacoes,
  mostrarTipo = false,
}: {
  movimentacoes: MovimentacaoFull[];
  mostrarTipo?: boolean;
}) {
  const router = useRouter();
  const mergeHref = useMergeHref();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Descrição</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Valor</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Vínculo</th>
            <th className="px-4 py-3 font-medium">Pagamento</th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((mov) => {
            const isDespesa = mov.tipo === "despesa";
            return (
              <tr
                key={mov.id}
                onClick={() => router.push(mergeHref({ mov: mov.id }), { scroll: false })}
                className="cursor-pointer border-b border-black/5 transition-colors last:border-0 hover:bg-[#F5F1E8]"
              >
                <td className="px-4 py-3 text-gray-600">
                  {formatData(mov.data_competencia)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {mostrarTipo && (
                    <span
                      className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                        isDespesa ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      aria-hidden
                    />
                  )}
                  {mov.descricao}
                </td>
                <td className="px-4 py-3 text-gray-600">{mov.categoria?.nome ?? "—"}</td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    isDespesa ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {isDespesa ? "− " : ""}
                  {formatCurrency(mov.valor)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    tipo={mov.tipo}
                    status={mov.status}
                    dataVencimento={mov.data_vencimento}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {mov.contexto
                    ? `${mov.contexto.tipo === "produto" ? "Produto" : "Projeto"}: ${mov.contexto.nome}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formaPagamentoLabel(mov.forma_pagamento)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
