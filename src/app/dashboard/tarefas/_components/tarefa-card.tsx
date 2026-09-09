import { formatPrazo, isVencido } from "../constants";
import type { TarefaListItem } from "../types";
import { PriorityFlag, TagBadge } from "./badges";

export function TarefaCard({
  tarefa,
  overlay = false,
}: {
  tarefa: TarefaListItem;
  overlay?: boolean;
}) {
  const vencido = isVencido(tarefa.data_prazo, tarefa.status);
  const concluida = tarefa.status === "concluida";
  const hasMeta =
    Boolean(tarefa.contexto) ||
    Boolean(tarefa.data_prazo) ||
    tarefa.tags.length > 0;

  return (
    <div
      className={`rounded-lg border border-black/5 bg-white px-3 py-2.5 transition-shadow ${
        overlay ? "shadow-lg" : "shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <PriorityFlag value={tarefa.prioridade} />
        </span>
        <p
          className={`min-w-0 flex-1 text-sm font-medium ${
            concluida ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {tarefa.titulo}
        </p>
      </div>

      {hasMeta && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-xs">
          {tarefa.contexto && (
            <span className="text-gray-500">
              {tarefa.contexto.tipo === "produto" ? "Produto" : "Projeto"}:{" "}
              {tarefa.contexto.nome}
            </span>
          )}
          {tarefa.data_prazo && (
            <span
              className={
                vencido ? "font-semibold text-red-600" : "text-gray-500"
              }
            >
              {vencido ? "Venceu " : "Prazo "}
              {formatPrazo(tarefa.data_prazo)}
            </span>
          )}
          {tarefa.tags.map((tag) => (
            <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} />
          ))}
        </div>
      )}
    </div>
  );
}
