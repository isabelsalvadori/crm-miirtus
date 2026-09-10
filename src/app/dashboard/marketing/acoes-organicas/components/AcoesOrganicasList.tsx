"use client";

import { useMemo, useState } from "react";
import {
  ACAO_STATUS_BADGE,
  ACAO_STATUS_OPTIONS,
  ACAO_TIPO_OPTIONS,
  acaoStatusLabel,
  acaoTipoLabel,
  formatBRL,
  formatDataCurta,
} from "../../constants";
import type { AcaoOrganicaItem, Catalogos } from "../../types";
import { AcaoOrganicaModal } from "./AcaoOrganicaModal";

const selectClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

type ModalState =
  | { modo: "nova" }
  | { modo: "edit"; acao: AcaoOrganicaItem }
  | null;

function Card({
  acao,
  onOpen,
}: {
  acao: AcaoOrganicaItem;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-xl border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 font-semibold text-gray-900">{acao.nome}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            ACAO_STATUS_BADGE[acao.status ?? "planejada"] ??
            "bg-gray-100 text-gray-600"
          }`}
        >
          {acaoStatusLabel(acao.status)}
        </span>
      </div>

      <span className="mt-2 inline-flex w-fit items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        {acaoTipoLabel(acao.tipo)}
      </span>

      <div className="mt-3 space-y-1 text-xs text-gray-500">
        {acao.canal_local && <p>{acao.canal_local}</p>}
        <p>{acao.data ? formatDataCurta(acao.data) : "Sem data"}</p>
        {acao.custo != null && (
          <p className="text-[#2D3230]">Custo: {formatBRL(acao.custo)}</p>
        )}
      </div>
    </button>
  );
}

export function AcoesOrganicasList({
  acoes,
  catalogos,
}: {
  acoes: AcaoOrganicaItem[];
  catalogos: Catalogos;
}) {
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const filtradas = useMemo(
    () =>
      acoes.filter(
        (a) =>
          (!tipoFiltro || a.tipo === tipoFiltro) &&
          (!statusFiltro || a.status === statusFiltro),
      ),
    [acoes, tipoFiltro, statusFiltro],
  );

  const temFiltro = Boolean(tipoFiltro || statusFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          {filtradas.length} {filtradas.length === 1 ? "ação" : "ações"}
        </p>
        <button
          type="button"
          onClick={() => setModal({ modo: "nova" })}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Nova Ação
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {ACAO_TIPO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {ACAO_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setTipoFiltro("");
              setStatusFiltro("");
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
            {acoes.length === 0
              ? "Nenhuma ação orgânica cadastrada ainda."
              : "Nenhuma ação com esses filtros."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {acoes.length === 0
              ? "Registre parcerias, comunidades e participações de alcance orgânico."
              : "Ajuste os filtros para ver todas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((acao) => (
            <Card
              key={acao.id}
              acao={acao}
              onOpen={() => setModal({ modo: "edit", acao })}
            />
          ))}
        </div>
      )}

      {modal && (
        <AcaoOrganicaModal
          acao={modal.modo === "edit" ? modal.acao : null}
          catalogos={catalogos}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
