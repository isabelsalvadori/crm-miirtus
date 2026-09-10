"use client";

import { useFormState } from "react-dom";
import { criarIdeia, type FormState } from "@/app/dashboard/ideias/actions";
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

export function QuickIdeiaModal({ onClose, onSuccess }: QuickModalProps) {
  const { show, close } = useQuickModal(onClose);
  const [state, formAction] = useFormState(criarIdeia, initialState);
  useOnSaved(state.ok, onSuccess, close);

  return (
    <QuickModalShell titulo="Nova ideia" show={show} onClose={close}>
      <form action={formAction} className="space-y-4 p-5" noValidate>
        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}
        <input type="hidden" name="status" value="caixa_de_entrada" />

        <div>
          <label htmlFor="q-ideia-titulo" className={labelClass}>
            Título <span className="text-[#B97059]">*</span>
          </label>
          <input
            id="q-ideia-titulo"
            name="titulo"
            type="text"
            required
            maxLength={200}
            autoFocus
            className={fieldClass}
            placeholder="O que você teve de ideia?"
          />
          {state.fieldErrors?.titulo && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.titulo}</p>
          )}
        </div>

        <div>
          <label htmlFor="q-ideia-descricao" className={labelClass}>
            Descrição
          </label>
          <textarea
            id="q-ideia-descricao"
            name="descricao"
            rows={4}
            className={fieldClass}
            placeholder="Opcional"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton label="Salvar ideia" />
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
