"use client";

import { useFormState } from "react-dom";
import {
  criarMovimentacao,
  type FormState,
} from "@/app/dashboard/financeiro/actions";
import { MoedaInput } from "@/app/dashboard/financeiro/_components/moeda-input";
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

function hojeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function QuickMovimentacaoModal({
  tipo,
  onClose,
  onSuccess,
}: QuickModalProps & { tipo: "receita" | "despesa" }) {
  const { show, close } = useQuickModal(onClose);
  const [state, formAction] = useFormState(criarMovimentacao, initialState);
  useOnSaved(state.ok, onSuccess, close);

  const isReceita = tipo === "receita";

  return (
    <QuickModalShell
      titulo={isReceita ? "Nova receita" : "Nova despesa"}
      show={show}
      onClose={close}
    >
      <form action={formAction} className="space-y-4 p-5" noValidate>
        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}
        <input type="hidden" name="tipo" value={tipo} />

        <div>
          <label htmlFor="q-mov-descricao" className={labelClass}>
            Descrição <span className="text-[#B97059]">*</span>
          </label>
          <input
            id="q-mov-descricao"
            name="descricao"
            type="text"
            required
            maxLength={300}
            autoFocus
            className={fieldClass}
            placeholder={isReceita ? "De onde vem?" : "Com o que foi?"}
          />
          {state.fieldErrors?.descricao && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.descricao}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="q-mov-valor" className={labelClass}>
              Valor <span className="text-[#B97059]">*</span>
            </label>
            <MoedaInput
              id="q-mov-valor"
              name="valor"
              required
              className={fieldClass}
            />
            {state.fieldErrors?.valor && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.valor}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="q-mov-data" className={labelClass}>
              Data
            </label>
            <input
              id="q-mov-data"
              name="data"
              type="date"
              defaultValue={hojeLocal()}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="q-mov-categoria" className={labelClass}>
            Categoria
          </label>
          <input
            id="q-mov-categoria"
            name="categoria"
            type="text"
            maxLength={80}
            className={fieldClass}
            placeholder="Ex.: Mentorias, Ferramentas"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton label={isReceita ? "Salvar receita" : "Salvar despesa"} />
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
