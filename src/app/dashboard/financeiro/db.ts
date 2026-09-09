import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addMonths,
  endOfMonth,
  mesAnoLabel,
  startOfMonth,
  ymd,
} from "./constants";
import type {
  CategoriaLite,
  ContextoLink,
  FluxoCaixaMes,
  MovimentacaoFull,
  OptionLite,
  ResumoMes,
} from "./types";

export const MOVIMENTACAO_SELECT =
  "id, descricao, tipo, valor, status, data_competencia, data_vencimento, data_pagamento, categoria_id, produto_id, projeto_id, forma_pagamento, comprovante_url, observacoes, categorias_financeiras(id, nome, tipo, cor)";

type MovimentacaoRow = {
  id: string;
  descricao: string;
  tipo: string | null;
  valor: number | string;
  status: string | null;
  data_competencia: string | null;
  data_vencimento: string | null;
  data_pagamento: string | null;
  categoria_id: string | null;
  produto_id: string | null;
  projeto_id: string | null;
  forma_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  categorias_financeiras?: CategoriaLite | CategoriaLite[] | null;
};

function flattenCategoria(
  rel: CategoriaLite | CategoriaLite[] | null | undefined,
): CategoriaLite | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

/** Monta o `MovimentacaoFull` a partir de uma linha crua do Supabase. */
export function mapMovimentacaoRow(
  row: MovimentacaoRow,
  produtoNome: Map<string, string>,
  projetoNome: Map<string, string>,
): MovimentacaoFull {
  const contexto: ContextoLink = row.produto_id && produtoNome.has(row.produto_id)
    ? { tipo: "produto", nome: produtoNome.get(row.produto_id)! }
    : row.projeto_id && projetoNome.has(row.projeto_id)
      ? { tipo: "projeto", nome: projetoNome.get(row.projeto_id)! }
      : null;

  return {
    id: row.id,
    descricao: row.descricao,
    tipo: row.tipo,
    valor: Number(row.valor) || 0,
    status: row.status,
    data_competencia: row.data_competencia,
    data_vencimento: row.data_vencimento,
    data_pagamento: row.data_pagamento,
    categoria_id: row.categoria_id,
    categoria: flattenCategoria(row.categorias_financeiras),
    produto_id: row.produto_id,
    projeto_id: row.projeto_id,
    forma_pagamento: row.forma_pagamento,
    comprovante_url: row.comprovante_url,
    observacoes: row.observacoes,
    contexto,
  };
}

/** Catálogos usados nos filtros e no formulário do modal. */
export async function catalogosFinanceiro(supabase: SupabaseClient): Promise<{
  produtos: OptionLite[];
  projetos: OptionLite[];
  categoriasReceita: CategoriaLite[];
  categoriasDespesa: CategoriaLite[];
}> {
  const [produtosRes, projetosRes, categoriasRes] = await Promise.all([
    supabase.from("produtos").select("id, nome").is("arquivado_em", null).order("nome"),
    supabase.from("projetos").select("id, nome").is("arquivado_em", null).order("nome"),
    supabase
      .from("categorias_financeiras")
      .select("id, nome, tipo, cor")
      .is("arquivado_em", null)
      .order("ordem", { ascending: true })
      .order("nome", { ascending: true }),
  ]);

  const categorias = categoriasRes.data ?? [];
  return {
    produtos: produtosRes.data ?? [],
    projetos: projetosRes.data ?? [],
    categoriasReceita: categorias.filter((c) => c.tipo === "receita"),
    categoriasDespesa: categorias.filter((c) => c.tipo === "despesa"),
  };
}

/** Busca a movimentação aberta no modal (edição), já mapeada. */
export async function buscarMovimentacaoAberta(
  supabase: SupabaseClient,
  movId: string | null,
  produtoNome: Map<string, string>,
  projetoNome: Map<string, string>,
): Promise<MovimentacaoFull | null> {
  if (!movId) return null;
  const { data } = await supabase
    .from("movimentacoes_financeiras")
    .select(MOVIMENTACAO_SELECT)
    .eq("id", movId)
    .is("arquivado_em", null)
    .maybeSingle();
  if (!data) return null;
  return mapMovimentacaoRow(data as unknown as MovimentacaoRow, produtoNome, projetoNome);
}

/** Últimas movimentações dentro de um intervalo de datas (para a Visão Geral). */
export async function movimentacoesRecentes(
  supabase: SupabaseClient,
  range: { inicio: string; fim: string },
  produtoNome: Map<string, string>,
  projetoNome: Map<string, string>,
  limite = 10,
): Promise<MovimentacaoFull[]> {
  const { data } = await supabase
    .from("movimentacoes_financeiras")
    .select(MOVIMENTACAO_SELECT)
    .is("arquivado_em", null)
    .gte("data_competencia", range.inicio)
    .lte("data_competencia", range.fim)
    .order("data_competencia", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);

  return (data ?? []).map((row) =>
    mapMovimentacaoRow(row as unknown as MovimentacaoRow, produtoNome, projetoNome),
  );
}

