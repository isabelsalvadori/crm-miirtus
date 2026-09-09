"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MODELOS_COM_PRECO,
  MODELO_ACESSO_VALUES,
  STATUS_VALUES,
  TIPO_COBRANCA_VALUES,
  TIPO_VALUES,
  slugify,
} from "./constants";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

type ParsedInput = {
  nome: string;
  slug: string | null;
  tipo: string | null;
  status: string | null;
  modelo_acesso: string | null;
  tipo_cobranca: string | null;
  preco: number | null;
  descricao: string | null;
};

/** Monta uma mensagem legível a partir do erro do Supabase/PostgREST. */
function describeDbError(
  error: {
    message?: string;
    details?: string | null;
    hint?: string | null;
    code?: string | null;
  } | null,
): string {
  if (!error) return "Erro desconhecido ao salvar (sem retorno do banco).";
  const parts = [error.message, error.details, error.hint].filter(
    (p): p is string => Boolean(p),
  );
  const code = error.code ? ` [${error.code}]` : "";
  return `${parts.join(" — ")}${code}`;
}

function parseAndValidate(
  formData: FormData,
):
  | { data: ParsedInput; fieldErrors?: undefined }
  | { data?: undefined; fieldErrors: Record<string, string> } {
  const nome = String(formData.get("nome") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const modeloAcesso = String(formData.get("modelo_acesso") ?? "").trim();
  const tipoCobranca = String(formData.get("tipo_cobranca") ?? "").trim();
  const precoRaw = String(formData.get("preco") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "O nome é obrigatório.";
  } else if (nome.length > 200) {
    fieldErrors.nome = "O nome deve ter no máximo 200 caracteres.";
  }

  const slug = slugify(slugRaw || nome);
  if (slugRaw && !slug) {
    fieldErrors.slug = "Slug inválido.";
  }

  if (tipo && !TIPO_VALUES.includes(tipo)) {
    fieldErrors.tipo = "Tipo inválido.";
  }

  if (status && !STATUS_VALUES.includes(status)) {
    fieldErrors.status = "Status inválido.";
  }

  if (modeloAcesso && !MODELO_ACESSO_VALUES.includes(modeloAcesso)) {
    fieldErrors.modelo_acesso = "Modelo de acesso inválido.";
  }

  if (tipoCobranca && !TIPO_COBRANCA_VALUES.includes(tipoCobranca)) {
    fieldErrors.tipo_cobranca = "Tipo de cobrança inválido.";
  }

  const precoRelevante = MODELOS_COM_PRECO.includes(modeloAcesso);

  let preco: number | null = null;
  if (precoRelevante && precoRaw) {
    const normalized = precoRaw.replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      fieldErrors.preco = "Informe um preço válido.";
    } else {
      preco = Math.round(parsed * 100) / 100;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      nome,
      slug: slug || null,
      tipo: tipo || null,
      status: status || null,
      modelo_acesso: modeloAcesso || null,
      // Cobrança só faz sentido quando há preço (Pago/Assinatura).
      tipo_cobranca: precoRelevante ? tipoCobranca || null : null,
      preco,
      descricao: descricao || null,
    },
  };
}

export async function createProduto(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseAndValidate(formData);
  if (parsed.fieldErrors) {
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("produtos")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Erro ao criar produto:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/produtos");
  redirect(`/dashboard/produtos/${data.id}?ok=criado`);
}

export async function updateProduto(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseAndValidate(formData);
  if (parsed.fieldErrors) {
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("produtos")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar produto:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/produtos");
  revalidatePath(`/dashboard/produtos/${id}`);
  redirect(`/dashboard/produtos/${id}?ok=atualizado`);
}

export async function arquivarProduto(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  if (!id) return { ok: false, error: "Produto inválido." };
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("produtos")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[arquivarProduto] falha:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos?ok=arquivado");
}

export async function excluirProduto(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  if (!id) return { ok: false, error: "Produto inválido." };
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    console.error("[excluirProduto] falha:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos?ok=excluido");
}
