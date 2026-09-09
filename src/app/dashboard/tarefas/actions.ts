"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  PRIORIDADE_VALUES,
  STATUS_VALUES,
  randomTagColor,
  slugify,
} from "./constants";
import { detectTarefaColumns, pickExtPayload } from "./db";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

type TagInput = { id?: string; nome: string; cor?: string | null };
type SubtarefaInput = { id?: string; titulo: string; concluida: boolean };

type ParsedTarefa = {
  base: Record<string, unknown>;
  ext: Record<string, unknown>;
  tags: TagInput[];
  subtarefas: SubtarefaInput[];
};

function toISODate(value: string): string | null {
  const v = value.trim();
  return v ? v.slice(0, 10) : null;
}

function toTime(value: string): string | null {
  const v = value.trim();
  return v ? v.slice(0, 8) : null;
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

function parseTarefa(
  formData: FormData,
): { data: ParsedTarefa } | { fieldErrors: Record<string, string> } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const prioridade = String(formData.get("prioridade") ?? "").trim();
  const dataPrazo = String(formData.get("data_prazo") ?? "");
  const naAgenda = formData.get("na_agenda") === "on";
  const agendaData = String(formData.get("agenda_data") ?? "");
  const agendaHoraInicio = String(formData.get("agenda_hora_inicio") ?? "");
  const agendaHoraFim = String(formData.get("agenda_hora_fim") ?? "");
  const produtoId = String(formData.get("produto_id") ?? "").trim();
  const projetoId = String(formData.get("projeto_id") ?? "").trim();

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
  if (naAgenda && !agendaData) {
    fieldErrors.agenda_data = "Informe a data na agenda.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const base: Record<string, unknown> = {
    titulo,
    descricao: descricao || null,
    status: status || "a_fazer",
    prioridade: prioridade || "normal",
    projeto_id: projetoId || null,
    data_prazo: toISODate(dataPrazo),
  };

  const ext: Record<string, unknown> = {
    observacoes: observacoes || null,
    produto_id: produtoId || null,
    agenda_data: naAgenda ? toISODate(agendaData) : null,
    agenda_hora_inicio: naAgenda ? toTime(agendaHoraInicio) : null,
    agenda_hora_fim: naAgenda ? toTime(agendaHoraFim) : null,
  };

  return {
    data: {
      base,
      ext,
      tags: safeJsonArray<TagInput>(String(formData.get("tags_json") ?? "")),
      subtarefas: safeJsonArray<SubtarefaInput>(
        String(formData.get("subtarefas_json") ?? ""),
      ),
    },
  };
}

/** Resolve a lista de tags (cria as novas) e devolve os ids. */
async function resolveTagIds(
  supabase: SupabaseClient,
  tags: TagInput[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const tag of tags) {
    if (tag.id) {
      ids.push(tag.id);
      continue;
    }
    const nome = tag.nome.trim();
    if (!nome) continue;

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .ilike("nome", nome)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      ids.push(existing.id);
      continue;
    }

    const { data: created } = await supabase
      .from("tags")
      .insert({
        nome,
        cor: tag.cor ?? randomTagColor(),
        slug: slugify(nome),
      })
      .select("id")
      .single();

    if (created?.id) ids.push(created.id);
  }
  return Array.from(new Set(ids));
}

async function syncTarefaTags(
  supabase: SupabaseClient,
  tarefaId: string,
  tagIds: string[],
) {
  await supabase.from("tarefa_tag").delete().eq("tarefa_id", tarefaId);
  if (tagIds.length > 0) {
    await supabase
      .from("tarefa_tag")
      .insert(tagIds.map((tagId) => ({ tarefa_id: tarefaId, tag_id: tagId })));
  }
}

