import type { SupabaseClient } from "@supabase/supabase-js";
import type { OptionLite, ProgressoInfo } from "./types";

export function calcPercentual(concluidas: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((concluidas / total) * 100);
}

/**
 * Progresso de um projeto = tarefas de topo (sem parent, não arquivadas)
 * concluídas / total. Calculado sob demanda, sem coluna redundante no banco.
 */
export async function progressoDoProjeto(
  supabase: SupabaseClient,
  projetoId: string,
): Promise<ProgressoInfo> {
  const { data } = await supabase
    .from("tarefas")
    .select("status")
    .eq("projeto_id", projetoId)
    .is("parent_id", null)
    .is("arquivado_em", null);

  const rows = data ?? [];
  const total = rows.length;
  const concluidas = rows.filter((r) => r.status === "concluida").length;
  return { concluidas, total, percentual: calcPercentual(concluidas, total) };
}

/** Mesmo cálculo, em lote, para a listagem (uma query para N projetos). */
export async function progressoEmLote(
  supabase: SupabaseClient,
  projetoIds: string[],
): Promise<Map<string, ProgressoInfo>> {
  const resultado = new Map<string, ProgressoInfo>();
  if (projetoIds.length === 0) return resultado;

  const { data } = await supabase
    .from("tarefas")
    .select("projeto_id, status")
    .in("projeto_id", projetoIds)
    .is("parent_id", null)
    .is("arquivado_em", null);

  const acumulado = new Map<string, { concluidas: number; total: number }>();
  for (const row of data ?? []) {
    const pid = row.projeto_id as string;
    const entry = acumulado.get(pid) ?? { concluidas: 0, total: 0 };
    entry.total += 1;
    if (row.status === "concluida") entry.concluidas += 1;
    acumulado.set(pid, entry);
  }

  for (const id of projetoIds) {
    const entry = acumulado.get(id) ?? { concluidas: 0, total: 0 };
    resultado.set(id, {
      ...entry,
      percentual: calcPercentual(entry.concluidas, entry.total),
    });
  }
  return resultado;
}

type ProdutoProjetoRow = { produtos: { id: string; nome: string } | null };
type ProdutoProjetoRowBulk = {
  projeto_id: string;
  produtos: { id: string; nome: string } | null;
};

/** Produtos vinculados a um único projeto (chips do perfil). */
export async function produtosDoProjeto(
  supabase: SupabaseClient,
  projetoId: string,
): Promise<OptionLite[]> {
  const { data } = await supabase
    .from("produto_projeto")
    .select("produtos(id, nome)")
    .eq("projeto_id", projetoId);

  return ((data ?? []) as unknown as ProdutoProjetoRow[])
    .map((row) => row.produtos)
    .filter((p): p is OptionLite => Boolean(p));
}

/** Produtos vinculados em lote (chips da listagem). */
export async function produtosEmLote(
  supabase: SupabaseClient,
  projetoIds: string[],
): Promise<Map<string, OptionLite[]>> {
  const resultado = new Map<string, OptionLite[]>();
  if (projetoIds.length === 0) return resultado;

  const { data } = await supabase
    .from("produto_projeto")
    .select("projeto_id, produtos(id, nome)")
    .in("projeto_id", projetoIds);

  for (const row of (data ?? []) as unknown as ProdutoProjetoRowBulk[]) {
    if (!row.produtos) continue;
    const lista = resultado.get(row.projeto_id) ?? [];
    lista.push(row.produtos);
    resultado.set(row.projeto_id, lista);
  }
  return resultado;
}
