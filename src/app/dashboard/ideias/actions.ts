"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type IdeiaStatus =
  | "nova"
  | "em_analise"
  | "aprovada"
  | "implementada"
  | "descartada";

export type IdeiaNivel = "baixo" | "medio" | "alto";

export type Ideia = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: IdeiaStatus | null;
  categoria: string | null;
  impacto: IdeiaNivel | null;
  esforco: IdeiaNivel | null;
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
  "nova",
  "em_analise",
  "aprovada",
  "implementada",
  "descartada",
];
const NIVEL_VALUES: string[] = ["baixo", "medio", "alto"];

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
      status: status || "nova",
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
