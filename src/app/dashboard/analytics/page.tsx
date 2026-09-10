import { createClient } from "@/lib/supabase/server";
import { AnalyticsView } from "./components/AnalyticsView";
import type {
  CampanhaAnalytics,
  ConteudoAnalytics,
  MetaAnalytics,
  MovAnalytics,
  OptionLite,
} from "./types";

const num = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v);

export default async function AnalyticsPage() {
  const supabase = createClient();

  const [movRes, produtosRes, projetosRes, campanhasRes, conteudosRes, metasRes] =
    await Promise.all([
      supabase
        .from("movimentacoes_financeiras")
        .select(
          "id, tipo, valor, status, data_competencia, data_pagamento, produto_id, projeto_id",
        )
        .is("arquivado_em", null),
      supabase
        .from("produtos")
        .select("id, nome")
        .is("arquivado_em", null)
        .order("nome"),
      supabase
        .from("projetos")
        .select("id, nome")
        .is("arquivado_em", null)
        .order("nome"),
      supabase.from("campanhas").select("*").is("arquivado_em", null),
      supabase
        .from("conteudos")
        .select(
          "id, canal, status, created_at, data_publicacao, produto_id, projeto_id",
        )
        .is("arquivado_em", null),
      supabase
        .from("metas")
        .select(
          "id, nome, tipo, unidade, valor_alvo, valor_atual, status, periodo_inicio, periodo_fim, produto_id, projeto_id",
        )
        .is("arquivado_em", null),
    ]);

  const erro =
    movRes.error ||
    produtosRes.error ||
    projetosRes.error ||
    campanhasRes.error ||
    conteudosRes.error ||
    metasRes.error;

  if (erro) {
    console.error("Erro ao carregar Analytics:", erro);
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar os dados de Analytics. Recarregue a página.
        </div>
      </div>
    );
  }

  const movimentacoes: MovAnalytics[] = (
    (movRes.data ?? []) as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    tipo: (r.tipo as string | null) ?? null,
    valor: Number(r.valor) || 0,
    status: (r.status as string | null) ?? null,
    data_competencia: (r.data_competencia as string | null) ?? null,
    data_pagamento: (r.data_pagamento as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const campanhas: CampanhaAnalytics[] = (
    (campanhasRes.data ?? []) as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    nome: (r.nome as string) ?? "(sem nome)",
    status: (r.status as string | null) ?? null,
    orcamento_planejado: num(r.orcamento_planejado ?? r.orcamento_previsto),
    gasto_real: num(r.gasto_real ?? r.orcamento_realizado),
    receita_gerada: num(r.receita_gerada),
    vendas: num(r.vendas),
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const conteudos: ConteudoAnalytics[] = (
    (conteudosRes.data ?? []) as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    canal: (r.canal as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    created_at: (r.created_at as string | null) ?? null,
    data_publicacao: (r.data_publicacao as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const metas: MetaAnalytics[] = (
    (metasRes.data ?? []) as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    nome: (r.nome as string) ?? "(sem nome)",
    tipo: (r.tipo as string | null) ?? null,
    unidade: (r.unidade as string | null) ?? null,
    valor_alvo: num(r.valor_alvo),
    valor_atual: num(r.valor_atual),
    status: (r.status as string | null) ?? null,
    periodo_inicio: (r.periodo_inicio as string | null) ?? null,
    periodo_fim: (r.periodo_fim as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const produtos = (produtosRes.data ?? []) as OptionLite[];
  const projetos = (projetosRes.data ?? []) as OptionLite[];

  return (
    <AnalyticsView
      data={{ movimentacoes, produtos, projetos, campanhas, conteudos, metas }}
    />
  );
}
