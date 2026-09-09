"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarIdeia,
  excluirIdeia,
  type FormState,
  type Ideia,
} from "../actions";
import { IdeiaModal } from "./IdeiaModal";

const STATUS_OPTIONS = [
  { value: "nova", label: "Nova" },
  { value: "em_analise", label: "Em análise" },
  { value: "aprovada", label: "Aprovada" },
  { value: "implementada", label: "Implementada" },
  { value: "descartada", label: "Descartada" },
] as const;

const NIVEL_OPTIONS = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  nova: "bg-[#E3BD62]/25 text-[#2D3230]",
  em_analise: "bg-[#B97059]/15 text-[#B97059]",
  aprovada: "bg-[#24483F]/10 text-[#24483F]",
  implementada: "bg-[#24483F] text-white",
  descartada: "bg-gray-100 text-gray-400",
};

function labelDe(
  options: readonly { value: string; label: string }[],
  value: string | null,
) {
  return options.find((o) => o.value === value)?.label ?? "—";
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
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

export function IdeiasList({ ideias }: { ideias: Ideia[] }) {
  const [statusFiltro, setStatusFiltro] = useState("");
  const [impactoFiltro, setImpactoFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Ideia | null>(null);

  const filtradas = useMemo(
    () =>
      ideias.filter(
        (ideia) =>
          (!statusFiltro || ideia.status === statusFiltro) &&
          (!impactoFiltro || ideia.impacto === impactoFiltro),
      ),
    [ideias, statusFiltro, impactoFiltro],
  );

  function abrirNova() {
    setEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(ideia: Ideia) {
    setEmEdicao(ideia);
    setModalAberto(true);
  }

  const selectClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

  const temFiltro = Boolean(statusFiltro || impactoFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Ideias</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtradas.length} {filtradas.length === 1 ? "ideia" : "ideias"}
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNova}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Nova ideia
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value)}
          className={selectClass}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={impactoFiltro}
          onChange={(event) => setImpactoFiltro(event.target.value)}
          className={selectClass}
          aria-label="Filtrar por impacto"
        >
          <option value="">Todos os impactos</option>
          {NIVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setStatusFiltro("");
              setImpactoFiltro("");
            }}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-[#24483F]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            {ideias.length === 0
              ? "Nenhuma ideia registrada ainda."
              : "Nenhuma ideia com esses filtros."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {ideias.length === 0
              ? "Capture a primeira ideia para começar."
              : "Ajuste os filtros para ver todas."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((ideia) => (
            <IdeiaCard
              key={ideia.id}
              ideia={ideia}
              onEdit={() => abrirEdicao(ideia)}
            />
          ))}
        </ul>
      )}

      {modalAberto && (
        <IdeiaModal ideia={emEdicao} onClose={() => setModalAberto(false)} />
      )}
    </div>
  );
}

function IdeiaCard({ ideia, onEdit }: { ideia: Ideia; onEdit: () => void }) {
  const [danger, setDanger] = useState<null | "arquivar" | "excluir">(null);

  return (
    <li className="group relative rounded-xl border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="truncate font-semibold text-[#2D3230] transition-colors group-hover:text-[#24483F]">
            {ideia.titulo}
          </h3>
        </button>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-[#F5F1E8] hover:text-[#24483F]"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() =>
              setDanger((d) => (d === "arquivar" ? null : "arquivar"))
            }
            className="rounded-md px-2 py-1 text-xs font-medium text-[#B97059] transition-colors hover:bg-[#B97059]/10"
          >
            Arquivar
          </button>
          <button
            type="button"
            onClick={() => setDanger((d) => (d === "excluir" ? null : "excluir"))}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Excluir
          </button>
        </div>
      </div>

      {ideia.descricao && (
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">
          {ideia.descricao}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_BADGE[ideia.status ?? "nova"] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {labelDe(STATUS_OPTIONS, ideia.status)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-gray-600">
          Impacto:{" "}
          <strong className="font-semibold text-[#2D3230]">
            {labelDe(NIVEL_OPTIONS, ideia.impacto)}
          </strong>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-gray-600">
          Esforço:{" "}
          <strong className="font-semibold text-[#2D3230]">
            {labelDe(NIVEL_OPTIONS, ideia.esforco)}
          </strong>
        </span>
        {ideia.categoria && (
          <span className="inline-flex items-center rounded-full border border-[#E3BD62] bg-[#E3BD62]/10 px-2.5 py-0.5 text-xs text-[#2D3230]">
            {ideia.categoria}
          </span>
        )}
      </div>

      {danger && (
        <InlineDanger
          key={danger}
          modo={danger}
          ideiaId={ideia.id}
          onCancel={() => setDanger(null)}
        />
      )}
    </li>
  );
}

const CONFIRM_WORD = { arquivar: "ARQUIVAR", excluir: "EXCLUIR" } as const;

function DangerSubmit({
  modo,
  disabled,
}: {
  modo: "arquivar" | "excluir";
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const tone =
    modo === "excluir"
      ? "border-red-300 text-red-700 hover:bg-red-50"
      : "border-[#B97059]/40 text-[#B97059] hover:bg-[#B97059]/10";
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {pending && <Spinner />}
      {pending ? "Processando..." : modo === "excluir" ? "Excluir" : "Arquivar"}
    </button>
  );
}

function InlineDanger({
  modo,
  ideiaId,
  onCancel,
}: {
  modo: "arquivar" | "excluir";
  ideiaId: string;
  onCancel: () => void;
}) {
  const action = modo === "arquivar" ? arquivarIdeia : excluirIdeia;
  const [state, formAction] = useFormState<FormState, FormData>(action, {});
  const [texto, setTexto] = useState("");
  const palavra = CONFIRM_WORD[modo];

  return (
    <form
      action={formAction}
      className="mt-3 rounded-lg border border-black/5 bg-[#F5F1E8] p-3"
    >
      <input type="hidden" name="id" value={ideiaId} />
      <p className="text-xs text-gray-500">
        {modo === "arquivar"
          ? "A ideia sai da listagem; os dados são mantidos."
          : "Remove a ideia permanentemente."}
      </p>
      <label className="mt-2 block text-xs text-gray-500">
        Digite{" "}
        <strong className="font-semibold text-[#2D3230]">{palavra}</strong> para
        confirmar
      </label>
      <input
        name="confirmacao"
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-[#2D3230] outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
      />
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      <div className="mt-2 flex items-center gap-3">
        <DangerSubmit modo={modo} disabled={texto !== palavra} />
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
