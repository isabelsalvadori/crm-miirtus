"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarEdicao,
  arquivarEvento,
  atualizarParticipante,
  excluirEdicao,
  excluirEvento,
  removerParticipante,
  vincularParticipante,
  type FormState,
} from "../actions";
import {
  EDICAO_STATUS_BADGE,
  EVENTO_STATUS_BADGE,
  PAPEL_OPTIONS,
  PARTICIPANTE_STATUS_BADGE,
  PARTICIPANTE_STATUS_OPTIONS,
  edicaoStatusLabel,
  eventoStatusLabel,
  eventoTipoLabel,
  formatData,
  formatoLabel,
  papelLabel,
  participanteStatusLabel,
} from "../constants";
import type {
  TagLite,
  TarefaHoje,
  VinculoOpcoes,
} from "@/app/dashboard/hoje/actions";
import { EdicaoModal, type EdicaoEdicao } from "./EdicaoModal";
import { EventoModal, type EventoEdicao } from "./EventoModal";
import { EventoTarefas } from "./EventoTarefas";
import {
  EventoDocumentos,
  type DocumentoEvento,
} from "./EventoDocumentos";

const initialState: FormState = {};

type Evento = EventoEdicao & { arquivado_em: string | null };
type Edicao = EdicaoEdicao & { inscritos: number };
type Participante = {
  edicao_id: string;
  pessoa_id: string;
  nome: string;
  papel: string | null;
  status: string | null;
};
type Option = { id: string; nome: string };

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-[#2D3230] outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const selectMini =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-[#2D3230] outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ------------------------------------------------------------
// Bloco de ação destrutiva com confirmação digitada
// ------------------------------------------------------------

function ConfirmSubmit({
  rotulo,
  disabled,
  tone,
}: {
  rotulo: string;
  disabled: boolean;
  tone: "argila" | "red";
}) {
  const { pending } = useFormStatus();
  const cor =
    tone === "red"
      ? "border-red-300 text-red-700 hover:bg-red-50"
      : "border-[#B97059]/40 text-[#B97059] hover:bg-[#B97059]/10";
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${cor}`}
    >
      {pending && <Spinner />}
      {pending ? "Processando..." : rotulo}
    </button>
  );
}

function DangerBloco({
  acao,
  palavra,
  rotulo,
  descricao,
  tone,
  hidden,
  onDone,
}: {
  acao: (prev: FormState, fd: FormData) => Promise<FormState>;
  palavra: string;
  rotulo: string;
  descricao: string;
  tone: "argila" | "red";
  hidden: Record<string, string>;
  onDone?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [state, formAction] = useFormState(acao, initialState);

  useEffect(() => {
    if (state.ok && onDone) onDone();
  }, [state, onDone]);

  const cor =
    tone === "red"
      ? "text-red-600 hover:bg-red-50"
      : "text-[#B97059] hover:bg-[#B97059]/10";

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setAberto((v) => !v);
          setTexto("");
        }}
        aria-expanded={aberto}
        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${cor}`}
      >
        {rotulo}
      </button>

      {aberto && (
        <form action={formAction} className="mt-2 rounded-lg border border-black/5 bg-white p-3">
          {Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <p className="text-xs text-gray-500">{descricao}</p>
          <label className="mt-2 block text-xs text-gray-500">
            Digite <strong className="font-semibold text-[#2D3230]">{palavra}</strong> para confirmar
          </label>
          <input
            name="confirmacao"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
          {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
          <div className="mt-2 flex items-center gap-3">
            <ConfirmSubmit rotulo={rotulo} tone={tone} disabled={texto !== palavra} />
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setTexto("");
              }}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Participantes de uma edição
// ------------------------------------------------------------

function SalvarParticipante() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-[#24483F]/30 bg-white px-2 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5 disabled:opacity-50"
    >
      {pending ? "..." : "Salvar"}
    </button>
  );
}

function ParticipanteRow({
  participante,
  edicaoId,
  eventoId,
}: {
  participante: Participante;
  edicaoId: string;
  eventoId: string;
}) {
  const [editando, setEditando] = useState(false);
  const [state, formAction] = useFormState(
    atualizarParticipante.bind(null, edicaoId, participante.pessoa_id, eventoId),
    initialState,
  );

  useEffect(() => {
    if (state.ok) setEditando(false);
  }, [state]);

  return (
    <li className="rounded-lg border border-black/5 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#2D3230]">{participante.nome}</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {papelLabel(participante.papel)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              PARTICIPANTE_STATUS_BADGE[participante.status ?? "confirmado"] ??
              "bg-gray-100 text-gray-600"
            }`}
          >
            {participanteStatusLabel(participante.status)}
          </span>
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="rounded-md px-1.5 py-0.5 text-xs text-gray-400 transition-colors hover:bg-[#F5F1E8] hover:text-[#24483F]"
          >
            Editar
          </button>
        </div>
      </div>

      {editando && (
        <div className="mt-2 space-y-2 border-t border-black/5 pt-2">
          <form action={formAction} className="flex flex-wrap items-center gap-2">
            <select name="papel" defaultValue={participante.papel ?? "inscrito"} className={selectMini}>
              {PAPEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={participante.status ?? "confirmado"}
              className={selectMini}
            >
              {PARTICIPANTE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <SalvarParticipante />
            {state.error && <span className="text-xs text-red-600">{state.error}</span>}
          </form>

          <DangerBloco
            acao={removerParticipante}
            palavra="REMOVER"
            rotulo="Remover participante"
            descricao="Desvincula esta pessoa da edição."
            tone="red"
            hidden={{
              edicao_id: edicaoId,
              pessoa_id: participante.pessoa_id,
              evento_id: eventoId,
            }}
          />
        </div>
      )}
    </li>
  );
}

function AdicionarParticipante({
  edicaoId,
  eventoId,
  clientes,
}: {
  edicaoId: string;
  eventoId: string;
  clientes: Option[];
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [pessoaId, setPessoaId] = useState("");
  const [state, formAction] = useFormState(
    vincularParticipante.bind(null, edicaoId, eventoId),
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      setAberto(false);
      setBusca("");
      setPessoaId("");
    }
  }, [state]);

  const filtrados = busca.trim()
    ? clientes
        .filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="rounded-md border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
      >
        + Adicionar participante
      </button>

      {aberto && (
        <form
          action={formAction}
          className="mt-2 space-y-2 rounded-lg border border-black/5 bg-white p-3"
        >
          <input type="hidden" name="pessoa_id" value={pessoaId} />
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPessoaId("");
            }}
            placeholder="Buscar cliente por nome"
            className={inputClass}
          />
          {filtrados.length > 0 && !pessoaId && (
            <ul className="max-h-40 overflow-y-auto rounded-md border border-black/5">
              {filtrados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPessoaId(c.id);
                      setBusca(c.nome);
                    }}
                    className="block w-full px-2.5 py-1.5 text-left text-sm text-[#2D3230] hover:bg-[#F5F1E8]"
                  >
                    {c.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select name="papel" defaultValue="inscrito" className={selectMini}>
              {PAPEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select name="status" defaultValue="confirmado" className={selectMini}>
              {PARTICIPANTE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <AdicionarSubmit disabled={!pessoaId} />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}

function AdicionarSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-[#24483F] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Adicionando..." : "Adicionar"}
    </button>
  );
}

function ParticipantesSection({
  edicaoId,
  eventoId,
  participantes,
  clientes,
}: {
  edicaoId: string;
  eventoId: string;
  participantes: Participante[];
  clientes: Option[];
}) {
  return (
    <div className="mt-3 border-t border-black/5 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Participantes ({participantes.length})
      </p>
      {participantes.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {participantes.map((p) => (
            <ParticipanteRow
              key={p.pessoa_id}
              participante={p}
              edicaoId={edicaoId}
              eventoId={eventoId}
            />
          ))}
        </ul>
      )}
      <AdicionarParticipante
        edicaoId={edicaoId}
        eventoId={eventoId}
        clientes={clientes}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Placeholder de seções futuras
// ------------------------------------------------------------

function Placeholder({ titulo }: { titulo: string }) {
  return (
    <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#24483F]">{titulo}</h3>
      <p className="mt-1 text-sm text-gray-400">Em breve.</p>
    </section>
  );
}

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------

type Props = {
  evento: Evento;
  edicoes: Edicao[];
  participantes: Participante[];
  clientes: Option[];
  projetos: Option[];
  colunasEdicao: string[];
  tarefas: TarefaHoje[];
  documentos: DocumentoEvento[];
  tarefaVinculos: VinculoOpcoes;
  tarefaTags: TagLite[];
  tarefaColunas: string[];
  tarefasHabilitadas: boolean;
};

export function EventoDetalhe({
  evento,
  edicoes,
  participantes,
  clientes,
  projetos,
  colunasEdicao,
  tarefas,
  documentos,
  tarefaVinculos,
  tarefaTags,
  tarefaColunas,
  tarefasHabilitadas,
}: Props) {
  const [editEvento, setEditEvento] = useState(false);
  const [edicaoModal, setEdicaoModal] = useState<
    { modo: "nova" } | { modo: "edit"; edicao: Edicao } | null
  >(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-900">{evento.nome}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {eventoTipoLabel(evento.tipo)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  EVENTO_STATUS_BADGE[evento.status ?? "ativo"] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {eventoStatusLabel(evento.status)}
              </span>
            </div>
          </div>
        </div>

        {evento.descricao && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
            {evento.descricao}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-start gap-3 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={() => setEditEvento(true)}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Editar
          </button>
          <DangerBloco
            acao={arquivarEvento}
            palavra="ARQUIVAR"
            rotulo="Arquivar"
            descricao="O evento sai da listagem; os dados são mantidos."
            tone="argila"
            hidden={{ id: evento.id }}
          />
          <DangerBloco
            acao={excluirEvento}
            palavra="EXCLUIR"
            rotulo="Excluir"
            descricao="Remove o evento, suas edições e participantes permanentemente."
            tone="red"
            hidden={{ id: evento.id }}
          />
        </div>
      </div>

      {/* Edições */}
      <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
          <h3 className="text-sm font-semibold text-[#24483F]">
            Edições ({edicoes.length})
          </h3>
          <button
            type="button"
            onClick={() => setEdicaoModal({ modo: "nova" })}
            className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
          >
            + Nova Edição
          </button>
        </div>

        {edicoes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Nenhuma edição ainda.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {edicoes.map((edicao) => {
              const daEdicao = participantes.filter(
                (p) => p.edicao_id === edicao.id,
              );
              return (
                <li
                  key={edicao.id}
                  className="rounded-xl border border-[#2D3230]/10 bg-[#F5F1E8]/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setEdicaoModal({ modo: "edit", edicao })}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-semibold text-[#2D3230] transition-colors hover:text-[#24483F]">
                        {edicao.nome ||
                          (edicao.numero
                            ? `${edicao.numero}ª edição`
                            : "Edição sem nome")}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {edicao.numero ? `Nº ${edicao.numero} · ` : ""}
                        {formatData(edicao.data_inicio)} ·{" "}
                        {formatoLabel(edicao.formato)}
                      </p>
                    </button>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        EDICAO_STATUS_BADGE[edicao.status ?? "planejada"] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {edicaoStatusLabel(edicao.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Inscritos: {edicao.inscritos}
                    {edicao.capacidade != null
                      ? ` / ${edicao.capacidade}`
                      : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <DangerBloco
                      acao={arquivarEdicao}
                      palavra="ARQUIVAR"
                      rotulo="Arquivar edição"
                      descricao="A edição sai da lista; os dados são mantidos."
                      tone="argila"
                      hidden={{ edicao_id: edicao.id, evento_id: evento.id }}
                    />
                    <DangerBloco
                      acao={excluirEdicao}
                      palavra="EXCLUIR"
                      rotulo="Excluir edição"
                      descricao="Remove a edição e seus participantes permanentemente."
                      tone="red"
                      hidden={{ edicao_id: edicao.id, evento_id: evento.id }}
                    />
                  </div>

                  <ParticipantesSection
                    edicaoId={edicao.id}
                    eventoId={evento.id}
                    participantes={daEdicao}
                    clientes={clientes}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Placeholder titulo="Financeiro" />

      <EventoTarefas
        eventoId={evento.id}
        tarefas={tarefas}
        vinculos={tarefaVinculos}
        tags={tarefaTags}
        colunas={tarefaColunas}
        habilitado={tarefasHabilitadas}
      />

      <EventoDocumentos eventoId={evento.id} documentos={documentos} />

      {editEvento && (
        <EventoModal
          evento={{
            id: evento.id,
            nome: evento.nome,
            descricao: evento.descricao,
            tipo: evento.tipo,
            status: evento.status,
            tipo_formato: evento.tipo_formato,
          }}
          edicaoUnica={
            edicoes.length > 0
              ? {
                  id: edicoes[0].id,
                  formato: edicoes[0].formato,
                  local: edicoes[0].local,
                  link_transmissao: edicoes[0].link_transmissao,
                  capacidade: edicoes[0].capacidade,
                  data_inicio: edicoes[0].data_inicio,
                  data_fim: edicoes[0].data_fim,
                  modelo_acesso: edicoes[0].modelo_acesso,
                  preco: edicoes[0].preco,
                }
              : null
          }
          onClose={() => setEditEvento(false)}
        />
      )}

      {edicaoModal && (
        <EdicaoModal
          edicao={edicaoModal.modo === "edit" ? edicaoModal.edicao : null}
          eventoId={evento.id}
          projetos={projetos}
          colunas={colunasEdicao}
          onClose={() => setEdicaoModal(null)}
        />
      )}
    </div>
  );
}
