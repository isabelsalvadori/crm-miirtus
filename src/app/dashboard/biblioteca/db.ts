import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Catalogos,
  DocumentoItem,
  EntidadeBiblioteca,
  OptionLite,
  TagLite,
} from "./types";

/**
 * Colunas de `documentos` que a Biblioteca usa mas podem ainda não
 * existir (migração 0011). Detectadas em runtime — mesmo padrão de
 * `eventos/db.ts` e `marketing/db.ts`.
 */
export const DOC_COLS = [
  "titulo",
  "tipo",
  "descricao",
  "url",
  "entidade_id",
  "pessoa_id",
  "projeto_id",
  "produto_id",
  "fonte",
  "resumo",
  "anotacoes",
  "aplicacoes",
  "created_at",
  "updated_at",
] as const;

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

export function montarSelect(
  base: readonly string[],
  cols: Set<string>,
  opcionais: readonly string[],
): string {
  return [...base, ...opcionais.filter((c) => cols.has(c))].join(", ");
}

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

async function catalogo(
  supabase: SupabaseClient,
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

export async function carregarTags(
  supabase: SupabaseClient,
): Promise<TagLite[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, nome, cor")
    .order("nome");
  if (error) return [];
  return (data ?? []) as TagLite[];
}

export async function carregarCatalogos(
  supabase: SupabaseClient,
): Promise<Catalogos> {
  const [produtos, projetos, tags] = await Promise.all([
    catalogo(supabase, "produtos"),
    catalogo(supabase, "projetos"),
    carregarTags(supabase),
  ]);
  return { produtos, projetos, tags };
}

type TagWrap = { tags: TagLite | null };

function flattenTags(rels: TagWrap[] | null | undefined): TagLite[] {
  return (rels ?? [])
    .map((r) => r.tags)
    .filter((t): t is TagLite => Boolean(t));
}

function mapDocumento(r: Record<string, unknown>): DocumentoItem {
  return {
    id: r.id as string,
    titulo: r.titulo as string,
    tipo: (r.tipo as string | null) ?? null,
    descricao: (r.descricao as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    entidade_id: (r.entidade_id as string | null) ?? null,
    pessoa_id: (r.pessoa_id as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
    produto_id: (r.produto_id as string | null) ?? null,
    fonte: (r.fonte as string | null) ?? null,
    resumo: (r.resumo as string | null) ?? null,
    anotacoes: (r.anotacoes as string | null) ?? null,
    aplicacoes: (r.aplicacoes as string | null) ?? null,
    tags: flattenTags(r.documento_tag as TagWrap[] | null),
  };
}

/** Documentos de um acervo da Biblioteca (por `entidade_tipo`), ativos. */
export async function carregarDocumentos(
  supabase: SupabaseClient,
  entidadeTipo: EntidadeBiblioteca,
): Promise<{ itens: DocumentoItem[]; error: unknown }> {
  const cols = await detectarColunas(supabase, "documentos", DOC_COLS);
  const base = montarSelect(["id", "titulo"], cols, [
    "tipo",
    "descricao",
    "url",
    "entidade_id",
    "pessoa_id",
    "projeto_id",
    "produto_id",
    "fonte",
    "resumo",
    "anotacoes",
    "aplicacoes",
  ]);

  // Tenta trazer as tags junto; se a tabela de junção não existir, refaz sem ela.
  const comTags = await supabase
    .from("documentos")
    .select(`${base}, documento_tag(tags(id, nome, cor))`)
    .eq("entidade_tipo", entidadeTipo)
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const resp = comTags.error
    ? await supabase
        .from("documentos")
        .select(base)
        .eq("entidade_tipo", entidadeTipo)
        .is("arquivado_em", null)
        .order("created_at", { ascending: false })
    : comTags;

  const itens = ((resp.data ?? []) as unknown as Record<string, unknown>[]).map(
    mapDocumento,
  );
  return { itens, error: resp.error };
}
