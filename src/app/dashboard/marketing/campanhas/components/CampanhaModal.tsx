"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  CAMPANHA_STATUS_OPTIONS,
  CAMPANHA_TIPO_OPTIONS,
  CONTEUDO_CANAL_OPTIONS,
  calcularCac,
  calcularRoas,
  formatBRL,
  formatNumero,
  formatRoas,
  toDateInput,
} from "../../constants";
import type { Catalogos, CampanhaItem } from "../../types";
import {
  arquivarCampanha,
  atualizarCampanha,
  criarCampanha,
  excluirCampanha,
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
  campanhaId,
  onDone,
}: {
  acao: (prev: FormState, fd: FormData) => Promise<FormState>;
  palavra: string;
  rotulo: string;
  descricao: string;
  tone: "argila" | "red";
  campanhaId: string;
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
          <input type="hidden" name="id" value={campanhaId} />
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

function Calculado({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[#2D3230]">{valor}</p>
    </div>
  );
}

type Props = {
  campanha: CampanhaItem | null;
  catalogos: Catalogos;
  onClose: () => void;
};

export function CampanhaModal({ campanha, catalogos, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const action = useMemo(
    () => (campanha ? atualizarCampanha.bind(null, campanha.id) : criarCampanha),
    [campanha],
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
  const roas = campanha
    ? calcularRoas(campanha.receita_gerada, campanha.gasto_real)
    : null;
  const cac = campanha
    ? calcularCac(campanha.gasto_real, campanha.vendas)
    : null;

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
        aria-label={campanha ? "Editar campanha" : "Nova campanha"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {campanha ? "Editar campanha" : "Nova campanha"}
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
                  Nome <span className="text-[#B97059]">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  maxLength={200}
                  autoFocus
                  defaultValue={campanha?.nome ?? ""}
                  className={fieldClass}
                />
                {state.fieldErrors?.nome && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nome}</p>
                )}
              </div>

              <div>
                <label htmlFor="objetivo" className={labelClass}>
                  Objetivo
                </label>
                <textarea
                  id="objetivo"
                  name="objetivo"
                  rows={4}
                  defaultValue={campanha?.objetivo ?? ""}
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
                    defaultValue={toDateInput(campanha?.periodo_inicio)}
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
                    defaultValue={toDateInput(campanha?.periodo_fim)}
                    className={fieldClass}
                  />
                  {state.fieldErrors?.periodo_fim && (
                    <p className="mt-1 text-xs text-red-600">
                      {state.fieldErrors.periodo_fim}
                    </p>
                  )}
                </div>
              </div>

              {campanha && (
                <div>
                  <p className={labelClass}>Resultados (calculados)</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Calculado label="Gasto real" valor={formatBRL(campanha.gasto_real)} />
                    <Calculado
                      label="Receita gerada"
                      valor={formatBRL(campanha.receita_gerada)}
                    />
                    <Calculado label="ROAS" valor={formatRoas(roas)} />
                    <Calculado
                      label="CAC"
                      valor={cac == null ? "—" : formatBRL(cac)}
                    />
                    <Calculado label="Leads" valor={formatNumero(campanha.leads)} />
                    <Calculado label="Vendas" valor={formatNumero(campanha.vendas)} />
                  </div>
                </div>
              )}
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
                  defaultValue={campanha?.tipo ?? "organica"}
                  className={fieldClass}
                >
                  {CAMPANHA_TIPO_OPTIONS.map((o) => (
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
                  defaultValue={campanha?.status ?? "planejada"}
                  className={fieldClass}
                >
                  {CAMPANHA_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="canal_principal" className={labelClass}>
                  Canal principal
                </label>
                <select
                  id="canal_principal"
                  name="canal_principal"
                  defaultValue={campanha?.canal_principal ?? ""}
                  className={fieldClass}
                >
                  <option value="">—</option>
                  {CONTEUDO_CANAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  <option value="multicanal">Multicanal</option>
                </select>
              </div>

              <div>
                <label htmlFor="orcamento_planejado" className={labelClass}>
                  Orçamento planejado
                </label>
                <input
                  id="orcamento_planejado"
                  name="orcamento_planejado"
                  type="text"
                  inputMode="decimal"
                  defaultValue={
                    campanha?.orcamento_planejado != null
                      ? String(campanha.orcamento_planejado)
                      : ""
                  }
                  placeholder="0,00"
                  className={fieldClass}
                />
                {state.fieldErrors?.orcamento_planejado && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.fieldErrors.orcamento_planejado}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="produto_id" className={labelClass}>
                  Produto relacionado
                </label>
                <select
                  id="produto_id"
                  name="produto_id"
                  defaultValue={campanha?.produto_id ?? ""}
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
                  defaultValue={campanha?.projeto_id ?? ""}
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
                <label htmlFor="evento_id" className={labelClass}>
                  Evento relacionado
                </label>
                <select
                  id="evento_id"
                  name="evento_id"
                  defaultValue={campanha?.evento_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Nenhum</option>
                  {catalogos.eventos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={campanha ? "Salvar alterações" : "Criar campanha"} />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>

        {campanha && (
          <div className="flex shrink-0 flex-wrap items-start gap-4 border-t border-black/5 bg-white/60 px-5 py-3">
            <DangerBloco
              acao={arquivarCampanha}
              palavra="ARQUIVAR"
              rotulo="Arquivar"
              descricao="A campanha sai da listagem; os dados são mantidos."
              tone="argila"
              campanhaId={campanha.id}
              onDone={close}
            />
            <DangerBloco
              acao={excluirCampanha}
              palavra="EXCLUIR"
              rotulo="Excluir"
              descricao="Remove a campanha permanentemente."
              tone="red"
              campanhaId={campanha.id}
              onDone={close}
            />
          </div>
        )}
      </div>
    </div>
  );
}
