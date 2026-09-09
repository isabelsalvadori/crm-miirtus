import { formatCurrency } from "../constants";
import type { FluxoCaixaMes } from "../types";

export function FluxoCaixaTable({ meses }: { meses: FluxoCaixaMes[] }) {
  const hojeChave = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Mês</th>
            <th className="px-4 py-3 text-right font-medium">Receitas previstas</th>
            <th className="px-4 py-3 text-right font-medium">Despesas previstas</th>
            <th className="px-4 py-3 text-right font-medium">Saldo projetado</th>
            <th className="px-4 py-3 text-right font-medium">Receitas realizadas</th>
            <th className="px-4 py-3 text-right font-medium">Despesas realizadas</th>
            <th className="px-4 py-3 text-right font-medium">Saldo real</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((mes) => (
            <tr
              key={mes.chave}
              className={`border-b border-black/5 last:border-0 ${
                mes.chave === hojeChave ? "bg-[#F5F1E8]/60" : ""
              }`}
            >
              <td className="px-4 py-3 font-medium text-gray-900">{mes.label}</td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatCurrency(mes.receitasPrevistas)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatCurrency(mes.despesasPrevistas)}
              </td>
              <td
                className={`px-4 py-3 text-right font-semibold ${
                  mes.saldoProjetado >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {formatCurrency(mes.saldoProjetado)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatCurrency(mes.receitasRealizadas)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatCurrency(mes.despesasRealizadas)}
              </td>
              <td
                className={`px-4 py-3 text-right font-semibold ${
                  mes.saldoReal >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {formatCurrency(mes.saldoReal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
