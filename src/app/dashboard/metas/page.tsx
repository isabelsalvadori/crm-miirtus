import { createClient } from "@/lib/supabase/server";
import { MetasList, type MetaCard, type OptionLite } from "./components/MetasList";
import { META_COLUNAS_OPCIONAIS, detectarColunasMeta } from "./db";

const BASE_COLS =
  "id, nome, descricao, tipo, indicador, unidade, valor_alvo, valor_atual, periodo_inicio, periodo_fim, status, projeto_id, created_at";

type Row = Record<string, unknown>;

const hojeYmd = () => new Date().toISOString().slice(0, 10);

/** Soma das receitas (tabela `movimentacoes_financeiras`) por meta financeira. */
async function calcularValoresFinanceiros(
  supabase: ReturnType<typeof createClient>,
  metas: Row[],
): Promise<Map<string, number>> {
  const financeiras = metas.filter(
    (m) => m.tipo === "financeira" && m.periodo_inicio,
  );
  const resultado = new Map<string, number>();
  if (financeiras.length === 0) return resultado;

  const hoje = hojeYmd();
  const limites = financeiras.map((m) => ({
    inicio: String(m.periodo_inicio).slice(0, 10),
    fim: (m.periodo_fim ? String(m.periodo_fim) : hoje).slice(0, 10),
  }));
  const minInicio = limites.reduce((a, b) => (b.inicio < a ? b.inicio : a), limites[0].inicio);
  const maxFim = limites.reduce((a, b) => (b.fim > a ? b.fim : a), limites[0].fim);

  const { data, error } = await supabase
    .from("movimentacoes_financeiras")
    .select("valor, data_competencia")
    .eq("tipo", "receita")
    .is("arquivado_em", null)
    .gte("data_competencia", minInicio)
    .lte("data_competencia", maxFim);

  if (error) {
    console.error("Erro ao calcular metas financeiras:", error);
    return resultado;
  }

  const receitas = ((data ?? []) as { valor: number | string; data_competencia: string | null }[])
    .filter((r) => r.data_competencia)
    .map((r) => ({
      valor: Number(r.valor) || 0,
      data: String(r.data_competencia).slice(0, 10),
    }));

  for (const meta of financeiras) {
    const inicio = String(meta.periodo_inicio).slice(0, 10);
    const fim = (meta.periodo_fim ? String(meta.periodo_fim) : hoje).slice(0, 10);
    const soma = receitas
      .filter((r) => r.data >= inicio && r.data <= fim)
      .reduce((acc, r) => acc + r.valor, 0);
    resultado.set(meta.id as string, soma);
  }

  return resultado;
}

async function catalogo(
  supabase: ReturnType<typeof createClient>,
  tabela: string,
): Promise<OptionLite[]> {
  const { data } = await supabase
    .from(tabela)
    .select("id, nome")
    .is("arquivado_em", null)
    .order("nome")
    .limit(300);
  return ((data ?? []) as OptionLite[]).map((o) => ({
    id: o.id,
    nome: o.nome || "(sem nome)",
  }));
}

export default async function MetasPage() {
  const supabase = createClient();

  const cols = await detectarColunasMeta(supabase);
  const select = [
    BASE_COLS,
    ...META_COLUNAS_OPCIONAIS.filter((c) => cols.has(c)),
  ].join(", ");

  const [{ data: metasRaw, error }, projetos, produtos, eventos] =
    await Promise.all([
      supabase
        .from("metas")
        .select(select)
        .is("arquivado_em", null)
        .order("created_at", { ascending: false }),
      catalogo(supabase, "projetos"),
      catalogo(supabase, "produtos"),
      catalogo(supabase, "eventos"),
    ]);

  const metas = (metasRaw ?? []) as unknown as Row[];
  const financeiros = await calcularValoresFinanceiros(supabase, metas);

  const cards: MetaCard[] = metas.map((m) => {
    const calculado = financeiros.get(m.id as string);
    return {
      id: m.id as string,
      nome: m.nome as string,
      descricao: (m.descricao as string | null) ?? null,
      tipo: (m.tipo as string | null) ?? null,
      indicador: (m.indicador as string | null) ?? null,
      unidade: (m.unidade as string | null) ?? null,
      valor_alvo:
        m.valor_alvo != null ? Number(m.valor_alvo) : null,
      valor_atual:
        calculado != null
          ? calculado
          : m.valor_atual != null
            ? Number(m.valor_atual)
            : 0,
      calculado_automaticamente: calculado != null,
      periodo_inicio: (m.periodo_inicio as string | null) ?? null,
      periodo_fim: (m.periodo_fim as string | null) ?? null,
      status: (m.status as string | null) ?? null,
      projeto_id: (m.projeto_id as string | null) ?? null,
      produto_id: (m.produto_id as string | null) ?? null,
      evento_id: (m.evento_id as string | null) ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar as metas. Recarregue a página.
        </div>
      ) : (
        <MetasList
          metas={cards}
          colunas={Array.from(cols)}
          projetos={projetos}
          produtos={produtos}
          eventos={eventos}
        />
      )}
    </div>
  );
}
