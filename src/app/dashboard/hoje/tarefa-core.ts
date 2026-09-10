import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PRIORIDADE_VALUES,
  STATUS_VALUES,
  randomTagColor,
  slugify,
} from "../tarefas/constants";

/**
 * Núcleo de parsing/persistência de tarefas, compartilhado entre o painel
 * Hoje e a Agenda. Mantido fora de arquivos "use server" para poder exportar
 * funções síncronas.
 */

export type TagInput = { id?: string; nome?: string; cor?: string | null };

export type ParsedTarefa = {
  base: Record<string, unknown>;
  opcionais: Record<string, unknown>;
  tags: TagInput[];
};

export function safeJsonArray<T>(raw: string): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function nuloOu(valor: string): string | null {
  return valor ? valor : null;
}

export function parseTarefa(
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
  supabase: SupabaseClient,
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

export async function syncTags(
  supabase: SupabaseClient,
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
