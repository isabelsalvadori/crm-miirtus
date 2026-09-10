import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AcaoOrganicaItem,
  Catalogos,
  CampanhaItem,
  ConteudoItem,
} from "./types";

const num = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v);

/**
 * O módulo de Marketing usa colunas que podem ainda não existir no banco
 * (migração 0010). Cada coluna opcional é testada em runtime; os campos
 * correspondentes só são lidos/gravados quando a coluna está presente.
 * Mesmo padrão de `eventos/db.ts` e `metas/db.ts`.
 */

export const CONTEUDO_COLS = [
  "titulo",
  "tipo",
  "canal",
  "status",
  "pilar",
  "resumo",
  "corpo_roteiro",
  "produto_id",
  "projeto_id",
  "campanha_id",
  "data_agendada",
  "data_publicacao",
  "link_publicado",
  "created_at",
  "updated_at",
] as const;

export const CAMPANHA_COLS = [
  "nome",
  "tipo",
  "objetivo",
  "status",
  "canal_principal",
  "orcamento_planejado",
  "gasto_real",
  "receita_gerada",
  "leads",
  "vendas",
  "produto_id",
  "projeto_id",
  "evento_id",
  "periodo_inicio",
  "periodo_fim",
  "created_at",
  "updated_at",
] as const;

export const ACAO_COLS = [
  "nome",
  "tipo",
  "canal_local",
  "data",
  "status",
  "custo",
  "contatos_gerados",
  "cliques",
  "inscricoes",
  "leads",
  "vendas",
  "receita_atribuida",
  "produto_id",
  "projeto_id",
  "evento_id",
  "campanha_id",
  "created_at",
  "updated_at",
] as const;

/** Devolve o conjunto de colunas de `tabela` que realmente existem. */
export async function detectarColunas(
  supabase: SupabaseClient,
  tabela: string,
  colunas: readonly string[],
): Promise<Set<string>> {
  const resultados = await Promise.all(
    colunas.map((col) =>
      supabase
        .from(tabela)
        .select(col)
        .limit(1)
        .then((res) => (res.error ? null : col)),
    ),
  );
  return new Set(resultados.filter((c): c is string => c !== null));
}

/** "id, a, b, c" a partir das colunas base garantidas + opcionais existentes. */
export function montarSelect(
  base: readonly string[],
  cols: Set<string>,
  opcionais: readonly string[],
): string {
  return [...base, ...opcionais.filter((c) => cols.has(c))].join(", ");
}

/** Mantém no payload apenas as chaves cujas colunas existem no banco. */
export function apenasColunas(
  cols: Set<string>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (cols.has(key)) out[key] = value;
  }
  return out;
}

export type OptionLite = { id: string; nome: string };

/** Lista curta {id, nome} de uma tabela para popular selects de vínculo. */
export async function catalogo(
  supabase: SupabaseClient,
  tabela: string,
  coluna: "nome" | "titulo" = "nome",
): Promise<OptionLite[]> {
  const { data } = await supabase
    .from(tabela)
    .select(`id, ${coluna}`)
    .is("arquivado_em", null)
    .order(coluna)
    .limit(300);
  return ((data ?? []) as Record<string, string>[]).map((row) => ({
    id: row.id,
    nome: row[coluna] || "(sem nome)",
  }));
}

/** Produtos, projetos, campanhas e eventos — para os selects dos modais. */
export async function carregarCatalogos(
  supabase: SupabaseClient,
): Promise<Catalogos> {
  const [produtos, projetos, campanhas, eventos] = await Promise.all([
    catalogo(supabase, "produtos"),
    catalogo(supabase, "projetos"),
    catalogo(supabase, "campanhas"),
    catalogo(supabase, "eventos"),
  ]);
  return { produtos, projetos, campanhas, eventos };
}

/**
 * Conteúdos ativos (arquivado_em IS NULL). Com `apenasComData`, restringe
 * aos que têm `data_agendada` preenchida (usado pelo calendário editorial).
 */
