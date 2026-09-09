"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { arquivarCategoria, createCategoria, updateCategoria, type FormState } from "../actions";
import type { CategoriaItem } from "../types";

const initialState: FormState = {};

const fieldClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

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
      className="inline-flex items-center gap-2 rounded-lg bg-[#24483F] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner />}
      {pending ? "Salvando..." : label}
    </button>
  );
}

function NovaCategoriaForm({ tipo }: { tipo: "receita" | "despesa" }) {
  const [state, formAction] = useFormState(createCategoria, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="tipo" value={tipo} />
      <div>
        <input
          name="nome"
          type="text"
          placeholder="Nova categoria"
          required
          maxLength={120}
          className={fieldClass}
        />
        {state.fieldErrors?.nome && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nome}</p>
        )}
      </div>
      <input
        name="cor"
        type="color"
        defaultValue="#6B7280"
        className="h-9 w-12 rounded-lg border border-black/10 bg-white p-1"
        aria-label="Cor da categoria"
      />
      <SubmitButton label="Adicionar" />
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

function CategoriaRow({ categoria }: { categoria: CategoriaItem }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const action = updateCategoria.bind(null, categoria.id);
  const [state, formAction] = useFormState(action, initialState);

  if (editing) {
    return (
      <form action={formAction} className="flex flex-wrap items-start gap-2 rounded-lg bg-black/[0.02] p-2">
        <input type="hidden" name="tipo" value={categoria.tipo ?? "receita"} />
        <div>
          <input
            name="nome"
            type="text"
            defaultValue={categoria.nome}
            required
            maxLength={120}
            className={fieldClass}
            autoFocus
          />
          {state.fieldErrors?.nome && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nome}</p>
          )}
        </div>
        <input
          name="cor"
          type="color"
          defaultValue={categoria.cor ?? "#6B7280"}
          className="h-9 w-12 rounded-lg border border-black/10 bg-white p-1"
          aria-label="Cor da categoria"
        />
        <SubmitButton label="Salvar" />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancelar
        </button>
        {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-black/[0.02]">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: categoria.cor ?? "#6B7280" }}
          aria-hidden
        />
        <span className="truncate text-sm text-gray-800">{categoria.nome}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
        >
          Editar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void arquivarCategoria(categoria.id))}
          className="text-xs font-medium text-amber-700 transition-colors hover:text-amber-900 disabled:opacity-40"
        >
          Arquivar
        </button>
      </div>
    </div>
  );
}

function CategoriaColuna({
  titulo,
  tipo,
  categorias,
}: {
  titulo: string;
  tipo: "receita" | "despesa";
  categorias: CategoriaItem[];
}) {
  return (
    <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
      <div className="mt-3 space-y-1">
        {categorias.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">Nenhuma categoria.</p>
        ) : (
          categorias.map((c) => <CategoriaRow key={c.id} categoria={c} />)
        )}
      </div>
      <div className="mt-4 border-t border-black/5 pt-4">
        <NovaCategoriaForm tipo={tipo} />
      </div>
    </section>
  );
}

export function CategoriasManager({
  categoriasReceita,
  categoriasDespesa,
}: {
  categoriasReceita: CategoriaItem[];
  categoriasDespesa: CategoriaItem[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CategoriaColuna titulo="Receita" tipo="receita" categorias={categoriasReceita} />
      <CategoriaColuna titulo="Despesa" tipo="despesa" categorias={categoriasDespesa} />
    </div>
  );
}
