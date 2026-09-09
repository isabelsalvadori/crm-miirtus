"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickNoteModal } from "@/app/dashboard/notas/components/QuickNoteModal";
import {
  marcarTarefaConcluida,
  type NotaHoje,
  type TagLite,
  type TarefaHoje,
  type VinculoOpcoes,
} from "../actions";
import { TarefaModal } from "./TarefaModal";

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
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatHora(valor: string | null) {
  return valor ? valor.slice(0, 5) : null;
}

function SecaoTitulo({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "danger";
}) {
  return (
    <h2
      className={`text-sm font-semibold uppercase tracking-wide ${
        tone === "danger" ? "text-red-700" : "text-[#2D3230]"
      }`}
    >
      {children}
    </h2>
  );
}

function Secao({
  titulo,
  vazio,
  itens,
  danger,
  acao,
  children,
}: {
  titulo: string;
  vazio?: string;
  itens: unknown[];
  danger?: boolean;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={danger ? "rounded-xl border border-red-200 bg-red-50/50 p-4" : undefined}>
      <div
        className={`flex items-center justify-between gap-3 pb-2 ${
          danger ? "border-b border-red-200" : "border-b border-black/10"
        }`}
      >
        <SecaoTitulo tone={danger ? "danger" : undefined}>{titulo}</SecaoTitulo>
        {acao}
      </div>
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">{vazio ?? "Nada por aqui."}</p>
      ) : (
        <ul className="mt-3 space-y-2">{children}</ul>
      )}
    </section>
  );
}

function TarefaRow({
  tarefa,
  modo,
  atrasada,
  onEditar,
}: {
  tarefa: TarefaHoje;
  modo: "agenda" | "prazo";
  atrasada?: boolean;
  onEditar: (tarefa: TarefaHoje) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [concluida, setConcluida] = useState(false);

  function concluir() {
    setConcluida(true);
    startTransition(async () => {
      const res = await marcarTarefaConcluida(tarefa.id);
      if (!res.ok) setConcluida(false);
    });
  }

  const hora =
    modo === "agenda"
      ? [
          formatHora(tarefa.agenda_hora_inicio),
          formatHora(tarefa.agenda_hora_fim),
        ]
          .filter(Boolean)
          .join("–")
      : "";

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

      {hora && (
        <span className="shrink-0 text-xs font-medium tabular-nums text-[#24483F]">
          {hora}
        </span>
      )}

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

        {modo === "prazo" && tarefa.data_prazo && (
          <span
            className={`text-xs tabular-nums ${
              atrasada ? "font-semibold text-red-600" : "text-gray-400"
            }`}
          >
            {formatDataCurta(tarefa.data_prazo)}
          </span>
        )}
      </div>
    </li>
  );
}

function NotaRow({ nota }: { nota: NotaHoje }) {
  const corpo = (nota.conteudo ?? "").trim().replace(/\s+/g, " ");
  const texto = nota.titulo?.trim() || corpo.slice(0, 90) || "(sem conteúdo)";
  const hora = new Date(nota.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex items-baseline gap-2 rounded-lg border border-black/5 bg-white px-3 py-2 text-sm">
      <span className="shrink-0 text-xs tabular-nums text-gray-400">{hora}</span>
      <Link
        href="/dashboard/notas"
        className="min-w-0 flex-1 truncate text-[#2D3230] transition-colors hover:text-[#24483F]"
      >
        {texto}
      </Link>
    </li>
  );
}

type Props = {
  dataCompleta: string;
  agenda: TarefaHoje[];
  prazoHoje: TarefaHoje[];
  atrasadas: TarefaHoje[];
  emAndamento: TarefaHoje[];
  prioridades: TarefaHoje[];
  aguardando: TarefaHoje[];
  notas: NotaHoje[];
  vinculos: VinculoOpcoes;
  tags: TagLite[];
  colunas: string[];
};

export function HojeView({
  dataCompleta,
  agenda,
  prazoHoje,
  atrasadas,
  emAndamento,
  prioridades,
  aguardando,
  notas,
  vinculos,
  tags,
  colunas,
}: Props) {
  const router = useRouter();
  const [quickAberto, setQuickAberto] = useState(false);
  const [novaAberta, setNovaAberta] = useState(false);
  const [emEdicao, setEmEdicao] = useState<TarefaHoje | null>(null);

  function fecharQuick() {
    setQuickAberto(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-black/10 pb-4">
        <p className="text-lg font-semibold text-[#24483F]">{dataCompleta}</p>
      </header>

      <Secao
        titulo="Agenda do dia"
        vazio="Nenhum compromisso agendado para hoje"
        itens={agenda}
      >
        {agenda.map((t) => (
          <TarefaRow key={t.id} tarefa={t} modo="agenda" onEditar={setEmEdicao} />
        ))}
      </Secao>

      <Secao
        titulo="Tarefas de hoje"
        vazio="Nenhuma tarefa com prazo hoje"
        itens={prazoHoje}
        acao={
          <button
            type="button"
            onClick={() => setNovaAberta(true)}
            className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
          >
            + Nova tarefa
          </button>
        }
      >
        {prazoHoje.map((t) => (
          <TarefaRow key={t.id} tarefa={t} modo="prazo" onEditar={setEmEdicao} />
        ))}
      </Secao>

      {atrasadas.length > 0 && (
        <Secao titulo="Atrasadas" itens={atrasadas} danger>
          {atrasadas.map((t) => (
            <TarefaRow
              key={t.id}
              tarefa={t}
              modo="prazo"
              atrasada
              onEditar={setEmEdicao}
            />
          ))}
        </Secao>
      )}

      {emAndamento.length > 0 && (
        <Secao titulo="Em andamento" itens={emAndamento}>
          {emAndamento.map((t) => (
            <TarefaRow
              key={t.id}
              tarefa={t}
              modo="prazo"
              onEditar={setEmEdicao}
            />
          ))}
        </Secao>
      )}

      {prioridades.length > 0 && (
        <Secao titulo="Prioridades" itens={prioridades}>
          {prioridades.map((t) => (
            <TarefaRow
              key={t.id}
              tarefa={t}
              modo="prazo"
              onEditar={setEmEdicao}
            />
          ))}
        </Secao>
      )}

      {aguardando.length > 0 && (
        <Secao titulo="Aguardando" itens={aguardando}>
          {aguardando.map((t) => (
            <TarefaRow
              key={t.id}
              tarefa={t}
              modo="prazo"
              onEditar={setEmEdicao}
            />
          ))}
        </Secao>
      )}

      <section>
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <SecaoTitulo>Notas rápidas do dia</SecaoTitulo>
          <button
            type="button"
            onClick={() => setQuickAberto(true)}
            className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
          >
            + Nova nota
          </button>
        </div>
        {notas.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Nenhuma nota criada hoje.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notas.map((n) => (
              <NotaRow key={n.id} nota={n} />
            ))}
          </ul>
        )}
      </section>

      {quickAberto && <QuickNoteModal onClose={fecharQuick} />}
      {novaAberta && (
        <TarefaModal
          tarefa={null}
          vinculos={vinculos}
          tags={tags}
          colunas={colunas}
          onClose={() => setNovaAberta(false)}
        />
      )}
      {emEdicao && (
        <TarefaModal
          key={emEdicao.id}
          tarefa={emEdicao}
          vinculos={vinculos}
          tags={tags}
          colunas={colunas}
          onClose={() => setEmEdicao(null)}
        />
      )}
    </div>
  );
}
