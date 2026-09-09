"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  atualizarIdeia,
  converterIdeia,
  criarIdeia,
  type ConvertivelTipo,
  type FormState,
  type Ideia,
} from "../actions";

const STATUS_OPTIONS = [
  { value: "caixa_de_entrada", label: "Caixa de entrada" },
  { value: "analisando", label: "Analisando" },
  { value: "talvez", label: "Talvez" },
  { value: "aprovada", label: "Aprovada" },
  { value: "descartada", label: "Descartada" },
];

const CATEGORIA_OPTIONS = [
  "Produto",
  "Conteúdo",
  "Evento",
  "Ferramenta",
  "Campanha",
  "Melhoria",
  "Parceria",
  "Outro",
];

const NIVEL_OPTIONS = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
];

const CONVERSAO_OPTIONS: { tipo: ConvertivelTipo; label: string }[] = [
  { tipo: "projeto", label: "Projeto" },
  { tipo: "produto", label: "Produto" },
  { tipo: "evento", label: "Evento" },
  { tipo: "conteudo", label: "Conteúdo" },
];

const CONVERSAO_LABEL: Record<ConvertivelTipo, string> = {
  projeto: "Projeto",
  produto: "Produto",
  evento: "Evento",
  conteudo: "Conteúdo",
};

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

function NivelToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-black/10 bg-white p-1">
        {NIVEL_OPTIONS.map((option) => {
          const ativo = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
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
  );
}

function ConverterSubmit({
  tipo,
  label,
}: {
  tipo: ConvertivelTipo;
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
  ideiaId,
  onDone,
}: {
  ideiaId: string;
  onDone: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(
    converterIdeia.bind(null, ideiaId),
    initialState,
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">
          Converter em
        </span>
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

      {state.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
    </div>
  );
}

type Props = {
  ideia: Ideia | null;
  onClose: () => void;
};

export function IdeiaModal({ ideia, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [status, setStatus] = useState<string>(
    ideia?.status ?? "caixa_de_entrada",
  );
  const [impacto, setImpacto] = useState<string>(ideia?.impacto ?? "medio");
  const [esforco, setEsforco] = useState<string>(ideia?.esforco ?? "medio");

  const action = useMemo(
    () => (ideia ? atualizarIdeia.bind(null, ideia.id) : criarIdeia),
    [ideia],
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
  const convertida = ideia?.convertida_em_tipo ?? null;

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
        aria-label={ideia ? "Editar ideia" : "Nova ideia"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {ideia ? "Editar ideia" : "Nova ideia"}
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
            <input type="hidden" name="impacto" value={impacto} />
            <input type="hidden" name="esforco" value={esforco} />

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
                    Título <span className="text-[#B97059]">*</span>
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    type="text"
                    required
                    maxLength={200}
                    autoFocus
                    defaultValue={ideia?.titulo ?? ""}
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
                    defaultValue={ideia?.descricao ?? ""}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="categoria" className={labelClass}>
                    Categoria
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    defaultValue={ideia?.categoria ?? ""}
                    className={fieldClass}
                  >
                    <option value="">Sem categoria</option>
                    {CATEGORIA_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.categoria && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.categoria}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
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

                <NivelToggle
                  label="Impacto"
                  value={impacto}
                  onChange={setImpacto}
                />
                <NivelToggle
                  label="Esforço"
                  value={esforco}
                  onChange={setEsforco}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
              <SubmitButton label={ideia ? "Salvar alterações" : "Criar ideia"} />
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
              >
                Cancelar
              </button>
            </div>
          </form>

          {ideia && (
            <div className="mt-4 border-t border-black/5 pt-4">
              {convertida ? (
                <p className="inline-flex items-center gap-1.5 rounded-lg border border-[#24483F]/20 bg-[#24483F]/5 px-3 py-1.5 text-xs text-[#24483F]">
                  <span aria-hidden>↳</span>
                  Originou {CONVERSAO_LABEL[convertida]}
                  {ideia.convertida_em_titulo
                    ? `: ${ideia.convertida_em_titulo}`
                    : ""}
                </p>
              ) : (
                <ConverterControl ideiaId={ideia.id} onDone={close} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
