"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS, toDateInputValue } from "../constants";
import type { FormState } from "../actions";
import type { OptionLite } from "../types";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-gray-700";
const errorClass = "mt-1 text-xs text-red-600";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#24483F] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

type ProjetoFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  submitLabel?: string;
  produtosDisponiveis: OptionLite[];
  defaults?: {
    nome?: string;
    descricao?: string;
    status?: string;
    prioridade?: string;
    data_inicio?: string;
    data_fim_prevista?: string;
    produtoIds?: string[];
  };
};

export function ProjetoForm({
  action,
  cancelHref,
  submitLabel = "Salvar",
  produtosDisponiveis,
  defaults = {},
}: ProjetoFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const [produtoIds, setProdutoIds] = useState<string[]>(defaults.produtoIds ?? []);
  const [dataFimPrevista, setDataFimPrevista] = useState(
    toDateInputValue(defaults.data_fim_prevista),
  );
  // Em edição, um prazo já nulo nasce marcado como indefinido; em criação, começa desmarcado.
  const [prazoIndefinido, setPrazoIndefinido] = useState(
    defaults.data_fim_prevista !== undefined && !defaults.data_fim_prevista,
  );

  function toggleProduto(id: string) {
    setProdutoIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input
        type="hidden"
        name="produtos_ids_json"
        value={JSON.stringify(produtoIds)}
      />

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="nome" className={labelClass}>
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={200}
          defaultValue={defaults.nome ?? ""}
          className={fieldClass}
        />
        {state.fieldErrors?.nome && (
          <p className={errorClass}>{state.fieldErrors.nome}</p>
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
          defaultValue={defaults.descricao ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status || "planejamento"}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.status && (
            <p className={errorClass}>{state.fieldErrors.status}</p>
          )}
        </div>

        <div>
          <label htmlFor="prioridade" className={labelClass}>
            Prioridade
          </label>
          <select
            id="prioridade"
            name="prioridade"
            defaultValue={defaults.prioridade || "normal"}
            className={fieldClass}
          >
            {PRIORIDADE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.prioridade && (
            <p className={errorClass}>{state.fieldErrors.prioridade}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="data_inicio" className={labelClass}>
            Data início
          </label>
          <input
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={toDateInputValue(defaults.data_inicio)}
            className={fieldClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="data_fim_prevista" className={labelClass}>
              Prazo
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <input
                type="checkbox"
                checked={prazoIndefinido}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setPrazoIndefinido(checked);
                  if (checked) setDataFimPrevista("");
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
              />
              Prazo indefinido
            </label>
          </div>
          <input
            id="data_fim_prevista"
            name="data_fim_prevista"
            type="date"
            value={dataFimPrevista}
            onChange={(event) => setDataFimPrevista(event.target.value)}
            disabled={prazoIndefinido}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Produtos relacionados</span>
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-black/10 p-3">
          {produtosDisponiveis.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum produto cadastrado.</p>
          ) : (
            <div className="space-y-1.5">
              {produtosDisponiveis.map((produto) => (
                <label
                  key={produto.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={produtoIds.includes(produto.id)}
                    onChange={() => toggleProduto(produto.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
                  />
                  {produto.nome}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href={cancelHref}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
