"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  atualizarEvento,
  criarEvento,
  type FormState,
} from "../actions";
import { EVENTO_STATUS_OPTIONS, EVENTO_TIPO_OPTIONS } from "../constants";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

export type EventoEdicao = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  status: string | null;
};

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

type Props = {
  evento: EventoEdicao | null;
  onClose: () => void;
};

export function EventoModal({ evento, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const action = useMemo(
    () => (evento ? atualizarEvento.bind(null, evento.id) : criarEvento),
    [evento],
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
        aria-label={evento ? "Editar evento" : "Novo evento"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {evento ? "Editar evento" : "Novo evento"}
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
            <div className="space-y-4">
              <div>
                <label htmlFor="nome" className={labelClass}>
                  Nome <span className="text-[#B97059]">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  maxLength={200}
                  autoFocus
                  defaultValue={evento?.nome ?? ""}
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
                  rows={8}
                  defaultValue={evento?.descricao ?? ""}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="tipo" className={labelClass}>
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  defaultValue={evento?.tipo ?? "outro"}
                  className={fieldClass}
                >
                  {EVENTO_TIPO_OPTIONS.map((o) => (
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
                  defaultValue={evento?.status ?? "ativo"}
                  className={fieldClass}
                >
                  {EVENTO_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={evento ? "Salvar alterações" : "Criar evento"} />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
