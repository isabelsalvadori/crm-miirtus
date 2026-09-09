"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PRIORIDADE_VALUES, STATUS_VALUES, randomTagColor, slugify } from "../tarefas/constants";
import { detectTarefaColumns, pickExtPayload } from "../tarefas/db";

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

export type OptionLite = { id: string; nome: string };
export type TagLite = { id: string; nome: string; cor: string | null };

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

type Supabase = ReturnType<typeof createClient>;
type TagInput = { id?: string; nome?: string; cor?: string | null };

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

function safeJsonArray<T>(raw: string): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function resolveTagIds(
  supabase: Supabase,
  tags: TagInput[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const tag of tags) {
    if (tag.id) {
      ids.push(tag.id);
      continue;
    }
    const nome = (tag.nome ?? "").trim();
    if (!nome) continue;

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .ilike("nome", nome)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      ids.push(existing.id as string);
      continue;
    }

    const { data: created } = await supabase
      .from("tags")
      .insert({ nome, cor: tag.cor ?? randomTagColor(), slug: slugify(nome) })
      .select("id")
      .single();

    if (created?.id) ids.push(created.id as string);
  }
  return Array.from(new Set(ids));
}

export async function criarTarefaDeHoje(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const prioridade = String(formData.get("prioridade") ?? "").trim();
  const dataPrazo = String(formData.get("data_prazo") ?? "").trim();
  const projetoId = String(formData.get("projeto_id") ?? "").trim();
  const produtoId = String(formData.get("produto_id") ?? "").trim();
  const tags = safeJsonArray<TagInput>(String(formData.get("tags_json") ?? ""));

  const fieldErrors: Record<string, string> = {};
  if (!titulo) {
    fieldErrors.titulo = "O título é obrigatório.";
  } else if (titulo.length > 300) {
    fieldErrors.titulo = "Título muito longo.";
  }
  if (status && !STATUS_VALUES.includes(status)) {
    fieldErrors.status = "Status inválido.";
  }
  if (prioridade && !PRIORIDADE_VALUES.includes(prioridade)) {
    fieldErrors.prioridade = "Prioridade inválida.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Revise os campos.", fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectTarefaColumns(supabase);

  const payload = {
    titulo,
    descricao: descricao || null,
    status: status || "a_fazer",
    prioridade: prioridade || "normal",
    data_prazo: dataPrazo ? dataPrazo.slice(0, 10) : null,
    projeto_id: projetoId || null,
    ...pickExtPayload(cols, { produto_id: produtoId || null }),
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

  const tagIds = await resolveTagIds(supabase, tags);
  if (tagIds.length > 0) {
    await supabase
      .from("tarefa_tag")
      .insert(tagIds.map((tagId) => ({ tarefa_id: data.id as string, tag_id: tagId })));
  }

  revalidatePath("/dashboard/hoje");
  revalidatePath("/dashboard/tarefas");
  if (projetoId) {
    revalidatePath("/dashboard/projetos");
    revalidatePath(`/dashboard/projetos/${projetoId}`);
  }
  return { ok: true };
}
