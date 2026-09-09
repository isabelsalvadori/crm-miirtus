"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  EVENTO_STATUS_BADGE,
  EVENTO_STATUS_OPTIONS,
  EVENTO_TIPO_OPTIONS,
  eventoStatusLabel,
  eventoTipoLabel,
  formatData,
} from "../constants";
import { EventoModal } from "./EventoModal";

export type EventoCard = {
  id: string;
  nome: string;
  tipo: string | null;
  status: string | null;
  total_edicoes: number;
  proxima_edicao: string | null;
};

export function EventosList({ eventos }: { eventos: EventoCard[] }) {
  const [statusFiltro, setStatusFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const filtrados = useMemo(
    () =>
      eventos.filter(
        (e) =>
          (!statusFiltro || e.status === statusFiltro) &&
          (!tipoFiltro || e.tipo === tipoFiltro),
      ),
    [eventos, statusFiltro, tipoFiltro],
  );

  const selectClass =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
  const temFiltro = Boolean(statusFiltro || tipoFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Eventos</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtrados.length} {filtrados.length === 1 ? "evento" : "eventos"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Novo Evento
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {EVENTO_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {EVENTO_TIPO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setStatusFiltro("");
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
            {eventos.length === 0
              ? "Nenhum evento cadastrado ainda."
              : "Nenhum evento com esses filtros."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {eventos.length === 0
              ? "Crie o primeiro evento para organizar suas edições."
              : "Ajuste os filtros para ver todos."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((evento) => (
            <Link
              key={evento.id}
              href={`/dashboard/eventos/${evento.id}`}
              className="flex flex-col rounded-xl border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 font-semibold text-gray-900">
                  {evento.nome}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    EVENTO_STATUS_BADGE[evento.status ?? "ativo"] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {eventoStatusLabel(evento.status)}
                </span>
              </div>

              <span className="mt-2 inline-flex w-fit items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {eventoTipoLabel(evento.tipo)}
              </span>

              <p className="mt-4 text-sm text-[#2D3230]">
                {evento.proxima_edicao ? (
                  <>
                    Próxima edição:{" "}
                    <strong className="font-semibold">
                      {formatData(evento.proxima_edicao)}
                    </strong>
                  </>
                ) : (
                  <span className="text-gray-400">Sem edições futuras</span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {evento.total_edicoes}{" "}
                {evento.total_edicoes === 1 ? "edição" : "edições"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {modalAberto && (
        <EventoModal evento={null} onClose={() => setModalAberto(false)} />
      )}
    </div>
  );
}
