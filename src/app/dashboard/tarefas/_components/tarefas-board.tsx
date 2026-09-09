"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrazo, isVencido } from "../constants";
import type { TarefaListItem } from "../types";
import { PriorityFlag, TagBadge } from "./badges";
import { useMergeHref } from "./use-merge-href";

type Grupo = {
  value: string;
  label: string;
  tarefas: TarefaListItem[];
};

export function TarefasBoard({ grupos }: { grupos: Grupo[] }) {
  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <Grupo key={grupo.value} grupo={grupo} />
      ))}
    </div>
  );
}

function Grupo({ grupo }: { grupo: Grupo }) {
  const isConcluido = grupo.value === "concluida";
  const [aberto, setAberto] = useState(!isConcluido);
  const total = grupo.tarefas.length;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-700">{grupo.label}</h3>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-500">
          {total}
        </span>
        {isConcluido && total > 0 && (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            {aberto ? "Ocultar" : `Mostrar ${total} concluída${total > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-black/10 bg-white/50 px-4 py-6 text-center text-sm text-gray-400">
          {vazioMsg(grupo.value)}
        </p>
      ) : aberto ? (
        <ul className="space-y-2">
          {grupo.tarefas.map((tarefa) => (
            <TarefaRow key={tarefa.id} tarefa={tarefa} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TarefaRow({ tarefa }: { tarefa: TarefaListItem }) {
  const mergeHref = useMergeHref();
  const vencido = isVencido(tarefa.data_prazo, tarefa.status);
  const concluida = tarefa.status === "concluida";

  return (
    <li>
      <Link
        href={mergeHref({ tarefa: tarefa.id, nova: null })}
        scroll={false}
        className="flex items-start gap-3 rounded-lg border border-black/5 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
      >
        <span className="mt-0.5">
          <PriorityFlag value={tarefa.prioridade} />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${
              concluida ? "text-gray-400 line-through" : "text-gray-900"
            }`}
          >
            {tarefa.titulo}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
        </div>
      </Link>
    </li>
  );
}

function vazioMsg(status: string): string {
  switch (status) {
    case "a_fazer":
      return "Nada para fazer por aqui. Aproveite.";
    case "em_andamento":
      return "Nenhuma tarefa em andamento.";
    case "aguardando":
      return "Nada aguardando.";
    case "concluida":
      return "Nenhuma tarefa concluída ainda.";
    default:
      return "Nada por aqui.";
  }
}
