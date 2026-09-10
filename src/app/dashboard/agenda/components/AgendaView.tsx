"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TagLite,
  TarefaHoje,
  VinculoOpcoes,
} from "@/app/dashboard/hoje/actions";
import { TarefaModal } from "@/app/dashboard/hoje/components/TarefaModal";
import { criarTarefaAgendada } from "../actions";
import {
  CORES,
  DIAS_SEMANA_CURTO,
  HORA_FIM,
  HORA_INICIO,
  HORA_PX,
  MODOS,
  type ModoAgenda,
  addDays,
  addMonths,
  diasDaSemana,
  gradeMes,
  hhmmParaMin,
  horasDaGrade,
  mesmoMes,
  minParaHhmm,
  parseYmd,
  tituloPeriodo,
  ymd,
} from "../constants";

export type EdicaoAgenda = {
  id: string;
  evento_id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string | null;
  status: string | null;
};

type EdicaoCalc = EdicaoAgenda & {
  dateKey: string;
  inicioMin: number;
  fimMin: number;
  diaInteiro: boolean;
};

type Props = {
  hojeISO: string;
  tarefas: TarefaHoje[];
  prazos: TarefaHoje[];
  edicoes: EdicaoAgenda[];
  vinculos: VinculoOpcoes;
  tags: TagLite[];
  colunas: string[];
};

type ModalState =
  | { modo: "nova"; data: string; horaInicio?: string; horaFim?: string }
  | { modo: "edit"; tarefa: TarefaHoje }
  | null;

const ALTURA_GRADE = (HORA_FIM - HORA_INICIO) * HORA_PX;

const dateKeyPrazo = (t: TarefaHoje) => (t.data_prazo ?? "").slice(0, 10);

// ------------------------------------------------------------
// Distribuição em "lanes" para blocos que se sobrepõem
// ------------------------------------------------------------

type Bloco = {
  key: string;
  titulo: string;
  inicioMin: number;
  fimMin: number;
  tipo: "tarefa" | "edicao";
  onClick: () => void;
};

function comLanes(blocos: Bloco[]): {
  itens: (Bloco & { lane: number })[];
  total: number;
} {
  const ordenados = [...blocos].sort(
    (a, b) => a.inicioMin - b.inicioMin || a.fimMin - b.fimMin,
  );
  const fimPorLane: number[] = [];
  const itens = ordenados.map((b) => {
    let lane = fimPorLane.findIndex((fim) => fim <= b.inicioMin);
    if (lane === -1) {
      lane = fimPorLane.length;
      fimPorLane.push(b.fimMin);
    } else {
      fimPorLane[lane] = b.fimMin;
    }
    return { ...b, lane };
  });
  return { itens, total: Math.max(1, fimPorLane.length) };
}

// ------------------------------------------------------------
// Chips
// ------------------------------------------------------------

function Chip({
  titulo,
  tipo,
  onClick,
}: {
  titulo: string;
  tipo: "tarefa" | "edicao" | "prazo";
  onClick: () => void;
}) {
  const c = CORES[tipo];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={titulo}
      className="flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <span className="truncate">{titulo}</span>
    </button>
  );
}

function Ponto({ tipo }: { tipo: "tarefa" | "edicao" | "prazo" }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ backgroundColor: CORES[tipo].bg }}
      aria-hidden
    />
  );
}

// ------------------------------------------------------------
// Visualização Mês
// ------------------------------------------------------------

