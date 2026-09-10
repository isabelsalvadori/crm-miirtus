"use client";

import { useMemo, useState } from "react";
import {
  PRODUTO_TIPO_BADGE,
  PRODUTO_TIPO_OPTIONS,
  dominioDe,
  produtoTipoLabel,
  truncar,
} from "../../constants";
import type { Catalogos, DocumentoItem } from "../../types";
import { DocumentoModal } from "./DocumentoModal";

const inputClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

type ModalState =
  | { modo: "novo" }
  | { modo: "edit"; documento: DocumentoItem }
  | null;

function Card({
  documento,
  produtoNome,
  onOpen,
}: {
  documento: DocumentoItem;
  produtoNome: string | null;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer flex-col rounded-xl border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 font-semibold text-gray-900">
          {documento.titulo}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            PRODUTO_TIPO_BADGE[documento.tipo ?? "outro"] ??
            "bg-black/5 text-gray-600"
          }`}
        >
          {produtoTipoLabel(documento.tipo)}
        </span>
      </div>

      {documento.descricao && (
        <p className="mt-2 text-sm text-gray-500">
          {truncar(documento.descricao, 160)}
        </p>
      )}

      {documento.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {documento.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: t.cor ?? "#e5e7eb", color: "#111827" }}
            >
              {t.nome}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        {produtoNome && <span>Produto: {produtoNome}</span>}
        {documento.url && (
          <a
            href={documento.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[#24483F] hover:underline"
          >
            {dominioDe(documento.url) || "abrir link"} ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function DocumentosList({
  documentos,
  catalogos,
}: {
  documentos: DocumentoItem[];
  catalogos: Catalogos;
}) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const produtoNome = useMemo(
    () => new Map(catalogos.produtos.map((p) => [p.id, p.nome])),
    [catalogos.produtos],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return documentos.filter(
      (d) =>
        (!tipoFiltro || d.tipo === tipoFiltro) &&
        (!termo || d.titulo.toLowerCase().includes(termo)),
    );
  }, [documentos, busca, tipoFiltro]);

  const temFiltro = Boolean(busca || tipoFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          {filtrados.length}{" "}
          {filtrados.length === 1 ? "documento" : "documentos"}
        </p>
        <button
          type="button"
          onClick={() => setModal({ modo: "novo" })}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Adicionar documento
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título"
          className={`${inputClass} sm:w-64`}
          aria-label="Buscar por título"
        />
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className={inputClass}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {PRODUTO_TIPO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setTipoFiltro("");
            }}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-[#24483F]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            {documentos.length === 0
              ? "Nenhum documento cadastrado ainda."
              : "Nenhum documento com esses filtros."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {documentos.length === 0
              ? "Reúna personas, landing pages, roteiros e materiais dos produtos."
              : "Ajuste a busca ou o filtro para ver todos."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((documento) => (
            <Card
              key={documento.id}
              documento={documento}
              produtoNome={
                documento.produto_id
                  ? produtoNome.get(documento.produto_id) ?? null
                  : null
              }
              onOpen={() => setModal({ modo: "edit", documento })}
            />
          ))}
        </div>
      )}

      {modal && (
        <DocumentoModal
          documento={modal.modo === "edit" ? modal.documento : null}
          catalogos={catalogos}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