async function syncSubtarefas(
  supabase: SupabaseClient,
  parentId: string,
  subtarefas: SubtarefaInput[],
) {
  const { data: current } = await supabase
    .from("tarefas")
    .select("id")
    .eq("parent_id", parentId);

  const currentIds = new Set((current ?? []).map((row) => row.id as string));
  const keptIds = new Set<string>();

  for (let index = 0; index < subtarefas.length; index++) {
    const sub = subtarefas[index];
    const titulo = sub.titulo.trim();
    if (!titulo) continue;
    const status = sub.concluida ? "concluida" : "a_fazer";
    const dataConclusao = sub.concluida ? new Date().toISOString() : null;

    if (sub.id && currentIds.has(sub.id)) {
      keptIds.add(sub.id);
      await supabase
        .from("tarefas")
        .update({
          titulo,
          status,
          data_conclusao: dataConclusao,
          ordem: index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
    } else {
      await supabase.from("tarefas").insert({
        titulo,
        status,
        data_conclusao: dataConclusao,
        parent_id: parentId,
        ordem: index,
      });
    }
  }

  const toDelete = Array.from(currentIds).filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("tarefas").delete().in("id", toDelete);
  }
}

/** Para onde redirecionar após salvar/arquivar/excluir (padrão: listagem de tarefas). */
function redirectToFrom(formData: FormData): string {
  return String(formData.get("redirect_to") ?? "").trim() || "/dashboard/tarefas";
}

/** Revalida a listagem e o perfil do projeto, para o progresso refletir a mudança. */
function revalidarProjeto(projetoId: string | null | undefined) {
  if (!projetoId) return;
  revalidatePath("/dashboard/projetos");
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

function describeDbError(error: {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
} | null): string {
  if (!error) return "Erro desconhecido ao salvar.";
  const parts = [error.message, error.details, error.hint].filter(
    (p): p is string => Boolean(p),
  );
  return `${parts.join(" — ")}${error.code ? ` [${error.code}]` : ""}`;
}

export async function createTarefa(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseTarefa(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectTarefaColumns(supabase);
  const payload = {
    ...parsed.data.base,
    ...pickExtPayload(cols, parsed.data.ext),
  };

  const { data, error } = await supabase
    .from("tarefas")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Erro ao criar tarefa:", error);
    return { ok: false, error: describeDbError(error) };
  }

  const tagIds = await resolveTagIds(supabase, parsed.data.tags);
  await syncTarefaTags(supabase, data.id, tagIds);
  await syncSubtarefas(supabase, data.id, parsed.data.subtarefas);

  const redirectTo = redirectToFrom(formData);
  revalidatePath("/dashboard/tarefas");
  revalidarProjeto(parsed.data.base.projeto_id as string | null);
  redirect(`${redirectTo}?ok=criada`);
}

export async function updateTarefa(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseTarefa(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { data: before } = await supabase
    .from("tarefas")
    .select("projeto_id")
    .eq("id", id)
    .maybeSingle();

  const cols = await detectTarefaColumns(supabase);
  const payload = {
    ...parsed.data.base,
    ...pickExtPayload(cols, parsed.data.ext),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("tarefas").update(payload).eq("id", id);

  if (error) {
    console.error("Erro ao editar tarefa:", error);
    return { ok: false, error: describeDbError(error) };
  }

  const tagIds = await resolveTagIds(supabase, parsed.data.tags);
  await syncTarefaTags(supabase, id, tagIds);
  await syncSubtarefas(supabase, id, parsed.data.subtarefas);

  const redirectTo = redirectToFrom(formData);
  revalidatePath("/dashboard/tarefas");
  revalidarProjeto(before?.projeto_id as string | null);
  revalidarProjeto(parsed.data.base.projeto_id as string | null);
  redirect(`${redirectTo}?tarefa=${id}&ok=atualizada`);
}

/** Move a tarefa para outra coluna do Kanban (atualiza o status). */
export async function moverTarefa(id: string, status: string) {
  if (!STATUS_VALUES.includes(status)) return;
  const supabase = createClient();
  const { data } = await supabase
    .from("tarefas")
    .update({
      status,
      data_conclusao:
        status === "concluida" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("projeto_id")
    .maybeSingle();
  revalidatePath("/dashboard/tarefas");
  revalidarProjeto(data?.projeto_id as string | null);
}

export async function toggleSubtarefa(id: string, concluida: boolean) {
  const supabase = createClient();
  await supabase
    .from("tarefas")
    .update({
      status: concluida ? "concluida" : "a_fazer",
      data_conclusao: concluida ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/dashboard/tarefas");
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
  const { data: before } = await supabase
    .from("tarefas")
    .select("projeto_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("tarefas")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao arquivar tarefa:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  const redirectTo = redirectToFrom(formData);
  revalidatePath("/dashboard/tarefas");
  revalidarProjeto(before?.projeto_id as string | null);
  redirect(`${redirectTo}?ok=arquivada`);
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
  const { data: before } = await supabase
    .from("tarefas")
    .select("projeto_id")
    .eq("id", id)
    .maybeSingle();

  // Subtarefas somem junto (parent_id ... on delete cascade).
  const { error } = await supabase.from("tarefas").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir tarefa:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  const redirectTo = redirectToFrom(formData);
  revalidatePath("/dashboard/tarefas");
  revalidarProjeto(before?.projeto_id as string | null);
  redirect(`${redirectTo}?ok=excluida`);
}
