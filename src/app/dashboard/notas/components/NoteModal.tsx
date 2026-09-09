"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  atualizarNota,
  converterNota,
  criarNota,
  type ConversaoTipo,
  type FormState,
  type Nota,
  type VinculoTipo,
} from "../actions";
import type { VinculoOpcoes } from "./NotesList";

const VINCULO_OPTIONS: { value: VinculoTipo; label: string }[] = [
  { value: "produto", label: "Produto" },
  { value: "projeto", label: "Projeto" },
  { value: "evento", label: "Evento" },
  { value: "ideia", label: "Ideia" },
  { value: "campanha", label: "Campanha" },
];

const CONVERSAO_OPTIONS: { tipo: ConversaoTipo; label: string }[] = [
  { tipo: "tarefa", label: "Tarefa" },
  { tipo: "ideia", label: "Ideia" },
  { tipo: "projeto", label: "Projeto" },
];

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

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

function ConverterSubmit({
  tipo,
  label,
}: {
  tipo: ConversaoTipo;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="tipo"
      value={tipo}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#24483F]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending && <Spinner />}
      {label}
    </button>
  );
}

function ConverterControl({
  notaId,
  onDone,
}: {
  notaId: string;
  onDone: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(
    converterNota.bind(null, notaId),
    initialState,
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Converter em</span>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
        >
          {aberto ? "▾" : "→"}
        </button>
      </div>

      {aberto && (
        <form action={formAction} className="mt-2 flex flex-wrap gap-2">
          {/* Cada botão envia o tipo via name/value ao disparar o submit. */}
          {CONVERSAO_OPTIONS.map((option) => (
            <ConverterSubmit
              key={option.tipo}
              tipo={option.tipo}
              label={option.label}
            />
          ))}
        </form>
      )}

      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

type Props = {
  nota: Nota | null;
  vinculos: VinculoOpcoes;
  onClose: () => void;
};

export function NoteModal({ nota, vinculos, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [entidadeTipo, setEntidadeTipo] = useState<string>(
    nota?.entidade_tipo ?? "",
  );
  const [entidadeId, setEntidadeId] = useState<string>(nota?.entidade_id ?? "");

  const action = useMemo(
    () => (nota ? atualizarNota.bind(null, nota.id) : criarNota),
    [nota],
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
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  const show = mounted && !closing;
  const opcoesEntidade =
    entidadeTipo && entidadeTipo in vinculos
      ? vinculos[entidadeTipo as VinculoTipo]
      : [];

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
        aria-label={nota ? "Editar nota" : "Nova nota"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {nota ? "Editar nota" : "Nova nota"}
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
            <input type="hidden" name="entidade_tipo" value={entidadeTipo} />
            <input type="hidden" name="entidade_id" value={entidadeId} />

            {state.error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {state.error}
              </p>
            )}

            <div className="grid gap-6 md:grid-cols-[1fr_260px]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="titulo" className={labelClass}>
                    Título
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    type="text"
                    maxLength={200}
                    autoFocus
                    defaultValue={nota?.titulo ?? ""}
                    className={fieldClass}
                    placeholder="Opcional"
                  />
                  {state.fieldErrors?.titulo && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.titulo}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="conteudo" className={labelClass}>
                    Conteúdo <span className="text-[#B97059]">*</span>
                  </label>
                  <textarea
                    id="conteudo"
                    name="conteudo"
                    rows={12}
                    required
                    defaultValue={nota?.conteudo ?? ""}
                    className={fieldClass}
                  />
                  {state.fieldErrors?.conteudo && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.conteudo}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <span className={labelClass}>Vínculo</span>
                  <select
                    value={entidadeTipo}
                    onChange={(event) => {
                      setEntidadeTipo(event.target.value);
                      setEntidadeId("");
                    }}
                    className={fieldClass}
                    aria-label="Tipo de vínculo"
                  >
                    <option value="">Sem vínculo</option>
                    {VINCULO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {entidadeTipo && (
                    <select
                      value={entidadeId}
                      onChange={(event) => setEntidadeId(event.target.value)}
                      className={`${fieldClass} mt-2`}
                      aria-label="Registro vinculado"
                    >
                      <option value="">Selecionar…</option>
                      {opcoesEntidade.map((opcao) => (
                        <option key={opcao.id} value={opcao.id}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {state.fieldErrors?.entidade_tipo && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.entidade_tipo}
                    </p>
                  )}
                </div>

                {nota && (
                  <p className="text-xs text-gray-500">
                    Criada em{" "}
                    {new Date(nota.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
              <SubmitButton label={nota ? "Salvar alterações" : "Criar nota"} />
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
              >
                Cancelar
              </button>
            </div>
          </form>

          {nota && (
            <div className="mt-4 border-t border-black/5 pt-4">
              <ConverterControl notaId={nota.id} onDone={close} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
