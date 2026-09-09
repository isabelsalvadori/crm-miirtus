"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type VinculoTipo =
  | "produto"
  | "projeto"
  | "evento"
  | "ideia"
  | "campanha";

export type ConversaoTipo = "tarefa" | "ideia" | "projeto";

export type Nota = {
  id: string;
  titulo: string | null;
  conteudo: string | null;
  entidade_tipo: VinculoTipo | null;
  entidade_id: string | null;
  /** Rótulo da entidade vinculada — hidratado no server, não persistido. */
  entidade_label?: string | null;
  created_at: string;
  updated_at: string | null;
  arquivado_em: string | null;
};

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

const VINCULO_VALUES: string[] = [
  "produto",
  "projeto",
  "evento",
  "ideia",
  "campanha",
];

type ConversaoConfig = {
  tabela: string;
  registro: (nome: string, conteudo: string) => Record<string, string>;
  path: string;
};

const CONVERSAO: Record<ConversaoTipo, ConversaoConfig> = {
  tarefa: {
    tabela: "tarefas",
    registro: (nome, conteudo) => ({
      titulo: nome,
      descricao: conteudo,
      status: "a_fazer",
      prioridade: "normal",
    }),
    path: "/dashboard/tarefas",
  },
  ideia: {
    tabela: "ideias",
    registro: (nome, conteudo) => ({
      titulo: nome,
      descricao: conteudo,
      status: "caixa_de_entrada",
      impacto: "medio",
      esforco: "medio",
    }),
    path: "/dashboard/ideias",
  },
  projeto: {
    tabela: "projetos",
    registro: (nome, conteudo) => ({
      nome,
      descricao: conteudo,
      status: "planejamento",
      prioridade: "normal",
    }),
    path: "/dashboard/projetos",
  },
};

function isConversaoTipo(value: string): value is ConversaoTipo {
  return value in CONVERSAO;
}

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

type ParsedNota = {
  titulo: string | null;
  conteudo: string;
  entidade_tipo: string | null;
  entidade_id: string | null;
};

function parseNota(
  formData: FormData,
):
  | { data: ParsedNota; fieldErrors?: undefined }
  | { data?: undefined; fieldErrors: Record<string, string> } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
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
  if (entidadeTipo && !VINCULO_VALUES.includes(entidadeTipo)) {
    fieldErrors.entidade_tipo = "Tipo de vínculo inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      titulo: titulo || null,
      conteudo,
      entidade_tipo: entidadeTipo || null,
      entidade_id: entidadeTipo ? entidadeId || null : null,
    },
  };
}

export async function criarNota(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseNota(formData);
  if (parsed.fieldErrors) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from("notas").insert(parsed.data);

  if (error) {
    console.error("Erro ao criar nota:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/notas");
  return { ok: true };
}

export async function atualizarNota(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Nota inválida." };

  const parsed = parseNota(formData);
  if (parsed.fieldErrors) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("notas")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar nota:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/notas");
  return { ok: true };
}

export async function arquivarNota(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Nota inválida." };
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("notas")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao arquivar nota:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidatePath("/dashboard/notas");
  return { ok: true };
}

export async function excluirNota(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Nota inválida." };
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("notas").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir nota:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidatePath("/dashboard/notas");
  return { ok: true };
}

export async function converterNota(
  notaId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const tipo = String(formData.get("tipo") ?? "").trim();
  if (!notaId) return { ok: false, error: "Nota inválida." };
  if (!isConversaoTipo(tipo)) {
    return { ok: false, error: "Tipo de conversão inválido." };
  }

  const supabase = createClient();

  const { data: nota, error: readError } = await supabase
    .from("notas")
    .select("id, titulo, conteudo")
    .eq("id", notaId)
    .single();

  if (readError || !nota) {
    return { ok: false, error: "Nota não encontrada." };
  }

  const conteudo = ((nota.conteudo as string | null) ?? "").trim();
  const titulo = ((nota.titulo as string | null) ?? "").trim();
  const nome = titulo || conteudo.slice(0, 60) || "Sem título";

  const cfg = CONVERSAO[tipo];
  const { error: insertError } = await supabase
    .from(cfg.tabela)
    .insert(cfg.registro(nome, conteudo));

  if (insertError) {
    console.error(`Erro ao converter nota em ${tipo}:`, insertError);
    return { ok: false, error: describeDbError(insertError) };
  }

  revalidatePath("/dashboard/notas");
  revalidatePath(cfg.path);
  return { ok: true };
}
