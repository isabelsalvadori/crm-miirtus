import { formatCurrency, formatData } from "@/app/dashboard/financeiro/constants";
import type { MovimentacaoLite } from "./types";

export function HistoricoFinanceiro({
  movimentacoes,
}: {
  movimentacoes: MovimentacaoLite[];
}) {
  const totalReceitas = movimentacoes
    .filter((m) => m.tipo === "receita")
    .reduce((soma, m) => soma + m.valor, 0);
  const totalDespesas = movimentacoes
    .filter((m) => m.tipo === "despesa")
    .reduce((soma, m) => soma + m.valor, 0);

  return (
    <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Histórico financeiro{" "}
          <span className="font-normal text-gray-400">
            ({movimentacoes.length})
          </span>
        </h3>
        {movimentacoes.length > 0 && (
          <div className="flex gap-4 text-xs">
            <span className="text-emerald-600">
              Receitas{" "}
              <strong className="font-semibold">
                {formatCurrency(totalReceitas)}
              </strong>
            </span>
            <span className="text-red-600">
              Despesas{" "}
              <strong className="font-semibold">
                {formatCurrency(totalDespesas)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {movimentacoes.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-black/10 bg-[#F5F1E8]/50 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">
            Nenhuma movimentação financeira vinculada a este cliente.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-black/5">
          {movimentacoes.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-20 shrink-0 text-xs tabular-nums text-gray-400">
                {m.data_competencia ? formatData(m.data_competencia) : "—"}
              </span>
              <span className="min-w-0 flex-1 truncate text-[#2D3230]">
                {m.descricao}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  m.tipo === "receita"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {m.tipo === "receita" ? "Receita" : "Despesa"}
              </span>
              <span
                className={`w-28 shrink-0 text-right font-semibold tabular-nums ${
                  m.tipo === "receita" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {formatCurrency(m.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
