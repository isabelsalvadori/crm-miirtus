"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type IdeiaStatus =
  | "caixa_de_entrada"
  | "analisando"
  | "talvez"
  | "aprovada"
  | "descartada";

export type IdeiaNivel = "baixo" | "medio" | "alto";

export type ConvertivelTipo = "projeto" | "produto" | "evento" | "conteudo";

export type Ideia = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: IdeiaStatus | null;
  categoria: string | null;
  impacto: IdeiaNivel | null;
  esforco: IdeiaNivel | null;
  convertida_em_tipo: ConvertivelTipo | null;
  convertida_em_id: string | null;
  /** Título do registro originado — hidratado no server, não persistido. */
  convertida_em_titulo?: string | null;
  created_at: string;
  updated_at: string | null;
  arquivado_em: string | null;
};

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

const STATUS_VALUES: string[] = [
  "caixa_de_entrada",
  "analisando",
  "talvez",
  "aprovada",
  "descartada",
];
const NIVEL_VALUES: string[] = ["baixo", "medio", "alto"];
const CATEGORIA_VALUES: string[] = [
  "Produto",
  "Conteúdo",
  "Evento",
  "Ferramenta",
  "Campanha",
  "Melhoria",
  "Parceria",
  "Outro",
];

const STATUS_PADRAO = "caixa_de_entrada";

type ConversaoConfig = {
  tabela: string;
  registro: (titulo: string) => Record<string, string>;
  path: string;
};

const CONVERSAO: Record<ConvertivelTipo, ConversaoConfig> = {
  projeto: {
    tabela: "projetos",
    registro: (titulo) => ({
      nome: titulo,
      status: "planejamento",
      prioridade: "normal",
    }),
    path: "/dashboard/projetos",
  },
  produto: {
    tabela: "produtos",
    registro: (titulo) => ({ nome: titulo, status: "rascunho" }),
    path: "/dashboard/produtos",
  },
  evento: {
    tabela: "eventos",
    registro: (titulo) => ({ nome: titulo }),
    path: "/dashboard/eventos",
  },
  conteudo: {
    tabela: "conteudos",
    registro: (titulo) => ({ titulo, status: "ideia" }),
    path: "/dashboard/conteudo",
  },
};

function isConvertivelTipo(value: string): value is ConvertivelTipo {
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

type ParsedIdeia = {
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  status: string;
  impacto: string;
  esforco: string;
};

function parseIdeia(
  formData: FormData,
):
  | { data: ParsedIdeia; fieldErrors?: undefined }
  | { data?: undefined; fieldErrors: Record<string, string> } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const impacto = String(formData.get("impacto") ?? "").trim();
  const esforco = String(formData.get("esforco") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!titulo) {
    fieldErrors.titulo = "O título é obrigatório.";
  } else if (titulo.length > 200) {
    fieldErrors.titulo = "O título deve ter no máximo 200 caracteres.";
  }
  if (status && !STATUS_VALUES.includes(status)) {
    fieldErrors.status = "Status inválido.";
  }
  if (categoria && !CATEGORIA_VALUES.includes(categoria)) {
    fieldErrors.categoria = "Categoria inválida.";
  }
  if (impacto && !NIVEL_VALUES.includes(impacto)) {
    fieldErrors.impacto = "Impacto inválido.";
  }
  if (esforco && !NIVEL_VALUES.includes(esforco)) {
    fieldErrors.esforco = "Esforço inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      titulo,
      descricao: descricao || null,
      categoria: categoria || null,
      status: status || STATUS_PADRAO,
      impacto: impacto || "medio",
      esforco: esforco || "medio",
    },
  };
}

export async function criarIdeia(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseIdeia(formData);
  if (parsed.fieldErrors) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from("ideias").insert(parsed.data);

  if (error) {
    console.error("Erro ao criar ideia:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/ideias");
  return { ok: true };
}

export async function atualizarIdeia(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Ideia inválida." };

  const parsed = parseIdeia(formData);
  if (parsed.fieldErrors) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("ideias")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar ideia:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/ideias");
  return { ok: true };
}

export async function arquivarIdeia(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Ideia inválida." };
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("ideias")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao arquivar ideia:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidatePath("/dashboard/ideias");
  return { ok: true };
}

export async function excluirIdeia(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Ideia inválida." };
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("ideias").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir ideia:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidatePath("/dashboard/ideias");
  return { ok: true };
}

export async function converterIdeia(
  ideiaId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const tipo = String(formData.get("tipo") ?? "").trim();
  if (!ideiaId) return { ok: false, error: "Ideia inválida." };
  if (!isConvertivelTipo(tipo)) {
    return { ok: false, error: "Tipo de conversão inválido." };
  }

  const supabase = createClient();

  const { data: ideia, error: readError } = await supabase
    .from("ideias")
    .select("id, titulo, convertida_em_tipo")
    .eq("id", ideiaId)
    .single();

  if (readError || !ideia) {
    return { ok: false, error: "Ideia não encontrada." };
  }
  if (ideia.convertida_em_tipo) {
    return { ok: false, error: "Esta ideia já foi convertida." };
  }

  const cfg = CONVERSAO[tipo];

  const { data: criado, error: insertError } = await supabase
    .from(cfg.tabela)
    .insert(cfg.registro(ideia.titulo as string))
    .select("id")
    .single();

  if (insertError || !criado) {
    console.error(`Erro ao converter ideia em ${tipo}:`, insertError);
    return { ok: false, error: describeDbError(insertError) };
  }

  const { error: updateError } = await supabase
    .from("ideias")
    .update({
      convertida_em_tipo: tipo,
      convertida_em_id: criado.id as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideiaId);

  if (updateError) {
    console.error("Erro ao registrar conversão da ideia:", updateError);
    return { ok: false, error: describeDbError(updateError) };
  }

  revalidatePath("/dashboard/ideias");
  revalidatePath(cfg.path);
  return { ok: true };
}
