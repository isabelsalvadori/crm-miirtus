"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { CheckSquare, Folder, Package } from "lucide-react";
import type {
  CampanhaLite,
  DashboardData,
  ProjetoLite,
  RecenteLite,
  TarefaLite,
} from "./inicio-types";

const CONCLUIDA = "concluida";
const FASE_FEITA = new Set(["concluida", "concluido", "encerrada", "cancelada"]);

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function saudacao(hora: number): string {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

const capitalizar = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function dataPorExtenso(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  return capitalizar(
    d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

function addDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function limitesMes(ymd: string) {
  const [a, m] = ymd.split("-").map(Number);
  const inicio = `${a}-${pad(m)}-01`;
  const fim = `${a}-${pad(m)}-${pad(new Date(a, m, 0).getDate())}`;
  const pa = m === 1 ? a - 1 : a;
  const pm = m === 1 ? 12 : m - 1;
  const prevInicio = `${pa}-${pad(pm)}-01`;
  return { inicio, fim, prevInicio };
}

function formatBRL(v: number | null | undefined): string {
  const n = typeof v === "number" ? v : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function crescimento(atual: number, anterior: number): number | null {
  if (!anterior) return atual ? null : 0;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function formatPct(v: number | null): string {
  if (v == null) return "—";
  return `${v > 0 ? "+" : ""}${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function tempoRelativo(iso: string | null, agoraMs: number): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const min = Math.round((agoraMs - t) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} ${d === 1 ? "dia" : "dias"}`;
  const meses = Math.round(d / 30);
  return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
}

const RECENTE_META: Record<
  RecenteLite["tipo"],
  { modulo: string; icone: typeof CheckSquare; href: (id: string) => string }
> = {
  tarefa: {
    modulo: "Tarefas",
    icone: CheckSquare,
    href: (id) => `/dashboard/tarefas?tarefa=${id}`,
  },
  projeto: {
    modulo: "Projetos",
    icone: Folder,
    href: (id) => `/dashboard/projetos/${id}`,
  },
  produto: {
    modulo: "Produtos",
    icone: Package,
    href: (id) => `/dashboard/produtos/${id}`,
  },
};

// ------------------------------------------------------------
// UI base
// ------------------------------------------------------------

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-black/10 pb-2 text-lg font-semibold text-[#24483F]">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-black/5 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function VerTudo({ href, texto = "Ver tudo" }: { href: string; texto?: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-[#24483F] transition-colors hover:underline"
    >
      {texto} →
    </Link>
  );
}

function Kpi({
  label,
  valor,
  tom = "neutro",
  variacao,
}: {
  label: string;
  valor: ReactNode;
  tom?: "neutro" | "positivo" | "negativo";
  variacao?: number | null;
}) {
  const cor =
    tom === "positivo"
      ? "text-emerald-600"
      : tom === "negativo"
        ? "text-red-600"
        : "text-[#2D3230]";
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${cor}`}>{valor}</p>
      {variacao !== undefined && (
        <p className="mt-1 text-xs">
          {variacao == null ? (
            <span className="text-gray-400">sem base anterior</span>
          ) : (
            <span
              className={`font-semibold ${
                variacao > 0
                  ? "text-emerald-600"
                  : variacao < 0
                    ? "text-red-600"
                    : "text-gray-400"
              }`}
            >
              {variacao > 0 ? "↑" : variacao < 0 ? "↓" : "→"} {formatPct(variacao)}
            </span>
          )}{" "}
          <span className="text-gray-400">vs mês anterior</span>
        </p>
      )}
    </Card>
  );
}

function Barra({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: cor }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------

export function DashboardView({ data }: { data: DashboardData }) {
  const hoje = data.hoje;
  const agoraMs = Date.now();

  const derivado = useMemo(() => {
    const { inicio: mesIni, fim: mesFim, prevInicio } = limitesMes(hoje);
    const em7 = addDias(hoje, 7);
    const ativa = (t: TarefaLite) => t.status !== CONCLUIDA;
    const prazo = (t: TarefaLite) => (t.data_prazo ?? "").slice(0, 10);

    const tarefasHoje = data.tarefas.filter((t) => ativa(t) && prazo(t) === hoje);
    const tarefasAtrasadas = data.tarefas.filter(
      (t) => ativa(t) && prazo(t) && prazo(t) < hoje,
    );
    const proximosPrazos = data.tarefas
      .filter((t) => ativa(t) && prazo(t) > hoje && prazo(t) <= em7)
      .sort((a, b) => prazo(a).localeCompare(prazo(b)));

    // Financeiro
    const dentro = (d: string | null, ini: string, fim: string) => {
      const x = (d ?? "").slice(0, 10);
      return x >= ini && x <= fim;
    };
    let receitaMes = 0;
    let despesaMes = 0;
    let receitaPrev = 0;
    let despesaPrev = 0;
    for (const m of data.movimentacoes) {
      if (m.status === "cancelado") continue;
      const noMes = dentro(m.data_competencia, mesIni, mesFim);
      const noPrev = dentro(m.data_competencia, prevInicio, addDias(mesIni, -1));
      if (m.tipo === "receita") {
        if (noMes) receitaMes += m.valor;
        if (noPrev) receitaPrev += m.valor;
      } else if (m.tipo === "despesa") {
        if (noMes) despesaMes += m.valor;
        if (noPrev) despesaPrev += m.valor;
      }
    }
    const resultadoMes = receitaMes - despesaMes;
    const resultadoPrev = receitaPrev - despesaPrev;

    // Meta principal (primeira financeira ativa; senão a primeira)
    const metaPrincipal =
      data.metas.find((m) => m.tipo === "financeira") ?? data.metas[0] ?? null;
    let metaAtual = metaPrincipal?.valor_atual ?? 0;
    if (metaPrincipal?.tipo === "financeira") metaAtual = receitaMes;
    const metaPct =
      metaPrincipal && metaPrincipal.valor_alvo
        ? Math.round((metaAtual / metaPrincipal.valor_alvo) * 100)
        : 0;

    // Projetos: progresso e atraso via tarefas
    const porProjeto = new Map<
      string,
      { total: number; concluidas: number; atrasadas: number }
    >();
    for (const t of data.tarefas) {
      if (!t.projeto_id) continue;
      const acc =
        porProjeto.get(t.projeto_id) ?? { total: 0, concluidas: 0, atrasadas: 0 };
      acc.total += 1;
      if (t.status === CONCLUIDA) acc.concluidas += 1;
      else if (prazo(t) && prazo(t) < hoje) acc.atrasadas += 1;
      porProjeto.set(t.projeto_id, acc);
    }
    const faseAtualDe = (projetoId: string): string | null => {
      const doProj = data.fases.filter((f) => f.projeto_id === projetoId);
      if (doProj.length === 0) return null;
      const emCurso = doProj.find(
        (f) => !FASE_FEITA.has((f.status ?? "").toLowerCase()),
      );
      return (emCurso ?? doProj[doProj.length - 1]).nome || null;
    };
    const projetos = data.projetos.slice(0, 4).map((p: ProjetoLite) => {
      const c = porProjeto.get(p.id);
      const pct = c && c.total > 0
        ? Math.round((c.concluidas / c.total) * 100)
        : p.progresso ?? 0;
      return {
        ...p,
        pct,
        fase: faseAtualDe(p.id),
        atrasadas: c?.atrasadas ?? 0,
      };
    });

    return {
      tarefasHoje,
      tarefasAtrasadas,
      proximosPrazos,
      receitaMes,
      despesaMes,
      resultadoMes,
      receitaPrev,
      despesaPrev,
      resultadoPrev,
      metaPrincipal,
      metaAtual,
      metaPct,
      projetos,
    };
  }, [data, hoje]);

  const campanhas: CampanhaLite[] = data.campanhas;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-[#24483F]">
          {saudacao(data.hora)}, Isabel 🌿
        </h1>
        <p className="mt-1 text-sm text-gray-500">{dataPorExtenso(hoje)}</p>
      </header>

      {data.falhas.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível carregar: {data.falhas.join(", ")}. O restante do
          painel está sendo exibido normalmente.
        </div>
      )}

      {/* ===== HOJE ===== */}
      <Secao titulo="Hoje">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Tarefas de hoje
              </p>
              <VerTudo href="/dashboard/hoje" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-[#2D3230]">
              {derivado.tarefasHoje.length}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {derivado.tarefasHoje.slice(0, 3).map((t) => (
                <li key={t.id} className="truncate">
                  • {t.titulo}
                </li>
              ))}
              {derivado.tarefasHoje.length > 3 && (
                <li className="text-xs text-gray-400">
                  + {derivado.tarefasHoje.length - 3} mais
                </li>
              )}
              {derivado.tarefasHoje.length === 0 && (
                <li className="text-xs text-gray-400">Nada para hoje.</li>
              )}
            </ul>
          </Card>

          <Card
            className={
              derivado.tarefasAtrasadas.length > 0
                ? "border-red-200 bg-red-50/60"
                : ""
            }
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Tarefas atrasadas
              </p>
              <VerTudo href="/dashboard/hoje" />
            </div>
            <p
              className={`mt-1 text-2xl font-semibold ${
                derivado.tarefasAtrasadas.length > 0
                  ? "text-red-600"
                  : "text-[#2D3230]"
              }`}
            >
              {derivado.tarefasAtrasadas.length}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {derivado.tarefasAtrasadas.slice(0, 3).map((t) => (
                <li key={t.id} className="truncate">
                  • {t.titulo}
                </li>
              ))}
              {derivado.tarefasAtrasadas.length > 3 && (
                <li className="text-xs text-gray-400">
                  + {derivado.tarefasAtrasadas.length - 3} mais
                </li>
              )}
              {derivado.tarefasAtrasadas.length === 0 && (
                <li className="text-xs text-gray-400">Nada atrasado. 🎉</li>
              )}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Compromissos agendados
              </p>
              <VerTudo href="/dashboard/hoje" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-[#2D3230]">
              {data.compromissos.length}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {data.compromissos.slice(0, 4).map((c) => (
                <li key={c.id} className="truncate">
                  <span className="font-medium text-[#24483F]">
                    {c.hora ?? "—"}
                  </span>{" "}
                  {c.titulo}
                </li>
              ))}
              {data.compromissos.length === 0 && (
                <li className="text-xs text-gray-400">Agenda livre.</li>
              )}
            </ul>
          </Card>
        </div>
      </Secao>

      {/* ===== NEGÓCIO ===== */}
      <Secao titulo="Negócio">
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi
            label="Receita do mês"
            valor={formatBRL(derivado.receitaMes)}
            tom="positivo"
            variacao={crescimento(derivado.receitaMes, derivado.receitaPrev)}
          />
          <Kpi
            label="Despesas do mês"
            valor={formatBRL(derivado.despesaMes)}
            tom="negativo"
            variacao={crescimento(derivado.despesaMes, derivado.despesaPrev)}
          />
          <Kpi
            label="Resultado do mês"
            valor={formatBRL(derivado.resultadoMes)}
            tom={derivado.resultadoMes >= 0 ? "positivo" : "negativo"}
            variacao={crescimento(
              derivado.resultadoMes,
              derivado.resultadoPrev,
            )}
          />
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#2D3230]">
              {derivado.metaPrincipal
                ? `Meta: ${derivado.metaPrincipal.nome}`
                : "Meta do mês"}
            </p>
            <VerTudo href="/dashboard/financeiro" texto="Ver detalhes" />
          </div>
          {derivado.metaPrincipal ? (
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-[#24483F]">
                  {derivado.metaPct}%
                </span>
                <span className="text-xs text-gray-500">
                  {formatBRL(derivado.metaAtual)}
                  {derivado.metaPrincipal.valor_alvo != null && (
                    <>
                      {" "}
                      de{" "}
                      <span className="font-medium text-gray-700">
                        {formatBRL(derivado.metaPrincipal.valor_alvo)}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <Barra
                pct={derivado.metaPct}
                cor={
                  derivado.metaPct >= 100
                    ? "#059669"
                    : derivado.metaPct >= 70
                      ? "#E3BD62"
                      : "#24483F"
                }
              />
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              Nenhuma meta ativa neste mês.
            </p>
          )}
        </Card>
      </Secao>

      {/* ===== OPERAÇÃO ===== */}
      <Secao titulo="Operação">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#2D3230]">
                Projetos ativos
              </p>
              <VerTudo href="/dashboard/projetos" texto="Ver todos" />
            </div>
            <div className="mt-3 space-y-3">
              {derivado.projetos.length === 0 && (
                <p className="text-xs text-gray-400">Nenhum projeto ativo.</p>
              )}
              {derivado.projetos.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projetos/${p.id}`}
                  className={`block rounded-lg border p-2.5 transition-colors ${
                    p.atrasadas > 0
                      ? "border-amber-200 bg-amber-50/70 hover:bg-amber-50"
                      : "border-black/5 hover:bg-black/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                      {p.nome}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#24483F]">
                      {p.pct}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {p.fase ? `Fase: ${p.fase}` : "Sem fases"}
                    {p.atrasadas > 0 && (
                      <span className="ml-2 font-medium text-amber-700">
                        {p.atrasadas} atrasada{p.atrasadas === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5">
                    <Barra pct={p.pct} cor="#24483F" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-medium text-[#2D3230]">
              Próximos prazos (7 dias)
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {derivado.proximosPrazos.length === 0 && (
                <li className="text-xs text-gray-400">
                  Nenhum prazo nos próximos 7 dias.
                </li>
              )}
              {derivado.proximosPrazos.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 border-b border-black/5 pb-2 last:border-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-gray-700">
                    {t.titulo}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-gray-500">
                    {(t.data_prazo ?? "").slice(8, 10)}/
                    {(t.data_prazo ?? "").slice(5, 7)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Secao>

      {/* ===== MARKETING ===== */}
      <Secao titulo="Marketing">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#2D3230]">
                Conteúdos desta semana
              </p>
              <VerTudo href="/dashboard/marketing" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-[#2D3230]">
              {data.conteudos.length}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {data.conteudos.slice(0, 4).map((c) => (
                <li key={c.id} className="truncate">
                  • {c.titulo}
                  {c.canal && (
                    <span className="text-xs text-gray-400"> — {c.canal}</span>
                  )}
                </li>
              ))}
              {data.conteudos.length === 0 && (
                <li className="text-xs text-gray-400">
                  Nada agendado para os próximos 7 dias.
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <p className="text-sm font-medium text-[#2D3230]">Campanhas ativas</p>
            <div className="mt-3 space-y-2 text-sm">
              {campanhas.length === 0 && (
                <p className="text-xs text-gray-400">Nenhuma campanha ativa.</p>
              )}
              {campanhas.map((c) => {
                const consumido =
                  c.orcamento_planejado && c.orcamento_planejado > 0
                    ? Math.round(
                        ((c.gasto_real ?? 0) / c.orcamento_planejado) * 100,
                      )
                    : null;
                return (
                  <div
                    key={c.id}
                    className="border-b border-black/5 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                        {c.nome}
                      </span>
                      {c.canal && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {c.canal}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatBRL(c.gasto_real)} de{" "}
                      {formatBRL(c.orcamento_planejado)}
                      {consumido != null && (
                        <span className="ml-1 font-medium text-[#24483F]">
                          ({consumido}%)
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Secao>

      {/* ===== CONTINUAR DE ONDE PAROU ===== */}
      <Secao titulo="Continuar de onde parou">
        <Card>
          {data.recentes.length === 0 ? (
            <p className="text-xs text-gray-400">Nada editado recentemente.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {data.recentes.map((r) => {
                const meta = RECENTE_META[r.tipo];
                const Icone = meta.icone;
                return (
                  <li key={`${r.tipo}-${r.id}`}>
                    <Link
                      href={meta.href(r.id)}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-black/[0.02]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#24483F]/10 text-[#24483F]">
                        <Icone className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {r.titulo}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {meta.modulo}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {tempoRelativo(r.updated_at, agoraMs)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </Secao>
    </div>
  );
}
