"use client";

import { useFormState } from "react-dom";
import {
  criarConteudo,
  type FormState,
} from "@/app/dashboard/marketing/conteudo/actions";
import {
  CONTEUDO_CANAL_OPTIONS,
  CONTEUDO_TIPO_OPTIONS,
} from "@/app/dashboard/marketing/constants";
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

export function QuickConteudoModal({ onClose, onSuccess }: QuickModalProps) {
  const { show, close } = useQuickModal(onClose);
  const [state, formAction] = useFormState(criarConteudo, initialState);
  useOnSaved(state.ok, onSuccess, close);

  return (
    <QuickModalShell titulo="Novo conteúdo" show={show} onClose={close}>
      <form action={formAction} className="space-y-4 p-5" noValidate>
        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}
        <input type="hidden" name="status" value="backlog" />

        <div>
          <label htmlFor="q-conteudo-titulo" className={labelClass}>
            Título <span className="text-[#B97059]">*</span>
          </label>
          <input
            id="q-conteudo-titulo"
            name="titulo"
            type="text"
            required
            maxLength={200}
            autoFocus
            className={fieldClass}
            placeholder="Ideia de conteúdo"
          />
          {state.fieldErrors?.titulo && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.titulo}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="q-conteudo-canal" className={labelClass}>
              Canal
            </label>
            <select
              id="q-conteudo-canal"
              name="canal"
              defaultValue=""
              className={fieldClass}
            >
              <option value="">Sem canal</option>
              {CONTEUDO_CANAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="q-conteudo-tipo" className={labelClass}>
              Tipo
            </label>
            <select
              id="q-conteudo-tipo"
              name="tipo"
              defaultValue=""
              className={fieldClass}
            >
              <option value="">Sem tipo</option>
              {CONTEUDO_TIPO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton label="Salvar conteúdo" />
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
