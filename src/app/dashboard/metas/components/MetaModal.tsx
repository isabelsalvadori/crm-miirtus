"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarMeta,
  atualizarMeta,
  criarMeta,
  excluirMeta,
  type FormState,
} from "../actions";
import {
  META_STATUS_OPTIONS,
  META_TIPO_OPTIONS,
  META_UNIDADE_OPTIONS,
} from "../constants";
import type { MetaCard, OptionLite } from "./MetasList";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
  metaId,
  onDone,
}: {
  acao: (prev: FormState, fd: FormData) => Promise<FormState>;
  palavra: string;
  rotulo: string;
  descricao: string;
  tone: "argila" | "red";
  metaId: string;
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
          <input type="hidden" name="id" value={metaId} />
          <p className="text-xs text-gray-500">{descricao}</p>
          <label className="mt-2 block text-xs text-gray-500">
            Digite{" "}
            <strong className="font-semibold text-[#2D3230]">{palavra}</strong>{" "}
            para confirmar
          </label>
          <input
            name="confirmacao"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-[#2D3230] outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
          />
          {state.error && (
            <p className="mt-1 text-xs text-red-600">{state.error}</p>
          )}
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
// Modal
// ------------------------------------------------------------

type Props = {
  meta: MetaCard | null;
  projetos: OptionLite[];
  produtos: OptionLite[];
  eventos: OptionLite[];
  onClose: () => void;
};

/** Config do vínculo dinâmico exibido conforme o tipo da meta. */
const VINCULO_POR_TIPO: Record<
  string,
  { campo: "produto_id" | "projeto_id" | "evento_id"; label: string; geral: string }
> = {
  produto: {
    campo: "produto_id",
    label: "Produto específico",
    geral: "Meta geral — todos os produtos",
  },
  projeto: {
    campo: "projeto_id",
    label: "Projeto específico",
    geral: "Meta geral — todos os projetos",
  },
  evento: {
    campo: "evento_id",
    label: "Evento específico",
    geral: "Meta geral — todos os eventos",
  },
};

export function MetaModal({
  meta,
  projetos,
  produtos,
  eventos,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [tipo, setTipo] = useState(meta?.tipo ?? "corporativa");

  const action = useMemo(
    () => (meta ? atualizarMeta.bind(null, meta.id) : criarMeta),
    [meta],
  );
  const [state, formAction] = useFormState(action, initialState);

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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  const show = mounted && !closing;
  const isFinanceira = tipo === "financeira";

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
        aria-label={meta ? "Editar meta" : "Nova meta"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {meta ? "Editar meta" : "Nova meta"}
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

        <form action={formAction} className="flex-1 overflow-y-auto p-5" noValidate>
          {state.error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            {/* Esquerda */}
            <div className="space-y-4">
              <div>
                <label htmlFor="nome" className={labelClass}>
                  Título <span className="text-[#B97059]">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  maxLength={200}
                  autoFocus
                  defaultValue={meta?.nome ?? ""}
                  className={fieldClass}
                />
                {state.fieldErrors?.nome && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nome}</p>
                )}
              </div>

              <div>
                <label htmlFor="descricao" className={labelClass}>
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={4}
                  defaultValue={meta?.descricao ?? ""}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="indicador" className={labelClass}>
                  Indicador
                </label>
                <input
                  id="indicador"
                  name="indicador"
                  type="text"
                  maxLength={200}
                  defaultValue={meta?.indicador ?? ""}
                  placeholder="O que será medido"
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="periodo_inicio" className={labelClass}>
                    Período início
                  </label>
                  <input
                    id="periodo_inicio"
                    name="periodo_inicio"
                    type="date"
                    defaultValue={meta?.periodo_inicio?.slice(0, 10) ?? ""}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="periodo_fim" className={labelClass}>
                    Período fim
                  </label>
                  <input
                    id="periodo_fim"
                    name="periodo_fim"
                    type="date"
                    defaultValue={meta?.periodo_fim?.slice(0, 10) ?? ""}
                    className={fieldClass}
                  />
                  {state.fieldErrors?.periodo_fim && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.periodo_fim}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Deixe o fim em branco para uma meta contínua.
              </p>
            </div>

            {/* Direita */}
            <div className="space-y-4">
              <div>
                <label htmlFor="tipo" className={labelClass}>
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={fieldClass}
                >
                  {META_TIPO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {VINCULO_POR_TIPO[tipo] &&
                (() => {
                  const cfg = VINCULO_POR_TIPO[tipo];
                  const opcoes =
                    cfg.campo === "produto_id"
                      ? produtos
                      : cfg.campo === "projeto_id"
                        ? projetos
                        : eventos;
                  const atual =
                    cfg.campo === "produto_id"
                      ? meta?.produto_id
                      : cfg.campo === "projeto_id"
                        ? meta?.projeto_id
                        : meta?.evento_id;
                  return (
                    <div key={cfg.campo}>
                      <label htmlFor={cfg.campo} className={labelClass}>
                        {cfg.label}
                      </label>
                      <select
                        id={cfg.campo}
                        name={cfg.campo}
                        defaultValue={atual ?? ""}
                        className={fieldClass}
                      >
                        <option value="">{cfg.geral}</option>
                        {opcoes.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

              <div>
                <label htmlFor="unidade" className={labelClass}>
                  Unidade
                </label>
                <select
                  id="unidade"
                  name="unidade"
                  defaultValue={meta?.unidade ?? (isFinanceira ? "R$" : "unidades")}
                  className={fieldClass}
                >
                  {META_UNIDADE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="valor_alvo" className={labelClass}>
                  Valor objetivo
                </label>
                <input
                  id="valor_alvo"
                  name="valor_alvo"
                  type="text"
                  inputMode="decimal"
                  defaultValue={
                    meta?.valor_alvo != null ? String(meta.valor_alvo) : ""
                  }
                  placeholder="0,00"
                  className={fieldClass}
                />
                {state.fieldErrors?.valor_alvo && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.fieldErrors.valor_alvo}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={meta?.status ?? "ativa"}
                  className={fieldClass}
                >
                  {META_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {isFinanceira && (
            <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Progresso calculado automaticamente via Financeiro (receitas do
              período).
            </p>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={meta ? "Salvar alterações" : "Criar meta"} />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>

        {meta && (
          <div className="flex shrink-0 flex-wrap items-start gap-4 border-t border-black/5 bg-white/60 px-5 py-3">
            <DangerBloco
              acao={arquivarMeta}
              palavra="ARQUIVAR"
              rotulo="Arquivar"
              descricao="A meta sai da listagem; os dados são mantidos."
              tone="argila"
              metaId={meta.id}
              onDone={close}
            />
            <DangerBloco
              acao={excluirMeta}
              palavra="EXCLUIR"
              rotulo="Excluir"
              descricao="Remove a meta permanentemente."
              tone="red"
              metaId={meta.id}
              onDone={close}
            />
          </div>
        )}
      </div>
    </div>
  );
}
