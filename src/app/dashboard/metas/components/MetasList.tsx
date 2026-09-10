"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarValorAtual, type FormState } from "../actions";
import {
  META_STATUS_BADGE,
  META_STATUS_OPTIONS,
  META_TIPO_BADGE,
  META_TIPO_OPTIONS,
  corBarraMeta,
  formatValorMeta,
  metaStatusLabel,
  metaTipoLabel,
  percentualMeta,
  periodoLabel,
} from "../constants";
import { MetaModal } from "./MetaModal";

export type OptionLite = { id: string; nome: string };

export type MetaCard = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  indicador: string | null;
  unidade: string | null;
  valor_alvo: number | null;
  valor_atual: number;
  calculado_automaticamente: boolean;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  status: string | null;
  projeto_id: string | null;
  produto_id: string | null;
  evento_id: string | null;
};

const initialState: FormState = {};

const selectClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

// ------------------------------------------------------------
// Atualizar progresso (metas não-financeiras)
// ------------------------------------------------------------

function AtualizarProgressoSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[#24483F] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:opacity-50"
    >
      {pending ? "..." : "Salvar"}
    </button>
  );
}

function AtualizarProgresso({ meta }: { meta: MetaCard }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarValorAtual, initialState);

  useEffect(() => {
    if (state.ok) setAberto(false);
  }, [state]);

  return (
    <div className="mt-3 border-t border-black/5 pt-3">
      {aberto ? (
        <form
          action={formAction}
          className="flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="hidden" name="id" value={meta.id} />
          <input
            name="valor"
            type="number"
            min={0}
            step="any"
            defaultValue={meta.valor_atual}
            autoFocus
            className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-[#2D3230] outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
          />
          <AtualizarProgressoSubmit />
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            Cancelar
          </button>
          {state.error && (
            <span className="w-full text-xs text-red-600">{state.error}</span>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAberto(true);
          }}
          className="rounded-md border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
        >
          Atualizar progresso
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Card
// ------------------------------------------------------------

function MetaCardView({
  meta,
  onOpen,
}: {
  meta: MetaCard;
  onOpen: () => void;
}) {
  const pct = percentualMeta(meta.valor_atual, meta.valor_alvo);
  const cores = corBarraMeta(pct, meta.periodo_fim);
  const barraWidth = Math.min(100, Math.max(0, pct));

  return (
    <div className="flex flex-col rounded-xl border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 font-semibold text-gray-900">
            {meta.nome}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              META_STATUS_BADGE[meta.status ?? "ativa"] ??
              "bg-gray-100 text-gray-600"
            }`}
          >
            {metaStatusLabel(meta.status)}
          </span>
        </div>

        <span
          className={`mt-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            META_TIPO_BADGE[meta.tipo ?? "corporativa"] ??
            "bg-black/5 text-gray-600"
          }`}
        >
          {metaTipoLabel(meta.tipo)}
        </span>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-sm font-semibold ${cores.texto}`}>
              {pct}%
            </span>
            <span className="text-xs text-gray-500">
              {formatValorMeta(meta.valor_atual, meta.unidade)}
              {meta.valor_alvo != null && (
                <>
                  {" "}
                  de{" "}
                  <span className="font-medium text-gray-700">
                    {formatValorMeta(meta.valor_alvo, meta.unidade)}
                  </span>
                </>
              )}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={barraWidth}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/5"
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${cores.barra}`}
              style={{ width: `${barraWidth}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {periodoLabel(meta.periodo_inicio, meta.periodo_fim)}
        </p>
        {meta.indicador && (
          <p className="mt-1 text-xs text-gray-400">{meta.indicador}</p>
        )}
      </button>

      {meta.tipo === "financeira" ? (
        <p className="mt-3 border-t border-black/5 pt-3 text-xs text-emerald-600">
          Progresso automático via Financeiro
        </p>
      ) : (
        <AtualizarProgresso meta={meta} />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Lista
// ------------------------------------------------------------

type Props = {
  metas: MetaCard[];
  colunas: string[];
  projetos: OptionLite[];
  produtos: OptionLite[];
  eventos: OptionLite[];
};

export function MetasList({ metas, colunas, projetos, produtos, eventos }: Props) {
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [modal, setModal] = useState<
    { modo: "nova" } | { modo: "edit"; meta: MetaCard } | null
  >(null);

  const filtradas = useMemo(
    () =>
      metas.filter(
        (m) =>
          (!tipoFiltro || m.tipo === tipoFiltro) &&
          (!statusFiltro || m.status === statusFiltro),
      ),
    [metas, tipoFiltro, statusFiltro],
  );

  const temFiltro = Boolean(tipoFiltro || statusFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Metas</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtradas.length} {filtradas.length === 1 ? "meta" : "metas"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ modo: "nova" })}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Nova Meta
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
          {META_TIPO_OPTIONS.map((o) => (
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
          {META_STATUS_OPTIONS.map((o) => (
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
            {metas.length === 0
              ? "Nenhuma meta cadastrada ainda."
              : "Nenhuma meta com esses filtros."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {metas.length === 0
              ? "Crie a primeira meta para acompanhar o progresso."
              : "Ajuste os filtros para ver todas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((meta) => (
            <MetaCardView
              key={meta.id}
              meta={meta}
              onOpen={() => setModal({ modo: "edit", meta })}
            />
          ))}
        </div>
      )}

      {modal && (
        <MetaModal
          meta={modal.modo === "edit" ? modal.meta : null}
          colunas={colunas}
          projetos={projetos}
          produtos={produtos}
          eventos={eventos}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
