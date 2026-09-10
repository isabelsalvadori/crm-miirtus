"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { detectarColunasTarefa, selecionarColunas } from "./db";
import { parseTarefa, syncTags } from "./tarefa-core";

export type VinculoTipo =
  | "projeto"
  | "produto"
  | "evento"
  | "cliente"
  | "ideia"
  | "campanha";

export type TarefaHoje = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string | null;
  prioridade: string | null;
  data_prazo: string | null;
  agenda_data: string | null;
  agenda_hora_inicio: string | null;
  agenda_hora_fim: string | null;
  projeto_id: string | null;
  produto_id: string | null;
  evento_id: string | null;
  cliente_id: string | null;
  ideia_id: string | null;
  campanha_id: string | null;
  tag_ids: string[];
};

export type NotaHoje = {
  id: string;
  titulo: string | null;
  conteudo: string | null;
  created_at: string;
};

export type OptionLite = { id: string; nome: string };
export type TagLite = { id: string; nome: string; cor: string | null };
export type VinculoOpcoes = Record<VinculoTipo, OptionLite[]>;

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

function revalidar(projetoId?: string | null) {
  revalidatePath("/dashboard/hoje");
  revalidatePath("/dashboard/tarefas");
  revalidatePath("/dashboard/agenda");
  if (projetoId) {
    revalidatePath("/dashboard/projetos");
    revalidatePath(`/dashboard/projetos/${projetoId}`);
  }
}

export async function criarTarefa(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseTarefa(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
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
    console.error("Erro ao criar tarefa (Hoje):", error);
    return { ok: false, error: "Não foi possível criar a tarefa. Tente novamente." };
  }

  await syncTags(supabase, data.id as string, parsed.data.tags);
  revalidar(parsed.data.base.projeto_id as string | null);
  return { ok: true };
}

export async function atualizarTarefa(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Tarefa inválida." };

  const parsed = parseTarefa(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunasTarefa(supabase);
  const payload = {
    ...parsed.data.base,
    ...selecionarColunas(cols, parsed.data.opcionais),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("tarefas").update(payload).eq("id", id);

  if (error) {
    console.error("Erro ao atualizar tarefa (Hoje):", error);
    return { ok: false, error: "Não foi possível salvar a tarefa. Tente novamente." };
  }

  await syncTags(supabase, id, parsed.data.tags);
  revalidar(parsed.data.base.projeto_id as string | null);
  return { ok: true };
}

export async function arquivarTarefa(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Tarefa inválida." };
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("tarefas")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao arquivar tarefa (Hoje):", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function excluirTarefa(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Tarefa inválida." };
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("tarefas").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir tarefa (Hoje):", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function marcarTarefaConcluida(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Tarefa inválida." };

  const supabase = createClient();
  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("tarefas")
    .update({ status: "concluida", data_conclusao: agora, updated_at: agora })
    .eq("id", id);

  if (error) {
    console.error("Erro ao concluir tarefa:", error);
    return { ok: false, error: "Não foi possível concluir a tarefa." };
  }

  revalidar();
  return { ok: true };
}
