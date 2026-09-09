"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  MODELO_ACESSO_OPTIONS,
  MODELOS_COM_PRECO,
  STATUS_OPTIONS,
  TIPO_COBRANCA_OPTIONS,
  TIPO_OPTIONS,
  slugify,
} from "../constants";
import type { FormState } from "../actions";

type ProdutoFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  submitLabel?: string;
  defaults?: {
    nome?: string;
    slug?: string;
    tipo?: string;
    status?: string;
    modelo_acesso?: string;
    tipo_cobranca?: string;
    preco?: string;
    descricao?: string;
  };
};

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

export function ProdutoForm({
  action,
  cancelHref,
  submitLabel = "Salvar",
  defaults = {},
}: ProdutoFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  const [nome, setNome] = useState(defaults.nome ?? "");
  const [slug, setSlug] = useState(defaults.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));
  const [modeloAcesso, setModeloAcesso] = useState(defaults.modelo_acesso ?? "");

  const mostrarPreco = MODELOS_COM_PRECO.includes(modeloAcesso);

  function handleNome(value: string) {
    setNome(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
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
          value={nome}
          onChange={(event) => handleNome(event.target.value)}
          className={fieldClass}
        />
        {state.fieldErrors?.nome && (
          <p className={errorClass}>{state.fieldErrors.nome}</p>
        )}
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          onBlur={(event) => setSlug(slugify(event.target.value))}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-gray-400">
          Gerado a partir do nome. Você pode ajustar.
        </p>
        {state.fieldErrors?.slug && (
          <p className={errorClass}>{state.fieldErrors.slug}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className={labelClass}>
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={defaults.tipo ?? ""}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.tipo && (
            <p className={errorClass}>{state.fieldErrors.tipo}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? ""}
            className={fieldClass}
          >
            <option value="">Selecione</option>
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
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="modelo_acesso" className={labelClass}>
            Modelo de acesso
          </label>
          <select
            id="modelo_acesso"
            name="modelo_acesso"
            value={modeloAcesso}
            onChange={(event) => setModeloAcesso(event.target.value)}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {MODELO_ACESSO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.modelo_acesso && (
            <p className={errorClass}>{state.fieldErrors.modelo_acesso}</p>
          )}
        </div>

        {mostrarPreco && (
          <div>
            <label htmlFor="preco" className={labelClass}>
              Preço (R$)
            </label>
            <input
              id="preco"
              name="preco"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={defaults.preco ?? ""}
              className={fieldClass}
            />
            {state.fieldErrors?.preco && (
              <p className={errorClass}>{state.fieldErrors.preco}</p>
            )}
          </div>
        )}
      </div>

      {mostrarPreco && (
        <div className="sm:max-w-xs">
          <label htmlFor="tipo_cobranca" className={labelClass}>
            Tipo de cobrança
          </label>
          <select
            id="tipo_cobranca"
            name="tipo_cobranca"
            defaultValue={defaults.tipo_cobranca ?? ""}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {TIPO_COBRANCA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.tipo_cobranca && (
            <p className={errorClass}>{state.fieldErrors.tipo_cobranca}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="descricao" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          defaultValue={defaults.descricao}
          className={fieldClass}
        />
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
