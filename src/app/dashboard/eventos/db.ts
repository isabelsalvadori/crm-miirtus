import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Colunas de `edicoes_evento` adicionadas pela migração 0007. Podem não
 * existir ainda; são detectadas em runtime e os campos correspondentes só
 * aparecem quando a coluna está presente.
 */
export const EDICAO_COLUNAS_OPCIONAIS = [
  "modelo_acesso",
  "preco",
  "projeto_id",
  "resumo",
] as const;

export type EdicaoColunaOpcional = (typeof EDICAO_COLUNAS_OPCIONAIS)[number];

export async function detectarColunasEdicao(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const resultados = await Promise.all(
    EDICAO_COLUNAS_OPCIONAIS.map((col) =>
      supabase
        .from("edicoes_evento")
        .select(col)
        .limit(1)
        .then((res) => (res.error ? null : col)),
    ),
  );
  return new Set(
    resultados.filter((c): c is EdicaoColunaOpcional => c !== null),
  );
}

/** Mantém no payload apenas as chaves cujas colunas existem no banco. */
export function selecionarColunasEdicao(
  cols: Set<string>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of EDICAO_COLUNAS_OPCIONAIS) {
    if (cols.has(key) && key in values) out[key] = values[key];
  }
  return out;
}
