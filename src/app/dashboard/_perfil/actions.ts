"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  criarTarefa,
  marcarTarefaConcluida,
  type FormState,
} from "../hoje/actions";
import type { FormState as NotaFormState } from "../notas/actions";

function describeDbError(
  error: { message?: string; code?: string | null } | null,
): string {
  if (!error) return "Erro desconhecido ao salvar.";
  return `${error.message ?? "Erro ao salvar."}${
    error.code ? ` [${error.code}]` : ""
  }`;
}

/**
 * Cria uma nota já ancorada a uma entidade (pessoa/produto/projeto) e
 * revalida o perfil de origem. `basePath` é fixado via `.bind` na página.
 */
export async function criarNotaVinculada(
  basePath: string,
  _prev: NotaFormState,
  formData: FormData,
): Promise<NotaFormState> {
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const entidadeTipo = String(formData.get("entidade_tipo") ?? "").trim();
  const entidadeId = String(formData.get("entidade_id") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!conteudo) {
    fieldErrors.conteudo = "O conteúdo é obrigatório.";
  } else if (conteudo.length > 20000) {
    fieldErrors.conteudo = "O conteúdo está muito longo.";
  }
  if (titulo.length > 200) {
    fieldErrors.titulo = "O título deve ter no máximo 200 caracteres.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Revise os campos.", fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from("notas").insert({
    titulo: titulo || null,
    conteudo,
    entidade_tipo: entidadeTipo || null,
    entidade_id: entidadeTipo ? entidadeId || null : null,
  });

  if (error) {
    console.error("Erro ao criar nota vinculada:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/notas");
  revalidatePath(basePath);
  return { ok: true };
}

/**
 * Delega a criação da tarefa ao núcleo do módulo Hoje e, além das rotas
 * que ele já revalida, revalida o perfil de origem.
 */
export async function criarTarefaVinculada(
  basePath: string,
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const res = await criarTarefa(prev, formData);
  if (res.ok) revalidatePath(basePath);
  return res;
}

/** Conclui a tarefa e revalida o perfil de origem. */
export async function concluirTarefaVinculada(
  basePath: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await marcarTarefaConcluida(id);
  if (res.ok) revalidatePath(basePath);
  return res;
}
