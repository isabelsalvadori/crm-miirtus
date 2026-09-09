"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarCliente,
  excluirCliente,
  type FormState,
} from "../actions";

const initialState: FormState = {};

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
      ? "bg-red-600 hover:bg-red-700"
      : "bg-amber-600 hover:bg-amber-700";

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {pending ? "Processando..." : label}
    </button>
  );
}

function ArquivarCard({ clienteId }: { clienteId: string }) {
  const [state, formAction] = useFormState(arquivarCliente, initialState);
  const [text, setText] = useState("");

  return (
    <form
      action={formAction}
      className="rounded-xl border border-amber-200 bg-amber-50/60 p-5"
    >
      <h3 className="text-sm font-semibold text-amber-900">Arquivar cliente</h3>
      <p className="mt-1 text-xs text-amber-800">
        O cliente deixa de aparecer na listagem, mas os dados são mantidos.
      </p>

      <input type="hidden" name="id" value={clienteId} />

      <label
        htmlFor="confirmacao-arquivar"
        className="mt-3 block text-xs font-medium text-amber-900"
      >
        Digite <strong>ARQUIVAR</strong> para confirmar
      </label>
      <input
        id="confirmacao-arquivar"
        name="confirmacao"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
      />

      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}

      <ConfirmSubmit
        label="Arquivar"
        tone="amber"
        disabled={text !== "ARQUIVAR"}
      />
    </form>
  );
}

function ExcluirCard({ clienteId }: { clienteId: string }) {
  const [state, formAction] = useFormState(excluirCliente, initialState);
  const [text, setText] = useState("");

  return (
    <form
      action={formAction}
      className="rounded-xl border border-red-200 bg-red-50/60 p-5"
    >
      <h3 className="text-sm font-semibold text-red-900">Excluir cliente</h3>
      <p className="mt-1 text-xs text-red-800">
        Ação permanente. Todos os dados deste cliente serão removidos.
      </p>

      <input type="hidden" name="id" value={clienteId} />

      <label
        htmlFor="confirmacao-excluir"
        className="mt-3 block text-xs font-medium text-red-900"
      >
        Digite <strong>EXCLUIR</strong> para confirmar
      </label>
      <input
        id="confirmacao-excluir"
        name="confirmacao"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />

      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}

      <ConfirmSubmit
        label="Excluir permanentemente"
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
    <div className="grid gap-4 sm:grid-cols-2">
      {!arquivado && <ArquivarCard clienteId={clienteId} />}
      <ExcluirCard clienteId={clienteId} />
    </div>
  );
}
