import Link from "next/link";
import { formatData, isVencido } from "../constants";
import type { ProjetoListItem } from "../types";
import { PriorityFlag, StatusBadge } from "./badges";
import { ProgressBar } from "./progress-bar";

export function ProjetosGrid({ projetos }: { projetos: ProjetoListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projetos.map((projeto) => {
        const vencido = isVencido(projeto.data_fim_prevista, projeto.status);

        return (
          <Link
            key={projeto.id}
            href={`/dashboard/projetos/${projeto.id}`}
            className="flex flex-col rounded-xl border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 flex-1 font-semibold text-gray-900">
                {projeto.nome}
              </h3>
              <PriorityFlag value={projeto.prioridade} />
            </div>

            <div className="mt-2">
              <StatusBadge value={projeto.status} />
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progresso</span>
                <span>{projeto.progresso.percentual}%</span>
              </div>
              <ProgressBar percentual={projeto.progresso.percentual} size="sm" />
            </div>

            {projeto.data_fim_prevista ? (
              <p
                className={`mt-3 text-xs ${
                  vencido ? "font-semibold text-red-600" : "text-gray-500"
                }`}
              >
                {vencido ? "Venceu " : "Prazo "}
                {formatData(projeto.data_fim_prevista)}
              </p>
            ) : (
              <p className="mt-3 text-xs italic text-gray-300">Prazo indefinido</p>
            )}

            {projeto.produtos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {projeto.produtos.map((produto) => (
                  <span
                    key={produto.id}
                    className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {produto.nome}
                  </span>
                ))}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
