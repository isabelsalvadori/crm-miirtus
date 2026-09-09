import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Colunas opcionais de `tarefas` usadas pelo painel Hoje. Vieram nas
 * migrações 0003 e 0006 e podem não existir em todos os bancos; cada uma
 * é detectada individualmente (probe em paralelo) e o módulo funciona
 * sem elas, escondendo os campos correspondentes.
 */
export const TAREFA_COLUNAS_OPCIONAIS = [
  "observacoes",
  "produto_id",
  "evento_id",
  "cliente_id",
  "ideia_id",
  "campanha_id",
  "agenda_data",
  "agenda_hora_inicio",
  "agenda_hora_fim",
] as const;

export type TarefaColunaOpcional = (typeof TAREFA_COLUNAS_OPCIONAIS)[number];

export async function detectarColunasTarefa(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const resultados = await Promise.all(
    TAREFA_COLUNAS_OPCIONAIS.map((col) =>
      supabase
        .from("tarefas")
        .select(col)
        .limit(1)
        .then((res) => (res.error ? null : col)),
    ),
  );
  return new Set(
    resultados.filter((c): c is TarefaColunaOpcional => c !== null),
  );
}

/** Mantém no payload apenas as chaves cujas colunas existem no banco. */
export function selecionarColunas(
  cols: Set<string>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of TAREFA_COLUNAS_OPCIONAIS) {
    if (cols.has(key) && key in values) out[key] = values[key];
  }
  return out;
}
