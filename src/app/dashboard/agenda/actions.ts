"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../hoje/actions";
import { detectarColunasTarefa, selecionarColunas } from "../hoje/db";
import { parseTarefa, syncTags } from "../hoje/tarefa-core";

/**
 * Cria uma tarefa a partir da Agenda. A `data` e as horas (`agenda_data`,
 * `agenda_hora_inicio`, `agenda_hora_fim`) já vêm no FormData, preenchidas
 * pelo slot/dia em que o usuário clicou.
 */
export async function criarTarefaAgendada(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseTarefa(formData);
  if ("fieldErrors" in parsed) {
    return {
      ok: false,
      error: "Revise os campos.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = createClient();
  const cols = await detectarColunasTarefa(supabase);
  const payload = {
    ...parsed.data.base,
    ...selecionarColunas(cols, parsed.data.opcionais),
  };

  const { data, error } = await supabase
    .from("tarefas")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Erro ao criar tarefa (Agenda):", error);
    return {
      ok: false,
      error: "Não foi possível criar a tarefa. Tente novamente.",
    };
  }

  await syncTags(supabase, data.id as string, parsed.data.tags);

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/hoje");
  revalidatePath("/dashboard/tarefas");
  const projetoId = parsed.data.base.projeto_id as string | null;
  if (projetoId) revalidatePath(`/dashboard/projetos/${projetoId}`);

  return { ok: true };
}