/** Resumo do mês de referência vs. o mês anterior (receitas/despesas realizadas). */
export async function resumoMensal(
  supabase: SupabaseClient,
  referencia = new Date(),
): Promise<ResumoMes> {
  const inicioAtual = ymd(startOfMonth(referencia));
  const fimAtual = ymd(endOfMonth(referencia));
  const anteriorRef = addMonths(referencia, -1);
  const inicioAnterior = ymd(startOfMonth(anteriorRef));
  const fimAnterior = ymd(endOfMonth(anteriorRef));

  const { data } = await supabase
    .from("movimentacoes_financeiras")
    .select("tipo, valor, status, data_competencia")
    .is("arquivado_em", null)
    .gte("data_competencia", inicioAnterior)
    .lte("data_competencia", fimAtual);

  let receitas = 0;
  let despesas = 0;
  let receitasAnterior = 0;
  let despesasAnterior = 0;

  for (const row of data ?? []) {
    if (!row.data_competencia) continue;
    const valor = Number(row.valor) || 0;
    const dataComp = row.data_competencia.slice(0, 10);
    const dentroAtual = dataComp >= inicioAtual && dataComp <= fimAtual;
    const dentroAnterior = dataComp >= inicioAnterior && dataComp <= fimAnterior;

    if (row.tipo === "receita" && row.status === "recebido") {
      if (dentroAtual) receitas += valor;
      else if (dentroAnterior) receitasAnterior += valor;
    } else if (row.tipo === "despesa" && row.status === "pago") {
      if (dentroAtual) despesas += valor;
      else if (dentroAnterior) despesasAnterior += valor;
    }
  }

  return {
    receitas,
    despesas,
    resultado: receitas - despesas,
    receitasAnterior,
    despesasAnterior,
    resultadoAnterior: receitasAnterior - despesasAnterior,
  };
}

/** Totais pendentes (status = previsto, cobre também os já vencidos/atrasados). */
export async function totaisPendentes(
  supabase: SupabaseClient,
): Promise<{ aReceber: number; aPagar: number }> {
  const { data } = await supabase
    .from("movimentacoes_financeiras")
    .select("tipo, valor")
    .is("arquivado_em", null)
    .eq("status", "previsto");

  let aReceber = 0;
  let aPagar = 0;
  for (const row of data ?? []) {
    const valor = Number(row.valor) || 0;
    if (row.tipo === "receita") aReceber += valor;
    else if (row.tipo === "despesa") aPagar += valor;
  }
  return { aReceber, aPagar };
}

/** Meses do fluxo de caixa: janeiro do ano atual até 6 meses à frente do mês atual. */
export function mesesFluxoCaixa(
  hoje = new Date(),
): { chave: string; label: string }[] {
  const inicio = new Date(hoje.getFullYear(), 0, 1);
  const fim = addMonths(hoje, 6);
  const meses: { chave: string; label: string }[] = [];
  let cursor = inicio;
  while (cursor <= fim) {
    meses.push({
      chave: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      label: mesAnoLabel(cursor),
    });
    cursor = addMonths(cursor, 1);
  }
  return meses;
}

/** Fluxo de caixa mensal: previsto vs. realizado, agrupado por competência. */
export async function fluxoDeCaixa(
  supabase: SupabaseClient,
  hoje = new Date(),
): Promise<FluxoCaixaMes[]> {
  const meses = mesesFluxoCaixa(hoje);

  const { data } = await supabase
    .from("movimentacoes_financeiras")
    .select("tipo, valor, status, data_competencia, data_vencimento")
    .is("arquivado_em", null);

  type Bucket = {
    receitasPrevistas: number;
    despesasPrevistas: number;
    receitasRealizadas: number;
    despesasRealizadas: number;
  };
  const acumulado = new Map<string, Bucket>();
  for (const m of meses) {
    acumulado.set(m.chave, {
      receitasPrevistas: 0,
      despesasPrevistas: 0,
      receitasRealizadas: 0,
      despesasRealizadas: 0,
    });
  }

  for (const row of data ?? []) {
    const dataRef = row.data_competencia ?? row.data_vencimento;
    if (!dataRef) continue;
    const chave = dataRef.slice(0, 7);
    const bucket = acumulado.get(chave);
    if (!bucket) continue;

    const valor = Number(row.valor) || 0;
    if (row.tipo === "receita") {
      if (row.status === "recebido") bucket.receitasRealizadas += valor;
      else if (row.status === "previsto") bucket.receitasPrevistas += valor;
    } else if (row.tipo === "despesa") {
      if (row.status === "pago") bucket.despesasRealizadas += valor;
      else if (row.status === "previsto") bucket.despesasPrevistas += valor;
    }
  }

  return meses.map((m) => {
    const b = acumulado.get(m.chave)!;
    return {
      chave: m.chave,
      label: m.label,
      ...b,
      saldoProjetado:
        b.receitasPrevistas + b.receitasRealizadas - (b.despesasPrevistas + b.despesasRealizadas),
      saldoReal: b.receitasRealizadas - b.despesasRealizadas,
    };
  });
}
