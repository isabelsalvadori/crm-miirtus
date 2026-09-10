"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  CONTEUDO_CANAL_OPTIONS,
  CONTEUDO_STATUS_OPTIONS,
  CONTEUDO_TIPO_OPTIONS,
  toDatetimeLocal,
} from "../../constants";
import type { Catalogos, ConteudoItem } from "../../types";
import {
  arquivarConteudo,
  atualizarConteudo,
  criarConteudo,
  excluirConteudo,
  type FormState,
} from "../actions";

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
  conteudoId,
  onDone,
}: {
  acao: (prev: FormState, fd: FormData) => Promise<FormState>;
  palavra: string;
  rotulo: string;
  descricao: string;
  tone: "argila" | "red";
  conteudoId: string;
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
          <input type="hidden" name="id" value={conteudoId} />
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

type Props = {
  conteudo: ConteudoItem | null;
  catalogos: Catalogos;
  defaultStatus?: string;
  defaultDataAgendada?: string;
  onClose: () => void;
};

export function ConteudoModal({
  conteudo,
  catalogos,
  defaultStatus,
  defaultDataAgendada,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const action = useMemo(
    () => (conteudo ? atualizarConteudo.bind(null, conteudo.id) : criarConteudo),
    [conteudo],
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
        aria-label={conteudo ? "Editar conteúdo" : "Novo conteúdo"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {conteudo ? "Editar conteúdo" : "Novo conteúdo"}
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
                <label htmlFor="titulo" className={labelClass}>
                  Título <span className="text-[#B97059]">*</span>
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  maxLength={200}
                  autoFocus
                  defaultValue={conteudo?.titulo ?? ""}
                  className={fieldClass}
                />
                {state.fieldErrors?.titulo && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.titulo}</p>
                )}
              </div>

              <div>
                <label htmlFor="resumo" className={labelClass}>
                  Resumo
                </label>
                <textarea
                  id="resumo"
                  name="resumo"
                  rows={3}
                  defaultValue={conteudo?.resumo ?? ""}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="corpo_roteiro" className={labelClass}>
                  Corpo / Roteiro
                </label>
                <textarea
                  id="corpo_roteiro"
                  name="corpo_roteiro"
                  rows={10}
                  defaultValue={conteudo?.corpo_roteiro ?? ""}
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="data_agendada" className={labelClass}>
                    Data agendada
                  </label>
                  <input
                    id="data_agendada"
                    name="data_agendada"
                    type="datetime-local"
                    defaultValue={
                      conteudo
                        ? toDatetimeLocal(conteudo.data_agendada)
                        : defaultDataAgendada ?? ""
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="data_publicacao" className={labelClass}>
                    Data publicação
                  </label>
                  <input
                    id="data_publicacao"
                    name="data_publicacao"
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(conteudo?.data_publicacao)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="link_publicado" className={labelClass}>
                  Link publicado
                </label>
                <input
                  id="link_publicado"
                  name="link_publicado"
                  type="url"
                  defaultValue={conteudo?.link_publicado ?? ""}
                  placeholder="https://"
                  className={fieldClass}
                />
              </div>
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
                  defaultValue={conteudo?.tipo ?? "post"}
                  className={fieldClass}
                >
                  {CONTEUDO_TIPO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="canal" className={labelClass}>
                  Canal
                </label>
                <select
                  id="canal"
                  name="canal"
                  defaultValue={conteudo?.canal ?? "instagram"}
                  className={fieldClass}
                >
                  {CONTEUDO_CANAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={conteudo?.status ?? defaultStatus ?? "backlog"}
                  className={fieldClass}
                >
                  {CONTEUDO_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pilar" className={labelClass}>
                  Pilar de conteúdo
                </label>
                <input
                  id="pilar"
                  name="pilar"
                  type="text"
                  maxLength={120}
                  defaultValue={conteudo?.pilar ?? ""}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="produto_id" className={labelClass}>
                  Produto relacionado
                </label>
                <select
                  id="produto_id"
                  name="produto_id"
                  defaultValue={conteudo?.produto_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Nenhum</option>
                  {catalogos.produtos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="projeto_id" className={labelClass}>
                  Projeto relacionado
                </label>
                <select
                  id="projeto_id"
                  name="projeto_id"
                  defaultValue={conteudo?.projeto_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Nenhum</option>
                  {catalogos.projetos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="campanha_id" className={labelClass}>
                  Campanha relacionada
                </label>
                <select
                  id="campanha_id"
                  name="campanha_id"
                  defaultValue={conteudo?.campanha_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Nenhuma</option>
                  {catalogos.campanhas.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={conteudo ? "Salvar alterações" : "Criar conteúdo"} />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>

        {conteudo && (
          <div className="flex shrink-0 flex-wrap items-start gap-4 border-t border-black/5 bg-white/60 px-5 py-3">
            <DangerBloco
              acao={arquivarConteudo}
              palavra="ARQUIVAR"
              rotulo="Arquivar"
              descricao="O conteúdo sai do quadro; os dados são mantidos."
              tone="argila"
              conteudoId={conteudo.id}
              onDone={close}
            />
            <DangerBloco
              acao={excluirConteudo}
              palavra="EXCLUIR"
              rotulo="Excluir"
              descricao="Remove o conteúdo permanentemente."
              tone="red"
              conteudoId={conteudo.id}
              onDone={close}
            />
          </div>
        )}
      </div>
    </div>
  );
}
