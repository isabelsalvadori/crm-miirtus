import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Colunas de `tarefas`. As "extras" dependem da migração 0003;
 * enquanto ela não roda, o módulo funciona sem elas.
 */
export const TAREFA_BASE_COLUMNS =
  "id, titulo, descricao, status, prioridade, parent_id, projeto_id, data_prazo, data_conclusao, ordem, created_at, updated_at, arquivado_em";

export const TAREFA_EXT_COLUMNS =
  "produto_id, observacoes, na_agenda, agenda_inicio, agenda_fim";

export const EXT_KEYS = [
  "produto_id",
  "observacoes",
  "na_agenda",
  "agenda_inicio",
  "agenda_fim",
] as const;

let extAvailable: boolean | null = null;

/** Detecta (e cacheia) se as colunas da migração 0003 existem. */
export async function tarefasExtAvailable(
  supabase: SupabaseClient,
): Promise<boolean> {
  if (extAvailable !== null) return extAvailable;
  const { error } = await supabase
    .from("tarefas")
    .select(TAREFA_EXT_COLUMNS)
    .limit(1);
  extAvailable = !error;
  return extAvailable;
}

export function invalidateTarefasExtCache() {
  extAvailable = null;
}

export function tarefaSelect(ext: boolean, withTags = false): string {
  const cols = ext
    ? `${TAREFA_BASE_COLUMNS}, ${TAREFA_EXT_COLUMNS}`
    : TAREFA_BASE_COLUMNS;
  return withTags ? `${cols}, tarefa_tag(tags(id, nome, cor))` : cols;
}

export function stripExtKeys<T extends Record<string, unknown>>(payload: T): T {
  const clone = { ...payload };
  for (const key of EXT_KEYS) delete clone[key];
  return clone;
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
