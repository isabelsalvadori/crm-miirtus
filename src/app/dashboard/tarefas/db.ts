import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Colunas de `tarefas`. As "opcionais" dependem da migração 0003;
 * o módulo funciona sem elas e cada uma é detectada individualmente,
 * então uma migração parcial (só `observacoes`, por ex.) também vale.
 */
export const TAREFA_BASE_COLUMNS =
  "id, titulo, descricao, status, prioridade, parent_id, projeto_id, data_prazo, data_conclusao, ordem, created_at, updated_at, arquivado_em";

export const EXT_COLUMN_CANDIDATES = [
  "observacoes",
  "produto_id",
  "na_agenda",
  "agenda_inicio",
  "agenda_fim",
] as const;

export type ExtColumn = (typeof EXT_COLUMN_CANDIDATES)[number];

/** Descobre quais colunas opcionais existem (probe individual, em paralelo). */
export async function detectTarefaColumns(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const results = await Promise.all(
    EXT_COLUMN_CANDIDATES.map((col) =>
      supabase
        .from("tarefas")
        .select(col)
        .limit(1)
        .then((res) => (res.error ? null : col)),
    ),
  );
  return new Set(results.filter((c): c is ExtColumn => c !== null));
}

export function tarefaSelect(cols: Set<string>, withTags = false): string {
  const ext = EXT_COLUMN_CANDIDATES.filter((c) => cols.has(c));
  const base = ext.length
    ? `${TAREFA_BASE_COLUMNS}, ${ext.join(", ")}`
    : TAREFA_BASE_COLUMNS;
  return withTags ? `${base}, tarefa_tag(tags(id, nome, cor))` : base;
}

/** Mantém no payload apenas as chaves opcionais cujas colunas existem. */
export function pickExtPayload(
  cols: Set<string>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of EXT_COLUMN_CANDIDATES) {
    if (cols.has(key) && key in values) out[key] = values[key];
  }
  return out;
}

type MaybeTagWrap = { tags: { id: string; nome: string; cor: string | null } | null };

/** Achata `tarefa_tag(tags(...))` em uma lista de tags. */
export function flattenTags(
  row: { tarefa_tag?: MaybeTagWrap[] | null } | null | undefined,
): { id: string; nome: string; cor: string | null }[] {
  const rels = row?.tarefa_tag ?? [];
  return rels
    .map((rel) => rel.tags)
    .filter(
      (tag): tag is { id: string; nome: string; cor: string | null } =>
        Boolean(tag),
    );
}
