"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  arquivarNota,
  excluirNota,
  type FormState,
  type Nota,
  type VinculoTipo,
} from "../actions";
import { NoteModal } from "./NoteModal";
import { QuickNoteModal } from "./QuickNoteModal";

export type VinculoOpcao = { id: string; label: string };
export type VinculoOpcoes = Record<VinculoTipo, VinculoOpcao[]>;

const VINCULO_LABEL: Record<VinculoTipo, string> = {
  produto: "Produto",
  projeto: "Projeto",
  evento: "Evento",
  ideia: "Ideia",
  campanha: "Campanha",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function tituloExibido(nota: Nota) {
  const titulo = nota.titulo?.trim();
  if (titulo) return titulo;
  const corpo = (nota.conteudo ?? "").trim().replace(/\s+/g, " ");
  if (!corpo) return "(sem conteúdo)";
  return corpo.length > 60 ? `${corpo.slice(0, 60)}…` : corpo;
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

export function NotesList({
  notas,
  vinculos,
}: {
  notas: Nota[];
  vinculos: VinculoOpcoes;
}) {
  const [busca, setBusca] = useState("");
  const [quickAberto, setQuickAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Nota | null>(null);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter(
      (nota) =>
        (nota.conteudo ?? "").toLowerCase().includes(q) ||
        (nota.titulo ?? "").toLowerCase().includes(q),
    );
  }, [notas, busca]);

  const inputClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Notas</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtradas.length} {filtradas.length === 1 ? "nota" : "notas"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setQuickAberto(true)}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Nova nota
        </button>
      </div>

      <input
        type="search"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por conteúdo"
        aria-label="Buscar notas"
        className={`${inputClass} w-full sm:w-72`}
      />

      {filtradas.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            {notas.length === 0
              ? "Nenhuma nota ainda."
              : "Nenhuma nota encontrada."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {notas.length === 0
              ? "Capture a primeira ideia, lembrete ou anotação."
              : "Tente outro termo de busca."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((nota) => (
            <NoteCard
              key={nota.id}
              nota={nota}
              onEdit={() => setEmEdicao(nota)}
            />
          ))}
        </ul>
      )}

      {quickAberto && <QuickNoteModal onClose={() => setQuickAberto(false)} />}
      {emEdicao && (
        <NoteModal
          nota={emEdicao}
          vinculos={vinculos}
          onClose={() => setEmEdicao(null)}
        />
      )}
    </div>
  );
}

function NoteCard({ nota, onEdit }: { nota: Nota; onEdit: () => void }) {
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
            {tituloExibido(nota)}
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

      {nota.titulo?.trim() && (nota.conteudo ?? "").trim() && (
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">
          {nota.conteudo}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>{formatarData(nota.created_at)}</span>
        {nota.entidade_tipo && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E3BD62] bg-[#E3BD62]/10 px-2.5 py-0.5 text-[#2D3230]">
            {VINCULO_LABEL[nota.entidade_tipo]}
            {nota.entidade_label ? `: ${nota.entidade_label}` : ""}
          </span>
        )}
      </div>

      {danger && (
        <InlineDanger
          key={danger}
          modo={danger}
          notaId={nota.id}
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
  notaId,
  onCancel,
}: {
  modo: "arquivar" | "excluir";
  notaId: string;
  onCancel: () => void;
}) {
  const action = modo === "arquivar" ? arquivarNota : excluirNota;
  const [state, formAction] = useFormState<FormState, FormData>(action, {});
  const [texto, setTexto] = useState("");
  const palavra = CONFIRM_WORD[modo];

  return (
    <form
      action={formAction}
      className="mt-3 rounded-lg border border-black/5 bg-[#F5F1E8] p-3"
    >
      <input type="hidden" name="id" value={notaId} />
      <p className="text-xs text-gray-500">
        {modo === "arquivar"
          ? "A nota sai da listagem; os dados são mantidos."
          : "Remove a nota permanentemente."}
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
