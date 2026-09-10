"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  atualizarEvento,
  criarEvento,
  type FormState,
} from "../actions";
import {
  EVENTO_FORMATO_OPTIONS,
  EVENTO_STATUS_OPTIONS,
  EVENTO_TIPO_OPTIONS,
  FORMATO_OPTIONS,
  MODELO_ACESSO_OPTIONS,
  toDatetimeLocal,
} from "../constants";

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
  tipo_formato: string | null;
};

/** Dados da edição única, quando o evento é do tipo "unico". */
export type EdicaoUnicaLite = {
  id: string;
  formato: string | null;
  local: string | null;
  link_transmissao: string | null;
  capacidade: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  modelo_acesso: string | null;
  preco: number | string | null;
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
  edicaoUnica?: EdicaoUnicaLite | null;
  onClose: () => void;
};

export function EventoModal({ evento, edicaoUnica, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [tipoFormato, setTipoFormato] = useState(
    evento?.tipo_formato ?? "unico",
  );
  const [modeloAcesso, setModeloAcesso] = useState(
    edicaoUnica?.modelo_acesso ?? "gratuito",
  );

  const localOuLink =
    edicaoUnica?.link_transmissao || edicaoUnica?.local || "";

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

              <div>
                <label htmlFor="tipo_formato" className={labelClass}>
                  Formato do evento
                </label>
                <select
                  id="tipo_formato"
                  name="tipo_formato"
                  value={tipoFormato}
                  onChange={(e) => setTipoFormato(e.target.value)}
                  className={fieldClass}
                >
                  {EVENTO_FORMATO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {tipoFormato === "unico"
                    ? "Data única — uma edição é criada automaticamente com os dados abaixo."
                    : "Recorrente — as edições são cadastradas separadamente no perfil do evento."}
                </p>
              </div>
            </div>
          </div>

          {tipoFormato === "unico" && (
            <fieldset className="mt-6 rounded-xl border border-black/10 bg-white/60 p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Edição única
              </legend>
              <input
                type="hidden"
                name="edicao_unica_id"
                value={edicaoUnica?.id ?? ""}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="data_inicio" className={labelClass}>
                    Data início
                  </label>
                  <input
                    id="data_inicio"
                    name="data_inicio"
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(edicaoUnica?.data_inicio)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="data_fim" className={labelClass}>
                    Data fim
                  </label>
                  <input
                    id="data_fim"
                    name="data_fim"
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(edicaoUnica?.data_fim)}
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="local_ou_link" className={labelClass}>
                    Local ou link
                  </label>
                  <input
                    id="local_ou_link"
                    name="local_ou_link"
                    type="text"
                    maxLength={500}
                    defaultValue={localOuLink}
                    placeholder="Endereço ou URL de transmissão"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="formato" className={labelClass}>
                    Formato
                  </label>
                  <select
                    id="formato"
                    name="formato"
                    defaultValue={edicaoUnica?.formato ?? "online"}
                    className={fieldClass}
                  >
                    {FORMATO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.formato && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.formato}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="capacidade" className={labelClass}>
                    Capacidade
                  </label>
                  <input
                    id="capacidade"
                    name="capacidade"
                    type="number"
                    min={0}
                    defaultValue={edicaoUnica?.capacidade ?? ""}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="modelo_acesso" className={labelClass}>
                    Modelo de acesso
                  </label>
                  <select
                    id="modelo_acesso"
                    name="modelo_acesso"
                    value={modeloAcesso}
                    onChange={(e) => setModeloAcesso(e.target.value)}
                    className={fieldClass}
                  >
                    {MODELO_ACESSO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {modeloAcesso === "pago" && (
                  <div>
                    <label htmlFor="preco" className={labelClass}>
                      Preço (R$)
                    </label>
                    <input
                      id="preco"
                      name="preco"
                      type="text"
                      inputMode="decimal"
                      defaultValue={
                        edicaoUnica?.preco != null
                          ? String(edicaoUnica.preco)
                          : ""
                      }
                      placeholder="0,00"
                      className={fieldClass}
                    />
                  </div>
                )}
              </div>
            </fieldset>
          )}

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
