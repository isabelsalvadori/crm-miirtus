"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarCliente,
  excluirCliente,
  type FormState,
} from "../actions";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-400";

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
      className={`mt-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {pending ? "Processando..." : label}
    </button>
  );
}

function ArquivarBlock({ clienteId }: { clienteId: string }) {
  const [state, formAction] = useFormState(arquivarCliente, initialState);
  const [text, setText] = useState("");

  return (
    <form action={formAction}>
      <p className="text-sm font-medium text-gray-600">Arquivar</p>
      <p className="mt-0.5 text-xs text-gray-400">
        Some da listagem; os dados são mantidos.
      </p>

      <input type="hidden" name="id" value={clienteId} />

      <label
        htmlFor="confirmacao-arquivar"
        className="mt-2 block text-xs text-gray-400"
      >
        Digite ARQUIVAR para confirmar
      </label>
      <input
        id="confirmacao-arquivar"
        name="confirmacao"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        className={inputClass}
      />

      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}

      <ConfirmSubmit
        label="Arquivar"
        tone="amber"
        disabled={text !== "ARQUIVAR"}
      />
    </form>
  );
}

function ExcluirBlock({ clienteId }: { clienteId: string }) {
  const [state, formAction] = useFormState(excluirCliente, initialState);
  const [text, setText] = useState("");

  return (
    <form action={formAction}>
      <p className="text-sm font-medium text-gray-600">Excluir</p>
      <p className="mt-0.5 text-xs text-gray-400">
        Remoção permanente deste cliente.
      </p>

      <input type="hidden" name="id" value={clienteId} />

      <label
        htmlFor="confirmacao-excluir"
        className="mt-2 block text-xs text-gray-400"
      >
        Digite EXCLUIR para confirmar
      </label>
      <input
        id="confirmacao-excluir"
        name="confirmacao"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        className={inputClass}
      />

      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}

      <ConfirmSubmit
        label="Excluir"
        tone="red"
        disabled={text !== "EXCLUIR"}
      />
    </form>
  );
}

export function DangerActions({
  clienteId,
  arquivado,
}: {
  clienteId: string;
  arquivado: boolean;
}) {
  return (
    <section className="border-t border-gray-200 pt-6">
      <h3 className="text-xs text-gray-400">Ações</h3>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {!arquivado && <ArquivarBlock clienteId={clienteId} />}
        <ExcluirBlock clienteId={clienteId} />
      </div>
    </section>
  );
}
