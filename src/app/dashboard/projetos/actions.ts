"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_FASE_STATUS,
  FASE_STATUS_VALUES,
  PRIORIDADE_VALUES,
  STATUS_VALUES,
} from "./constants";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

type ParsedProjeto = {
  nome: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  data_inicio: string | null;
  data_fim_prevista: string | null;
};

function describeDbError(
  error: {
    message?: string;
    details?: string | null;
    hint?: string | null;
    code?: string | null;
  } | null,
): string {
  if (!error) return "Erro desconhecido ao salvar.";
  const parts = [error.message, error.details, error.hint].filter(
    (p): p is string => Boolean(p),
  );
  return `${parts.join(" — ")}${error.code ? ` [${error.code}]` : ""}`;
}

function toISODate(value: string): string | null {
  const v = value.trim();
  return v ? v.slice(0, 10) : null;
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

function parseProjeto(
  formData: FormData,
):
  | { data: ParsedProjeto; produtoIds: string[]; fieldErrors?: undefined }
  | { data?: undefined; produtoIds?: undefined; fieldErrors: Record<string, string> } {
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const prioridade = String(formData.get("prioridade") ?? "").trim();
  const dataInicio = String(formData.get("data_inicio") ?? "");
  const dataFimPrevista = String(formData.get("data_fim_prevista") ?? "");
  const produtoIds = safeJsonArray<string>(
    String(formData.get("produtos_ids_json") ?? ""),
  );

  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "O nome é obrigatório.";
  } else if (nome.length > 200) {
    fieldErrors.nome = "O nome deve ter no máximo 200 caracteres.";
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
      nome,
      descricao: descricao || null,
      status: status || "planejamento",
      prioridade: prioridade || "normal",
      data_inicio: toISODate(dataInicio),
      data_fim_prevista: toISODate(dataFimPrevista),
    },
    produtoIds: Array.from(new Set(produtoIds.filter(Boolean))),
  };
}

async function syncProdutosProjeto(
  supabase: ReturnType<typeof createClient>,
  projetoId: string,
  produtoIds: string[],
) {
  await supabase.from("produto_projeto").delete().eq("projeto_id", projetoId);
  if (produtoIds.length > 0) {
    await supabase
      .from("produto_projeto")
      .insert(produtoIds.map((produtoId) => ({ projeto_id: projetoId, produto_id: produtoId })));
  }
}

export async function createProjeto(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseProjeto(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("projetos")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Erro ao criar projeto:", error);
    return { ok: false, error: describeDbError(error) };
  }

  await syncProdutosProjeto(supabase, data.id, parsed.produtoIds);

  revalidatePath("/dashboard/projetos");
  redirect(`/dashboard/projetos/${data.id}?ok=criado`);
}

export async function updateProjeto(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseProjeto(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("projetos")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar projeto:", error);
    return { ok: false, error: describeDbError(error) };
  }

  await syncProdutosProjeto(supabase, id, parsed.produtoIds);

  revalidatePath("/dashboard/projetos");
  revalidatePath(`/dashboard/projetos/${id}`);
  redirect(`/dashboard/projetos/${id}?ok=atualizado`);
}

export async function arquivarProjeto(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Projeto inválido." };
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("projetos")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao arquivar projeto:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidatePath("/dashboard/projetos");
  redirect("/dashboard/projetos?ok=arquivado");
}

export async function excluirProjeto(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Projeto inválido." };
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  // Fases somem junto (on delete cascade); tarefas vinculadas ficam sem projeto.
  const { error } = await supabase.from("projetos").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir projeto:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidatePath("/dashboard/projetos");
  redirect("/dashboard/projetos?ok=excluido");
}

// ============================================================
// Fases
// ============================================================

export async function criarFase(projetoId: string, nome: string) {
  const titulo = nome.trim();
  if (!titulo) return;

  const supabase = createClient();
  const { count } = await supabase
    .from("fases_projeto")
    .select("id", { count: "exact", head: true })
    .eq("projeto_id", projetoId);

  await supabase.from("fases_projeto").insert({
    projeto_id: projetoId,
    nome: titulo,
    status: DEFAULT_FASE_STATUS,
    ordem: count ?? 0,
  });

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function renomearFase(projetoId: string, faseId: string, nome: string) {
  const titulo = nome.trim();
  if (!titulo) return;

  const supabase = createClient();
  await supabase
    .from("fases_projeto")
    .update({ nome: titulo, updated_at: new Date().toISOString() })
    .eq("id", faseId);

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function atualizarStatusFase(
  projetoId: string,
  faseId: string,
  status: string,
) {
  if (!FASE_STATUS_VALUES.includes(status)) return;

  const supabase = createClient();
  await supabase
    .from("fases_projeto")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", faseId);

  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function removerFase(projetoId: string, faseId: string) {
  const supabase = createClient();
  await supabase.from("fases_projeto").delete().eq("id", faseId);
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function reordenarFases(projetoId: string, orderedIds: string[]) {
  const supabase = createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("fases_projeto").update({ ordem: index }).eq("id", id),
    ),
  );
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

// ============================================================
// Produtos relacionados (perfil do projeto)
// ============================================================

export async function vincularProduto(projetoId: string, produtoId: string) {
  if (!produtoId) return;
  const supabase = createClient();
  await supabase
    .from("produto_projeto")
    .upsert(
      { projeto_id: projetoId, produto_id: produtoId },
      { onConflict: "produto_id,projeto_id" },
    );
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}

export async function desvincularProduto(projetoId: string, produtoId: string) {
  const supabase = createClient();
  await supabase
    .from("produto_projeto")
    .delete()
    .eq("projeto_id", projetoId)
    .eq("produto_id", produtoId);
  revalidatePath(`/dashboard/projetos/${projetoId}`);
}
