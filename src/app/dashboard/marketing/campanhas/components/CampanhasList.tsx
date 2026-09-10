"use client";

import { useMemo, useState } from "react";
import {
  CAMPANHA_STATUS_BADGE,
  CAMPANHA_STATUS_OPTIONS,
  CAMPANHA_TIPO_BADGE,
  CAMPANHA_TIPO_OPTIONS,
  calcularRoas,
  campanhaStatusLabel,
  campanhaTipoLabel,
  formatBRL,
  formatRoas,
  periodoLabel,
} from "../../constants";
import type { Catalogos, CampanhaItem } from "../../types";
import { CampanhaModal } from "./CampanhaModal";

const selectClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

type ModalState = { modo: "nova" } | { modo: "edit"; campanha: CampanhaItem } | null;

function Card({
  campanha,
  onOpen,
}: {
  campanha: CampanhaItem;
  onOpen: () => void;
}) {
  const roas = calcularRoas(campanha.receita_gerada, campanha.gasto_real);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-xl border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 font-semibold text-gray-900">
          {campanha.nome}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            CAMPANHA_STATUS_BADGE[campanha.status ?? "planejada"] ??
            "bg-gray-100 text-gray-600"
          }`}
        >
          {campanhaStatusLabel(campanha.status)}
        </span>
      </div>

      <span
        className={`mt-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          CAMPANHA_TIPO_BADGE[campanha.tipo ?? "organica"] ??
          "bg-black/5 text-gray-600"
        }`}
      >
        {campanhaTipoLabel(campanha.tipo)}
      </span>

      <p className="mt-3 text-xs text-gray-500">
        {periodoLabel(campanha.periodo_inicio, campanha.periodo_fim)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/5 pt-3 text-sm">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Planejado
          </p>
          <p className="mt-0.5 font-semibold text-[#2D3230]">
            {formatBRL(campanha.orcamento_planejado)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Gasto real
          </p>
          <p className="mt-0.5 font-semibold text-[#2D3230]">
            {formatBRL(campanha.gasto_real)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Receita
          </p>
          <p className="mt-0.5 font-semibold text-[#2D3230]">
            {formatBRL(campanha.receita_gerada)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            ROAS
          </p>
          <p
            className={`mt-0.5 font-semibold ${
              roas != null && roas >= 1 ? "text-emerald-600" : "text-[#2D3230]"
            }`}
          >
            {formatRoas(roas)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function CampanhasList({
  campanhas,
  catalogos,
}: {
  campanhas: CampanhaItem[];
  catalogos: Catalogos;
}) {
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const filtradas = useMemo(
    () =>
      campanhas.filter(
        (c) =>
          (!tipoFiltro || c.tipo === tipoFiltro) &&
          (!statusFiltro || c.status === statusFiltro),
      ),
    [campanhas, tipoFiltro, statusFiltro],
  );

  const temFiltro = Boolean(tipoFiltro || statusFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          {filtradas.length} {filtradas.length === 1 ? "campanha" : "campanhas"}
        </p>
        <button
          type="button"
          onClick={() => setModal({ modo: "nova" })}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Nova Campanha
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
          {CAMPANHA_TIPO_OPTIONS.map((o) => (
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
          {CAMPANHA_STATUS_OPTIONS.map((o) => (
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
            {campanhas.length === 0
              ? "Nenhuma campanha cadastrada ainda."
              : "Nenhuma campanha com esses filtros."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {campanhas.length === 0
              ? "Crie a primeira campanha para acompanhar orçamento e ROAS."
              : "Ajuste os filtros para ver todas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((campanha) => (
            <Card
              key={campanha.id}
              campanha={campanha}
              onOpen={() => setModal({ modo: "edit", campanha })}
            />
          ))}
        </div>
      )}

      {modal && (
        <CampanhaModal
          campanha={modal.modo === "edit" ? modal.campanha : null}
          catalogos={catalogos}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
