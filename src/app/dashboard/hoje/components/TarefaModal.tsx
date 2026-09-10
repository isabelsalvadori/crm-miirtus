"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarTarefa,
  atualizarTarefa,
  criarTarefa,
  excluirTarefa,
  type FormState,
  type TagLite,
  type TarefaHoje,
  type VinculoOpcoes,
  type VinculoTipo,
} from "../actions";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "../../tarefas/constants";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

const VINCULOS: { tipo: VinculoTipo; label: string; coluna: string }[] = [
  { tipo: "projeto", label: "Projeto", coluna: "projeto_id" },
  { tipo: "produto", label: "Produto", coluna: "produto_id" },
  { tipo: "evento", label: "Evento", coluna: "evento_id" },
  { tipo: "cliente", label: "Cliente", coluna: "cliente_id" },
  { tipo: "ideia", label: "Ideia", coluna: "ideia_id" },
  { tipo: "campanha", label: "Campanha", coluna: "campanha_id" },
];

function vinculoAtual(tarefa: TarefaHoje | null, tipo: VinculoTipo): string {
  if (!tarefa) return "";
  const mapa: Record<VinculoTipo, string | null> = {
    projeto: tarefa.projeto_id,
    produto: tarefa.produto_id,
    evento: tarefa.evento_id,
    cliente: tarefa.cliente_id,
    ideia: tarefa.ideia_id,
    campanha: tarefa.campanha_id,
  };
  return mapa[tipo] ?? "";
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-[#24483F] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner />}
      {pending ? "Salvando..." : label}
    </button>
  );
}

