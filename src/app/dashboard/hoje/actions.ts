"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  PRIORIDADE_VALUES,
  STATUS_VALUES,
  randomTagColor,
  slugify,
} from "../tarefas/constants";
import { detectarColunasTarefa, selecionarColunas } from "./db";

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

type Supabase = ReturnType<typeof createClient>;
type TagInput = { id?: string; nome?: string; cor?: string | null };

function safeJsonArray<T>(raw: string): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nuloOu(valor: string): string | null {
  return valor ? valor : null;
}

type ParsedTarefa = {
  base: Record<string, unknown>;
  opcionais: Record<string, unknown>;
  tags: TagInput[];
};

function parseTarefa(
  formData: FormData,
): { data: ParsedTarefa } | { fieldErrors: Record<string, string> } {
  const titulo = texto(formData, "titulo");
  const descricao = texto(formData, "descricao");
  const status = texto(formData, "status");
  const prioridade = texto(formData, "prioridade");
  const dataPrazo = texto(formData, "data_prazo");
  const agendaData = texto(formData, "agenda_data");
  const agendaInicio = texto(formData, "agenda_hora_inicio");
  const agendaFim = texto(formData, "agenda_hora_fim");
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
    return { fieldErrors };
  }

  return {
    data: {
      base: {
        titulo,
        descricao: nuloOu(descricao),
        status: status || "a_fazer",
        prioridade: prioridade || "normal",
        data_prazo: dataPrazo ? dataPrazo.slice(0, 10) : null,
        projeto_id: nuloOu(texto(formData, "projeto_id")),
      },
      opcionais: {
        produto_id: nuloOu(texto(formData, "produto_id")),
        evento_id: nuloOu(texto(formData, "evento_id")),
        cliente_id: nuloOu(texto(formData, "cliente_id")),
        ideia_id: nuloOu(texto(formData, "ideia_id")),
        campanha_id: nuloOu(texto(formData, "campanha_id")),
        agenda_data: agendaData ? agendaData.slice(0, 10) : null,
        agenda_hora_inicio: agendaInicio ? agendaInicio.slice(0, 5) : null,
        agenda_hora_fim: agendaFim ? agendaFim.slice(0, 5) : null,
      },
      tags,
    },
  };
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

async function syncTags(
  supabase: Supabase,
  tarefaId: string,
  tags: TagInput[],
) {
  const tagIds = await resolveTagIds(supabase, tags);
  await supabase.from("tarefa_tag").delete().eq("tarefa_id", tarefaId);
  if (tagIds.length > 0) {
    await supabase
      .from("tarefa_tag")
      .insert(tagIds.map((tagId) => ({ tarefa_id: tarefaId, tag_id: tagId })));
  }
}

function revalidar(projetoId?: string | null) {
  revalidatePath("/dashboard/hoje");
  revalidatePath("/dashboard/tarefas");
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