function MesGrade({
  cursor,
  hojeISO,
  itensPorDia,
  onDiaVazio,
}: {
  cursor: Date;
  hojeISO: string;
  itensPorDia: (
    key: string,
  ) => { chips: { titulo: string; tipo: "tarefa" | "edicao" | "prazo"; onClick: () => void }[] };
  onDiaVazio: (key: string) => void;
}) {
  const celulas = gradeMes(cursor);

  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-black/5 bg-[#F5F1E8]/60 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {DIAS_SEMANA_CURTO.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {celulas.map((dia) => {
          const key = ymd(dia);
          const foraDoMes = !mesmoMes(dia, cursor);
          const ehHoje = key === hojeISO;
          const { chips } = itensPorDia(key);
          const visiveis = chips.slice(0, 3);
          const resto = chips.length - visiveis.length;

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onDiaVazio(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDiaVazio(key);
                }
              }}
              className={`min-h-[64px] cursor-pointer border-b border-r border-black/5 p-1 text-left align-top transition-colors last:border-r-0 hover:bg-[#F5F1E8]/40 sm:min-h-[104px] ${
                foraDoMes ? "bg-black/[0.015]" : ""
              }`}
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

              {/* Desktop: chips */}
              <div className="mt-1 hidden space-y-0.5 sm:block">
                {visiveis.map((chip, i) => (
                  <Chip
                    key={i}
                    titulo={chip.titulo}
                    tipo={chip.tipo}
                    onClick={chip.onClick}
                  />
                ))}
                {resto > 0 && (
                  <span className="block px-1.5 text-[10px] font-medium text-gray-400">
                    +{resto} mais
                  </span>
                )}
              </div>

              {/* Mobile: pontos */}
              {chips.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                  {chips.slice(0, 4).map((chip, i) => (
                    <Ponto key={i} tipo={chip.tipo} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Visualização Dia / Semana (grade de horas)
// ------------------------------------------------------------

function GradeHoras({
  dias,
  hojeISO,
  tarefasComHora,
  tarefasDiaInteiro,
  edicoesCalc,
  prazos,
  verTarefas,
  verEdicoes,
  verPrazos,
  onSlot,
  onEditarTarefa,
  onAbrirEdicao,
}: {
  dias: Date[];
  hojeISO: string;
  tarefasComHora: TarefaHoje[];
  tarefasDiaInteiro: TarefaHoje[];
  edicoesCalc: EdicaoCalc[];
  prazos: TarefaHoje[];
  verTarefas: boolean;
  verEdicoes: boolean;
  verPrazos: boolean;
  onSlot: (key: string, hora: number) => void;
  onEditarTarefa: (t: TarefaHoje) => void;
  onAbrirEdicao: (e: EdicaoAgenda) => void;
}) {
  const horas = horasDaGrade();
  const cols = `56px repeat(${dias.length}, minmax(120px, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
      <div className="grid min-w-full" style={{ gridTemplateColumns: cols }}>
        {/* Linha de cabeçalho */}
        <div className="border-b border-black/5" />
        {dias.map((d) => {
          const key = ymd(d);
          const ehHoje = key === hojeISO;
          return (
            <div
              key={key}
              className="border-b border-l border-black/5 py-2 text-center"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {DIAS_SEMANA_CURTO[(d.getDay() + 6) % 7]}
              </div>
              <div
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  ehHoje ? "bg-[#E3BD62] text-[#2D3230]" : "text-gray-700"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}

        {/* Linha "dia inteiro" */}
        <div className="border-b border-black/5 px-1 py-1 text-right text-[10px] font-medium uppercase text-gray-400">
          dia todo
        </div>
        {dias.map((d) => {
          const key = ymd(d);
          const ts = verTarefas
            ? tarefasDiaInteiro.filter((t) => t.agenda_data === key)
            : [];
          const es = verEdicoes
            ? edicoesCalc.filter((e) => e.diaInteiro && e.dateKey === key)
            : [];
          const ps = verPrazos
            ? prazos.filter((p) => dateKeyPrazo(p) === key)
            : [];
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onSlot(key, HORA_INICIO)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSlot(key, HORA_INICIO);
                }
              }}
              className="min-h-[34px] cursor-pointer space-y-0.5 border-b border-l border-black/5 p-1 text-left transition-colors hover:bg-[#F5F1E8]/40"
            >
              {ts.map((t) => (
                <Chip
                  key={t.id}
                  titulo={t.titulo}
                  tipo="tarefa"
                  onClick={() => onEditarTarefa(t)}
                />
              ))}
              {es.map((e) => (
                <Chip
                  key={e.id}
                  titulo={e.titulo}
                  tipo="edicao"
                  onClick={() => onAbrirEdicao(e)}
                />
              ))}
              {ps.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onEditarTarefa(p);
                  }}
                  title={`Prazo: ${p.titulo}`}
                  className="flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium"
                  style={{ color: CORES.prazo.bg }}
                >
                  <Ponto tipo="prazo" />
                  <span className="truncate">{p.titulo}</span>
                </button>
              ))}
            </div>
          );
        })}

        {/* Coluna de horas */}
        <div className="relative" style={{ height: ALTURA_GRADE }}>
          {horas.map((h) => (
            <div
              key={h}
              className="absolute -translate-y-1/2 pr-1 text-right text-[10px] font-medium text-gray-400"
              style={{ top: (h - HORA_INICIO) * HORA_PX, right: 0, left: 0 }}
            >
              {String(h).padStart(2, "0")}h
            </div>
          ))}
        </div>

        {/* Colunas dos dias (blocos posicionados) */}
        {dias.map((d) => {
          const key = ymd(d);
          const blocos: Bloco[] = [];

          if (verTarefas) {
            for (const t of tarefasComHora) {
              if (t.agenda_data !== key || !t.agenda_hora_inicio) continue;
              const inicioMin = hhmmParaMin(t.agenda_hora_inicio);
              const fimMin = t.agenda_hora_fim
                ? Math.max(inicioMin + 20, hhmmParaMin(t.agenda_hora_fim))
                : inicioMin + 60;
              blocos.push({
                key: t.id,
                titulo: t.titulo,
                inicioMin,
                fimMin,
                tipo: "tarefa",
                onClick: () => onEditarTarefa(t),
              });
            }
          }
          if (verEdicoes) {
            for (const e of edicoesCalc) {
              if (e.diaInteiro || e.dateKey !== key) continue;
              blocos.push({
                key: e.id,
                titulo: e.titulo,
                inicioMin: e.inicioMin,
                fimMin: e.fimMin,
                tipo: "edicao",
                onClick: () => onAbrirEdicao(e),
              });
            }
          }

          const { itens, total } = comLanes(blocos);
          const min0 = HORA_INICIO * 60;

          return (
            <div
              key={key}
              className="relative border-l border-black/5"
              style={{ height: ALTURA_GRADE }}
              onClick={(ev) => {
                const rect = ev.currentTarget.getBoundingClientRect();
                const y = ev.clientY - rect.top;
                const hora = Math.min(
                  HORA_FIM - 1,
                  Math.max(HORA_INICIO, HORA_INICIO + Math.floor(y / HORA_PX)),
                );
                onSlot(key, hora);
              }}
            >
              {horas.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute inset-x-0 border-t border-black/[0.06]"
                  style={{ top: (h - HORA_INICIO) * HORA_PX }}
                />
              ))}

              {itens.map((b) => {
                const topRaw = ((b.inicioMin - min0) / 60) * HORA_PX;
                const top = Math.max(0, topRaw);
                const altura = Math.max(
                  20,
                  ((b.fimMin - b.inicioMin) / 60) * HORA_PX -
                    (top - topRaw),
                );
                const c = CORES[b.tipo];
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      b.onClick();
                    }}
                    title={b.titulo}
                    className="absolute overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] font-semibold leading-tight shadow-sm"
                    style={{
                      top,
                      height: altura,
                      left: `calc(${(b.lane / total) * 100}% + 2px)`,
                      width: `calc(${100 / total}% - 4px)`,
                      backgroundColor: c.bg,
                      color: c.fg,
                      border: `1px solid ${c.borda}`,
                    }}
                  >
                    <span className="block truncate">
                      {minParaHhmm(b.inicioMin)} {b.titulo}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------

export function AgendaView({
  hojeISO,
  tarefas,
  prazos,
  edicoes,
  vinculos,
  tags,
  colunas,
}: Props) {
  const router = useRouter();
  const [modo, setModo] = useState<ModoAgenda>("mes");
  const [cursor, setCursor] = useState<Date>(() => parseYmd(hojeISO));
  const [verTarefas, setVerTarefas] = useState(true);
  const [verEdicoes, setVerEdicoes] = useState(true);
  const [verPrazos, setVerPrazos] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  const edicoesCalc = useMemo<EdicaoCalc[]>(
    () =>
      edicoes.map((e) => {
        const ini = new Date(e.data_inicio);
        const dateKey = ymd(ini);
        const inicioMin = ini.getHours() * 60 + ini.getMinutes();
        let fimMin = inicioMin + 90;
        if (e.data_fim) {
          const f = new Date(e.data_fim);
          if (ymd(f) === dateKey) {
            fimMin = Math.max(
              inicioMin + 30,
              f.getHours() * 60 + f.getMinutes(),
            );
          }
        }
        return {
          ...e,
          dateKey,
          inicioMin,
          fimMin,
          diaInteiro: inicioMin === 0,
        };
      }),
    [edicoes],
  );

  const tarefasComHora = useMemo(
    () => tarefas.filter((t) => t.agenda_hora_inicio),
    [tarefas],
  );
  const tarefasDiaInteiro = useMemo(
    () => tarefas.filter((t) => !t.agenda_hora_inicio),
    [tarefas],
  );

  function navegar(dir: -1 | 1) {
    setCursor((c) =>
      modo === "mes"
        ? addMonths(c, dir)
        : addDays(c, dir * (modo === "semana" ? 7 : 1)),
    );
  }

  function abrirNova(data: string, horaInicio?: string, horaFim?: string) {
    setModal({ modo: "nova", data, horaInicio, horaFim });
  }

  function abrirEdicao(e: EdicaoAgenda) {
    router.push(`/dashboard/eventos/${e.evento_id}`);
  }

  const itensPorDiaMes = (key: string) => {
    const chips: {
      titulo: string;
      tipo: "tarefa" | "edicao" | "prazo";
      onClick: () => void;
    }[] = [];
    if (verTarefas) {
      for (const t of tarefas) {
        if (t.agenda_data === key) {
          chips.push({
            titulo: t.agenda_hora_inicio
              ? `${t.agenda_hora_inicio.slice(0, 5)} ${t.titulo}`
              : t.titulo,
            tipo: "tarefa",
            onClick: () => setModal({ modo: "edit", tarefa: t }),
          });
        }
      }
    }
    if (verEdicoes) {
      for (const e of edicoesCalc) {
        if (e.dateKey === key) {
          chips.push({
            titulo: e.titulo,
            tipo: "edicao",
            onClick: () => abrirEdicao(e),
          });
        }
      }
    }
    if (verPrazos) {
      for (const p of prazos) {
        if (dateKeyPrazo(p) === key) {
          chips.push({
            titulo: p.titulo,
            tipo: "prazo",
            onClick: () => setModal({ modo: "edit", tarefa: p }),
          });
        }
      }
    }
    return { chips };
  };

  const dias =
    modo === "mes" ? [] : modo === "semana" ? diasDaSemana(cursor) : [cursor];

  return (
    <div className="space-y-4">
      {/* Header */}
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
              onClick={() => setCursor(parseYmd(hojeISO))}
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
            {tituloPeriodo(modo, cursor)}
          </h2>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-black/10">
          {MODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setModo(m.value)}
              aria-pressed={modo === m.value}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                modo === m.value
                  ? "bg-[#24483F] text-white"
                  : "text-gray-600 hover:bg-[#F5F1E8]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <FiltroToggle
          ativo={verTarefas}
          onToggle={() => setVerTarefas((v) => !v)}
          cor={CORES.tarefa.bg}
          label="Tarefas agendadas"
        />
        <FiltroToggle
          ativo={verEdicoes}
          onToggle={() => setVerEdicoes((v) => !v)}
          cor={CORES.edicao.bg}
          label="Edições de eventos"
        />
        <FiltroToggle
          ativo={verPrazos}
          onToggle={() => setVerPrazos((v) => !v)}
          cor={CORES.prazo.bg}
          label="Prazos"
        />
      </div>

      {/* Corpo */}
      {modo === "mes" ? (
        <MesGrade
          cursor={cursor}
          hojeISO={hojeISO}
          itensPorDia={itensPorDiaMes}
          onDiaVazio={(key) => abrirNova(key)}
        />
      ) : (
        <GradeHoras
          dias={dias}
          hojeISO={hojeISO}
          tarefasComHora={tarefasComHora}
          tarefasDiaInteiro={tarefasDiaInteiro}
          edicoesCalc={edicoesCalc}
          prazos={prazos}
          verTarefas={verTarefas}
          verEdicoes={verEdicoes}
          verPrazos={verPrazos}
          onSlot={(key, hora) =>
            abrirNova(
              key,
              minParaHhmm(hora * 60),
              minParaHhmm((hora + 1) * 60),
            )
          }
          onEditarTarefa={(t) => setModal({ modo: "edit", tarefa: t })}
          onAbrirEdicao={abrirEdicao}
        />
      )}

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <Legenda cor={CORES.tarefa.bg} label="Tarefa agendada" />
        <Legenda cor={CORES.edicao.bg} label="Edição de evento" />
        <Legenda cor={CORES.prazo.bg} label="Prazo" />
      </div>

      {modal?.modo === "nova" && (
        <TarefaModal
          tarefa={null}
          vinculos={vinculos}
          tags={tags}
          colunas={colunas}
          createAction={criarTarefaAgendada}
          agendaDataPadrao={modal.data}
          agendaHoraInicioPadrao={modal.horaInicio}
          agendaHoraFimPadrao={modal.horaFim}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.modo === "edit" && (
        <TarefaModal
          key={modal.tarefa.id}
          tarefa={modal.tarefa}
          vinculos={vinculos}
          tags={tags}
          colunas={colunas}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function FiltroToggle({
  ativo,
  onToggle,
  cor,
  label,
}: {
  ativo: boolean;
  onToggle: () => void;
  cor: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ativo}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        ativo
          ? "border-[#24483F]/30 bg-white text-[#2D3230]"
          : "border-black/10 bg-black/[0.03] text-gray-400"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: ativo ? cor : "transparent", border: `1px solid ${cor}` }}
      />
      {label}
    </button>
  );
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: cor }}
      />
      {label}
    </span>
  );
}
