import type { PostgrestError } from "@supabase/supabase-js";
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

type QueryLike<T> = PromiseLike<{
  data: T[] | null;
  error: PostgrestError | null;
}>;

/**
 * Executa uma query isoladamente: se falhar, loga o erro específico e
 * devolve uma lista vazia — nunca deixa uma fonte quebrar a página toda.
 */
async function carregar<T>(
  rotulo: string,
  query: QueryLike<T>,
  falhas: string[],
): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error(
        `[Analytics] Falha ao carregar "${rotulo}":`,
        error.message,
        error.details ?? "",
        error.hint ?? "",
        error.code ? `(${error.code})` : "",
      );
      falhas.push(rotulo);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error(`[Analytics] Exceção ao carregar "${rotulo}":`, e);
    falhas.push(rotulo);
    return [];
  }
}

export default async function AnalyticsPage() {
  const supabase = createClient();
  const falhas: string[] = [];

  const [movRows, produtosRows, projetosRows, campanhasRows, conteudosRows, metasRows] =
    await Promise.all([
      carregar<Record<string, unknown>>(
        "movimentações financeiras",
        supabase
          .from("movimentacoes_financeiras")
          .select(
            "id, tipo, valor, status, data_competencia, data_pagamento, produto_id, projeto_id",
          )
          .is("arquivado_em", null),
        falhas,
      ),
      carregar<OptionLite>(
        "produtos",
        supabase
          .from("produtos")
          .select("id, nome")
          .is("arquivado_em", null)
          .order("nome"),
        falhas,
      ),
      carregar<OptionLite>(
        "projetos",
        supabase
          .from("projetos")
          .select("id, nome")
          .is("arquivado_em", null)
          .order("nome"),
        falhas,
      ),
      carregar<Record<string, unknown>>(
        "campanhas",
        supabase.from("campanhas").select("*").is("arquivado_em", null),
        falhas,
      ),
      carregar<Record<string, unknown>>(
        "conteúdos",
        supabase
          .from("conteudos")
          .select(
            "id, canal, status, created_at, data_publicacao, produto_id, projeto_id",
          )
          .is("arquivado_em", null),
        falhas,
      ),
      carregar<Record<string, unknown>>(
        "metas",
        supabase
          .from("metas")
          .select(
            "id, nome, tipo, unidade, valor_alvo, valor_atual, status, periodo_inicio, periodo_fim, produto_id, projeto_id",
          )
          .is("arquivado_em", null),
        falhas,
      ),
    ]);

  const movimentacoes: MovAnalytics[] = movRows.map((r) => ({
    id: r.id as string,
    tipo: (r.tipo as string | null) ?? null,
    valor: Number(r.valor) || 0,
    status: (r.status as string | null) ?? null,
    data_competencia: (r.data_competencia as string | null) ?? null,
    data_pagamento: (r.data_pagamento as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const campanhas: CampanhaAnalytics[] = campanhasRows.map((r) => ({
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

  const conteudos: ConteudoAnalytics[] = conteudosRows.map((r) => ({
    id: r.id as string,
    canal: (r.canal as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    created_at: (r.created_at as string | null) ?? null,
    data_publicacao: (r.data_publicacao as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const metas: MetaAnalytics[] = metasRows.map((r) => ({
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

  return (
    <div className="space-y-4">
      {falhas.length > 0 && (
        <div className="mx-auto max-w-6xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível carregar: {falhas.join(", ")}. O restante do painel
          está sendo exibido normalmente.
        </div>
      )}
      <AnalyticsView
        data={{
          movimentacoes,
          produtos: produtosRows,
          projetos: projetosRows,
          campanhas,
          conteudos,
          metas,
        }}
      />
    </div>
  );
}