function DangerBloco({
  acao,
  palavra,
  rotulo,
  descricao,
  tarefaId,
  tone,
  onDone,
}: {
  acao: (prev: FormState, fd: FormData) => Promise<FormState>;
  palavra: "ARQUIVAR" | "EXCLUIR";
  rotulo: string;
  descricao: string;
  tarefaId: string;
  tone: "argila" | "red";
  onDone: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [state, formAction] = useFormState(acao, initialState);

  useEffect(() => {
    if (state.ok) onDone();
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
        <form
          action={formAction}
          className="mt-2 rounded-lg border border-black/5 bg-white p-3"
        >
          <input type="hidden" name="id" value={tarefaId} />
          <p className="text-xs text-gray-500">{descricao}</p>
          <label className="mt-2 block text-xs text-gray-500">
            Digite{" "}
            <strong className="font-semibold text-[#2D3230]">{palavra}</strong>{" "}
            para confirmar
          </label>
          <input
            name="confirmacao"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-[#2D3230] outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
          />
          {state.error && (
            <p className="mt-1 text-xs text-red-600">{state.error}</p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <ConfirmSubmit rotulo={rotulo} disabled={texto !== palavra} tone={tone} />
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

function TagInput({
  disponiveis,
  selecionadas,
  novas,
  onToggle,
  onAdd,
  onRemoveNova,
}: {
  disponiveis: TagLite[];
  selecionadas: Set<string>;
  novas: string[];
  onToggle: (id: string) => void;
  onAdd: (nome: string) => void;
  onRemoveNova: (nome: string) => void;
}) {
  const [texto, setTexto] = useState("");

  function adicionar() {
    const nome = texto.trim();
    if (!nome) return;
    onAdd(nome);
    setTexto("");
  }

  return (
    <div>
      <span className={labelClass}>Tags</span>
      {disponiveis.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {disponiveis.map((tag) => {
            const ativa = selecionadas.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag.id)}
                aria-pressed={ativa}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  ativa
                    ? "border-[#24483F] bg-[#24483F] text-white"
                    : "border-black/10 bg-white text-[#2D3230] hover:border-[#24483F]/40"
                }`}
              >
                {tag.nome}
              </button>
            );
          })}
        </div>
      )}

      {novas.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {novas.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => onRemoveNova(nome)}
              className="rounded-full border border-[#E3BD62] bg-[#E3BD62]/15 px-2.5 py-0.5 text-xs font-medium text-[#2D3230]"
            >
              {nome} ×
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              adicionar();
            }
          }}
          placeholder="Nova tag"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
        />
        <button
          type="button"
          onClick={adicionar}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-[#24483F] transition-colors hover:bg-[#24483F]/5"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

type Props = {
  tarefa: TarefaHoje | null;
  vinculos: VinculoOpcoes;
  tags: TagLite[];
  colunas: string[];
  onClose: () => void;
  /** Chamado quando a tarefa é criada/salva com sucesso (antes de fechar). */
  onSuccess?: () => void;
  /** Vínculos pré-preenchidos ao criar uma tarefa a partir de outro módulo. */
  eventoIdPadrao?: string;
  /** Pré-seleção genérica de vínculos ao criar (ex.: perfil de Cliente/Produto). */
  vinculosPadrao?: Partial<Record<VinculoTipo, string>>;
  /** Data/horas pré-preenchidas ao criar a partir da Agenda. */
  agendaDataPadrao?: string;
  agendaHoraInicioPadrao?: string;
  agendaHoraFimPadrao?: string;
  /** Sobrescreve a action de criação (ex.: criarTarefaAgendada). */
  createAction?: (prev: FormState, fd: FormData) => Promise<FormState>;
};

export function TarefaModal({
  tarefa,
  vinculos,
  tags,
  colunas,
  onClose,
  onSuccess,
  eventoIdPadrao,
  vinculosPadrao,
  agendaDataPadrao,
  agendaHoraInicioPadrao,
  agendaHoraFimPadrao,
  createAction,
}: Props) {
  const editando = Boolean(tarefa);

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [status, setStatus] = useState(tarefa?.status ?? "a_fazer");
  const [prioridade, setPrioridade] = useState(tarefa?.prioridade ?? "normal");
  const [tagIds, setTagIds] = useState<Set<string>>(
    new Set(tarefa?.tag_ids ?? []),
  );
  const [novasTags, setNovasTags] = useState<string[]>([]);

  const action = useMemo(
    () =>
      tarefa
        ? atualizarTarefa.bind(null, tarefa.id)
        : createAction ?? criarTarefa,
    [tarefa, createAction],
  );
  const [state, formAction] = useFormState(action, initialState);
  const savedRef = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 160);
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (state.ok && !savedRef.current) {
      savedRef.current = true;
      onSuccess?.();
      close();
    }
  }, [state, close, onSuccess]);

  function toggleTag(id: string) {
    setTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tagsJson = JSON.stringify([
    ...Array.from(tagIds).map((id) => ({ id })),
    ...novasTags.map((nome) => ({ nome })),
  ]);

  const temAgenda = colunas.includes("agenda_data");
  const show = mounted && !closing;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        aria-hidden
        onClick={close}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editando ? "Editar tarefa" : "Nova tarefa"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {editando ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-[#F5F1E8]"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <form action={formAction} noValidate>
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="prioridade" value={prioridade} />
            <input type="hidden" name="tags_json" value={tagsJson} />

            {state.error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {state.error}
              </p>
            )}

            <div className="grid gap-6 md:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="titulo" className={labelClass}>
                    Título <span className="text-[#B97059]">*</span>
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    type="text"
                    required
                    maxLength={300}
                    autoFocus
                    defaultValue={tarefa?.titulo ?? ""}
                    className={fieldClass}
                  />
                  {state.fieldErrors?.titulo && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.titulo}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="descricao" className={labelClass}>
                    Descrição
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    rows={6}
                    defaultValue={tarefa?.descricao ?? ""}
                    className={fieldClass}
                  />
                </div>

                <TagInput
                  disponiveis={tags}
                  selecionadas={tagIds}
                  novas={novasTags}
                  onToggle={toggleTag}
                  onAdd={(nome) =>
                    setNovasTags((prev) =>
                      prev.includes(nome) ? prev : [...prev, nome],
                    )
                  }
                  onRemoveNova={(nome) =>
                    setNovasTags((prev) => prev.filter((n) => n !== nome))
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className={labelClass}>Status</span>
                  <div className="mt-1.5 space-y-1.5">
                    {STATUS_OPTIONS.map((option) => {
                      const ativo = status === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatus(option.value)}
                          aria-pressed={ativo}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                            ativo
                              ? "border-[#24483F] bg-[#24483F] text-white"
                              : "border-black/10 bg-white text-[#2D3230] hover:border-[#24483F]/40"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className={labelClass}>Prioridade</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-black/10 bg-white p-1">
                    {PRIORIDADE_OPTIONS.map((option) => {
                      const ativo = prioridade === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPrioridade(option.value)}
                          aria-pressed={ativo}
                          className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                            ativo
                              ? "bg-[#E3BD62] text-[#2D3230]"
                              : "text-gray-500 hover:bg-[#F5F1E8]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="data_prazo" className={labelClass}>
                    Data prazo
                  </label>
                  <input
                    id="data_prazo"
                    name="data_prazo"
                    type="date"
                    defaultValue={tarefa?.data_prazo?.slice(0, 10) ?? ""}
                    className={fieldClass}
                  />
                </div>

                {temAgenda && (
                  <div>
                    <span className={labelClass}>Agenda</span>
                    <input
                      name="agenda_data"
                      type="date"
                      aria-label="Data da agenda"
                      defaultValue={
                        tarefa?.agenda_data?.slice(0, 10) ??
                        agendaDataPadrao ??
                        ""
                      }
                      className={fieldClass}
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        name="agenda_hora_inicio"
                        type="time"
                        aria-label="Hora de início"
                        defaultValue={
                          tarefa?.agenda_hora_inicio?.slice(0, 5) ??
                          agendaHoraInicioPadrao ??
                          ""
                        }
                        className={fieldClass}
                      />
                      <input
                        name="agenda_hora_fim"
                        type="time"
                        aria-label="Hora de fim"
                        defaultValue={
                          tarefa?.agenda_hora_fim?.slice(0, 5) ??
                          agendaHoraFimPadrao ??
                          ""
                        }
                        className={fieldClass}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {VINCULOS.map(({ tipo, label, coluna }) => {
                    if (coluna !== "projeto_id" && !colunas.includes(coluna)) {
                      return null;
                    }
                    const atual =
                      vinculoAtual(tarefa, tipo) ||
                      (!tarefa
                        ? vinculosPadrao?.[tipo] ??
                          (tipo === "evento" ? eventoIdPadrao ?? "" : "")
                        : "");
                    return (
                      <div key={tipo}>
                        <label htmlFor={`${tipo}_id`} className={labelClass}>
                          {label}
                        </label>
                        <select
                          id={`${tipo}_id`}
                          name={`${tipo}_id`}
                          defaultValue={atual}
                          className={fieldClass}
                        >
                          <option value="">Sem vínculo</option>
                          {vinculos[tipo].map((opcao) => (
                            <option key={opcao.id} value={opcao.id}>
                              {opcao.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
              <SubmitButton
                label={editando ? "Salvar alterações" : "Criar tarefa"}
              />
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
              >
                Cancelar
              </button>
            </div>
          </form>

          {tarefa && (
            <div className="mt-4 flex flex-wrap items-start gap-4 border-t border-black/5 pt-4">
              <DangerBloco
                acao={arquivarTarefa}
                palavra="ARQUIVAR"
                rotulo="Arquivar"
                descricao="A tarefa sai do painel e da listagem; os dados são mantidos."
                tarefaId={tarefa.id}
                tone="argila"
                onDone={close}
              />
              <DangerBloco
                acao={excluirTarefa}
                palavra="EXCLUIR"
                rotulo="Excluir"
                descricao="Remove a tarefa e suas subtarefas permanentemente."
                tarefaId={tarefa.id}
                tone="red"
                onDone={close}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
