"use server";

import { createClient } from "@/lib/supabase/server";
import type { OptionLite, TagLite, VinculoOpcoes } from "../hoje/actions";
import { detectarColunasTarefa } from "../hoje/db";

export type ContextoTarefa = {
  vinculos: VinculoOpcoes;
  tags: TagLite[];
  colunas: string[];
};

async function opcoes(
  supabase: ReturnType<typeof createClient>,
  tabela: string,
  coluna: "nome" | "titulo",
): Promise<OptionLite[]> {
  const { data } = await supabase
    .from(tabela)
    .select(`id, ${coluna}`)
    .is("arquivado_em", null)
    .order(coluna)
    .limit(200);
  return ((data ?? []) as Record<string, string>[]).map((row) => ({
    id: row.id,
    nome: row[coluna] || "(sem nome)",
  }));
}

/**
 * Catálogos (vínculos, tags e colunas existentes) que o `TarefaModal` exige.
 * Usado pela Captura Rápida (FAB), que abre o modal fora do módulo de Tarefas.
 * Espelha a montagem feita em `dashboard/hoje/page.tsx`.
 */
export async function carregarContextoTarefa(): Promise<ContextoTarefa> {
  const supabase = createClient();
  const cols = await detectarColunasTarefa(supabase);

  const [projetos, produtos, eventos, clientes, ideias, campanhas, tagsRes] =
    await Promise.all([
      opcoes(supabase, "projetos", "nome"),
      opcoes(supabase, "produtos", "nome"),
      opcoes(supabase, "eventos", "nome"),
      opcoes(supabase, "pessoas", "nome"),
      opcoes(supabase, "ideias", "titulo"),
      opcoes(supabase, "campanhas", "nome"),
      supabase.from("tags").select("id, nome, cor").order("nome"),
    ]);

  return {
    vinculos: {
      projeto: projetos,
      produto: produtos,
      evento: eventos,
      cliente: clientes,
      ideia: ideias,
      campanha: campanhas,
    },
    tags: (tagsRes.data ?? []) as TagLite[],
    colunas: Array.from(cols),
  };
}