export async function carregarConteudos(
  supabase: SupabaseClient,
  { apenasComData = false }: { apenasComData?: boolean } = {},
): Promise<{ itens: ConteudoItem[]; error: unknown }> {
  const cols = await detectarColunas(supabase, "conteudos", CONTEUDO_COLS);
  const select = montarSelect(["id", "titulo"], cols, [
    "tipo",
    "canal",
    "status",
    "pilar",
    "resumo",
    "corpo_roteiro",
    "produto_id",
    "projeto_id",
    "campanha_id",
    "data_agendada",
    "data_publicacao",
    "link_publicado",
  ]);

  let query = supabase
    .from("conteudos")
    .select(select)
    .is("arquivado_em", null);

  if (apenasComData && cols.has("data_agendada")) {
    query = query.not("data_agendada", "is", null);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Record<string, unknown>[];

  const produtoIds = Array.from(
    new Set(rows.map((r) => r.produto_id).filter(Boolean) as string[]),
  );
  const produtoNome = new Map<string, string>();
  if (produtoIds.length > 0) {
    const { data: prods } = await supabase
      .from("produtos")
      .select("id, nome")
      .in("id", produtoIds);
    for (const p of (prods ?? []) as { id: string; nome: string }[]) {
      produtoNome.set(p.id, p.nome);
    }
  }

  const itens: ConteudoItem[] = rows.map((r) => ({
    id: r.id as string,
    titulo: r.titulo as string,
    tipo: (r.tipo as string | null) ?? null,
    canal: (r.canal as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    pilar: (r.pilar as string | null) ?? null,
    resumo: (r.resumo as string | null) ?? null,
    corpo_roteiro: (r.corpo_roteiro as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
    campanha_id: (r.campanha_id as string | null) ?? null,
    data_agendada: (r.data_agendada as string | null) ?? null,
    data_publicacao: (r.data_publicacao as string | null) ?? null,
    link_publicado: (r.link_publicado as string | null) ?? null,
    produto_nome: r.produto_id
      ? produtoNome.get(r.produto_id as string) ?? null
      : null,
  }));

  return { itens, error };
}

/** Campanhas ativas, mais recentes primeiro. */
export async function carregarCampanhas(
  supabase: SupabaseClient,
): Promise<{ itens: CampanhaItem[]; error: unknown }> {
  const cols = await detectarColunas(supabase, "campanhas", CAMPANHA_COLS);
  const select = montarSelect(["id", "nome"], cols, [
    "tipo",
    "objetivo",
    "status",
    "canal_principal",
    "orcamento_planejado",
    "gasto_real",
    "receita_gerada",
    "leads",
    "vendas",
    "produto_id",
    "projeto_id",
    "evento_id",
    "periodo_inicio",
    "periodo_fim",
  ]);

  const { data, error } = await supabase
    .from("campanhas")
    .select(select)
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const itens: CampanhaItem[] = (
    (data ?? []) as unknown as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    nome: r.nome as string,
    tipo: (r.tipo as string | null) ?? null,
    objetivo: (r.objetivo as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    canal_principal: (r.canal_principal as string | null) ?? null,
    orcamento_planejado: num(r.orcamento_planejado),
    gasto_real: num(r.gasto_real),
    receita_gerada: num(r.receita_gerada),
    leads: num(r.leads),
    vendas: num(r.vendas),
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
    evento_id: (r.evento_id as string | null) ?? null,
    periodo_inicio: (r.periodo_inicio as string | null) ?? null,
    periodo_fim: (r.periodo_fim as string | null) ?? null,
  }));

  return { itens, error };
}

/** Ações orgânicas ativas, mais recentes primeiro. */
export async function carregarAcoesOrganicas(
  supabase: SupabaseClient,
): Promise<{ itens: AcaoOrganicaItem[]; error: unknown }> {
  const cols = await detectarColunas(supabase, "acoes_organicas", ACAO_COLS);
  const select = montarSelect(["id", "nome"], cols, [
    "tipo",
    "canal_local",
    "data",
    "status",
    "custo",
    "contatos_gerados",
    "cliques",
    "inscricoes",
    "leads",
    "vendas",
    "receita_atribuida",
    "produto_id",
    "projeto_id",
    "evento_id",
    "campanha_id",
  ]);

  const { data, error } = await supabase
    .from("acoes_organicas")
    .select(select)
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const itens: AcaoOrganicaItem[] = (
    (data ?? []) as unknown as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    nome: r.nome as string,
    tipo: (r.tipo as string | null) ?? null,
    canal_local: (r.canal_local as string | null) ?? null,
    data: (r.data as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    custo: num(r.custo),
    contatos_gerados: num(r.contatos_gerados),
    cliques: num(r.cliques),
    inscricoes: num(r.inscricoes),
    leads: num(r.leads),
    vendas: num(r.vendas),
    receita_atribuida: num(r.receita_atribuida),
    produto_id: (r.produto_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
    evento_id: (r.evento_id as string | null) ?? null,
    campanha_id: (r.campanha_id as string | null) ?? null,
  }));

  return { itens, error };
}
