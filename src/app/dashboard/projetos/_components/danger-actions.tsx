"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { arquivarProjeto, excluirProjeto, type FormState } from "../actions";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-400";

const triggerClass =
  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors";

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function ConfirmSubmit({
  label,
  disabled,
  tone,
}: {
  label: string;
  disabled: boolean;
  tone: "amber" | "red";
}) {
  const { pending } = useFormStatus();
  const toneClass =
    tone === "red"
      ? "border-red-300 text-red-700 hover:bg-red-50"
      : "border-amber-300 text-amber-700 hover:bg-amber-50";
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {pending && <Spinner />}
      {pending ? "Processando..." : label}
    </button>
  );
}

type BlockProps = {
  projetoId: string;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  triggerLabel: string;
  confirmWord: string;
  description: string;
  tone: "amber" | "red";
  fieldId: string;
};

function DangerBlock({
  projetoId,
  action,
  triggerLabel,
  confirmWord,
  description,
  tone,
  fieldId,
}: BlockProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, formAction] = useFormState(action, initialState);

  const toneClass =
    tone === "red"
      ? "border-red-300 text-red-700 hover:bg-red-50"
      : "border-amber-300 text-amber-700 hover:bg-amber-50";

  function toggle() {
    setOpen((prev) => {
      if (prev) setText("");
      return !prev;
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`${triggerClass} ${toneClass}`}
      >
        {triggerLabel}
      </button>

      {open && (
        <form action={formAction} className="mt-2">
          <input type="hidden" name="id" value={projetoId} />
          <p className="text-xs text-gray-400">{description}</p>

          <label htmlFor={fieldId} className="mt-2 block text-xs text-gray-400">
            Digite {confirmWord} para confirmar
          </label>
          <input
            id={fieldId}
            name="confirmacao"
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoComplete="off"
            className={inputClass}
          />

          {state.error && (
            <p className="mt-1 text-xs text-red-600">{state.error}</p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <ConfirmSubmit
              label={triggerLabel}
              tone={tone}
              disabled={text !== confirmWord}
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setText("");
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

export function DangerActions({
  projetoId,
  arquivado,
}: {
  projetoId: string;
  arquivado: boolean;
}) {
  return (
    <section className="border-t border-gray-200 pt-6">
      <h3 className="text-xs text-gray-400">Ações</h3>
      <div className="mt-4 grid items-start gap-6 sm:grid-cols-2">
        {!arquivado && (
          <DangerBlock
            projetoId={projetoId}
            action={arquivarProjeto}
            triggerLabel="Arquivar"
            confirmWord="ARQUIVAR"
            description="Some da listagem; os dados são mantidos."
            tone="amber"
            fieldId="confirmacao-arquivar"
          />
        )}
        <DangerBlock
          projetoId={projetoId}
          action={excluirProjeto}
          triggerLabel="Excluir"
          confirmWord="EXCLUIR"
          description="Remove o projeto e suas fases; tarefas vinculadas ficam sem projeto."
          tone="red"
          fieldId="confirmacao-excluir"
        />
      </div>
    </section>
  );
}
