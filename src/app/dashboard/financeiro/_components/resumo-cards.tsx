import { calcVariacao, formatCurrency } from "../constants";
import type { ResumoMes } from "../types";

function Variacao({ percentual }: { percentual: number | null }) {
  if (percentual === null) {
    return <span className="text-xs text-gray-400">sem comparativo</span>;
  }
  const positivo = percentual > 0;
  const neutro = percentual === 0;
  return (
    <span
      className={`text-xs font-medium ${
        neutro ? "text-gray-400" : positivo ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {positivo ? "▲" : neutro ? "" : "▼"} {Math.abs(percentual)}% vs. mês anterior
    </span>
  );
}

function Card({
  label,
  value,
  variacao,
  tone = "default",
}: {
  label: string;
  value: number;
  variacao?: number | null;
  tone?: "default" | "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-red-700"
        : "text-gray-900";

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold ${valueClass}`}>{formatCurrency(value)}</p>
      {variacao !== undefined && (
        <div className="mt-1">
          <Variacao percentual={variacao} />
        </div>
      )}
    </div>
  );
}

export function ResumoCards({
  resumo,
  aReceber,
  aPagar,
}: {
  resumo: ResumoMes;
  aReceber: number;
  aPagar: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        label="Receita do mês"
        value={resumo.receitas}
        variacao={calcVariacao(resumo.receitas, resumo.receitasAnterior)}
        tone="positive"
      />
      <Card
        label="Despesas do mês"
        value={resumo.despesas}
        variacao={calcVariacao(resumo.despesas, resumo.despesasAnterior)}
        tone="negative"
      />
      <Card
        label="Resultado do mês"
        value={resumo.resultado}
        variacao={calcVariacao(resumo.resultado, resumo.resultadoAnterior)}
        tone={resumo.resultado >= 0 ? "positive" : "negative"}
      />
      <Card label="A receber" value={aReceber} />
      <Card label="A pagar" value={aPagar} />
    </div>
  );
}
