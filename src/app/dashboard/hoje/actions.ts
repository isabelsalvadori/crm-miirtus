"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TarefaHoje = {
  id: string;
  titulo: string;
  status: string | null;
  prioridade: string | null;
  data_prazo: string | null;
  agenda_data: string | null;
  agenda_hora_inicio: string | null;
  agenda_hora_fim: string | null;
};

export type NotaHoje = {
  id: string;
  titulo: string | null;
  conteudo: string | null;
  created_at: string;
};

export async function marcarTarefaConcluida(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Tarefa inválida." };

  const supabase = createClient();
  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("tarefas")
    .update({
      status: "concluida",
      data_conclusao: agora,
      updated_at: agora,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao concluir tarefa:", error);
    return { ok: false, error: "Não foi possível concluir a tarefa." };
  }

  revalidatePath("/dashboard/hoje");
  return { ok: true };
}
