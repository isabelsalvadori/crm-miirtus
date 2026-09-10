"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  ACAO_STATUS_OPTIONS,
  ACAO_TIPO_OPTIONS,
  toDateInput,
} from "../../constants";
import type { AcaoOrganicaItem, Catalogos } from "../../types";
import {
  arquivarAcaoOrganica,
  atualizarAcaoOrganica,
  criarAcaoOrganica,
  excluirAcaoOrganica,
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
  acaoId,
  onDone,
}: {
  acao: (prev: FormState, fd: FormData) => Promise<FormState>;
  palavra: string;
  rotulo: string;
  descricao: string;
  tone: "argila" | "red";
  acaoId: string;
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
          <input type="hidden" name="id" value={acaoId} />
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

function NumeroField({
  id,
  label,
  defaultValue,
  decimal = false,
}: {
  id: string;
  label: string;
  defaultValue: number | null;
  decimal?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={decimal ? "text" : "number"}
        inputMode={decimal ? "decimal" : "numeric"}
        min={decimal ? undefined : 0}
        defaultValue={defaultValue != null ? String(defaultValue) : ""}
        placeholder={decimal ? "0,00" : "0"}
        className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
      />
    </div>
  );
}

type Props = {
  acao: AcaoOrganicaItem | null;
  catalogos: Catalogos;
  onClose: () => void;
};

export function AcaoOrganicaModal({ acao, catalogos, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const action = useMemo(
    () =>
      acao ? atualizarAcaoOrganica.bind(null, acao.id) : criarAcaoOrganica,
    [acao],
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
        aria-label={acao ? "Editar ação orgânica" : "Nova ação orgânica"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {acao ? "Editar ação orgânica" : "Nova ação orgânica"}
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
                  defaultValue={acao?.nome ?? ""}
                  className={fieldClass}
                />
                {state.fieldErrors?.nome && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nome}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="canal_local" className={labelClass}>
                    Canal / local
                  </label>
                  <input
                    id="canal_local"
                    name="canal_local"
                    type="text"
                    maxLength={200}
                    defaultValue={acao?.canal_local ?? ""}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="data" className={labelClass}>
                    Data
                  </label>
                  <input
                    id="data"
                    name="data"
                    type="date"
                    defaultValue={toDateInput(acao?.data)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <fieldset className="rounded-xl border border-black/10 bg-white/60 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Resultado
                </legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  <NumeroField
                    id="contatos_gerados"
                    label="Contatos"
                    defaultValue={acao?.contatos_gerados ?? null}
                  />
                  <NumeroField
                    id="cliques"
                    label="Cliques"
                    defaultValue={acao?.cliques ?? null}
                  />
                  <NumeroField
                    id="inscricoes"
                    label="Inscrições"
                    defaultValue={acao?.inscricoes ?? null}
                  />
                  <NumeroField
                    id="leads"
                    label="Leads"
                    defaultValue={acao?.leads ?? null}
                  />
                  <NumeroField
                    id="vendas"
                    label="Vendas"
                    defaultValue={acao?.vendas ?? null}
                  />
                  <NumeroField
                    id="receita_atribuida"
                    label="Receita atribuída (R$)"
                    defaultValue={acao?.receita_atribuida ?? null}
                    decimal
                  />
                </div>
                {state.fieldErrors?.receita_atribuida && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.fieldErrors.receita_atribuida}
                  </p>
                )}
              </fieldset>
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
                  defaultValue={acao?.tipo ?? "comunidade"}
                  className={fieldClass}
                >
                  {ACAO_TIPO_OPTIONS.map((o) => (
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
                  defaultValue={acao?.status ?? "planejada"}
                  className={fieldClass}
                >
                  {ACAO_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="custo" className={labelClass}>
                  Custo (R$)
                </label>
                <input
                  id="custo"
                  name="custo"
                  type="text"
                  inputMode="decimal"
                  defaultValue={acao?.custo != null ? String(acao.custo) : ""}
                  placeholder="Opcional"
                  className={fieldClass}
                />
                {state.fieldErrors?.custo && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.fieldErrors.custo}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-black/10 bg-white/60 p-3">
                <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vínculos (opcionais)
                </p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="produto_id" className="block text-xs font-medium text-gray-500">
                      Produto
                    </label>
                    <select
                      id="produto_id"
                      name="produto_id"
                      defaultValue={acao?.produto_id ?? ""}
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
                    <label htmlFor="projeto_id" className="block text-xs font-medium text-gray-500">
                      Projeto
                    </label>
                    <select
                      id="projeto_id"
                      name="projeto_id"
                      defaultValue={acao?.projeto_id ?? ""}
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
                    <label htmlFor="evento_id" className="block text-xs font-medium text-gray-500">
                      Evento
                    </label>
                    <select
                      id="evento_id"
                      name="evento_id"
                      defaultValue={acao?.evento_id ?? ""}
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
                  <div>
                    <label htmlFor="campanha_id" className="block text-xs font-medium text-gray-500">
                      Campanha
                    </label>
                    <select
                      id="campanha_id"
                      name="campanha_id"
                      defaultValue={acao?.campanha_id ?? ""}
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
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={acao ? "Salvar alterações" : "Criar ação"} />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>

        {acao && (
          <div className="flex shrink-0 flex-wrap items-start gap-4 border-t border-black/5 bg-white/60 px-5 py-3">
            <DangerBloco
              acao={arquivarAcaoOrganica}
              palavra="ARQUIVAR"
              rotulo="Arquivar"
              descricao="A ação sai da listagem; os dados são mantidos."
              tone="argila"
              acaoId={acao.id}
              onDone={close}
            />
            <DangerBloco
              acao={excluirAcaoOrganica}
              palavra="EXCLUIR"
              rotulo="Excluir"
              descricao="Remove a ação permanentemente."
              tone="red"
              acaoId={acao.id}
              onDone={close}
            />
          </div>
        )}
      </div>
    </div>
  );
}
