"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  atualizarEdicao,
  criarEdicao,
  type FormState,
} from "../actions";
import {
  EDICAO_STATUS_OPTIONS,
  FORMATO_OPTIONS,
  MODELO_ACESSO_OPTIONS,
  toDatetimeLocal,
} from "../constants";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

export type EdicaoEdicao = {
  id: string;
  nome: string | null;
  numero: number | null;
  status: string | null;
  formato: string | null;
  local: string | null;
  link_transmissao: string | null;
  capacidade: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  modelo_acesso: string | null;
  preco: number | string | null;
  projeto_id: string | null;
  resumo: string | null;
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
  edicao: EdicaoEdicao | null;
  eventoId: string;
  projetos: { id: string; nome: string }[];
  colunas: string[];
  onClose: () => void;
};

export function EdicaoModal({
  edicao,
  eventoId,
  projetos,
  colunas,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [modeloAcesso, setModeloAcesso] = useState(
    edicao?.modelo_acesso ?? "gratuito",
  );

  const temResumo = colunas.includes("resumo");
  const temAcesso = colunas.includes("modelo_acesso");
  const temPreco = colunas.includes("preco");
  const temProjeto = colunas.includes("projeto_id");

  const action = useMemo(
    () =>
      edicao
        ? atualizarEdicao.bind(null, edicao.id, eventoId)
        : criarEdicao.bind(null, eventoId),
    [edicao, eventoId],
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

  const localOuLink = edicao?.link_transmissao || edicao?.local || "";
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
        aria-label={edicao ? "Editar edição" : "Nova edição"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {edicao ? "Editar edição" : "Nova edição"}
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
                  Nome da edição
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  maxLength={200}
                  autoFocus
                  defaultValue={edicao?.nome ?? ""}
                  placeholder="Ex.: 1ª edição, Turma de Março…"
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="data_inicio" className={labelClass}>
                    Data início
                  </label>
                  <input
                    id="data_inicio"
                    name="data_inicio"
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(edicao?.data_inicio)}
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
                    defaultValue={toDatetimeLocal(edicao?.data_fim)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
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

              {temResumo && (
                <div>
                  <label htmlFor="resumo" className={labelClass}>
                    Resumo
                  </label>
                  <textarea
                    id="resumo"
                    name="resumo"
                    rows={4}
                    defaultValue={edicao?.resumo ?? ""}
                    className={fieldClass}
                  />
                </div>
              )}
            </div>

            {/* Direita */}
            <div className="space-y-4">
              <div>
                <label htmlFor="numero" className={labelClass}>
                  Número da edição
                </label>
                <input
                  id="numero"
                  name="numero"
                  type="number"
                  min={1}
                  defaultValue={edicao?.numero ?? ""}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={edicao?.status ?? "planejada"}
                  className={fieldClass}
                >
                  {EDICAO_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="formato" className={labelClass}>
                  Formato
                </label>
                <select
                  id="formato"
                  name="formato"
                  defaultValue={edicao?.formato ?? "online"}
                  className={fieldClass}
                >
                  {FORMATO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
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
                  defaultValue={edicao?.capacidade ?? ""}
                  className={fieldClass}
                />
              </div>

              {temAcesso && (
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
              )}

              {temPreco && modeloAcesso === "pago" && (
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
                      edicao?.preco != null ? String(edicao.preco) : ""
                    }
                    placeholder="0,00"
                    className={fieldClass}
                  />
                </div>
              )}

              {temProjeto && (
                <div>
                  <label htmlFor="projeto_id" className={labelClass}>
                    Projeto relacionado
                  </label>
                  <select
                    id="projeto_id"
                    name="projeto_id"
                    defaultValue={edicao?.projeto_id ?? ""}
                    className={fieldClass}
                  >
                    <option value="">Sem vínculo</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={edicao ? "Salvar alterações" : "Criar edição"} />
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
