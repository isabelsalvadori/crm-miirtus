"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  createTarefa,
  toggleSubtarefa,
  updateTarefa,
  type FormState,
} from "../actions";
import { formatPrazo, isVencido, prioridadeLabel } from "../constants";
import type {
  OptionLite,
  SubtarefaItem,
  TagLite,
  TarefaFull,
} from "../types";
import { PriorityFlag, StatusBadge, TagBadge } from "./badges";
import { DangerActions } from "./danger-actions";
import { TarefaFormFields } from "./tarefa-form-fields";
import { useMergeHref } from "./use-merge-href";

const initialState: FormState = {};

type Props = {
  mode: "create" | "view";
  tarefa: TarefaFull | null;
  subtarefas: SubtarefaItem[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  tags: TagLite[];
  agendaEnabled: boolean;
};

export function TarefaModal({
  mode,
  tarefa,
  subtarefas,
  produtos,
  projetos,
  tags,
  agendaEnabled,
}: Props) {
  const router = useRouter();
  const mergeHref = useMergeHref();
  const closeHref = mergeHref({ tarefa: null, nova: null, ok: null });

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(mode === "create");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function close() {
    setClosing(true);
    setTimeout(() => router.push(closeHref, { scroll: false }), 180);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeHref]);

  const show = mounted && !closing;

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-xl transition-transform duration-200 ${
          show ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-black/5 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {mode === "create"
              ? "Nova tarefa"
              : editing
                ? "Editar tarefa"
                : "Tarefa"}
          </h2>
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
          {editing ? (
            <EditForm
              tarefa={tarefa}
              subtarefas={subtarefas}
              produtos={produtos}
              projetos={projetos}
              tags={tags}
              agendaEnabled={agendaEnabled}
              onCancel={
                mode === "create" ? close : () => setEditing(false)
              }
            />
          ) : (
            tarefa && (
              <ViewTarefa
                tarefa={tarefa}
                subtarefas={subtarefas}
                onEdit={() => setEditing(true)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#24483F] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

function EditForm({
  tarefa,
  subtarefas,
  produtos,
  projetos,
  tags,
  agendaEnabled,
  onCancel,
}: {
  tarefa: TarefaFull | null;
  subtarefas: SubtarefaItem[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  tags: TagLite[];
  agendaEnabled: boolean;
  onCancel: () => void;
}) {
  const action = useMemo(
    () => (tarefa ? updateTarefa.bind(null, tarefa.id) : createTarefa),
    [tarefa],
  );
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {state.error}
        </p>
      )}

      <TarefaFormFields
        tarefa={tarefa}
        subtarefas={subtarefas}
        produtos={produtos}
        projetos={projetos}
        tags={tags}
        agendaEnabled={agendaEnabled}
        fieldErrors={state.fieldErrors}
      />

      <div className="flex items-center gap-3 border-t border-black/5 pt-4">
        <SubmitButton label={tarefa ? "Salvar alterações" : "Criar tarefa"} />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ViewTarefa({
  tarefa,
  subtarefas,
  onEdit,
}: {
  tarefa: TarefaFull;
  subtarefas: SubtarefaItem[];
  onEdit: () => void;
}) {
  const vencido = isVencido(tarefa.data_prazo, tarefa.status);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{tarefa.titulo}</h3>
        {tarefa.descricao && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
            {tarefa.descricao}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={tarefa.status} />
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-gray-600">
          <PriorityFlag value={tarefa.prioridade} />
          {prioridadeLabel(tarefa.prioridade)}
        </span>
        {tarefa.tags.map((tag) => (
          <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} />
        ))}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Prazo</dt>
          <dd
            className={`mt-0.5 text-sm ${
              vencido ? "font-semibold text-red-600" : "text-gray-800"
            }`}
          >
            {tarefa.data_prazo ? formatPrazo(tarefa.data_prazo) : "—"}
            {vencido && " (vencido)"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Contexto
          </dt>
          <dd className="mt-0.5 text-sm text-gray-800">
            {tarefa.contexto
              ? `${
                  tarefa.contexto.tipo === "produto" ? "Produto" : "Projeto"
                }: ${tarefa.contexto.nome}`
              : "Sem vínculo"}
          </dd>
        </div>
      </dl>

      {tarefa.observacoes && (
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Observações
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
            {tarefa.observacoes}
          </dd>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Subtarefas
        </p>
        {subtarefas.length === 0 ? (
          <p className="mt-1 text-sm text-gray-400">Nenhuma subtarefa.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {subtarefas.map((sub) => (
              <li key={sub.id}>
                <SubtarefaCheckbox sub={sub} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-black/5 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Editar
        </button>
      </div>

      <DangerActions tarefaId={tarefa.id} />
    </div>
  );
}

function SubtarefaCheckbox({ sub }: { sub: SubtarefaItem }) {
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState(sub.status === "concluida");

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.checked;
          setChecked(next);
          startTransition(() => {
            void toggleSubtarefa(sub.id, next);
          });
        }}
        className="h-4 w-4 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
      />
      <span className={checked ? "text-gray-400 line-through" : "text-gray-700"}>
        {sub.titulo}
      </span>
    </label>
  );
}
