"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  criarDocumentoEvento,
  removerDocumentoEvento,
  type FormState,
} from "../actions";
import {
  DOCUMENTO_TIPO_ICONE,
  DOCUMENTO_TIPO_OPTIONS,
  documentoTipoLabel,
} from "../constants";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

export type DocumentoEvento = {
  id: string;
  titulo: string;
  tipo: string | null;
  descricao: string | null;
  url: string | null;
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function AdicionarSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner />}
      {pending ? "Salvando..." : "Adicionar"}
    </button>
  );
}

function RemoverSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Removendo..." : "Confirmar"}
    </button>
  );
}

function DocumentoRow({
  doc,
  eventoId,
}: {
  doc: DocumentoEvento;
  eventoId: string;
}) {
  const [state, formAction] = useFormState(removerDocumentoEvento, initialState);
  const [confirmando, setConfirmando] = useState(false);
  const icone = DOCUMENTO_TIPO_ICONE[doc.tipo ?? "outro"] ?? "📎";

  return (
    <li className="flex items-start gap-3 rounded-xl border border-[#2D3230]/10 bg-white p-4 shadow-sm">
      <span aria-hidden className="text-lg leading-none">
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        {doc.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-semibold text-[#24483F] hover:underline"
          >
            {doc.titulo}
          </a>
        ) : (
          <span className="block truncate text-sm font-semibold text-[#2D3230]">
            {doc.titulo}
          </span>
        )}
        <p className="mt-0.5 text-xs text-gray-400">
          {documentoTipoLabel(doc.tipo)}
        </p>
        {doc.descricao && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
            {doc.descricao}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {confirmando ? (
          <form action={formAction} className="flex items-center gap-1.5">
            <input type="hidden" name="id" value={doc.id} />
            <input type="hidden" name="evento_id" value={eventoId} />
            <RemoverSubmit />
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Remover
          </button>
        )}
        {state.error && (
          <p className="mt-1 text-xs text-red-600">{state.error}</p>
        )}
      </div>
    </li>
  );
}

export function EventoDocumentos({
  eventoId,
  documentos,
}: {
  eventoId: string;
  documentos: DocumentoEvento[];
}) {
  const [aberto, setAberto] = useState(false);
  const action = useMemo(
    () => criarDocumentoEvento.bind(null, eventoId),
    [eventoId],
  );
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state.ok) setAberto(false);
  }, [state]);

  return (
    <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
        <h3 className="text-sm font-semibold text-[#24483F]">
          Documentos ({documentos.length})
        </h3>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
        >
          + Adicionar documento
        </button>
      </div>

      {aberto && (
        <form
          action={formAction}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-[#F5F1E8]/40 p-4"
          noValidate
        >
          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="doc-titulo" className={labelClass}>
                Título <span className="text-[#B97059]">*</span>
              </label>
              <input
                id="doc-titulo"
                name="titulo"
                type="text"
                required
                maxLength={200}
                className={fieldClass}
              />
              {state.fieldErrors?.titulo && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.titulo}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="doc-url" className={labelClass}>
                URL ou link <span className="text-[#B97059]">*</span>
              </label>
              <input
                id="doc-url"
                name="url"
                type="text"
                required
                placeholder="https://…"
                className={fieldClass}
              />
              {state.fieldErrors?.url && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.url}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="doc-tipo" className={labelClass}>
                Tipo
              </label>
              <select
                id="doc-tipo"
                name="tipo"
                defaultValue="link"
                className={fieldClass}
              >
                {DOCUMENTO_TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="doc-descricao" className={labelClass}>
                Descrição
              </label>
              <textarea
                id="doc-descricao"
                name="descricao"
                rows={3}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdicionarSubmit />
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {documentos.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">Nenhum documento vinculado.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {documentos.map((doc) => (
            <DocumentoRow key={doc.id} doc={doc} eventoId={eventoId} />
          ))}
        </ul>
      )}
    </section>
  );
}
