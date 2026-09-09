"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ORIGEM_OPTIONS, STATUS_OPTIONS } from "../constants";
import type { FormState } from "../actions";

type ClienteFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  submitLabel?: string;
  defaults?: {
    nome?: string;
    email?: string;
    telefone?: string;
    origem?: string;
    tipo?: string;
    observacoes?: string;
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

export function ClienteForm({
  action,
  cancelHref,
  submitLabel = "Salvar",
  defaults = {},
}: ClienteFormProps) {
  const [state, formAction] = useFormState(action, initialState);

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
          defaultValue={defaults.nome}
          className={fieldClass}
        />
        {state.fieldErrors?.nome && (
          <p className={errorClass}>{state.fieldErrors.nome}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaults.email}
          className={fieldClass}
        />
        {state.fieldErrors?.email && (
          <p className={errorClass}>{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="telefone" className={labelClass}>
          Telefone
        </label>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          defaultValue={defaults.telefone}
          className={fieldClass}
        />
        {state.fieldErrors?.telefone && (
          <p className={errorClass}>{state.fieldErrors.telefone}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="origem" className={labelClass}>
            Origem
          </label>
          <select
            id="origem"
            name="origem"
            defaultValue={defaults.origem ?? ""}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {ORIGEM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.origem && (
            <p className={errorClass}>{state.fieldErrors.origem}</p>
          )}
        </div>

        <div>
          <label htmlFor="tipo" className={labelClass}>
            Status
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={defaults.tipo ?? ""}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.tipo && (
            <p className={errorClass}>{state.fieldErrors.tipo}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="observacoes" className={labelClass}>
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={4}
          defaultValue={defaults.observacoes}
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
