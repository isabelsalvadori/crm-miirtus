"use client";

import { useFormState } from "react-dom";
import {
  criarDocumento,
  type FormState,
} from "@/app/dashboard/biblioteca/actions";
import { ACERVO_TIPO_OPTIONS } from "@/app/dashboard/biblioteca/constants";
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
const criarNoAcervo = criarDocumento.bind(null, "biblioteca_acervo");

export function QuickLinkModal({ onClose, onSuccess }: QuickModalProps) {
  const { show, close } = useQuickModal(onClose);
  const [state, formAction] = useFormState(criarNoAcervo, initialState);
  useOnSaved(state.ok, onSuccess, close);

  return (
    <QuickModalShell titulo="Novo link no Acervo" show={show} onClose={close}>
      <form action={formAction} className="space-y-4 p-5" noValidate>
        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}
        <input type="hidden" name="url_obrigatoria" value="1" />

        <div>
          <label htmlFor="q-link-url" className={labelClass}>
            URL <span className="text-[#B97059]">*</span>
          </label>
          <input
            id="q-link-url"
            name="url"
            type="url"
            required
            autoFocus
            className={fieldClass}
            placeholder="https://..."
          />
          {state.fieldErrors?.url && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.url}</p>
          )}
        </div>

        <div>
          <label htmlFor="q-link-titulo" className={labelClass}>
            Título <span className="text-[#B97059]">*</span>
          </label>
          <input
            id="q-link-titulo"
            name="titulo"
            type="text"
            required
            maxLength={200}
            className={fieldClass}
            placeholder="Como identificar este link"
          />
          {state.fieldErrors?.titulo && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.titulo}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="q-link-tipo" className={labelClass}>
            Tipo
          </label>
          <select
            id="q-link-tipo"
            name="tipo"
            defaultValue="link"
            className={fieldClass}
          >
            {ACERVO_TIPO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton label="Salvar no Acervo" />
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
