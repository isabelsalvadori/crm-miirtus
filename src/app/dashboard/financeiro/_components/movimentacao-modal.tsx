"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { createMovimentacao, updateMovimentacao, type FormState } from "../actions";
import type { CategoriaLite, MovimentacaoFull, OptionLite } from "../types";
import { DangerActions } from "./danger-actions";
import { MovimentacaoFormFields } from "./movimentacao-form-fields";
import { useMergeHref } from "./use-merge-href";

const initialState: FormState = {};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
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

type Props = {
  tipo: "receita" | "despesa";
  mov: MovimentacaoFull | null;
  categoriasReceita: CategoriaLite[];
  categoriasDespesa: CategoriaLite[];
  produtos: OptionLite[];
  projetos: OptionLite[];
};

export function MovimentacaoModal({
  tipo,
  mov,
  categoriasReceita,
  categoriasDespesa,
  produtos,
  projetos,
}: Props) {
  const router = useRouter();
  const mergeHref = useMergeHref();
  const closeHref = mergeHref({ nova: null, mov: null, ok: null });

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function close() {
    setClosing(true);
    setTimeout(() => router.push(closeHref, { scroll: false }), 160);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeHref]);

  const action = useMemo(
    () => (mov ? updateMovimentacao.bind(null, mov.id) : createMovimentacao),
    [mov],
  );
  const [state, formAction] = useFormState(action, initialState);

  const categorias = tipo === "despesa" ? categoriasDespesa : categoriasReceita;
  const show = mounted && !closing;
  const titulo = mov
    ? `Editar ${tipo === "despesa" ? "despesa" : "receita"}`
    : `Nova ${tipo === "despesa" ? "despesa" : "receita"}`;

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
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col rounded-xl bg-white shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <form action={formAction} className="space-y-4" noValidate>
            <input type="hidden" name="redirect_to" value={mergeHref({ nova: null, mov: null, ok: null })} />
            {state.error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {state.error}
              </p>
            )}

            <MovimentacaoFormFields
              tipo={tipo}
              mov={mov}
              categorias={categorias}
              produtos={produtos}
              projetos={projetos}
              fieldErrors={state.fieldErrors}
            />

            <div className="flex items-center gap-3 border-t border-black/5 pt-4">
              <SubmitButton label={mov ? "Salvar alterações" : "Criar"} />
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>

          {mov && (
            <div className="mt-4">
              <DangerActions movId={mov.id} redirectTo={closeHref} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
