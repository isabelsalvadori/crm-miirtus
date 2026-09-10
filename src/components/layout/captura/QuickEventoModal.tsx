"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { criarEvento, type FormState } from "@/app/dashboard/eventos/actions";
import { EVENTO_TIPO_OPTIONS } from "@/app/dashboard/eventos/constants";
import {
  type QuickModalProps,
  QuickModalShell,
  SubmitButton,
  fieldClass,
  labelClass,
  useOnSaved,
  useQuickModal,
} from "./shared";

const initialState: FormState = {};

export function QuickEventoModal({ onClose, onSuccess }: QuickModalProps) {
  const { show, close } = useQuickModal(onClose);
  const [state, formAction] = useFormState(criarEvento, initialState);
  const [data, setData] = useState("");
  useOnSaved(state.ok, onSuccess, close);

  return (
    <QuickModalShell titulo="Novo evento" show={show} onClose={close}>
      <form action={formAction} className="space-y-4 p-5" noValidate>
        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}
        {/* Com data, o evento vira "único" e ganha uma edição inicial. */}
        {data && <input type="hidden" name="tipo_formato" value="unico" />}

        <div>
          <label htmlFor="q-evento-nome" className={labelClass}>
            Título <span className="text-[#B97059]">*</span>
          </label>
          <input
            id="q-evento-nome"
            name="nome"
            type="text"
            required
            maxLength={200}
            autoFocus
            className={fieldClass}
            placeholder="Nome do evento"
          />
          {state.fieldErrors?.nome && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nome}</p>
          )}
        </div>

        <div>
          <label htmlFor="q-evento-tipo" className={labelClass}>
            Tipo
          </label>
          <select
            id="q-evento-tipo"
            name="tipo"
            defaultValue="outro"
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
          <label htmlFor="q-evento-data" className={labelClass}>
            Data
          </label>
          <input
            id="q-evento-data"
            name="data_inicio"
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton label="Salvar evento" />
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
          >
            Cancelar
          </button>
        </div>
      </form>
    </QuickModalShell>
  );
}
