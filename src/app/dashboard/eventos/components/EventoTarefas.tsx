"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  marcarTarefaConcluida,
  type TagLite,
  type TarefaHoje,
  type VinculoOpcoes,
} from "@/app/dashboard/hoje/actions";
import { TarefaModal } from "@/app/dashboard/hoje/components/TarefaModal";

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

function formatDataCurta(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function LinhaTarefa({
  tarefa,
  onEditar,
}: {
  tarefa: TarefaHoje;
  onEditar: (tarefa: TarefaHoje) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [concluida, setConcluida] = useState(tarefa.status === "concluida");

  function concluir() {
    setConcluida(true);
    startTransition(async () => {
      const res = await marcarTarefaConcluida(tarefa.id);
      if (!res.ok) setConcluida(false);
      else router.refresh();
    });
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-[#2D3230]/10 bg-white p-4 shadow-sm transition-all duration-150 hover:border-[#24483F]/30 ${
        concluida ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={concluida}
        disabled={pending || concluida}
        onChange={concluir}
        aria-label={`Concluir ${tarefa.titulo}`}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
      />

      <button
        type="button"
        onClick={() => onEditar(tarefa)}
        className={`min-w-0 flex-1 truncate text-left text-sm transition-colors hover:text-[#24483F] ${
          concluida ? "text-gray-400 line-through" : "text-[#2D3230]"
        }`}
      >
        {tarefa.titulo}
      </button>

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
        {tarefa.data_prazo && (
          <span className="text-xs tabular-nums text-gray-400">
            {formatDataCurta(tarefa.data_prazo)}
          </span>
        )}
      </div>
    </li>
  );
}

type Props = {
  eventoId: string;
  tarefas: TarefaHoje[];
  vinculos: VinculoOpcoes;
  tags: TagLite[];
  colunas: string[];
  habilitado: boolean;
};

export function EventoTarefas({
  eventoId,
  tarefas,
  vinculos,
  tags,
  colunas,
  habilitado,
}: Props) {
  const router = useRouter();
  const [nova, setNova] = useState(false);
  const [emEdicao, setEmEdicao] = useState<TarefaHoje | null>(null);

  const fechar = () => {
    setNova(false);
    setEmEdicao(null);
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
        <h3 className="text-sm font-semibold text-[#24483F]">
          Tarefas ({tarefas.length})
        </h3>
        {habilitado && (
          <button
            type="button"
            onClick={() => setNova(true)}
            className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
          >
            + Nova tarefa
          </button>
        )}
      </div>

      {!habilitado ? (
        <p className="mt-3 text-sm text-gray-400">
          Vínculo de tarefas com eventos indisponível neste banco.
        </p>
      ) : tarefas.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">Nenhuma tarefa vinculada.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tarefas.map((t) => (
            <LinhaTarefa key={t.id} tarefa={t} onEditar={setEmEdicao} />
          ))}
        </ul>
      )}

      {nova && (
        <TarefaModal
          tarefa={null}
          eventoIdPadrao={eventoId}
          vinculos={vinculos}
          tags={tags}
          colunas={colunas}
          onClose={fechar}
        />
      )}
      {emEdicao && (
        <TarefaModal
          key={emEdicao.id}
          tarefa={emEdicao}
          vinculos={vinculos}
          tags={tags}
          colunas={colunas}
          onClose={fechar}
        />
      )}
    </section>
  );
}
