import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `metas` nasce com apenas `projeto_id` como vínculo. As colunas abaixo são
 * opcionais: quando existirem (migração futura), os selects de Produto/Evento
 * do modal passam a persistir; enquanto não existirem, são ignoradas.
 */
export const META_COLUNAS_OPCIONAIS = ["produto_id", "evento_id"] as const;

export type MetaColunaOpcional = (typeof META_COLUNAS_OPCIONAIS)[number];

export async function detectarColunasMeta(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const resultados = await Promise.all(
    META_COLUNAS_OPCIONAIS.map((col) =>
      supabase
        .from("metas")
        .select(col)
        .limit(1)
        .then((res) => (res.error ? null : col)),
    ),
  );
  return new Set(
    resultados.filter((c): c is MetaColunaOpcional => c !== null),
  );
}

/** Mantém no payload apenas as chaves cujas colunas existem no banco. */
export function selecionarColunasMeta(
  cols: Set<string>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of META_COLUNAS_OPCIONAIS) {
    if (cols.has(key) && key in values) out[key] = values[key];
  }
  return out;
}
