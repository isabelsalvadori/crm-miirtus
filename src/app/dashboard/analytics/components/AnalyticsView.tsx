"use client";

import { useMemo, useState } from "react";
import {
  corBarraMeta,
  formatValorMeta,
  metaStatusLabel,
  percentualMeta,
} from "@/app/dashboard/metas/constants";
import {
  COR_DESPESA,
  COR_RECEITA,
  PERIODO_OPTIONS,
  type PeriodoKey,
  cac,
  crescimentoPct,
  dentro,
  formatBRL,
  formatNum,
  mesAtualEAnterior,
  resolverPeriodo,
  roas,
  ultimosMeses,
  ymd,
} from "../constants";
import type {
  AnalyticsData,
  Intervalo,
  MovAnalytics,
} from "../types";
import {
  GraficoReceitaDespesa,
  GraficoReceitaPorProduto,
  GraficoResultadoAcumulado,
} from "./charts";
import { KpiCard, MiniBar, SecaoTitulo, Variacao } from "./ui";

const selectClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

type ResumoFin = {
  receita: number;
  despesa: number;
  resultado: number;
  nReceita: number;
  ticket: number;
};

function resumoFinanceiro(
  movs: MovAnalytics[],
  intervalo: Intervalo,
): ResumoFin {
  let receita = 0;
  let despesa = 0;
  let nReceita = 0;
  for (const m of movs) {
    if (m.status === "cancelado") continue;
    if (!dentro(m.data_competencia, intervalo)) continue;
    if (m.tipo === "receita") {
      receita += m.valor;
      nReceita += 1;
    } else if (m.tipo === "despesa") {
      despesa += m.valor;
    }
  }
  return {
    receita,
    despesa,
    resultado: receita - despesa,
    nReceita,
    ticket: nReceita ? receita / nReceita : 0,
  };
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const hoje = ymd(new Date());
  const [periodo, setPeriodo] = useState<PeriodoKey>("mes_atual");
  const [custom, setCustom] = useState<{ inicio: string; fim: string }>({
    inicio: hoje.slice(0, 8) + "01",
    fim: hoje,
  });
  const [produtoId, setProdutoId] = useState("");
  const [projetoId, setProjetoId] = useState("");

  const intervalo = useMemo(
    () => resolverPeriodo(periodo, custom),
    [periodo, custom],
  );

  const produtoNome = useMemo(
    () => new Map(data.produtos.map((p) => [p.id, p.nome])),
    [data.produtos],
  );

  // --- Filtro global produto/projeto -------------------------------------
  const { movs, conteudos, campanhas, metas } = useMemo(() => {
    const casa = (pid: string | null, jid: string | null) =>
      (!produtoId || pid === produtoId) && (!projetoId || jid === projetoId);
    return {
      movs: data.movimentacoes.filter((m) => casa(m.produto_id, m.projeto_id)),
      conteudos: data.conteudos.filter((c) => casa(c.produto_id, c.projeto_id)),
      campanhas: data.campanhas.filter((c) => casa(c.produto_id, c.projeto_id)),
      metas: data.metas.filter((m) => casa(m.produto_id, m.projeto_id)),
    };
  }, [data, produtoId, projetoId]);

  // --- Seção 1: Financeiro ------------------------------------------------
  const fin = useMemo(() => resumoFinanceiro(movs, intervalo), [movs, intervalo]);

  const seis = useMemo(() => ultimosMeses(6), []);

  const barrasMes = useMemo(
    () =>
      seis.map((mes) => {
        const r = resumoFinanceiro(movs, mes.intervalo);
        return { mes: mes.label, receita: r.receita, despesa: r.despesa };
      }),
    [seis, movs],
  );

  const linhaAcumulada = useMemo(() => {
    let acc = 0;
    return seis.map((mes) => {
      const r = resumoFinanceiro(movs, mes.intervalo);
      acc += r.resultado;
      return { mes: mes.label, acumulado: acc };
    });
  }, [seis, movs]);

  const receitaPorProduto = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of movs) {
      if (m.tipo !== "receita" || m.status === "cancelado") continue;
      if (!dentro(m.data_competencia, intervalo)) continue;
      const chave = m.produto_id ?? "__sem__";
      map.set(chave, (map.get(chave) ?? 0) + m.valor);
    }
    return Array.from(map.entries())
      .map(([id, receita]) => ({
        nome: id === "__sem__" ? "Sem produto" : produtoNome.get(id) ?? "Produto",
        receita,
      }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5);
  }, [movs, intervalo, produtoNome]);

  // --- Seção 2: Metas ---------------------------------------------------
  const metasView = useMemo(() => {
    return metas
      .filter((m) => (m.status ?? "ativa") === "ativa")
      .map((m) => {
        let valorAtual = m.valor_atual ?? 0;
        if (m.tipo === "financeira") {
          const ini = (m.periodo_inicio ?? intervalo.inicio).slice(0, 10);
          const fimMeta = (m.periodo_fim ?? hoje).slice(0, 10);
          valorAtual = movs
            .filter(
              (mv) =>
                mv.tipo === "receita" &&
                mv.status !== "cancelado" &&
                dentro(mv.data_competencia, { inicio: ini, fim: fimMeta }),
            )
            .reduce((acc, mv) => acc + mv.valor, 0);
        }
        const pct = percentualMeta(valorAtual, m.valor_alvo);
        const cores = corBarraMeta(pct, m.periodo_fim);
        return { meta: m, valorAtual, pct, cores };
      });
  }, [metas, movs, intervalo, hoje]);

  // --- Seção 3: Marketing ---------------------------------------------
  const conteudosPeriodo = useMemo(
    () => conteudos.filter((c) => dentro(c.created_at, intervalo)),
    [conteudos, intervalo],
  );

  const porCanal = useMemo(
    () => contar(conteudosPeriodo.map((c) => c.canal ?? "sem canal")),
    [conteudosPeriodo],
  );
  const porStatus = useMemo(
    () => contar(conteudosPeriodo.map((c) => c.status ?? "sem status")),
    [conteudosPeriodo],
  );

  const campanhasAtivas = useMemo(
    () => campanhas.filter((c) => (c.status ?? "") === "ativa"),
    [campanhas],
  );

  // --- Seção 4: Comparação de períodos -------------------------------
  const comparacao = useMemo(() => {
    const { atual, anterior } = mesAtualEAnterior();
    const fa = resumoFinanceiro(movs, atual);
    const fb = resumoFinanceiro(movs, anterior);
    const cAtual = conteudos.filter((c) => dentro(c.created_at, atual)).length;
    const cAnt = conteudos.filter((c) => dentro(c.created_at, anterior)).length;
    return [
      { rotulo: "Receita", atual: fa.receita, anterior: fb.receita, moeda: true },
      { rotulo: "Despesas", atual: fa.despesa, anterior: fb.despesa, moeda: true },
      { rotulo: "Resultado", atual: fa.resultado, anterior: fb.resultado, moeda: true },
      { rotulo: "Conteúdos produzidos", atual: cAtual, anterior: cAnt, moeda: false },
    ];
  }, [movs, conteudos]);

  const maxCanal = Math.max(1, ...porCanal.map((c) => c.valor));
  const maxStatus = Math.max(1, ...porStatus.map((c) => c.valor));

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-[#24483F]">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Financeiro, metas e marketing consolidados no período selecionado.
        </p>
      </div>

      {/* Filtros globais */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
          Período
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as PeriodoKey)}
            className={selectClass}
          >
            {PERIODO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {periodo === "personalizado" && (
          <>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Início
              <input
                type="date"
                value={custom.inicio}
                max={custom.fim}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, inicio: e.target.value }))
                }
                className={selectClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Fim
              <input
                type="date"
                value={custom.fim}
                min={custom.inicio}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, fim: e.target.value }))
                }
                className={selectClass}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
          Produto
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {data.produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
          Projeto
          <select
            value={projetoId}
            onChange={(e) => setProjetoId(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {data.projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto self-center text-xs text-gray-400">
          {intervalo.inicio} → {intervalo.fim}
        </span>
      </div>

      {/* ============ SEÇÃO 1: FINANCEIRO ============ */}
      <section className="space-y-5">
        <SecaoTitulo titulo="Financeiro" descricao="Movimentações do período selecionado." />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Receita total" valor={formatBRL(fin.receita)} tom="positivo" />
          <KpiCard label="Despesa total" valor={formatBRL(fin.despesa)} tom="negativo" />
          <KpiCard
            label="Resultado"
            valor={formatBRL(fin.resultado)}
            tom={fin.resultado >= 0 ? "positivo" : "negativo"}
          />
          <KpiCard
            label="Ticket médio"
            valor={formatBRL(fin.ticket)}
            hint={`${fin.nReceita} ${fin.nReceita === 1 ? "receita" : "receitas"}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-medium text-[#2D3230]">
              Receita vs Despesa por mês
            </p>
            <GraficoReceitaDespesa data={barrasMes} />
            <Legenda />
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-medium text-[#2D3230]">
              Receita por produto (top 5)
            </p>
            {receitaPorProduto.length === 0 ? (
              <Vazio texto="Sem receitas no período." />
            ) : (
              <GraficoReceitaPorProduto data={receitaPorProduto} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium text-[#2D3230]">
            Resultado acumulado por mês
          </p>
          <GraficoResultadoAcumulado data={linhaAcumulada} />
        </div>
      </section>

      {/* ============ SEÇÃO 2: METAS ============ */}
      <section className="space-y-5">
        <SecaoTitulo titulo="Metas" descricao="Progresso das metas ativas." />

        {metasView.length === 0 ? (
          <Vazio texto="Nenhuma meta ativa." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metasView.map(({ meta, valorAtual, pct, cores }) => (
              <div
                key={meta.id}
                className="rounded-xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
                    {meta.nome}
                  </h3>
                  <span className={`shrink-0 text-sm font-semibold ${cores.texto}`}>
                    {pct}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className={`h-full rounded-full transition-all ${cores.barra}`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {formatValorMeta(valorAtual, meta.unidade)}
                  {meta.valor_alvo != null && (
                    <>
                      {" "}
                      de{" "}
                      <span className="font-medium text-gray-700">
                        {formatValorMeta(meta.valor_alvo, meta.unidade)}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                  {meta.tipo === "financeira"
                    ? "Automático via Financeiro"
                    : metaStatusLabel(meta.status)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ SEÇÃO 3: MARKETING ============ */}
      <section className="space-y-5">
        <SecaoTitulo titulo="Marketing" descricao="Produção de conteúdo e campanhas ativas." />

        <div className="grid gap-4 lg:grid-cols-3">
          <KpiCard
            label="Conteúdos no período"
            valor={conteudosPeriodo.length}
            hint="por data de criação"
          />
          <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Por canal
            </p>
            {porCanal.length === 0 ? (
              <Vazio texto="Sem conteúdos." />
            ) : (
              <div className="space-y-2">
                {porCanal.map((c) => (
                  <MiniBar
                    key={c.chave}
                    label={c.chave}
                    valor={c.valor}
                    max={maxCanal}
                    cor={COR_RECEITA}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Por status
            </p>
            {porStatus.length === 0 ? (
              <Vazio texto="Sem conteúdos." />
            ) : (
              <div className="space-y-2">
                {porStatus.map((c) => (
                  <MiniBar
                    key={c.chave}
                    label={c.chave}
                    valor={c.valor}
                    max={maxStatus}
                    cor={COR_DESPESA}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-[#2D3230]">
            Campanhas ativas
          </p>
          {campanhasAtivas.length === 0 ? (
            <Vazio texto="Nenhuma campanha ativa." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-3 font-medium">Campanha</th>
                    <th className="py-2 pr-3 font-medium">Planejado</th>
                    <th className="py-2 pr-3 font-medium">Gasto real</th>
                    <th className="py-2 pr-3 font-medium">ROAS</th>
                    <th className="py-2 font-medium">CAC</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhasAtivas.map((c) => {
                    const r = roas(c.receita_gerada, c.gasto_real);
                    const k = cac(c.gasto_real, c.vendas);
                    return (
                      <tr key={c.id} className="border-b border-black/5 last:border-0">
                        <td className="py-2 pr-3 font-medium text-gray-900">
                          {c.nome}
                        </td>
                        <td className="py-2 pr-3 text-gray-600">
                          {formatBRL(c.orcamento_planejado)}
                        </td>
                        <td className="py-2 pr-3 text-gray-600">
                          {formatBRL(c.gasto_real)}
                        </td>
                        <td className="py-2 pr-3 font-medium text-gray-900">
                          {r == null ? "—" : `${formatNum(r)}x`}
                        </td>
                        <td className="py-2 text-gray-600">
                          {k == null ? "—" : formatBRL(k)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ============ SEÇÃO 4: COMPARAÇÃO DE PERÍODOS ============ */}
      <section className="space-y-5">
        <SecaoTitulo
          titulo="Comparação de períodos"
          descricao="Este mês vs mês anterior."
        />

        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">Indicador</th>
                <th className="px-4 py-3 font-medium">Este mês</th>
                <th className="px-4 py-3 font-medium">Mês anterior</th>
                <th className="px-4 py-3 font-medium">Crescimento</th>
              </tr>
            </thead>
            <tbody>
              {comparacao.map((linha) => {
                const fmt = (n: number) =>
                  linha.moeda ? formatBRL(n) : String(n);
                return (
                  <tr
                    key={linha.rotulo}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {linha.rotulo}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmt(linha.atual)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {fmt(linha.anterior)}
                    </td>
                    <td className="px-4 py-3">
                      <Variacao
                        valor={crescimentoPct(linha.atual, linha.anterior)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------
// Auxiliares locais
// ------------------------------------------------------------

function contar(valores: string[]): { chave: string; valor: number }[] {
  const map = new Map<string, number>();
  for (const v of valores) map.set(v, (map.get(v) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([chave, valor]) => ({ chave, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function Legenda() {
  return (
    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: COR_RECEITA }}
        />
        Receita
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: COR_DESPESA }}
        />
        Despesa
      </span>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <p className="py-8 text-center text-sm text-gray-400">{texto}</p>
  );
}
