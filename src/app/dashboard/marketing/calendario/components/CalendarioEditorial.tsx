"use client";

import { useMemo, useState } from "react";
import {
  CONTEUDO_CANAL_OPTIONS,
  CONTEUDO_STATUS_OPTIONS,
  canalCor,
  conteudoStatusLabel,
  conteudoTipoLabel,
  textoContraste,
} from "../../constants";
import type { Catalogos, ConteudoItem } from "../../types";
import { ConteudoModal } from "../../conteudo/components/ConteudoModal";

type Modo = "mes" | "semana";

type ModalState =
  | { modo: "nova"; dataAgendada: string }
  | { modo: "edit"; conteudo: ConteudoItem }
  | null;

const DIAS_CURTO = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
}
function inicioSemana(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function gradeMes(cursor: Date): Date[] {
  const inicio = inicioSemana(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
}
function diasDaSemana(cursor: Date): Date[] {
  const inicio = inicioSemana(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
}
const capitalizar = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const selectClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

export function CalendarioEditorial({
  conteudos,
  catalogos,
}: {
  conteudos: ConteudoItem[];
  catalogos: Catalogos;
}) {
  const hojeKey = ymd(new Date());
  const [modo, setModo] = useState<Modo>("mes");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [canalFiltro, setCanalFiltro] = useState("");
  const [produtoFiltro, setProdutoFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const filtrados = useMemo(
    () =>
      conteudos.filter(
        (c) =>
          c.data_agendada &&
          (!canalFiltro || c.canal === canalFiltro) &&
          (!produtoFiltro || c.produto_id === produtoFiltro) &&
          (!statusFiltro || c.status === statusFiltro),
      ),
    [conteudos, canalFiltro, produtoFiltro, statusFiltro],
  );

  const porDia = useMemo(() => {
    const map = new Map<string, ConteudoItem[]>();
    for (const c of filtrados) {
      const key = (c.data_agendada ?? "").slice(0, 10);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    map.forEach((arr) =>
      arr.sort((a, b) =>
        (a.data_agendada ?? "").localeCompare(b.data_agendada ?? ""),
      ),
    );
    return map;
  }, [filtrados]);

  const dias = modo === "mes" ? gradeMes(cursor) : diasDaSemana(cursor);
  const titulo =
    modo === "mes"
      ? capitalizar(
          cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        )
      : (() => {
          const ds = diasDaSemana(cursor);
          return `${ds[0].toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
          })} – ${ds[6].toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`;
        })();

  function navegar(dir: -1 | 1) {
    setCursor((c) => (modo === "mes" ? addMonths(c, dir) : addDays(c, dir * 7)));
  }

  const temFiltro = Boolean(canalFiltro || produtoFiltro || statusFiltro);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-black/10">
            <button
              type="button"
              onClick={() => navegar(-1)}
              aria-label="Período anterior"
              className="px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-[#F5F1E8]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="border-x border-black/10 px-3 py-1.5 text-sm font-medium text-[#24483F] transition-colors hover:bg-[#F5F1E8]"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => navegar(1)}
              aria-label="Próximo período"
              className="px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-[#F5F1E8]"
            >
              ›
            </button>
          </div>
          <h2 className="text-sm font-semibold text-[#24483F] sm:text-base">
            {titulo}
          </h2>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-black/10">
          {(["mes", "semana"] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              aria-pressed={modo === m}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                modo === m
                  ? "bg-[#24483F] text-white"
                  : "text-gray-600 hover:bg-[#F5F1E8]"
              }`}
            >
              {m === "mes" ? "Mês" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={canalFiltro}
          onChange={(e) => setCanalFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por canal"
        >
          <option value="">Todos os canais</option>
          {CONTEUDO_CANAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={produtoFiltro}
          onChange={(e) => setProdutoFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por produto"
        >
          <option value="">Todos os produtos</option>
          {catalogos.produtos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
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
          {CONTEUDO_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setCanalFiltro("");
              setProdutoFiltro("");
              setStatusFiltro("");
            }}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-[#24483F]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Grade */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-black/5 bg-[#F5F1E8]/60 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {DIAS_CURTO.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const key = ymd(dia);
            const foraDoMes = modo === "mes" && dia.getMonth() !== cursor.getMonth();
            const ehHoje = key === hojeKey;
            const itens = porDia.get(key) ?? [];

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => setModal({ modo: "nova", dataAgendada: `${key}T09:00` })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setModal({ modo: "nova", dataAgendada: `${key}T09:00` });
                  }
                }}
                className={`min-h-[92px] cursor-pointer border-b border-r border-black/5 p-1.5 text-left align-top transition-colors last:border-r-0 hover:bg-[#F5F1E8]/40 ${
                  modo === "semana" ? "sm:min-h-[220px]" : "sm:min-h-[116px]"
                } ${foraDoMes ? "bg-black/[0.015]" : ""}`}
              >
                <span
                  className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-xs font-semibold ${
                    ehHoje
                      ? "bg-[#E3BD62] text-[#2D3230]"
                      : foraDoMes
                        ? "text-gray-300"
                        : "text-gray-600"
                  }`}
                >
                  {dia.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {itens.map((c) => {
                    const cor = canalCor(c.canal);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ modo: "edit", conteudo: c });
                        }}
                        title={`${c.titulo} · ${conteudoTipoLabel(c.tipo)}`}
                        className="block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium leading-tight"
                        style={{ backgroundColor: cor, color: textoContraste(cor) }}
                      >
                        <span className="block truncate">{c.titulo}</span>
                        <span className="block truncate text-[10px] opacity-80">
                          {conteudoTipoLabel(c.tipo)}
                          {c.status ? ` · ${conteudoStatusLabel(c.status)}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda de canais */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {CONTEUDO_CANAL_OPTIONS.map((o) => (
          <span key={o.value} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: canalCor(o.value) }}
            />
            {o.label}
          </span>
        ))}
      </div>

      {modal && (
        <ConteudoModal
          conteudo={modal.modo === "edit" ? modal.conteudo : null}
          catalogos={catalogos}
          defaultDataAgendada={
            modal.modo === "nova" ? modal.dataAgendada : undefined
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
