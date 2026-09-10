"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TarefaModalLoader } from "@/components/layout/captura/TarefaModalLoader";
import { concluirTarefaVinculada, criarTarefaVinculada } from "./actions";
import { SecaoShell } from "./SecaoShell";
import type { TarefaLite } from "./types";

const PRIORIDADE_BADGE: Record<string, string> = {
  baixa: "bg-gray-50 text-gray-400",
  normal: "bg-gray-100 text-gray-600",
  alta: "bg-amber-100 text-amber-700",
  urgente: "bg-red-100 text-red-700",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

function formatPrazo(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function estaVencida(iso: string | null, status: string | null): boolean {
  if (!iso || status === "concluida") return false;
  return iso.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function TarefaCard({
  tarefa,
  basePath,
}: {
  tarefa: TarefaLite;
  basePath: string;
}) {
  const [pending, startTransition] = useTransition();
  const [feitoLocal, setFeitoLocal] = useState(false);
  const feito = tarefa.status === "concluida" || feitoLocal;

  function concluir() {
    setFeitoLocal(true);
    startTransition(async () => {
      const res = await concluirTarefaVinculada(basePath, tarefa.id);
      if (!res.ok) setFeitoLocal(false);
    });
  }

  const prazo = formatPrazo(tarefa.data_prazo);
  const vencida = estaVencida(tarefa.data_prazo, tarefa.status);

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-[#2D3230]/10 bg-white p-4 shadow-sm transition-all duration-150 hover:border-[#24483F]/30 ${
        feito ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={feito}
        disabled={pending || feito}
        onChange={concluir}
        aria-label={`Concluir ${tarefa.titulo}`}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
      />

      <Link
        href={`/dashboard/tarefas?tarefa=${tarefa.id}`}
        className={`min-w-0 flex-1 truncate text-sm transition-colors hover:text-[#24483F] ${
          feito ? "text-gray-400 line-through" : "text-[#2D3230]"
        }`}
      >
        {tarefa.titulo}
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {tarefa.prioridade && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              PRIORIDADE_BADGE[tarefa.prioridade] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {PRIORIDADE_LABEL[tarefa.prioridade] ?? tarefa.prioridade}
          </span>
        )}
        {prazo && (
          <span
            className={`text-xs tabular-nums ${
              vencida ? "font-semibold text-red-600" : "text-gray-400"
            }`}
          >
            {prazo}
          </span>
        )}
      </div>
    </li>
  );
}

export function TarefasSecao({
  basePath,
  vinculoTipo,
  entidadeId,
  tarefas,
}: {
  basePath: string;
  vinculoTipo: "cliente" | "produto";
  entidadeId: string;
  tarefas: TarefaLite[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <SecaoShell
        titulo="Tarefas"
        count={tarefas.length}
        vazio="Nenhuma tarefa vinculada ainda."
        acao={
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
          >
            + Nova tarefa
          </button>
        }
      >
        <ul className="space-y-2">
          {tarefas.map((tarefa) => (
            <TarefaCard key={tarefa.id} tarefa={tarefa} basePath={basePath} />
          ))}
        </ul>
      </SecaoShell>

      {aberto && (
        <TarefaModalLoader
          onClose={() => setAberto(false)}
          onSuccess={() => router.refresh()}
          vinculosPadrao={
            vinculoTipo === "cliente"
              ? { cliente: entidadeId }
              : { produto: entidadeId }
          }
          createAction={criarTarefaVinculada.bind(null, basePath)}
        />
      )}
    </>
  );
}
