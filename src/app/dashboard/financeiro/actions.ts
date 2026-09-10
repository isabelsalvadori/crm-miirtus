"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FORMA_PAGAMENTO_VALUES,
  STATUS_DESPESA_FORM_VALUES,
  STATUS_RECEITA_FORM_VALUES,
  TIPO_VALUES,
  ymd,
} from "./constants";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

const FINANCEIRO_PATHS = [
  "/dashboard/financeiro",
  "/dashboard/financeiro/receitas",
  "/dashboard/financeiro/despesas",
  "/dashboard/financeiro/a-receber",
  "/dashboard/financeiro/a-pagar",
  "/dashboard/financeiro/fluxo-de-caixa",
];

function revalidarFinanceiro() {
  for (const path of FINANCEIRO_PATHS) revalidatePath(path);
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

function toISODate(value: string): string | null {
  const v = value.trim();
  return v ? v.slice(0, 10) : null;
}

function redirectToFrom(formData: FormData): string {
  return String(formData.get("redirect_to") ?? "").trim() || "/dashboard/financeiro";
}

type ParsedMovimentacao = {
  descricao: string;
  tipo: string;
  valor: number;
  status: string;
  data_competencia: string | null;
  data_vencimento: string | null;
  categoria_id: string | null;
  forma_pagamento: string | null;
  produto_id: string | null;
  projeto_id: string | null;
  observacoes: string | null;
  comprovante_url: string | null;
};

function parseMovimentacao(
  formData: FormData,
): { data: ParsedMovimentacao } | { fieldErrors: Record<string, string> } {
  const descricao = String(formData.get("descricao") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const dataCompetencia = String(formData.get("data_competencia") ?? "");
  const dataVencimento = String(formData.get("data_vencimento") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const formaPagamento = String(formData.get("forma_pagamento") ?? "").trim();
  const produtoId = String(formData.get("produto_id") ?? "").trim();
  const projetoId = String(formData.get("projeto_id") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const comprovanteUrl = String(formData.get("comprovante_url") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!TIPO_VALUES.includes(tipo)) {
    // Campo escondido no form — só dá errado se o modal for adulterado.
    fieldErrors.tipo = "Tipo inválido.";
  }

  if (!descricao) {
    fieldErrors.descricao = "A descrição é obrigatória.";
  } else if (descricao.length > 300) {
    fieldErrors.descricao = "Descrição muito longa.";
  }

  const statusValues =
    tipo === "despesa" ? STATUS_DESPESA_FORM_VALUES : STATUS_RECEITA_FORM_VALUES;
  if (status && !statusValues.includes(status)) {
    fieldErrors.status = "Status inválido.";
  }

  if (formaPagamento && !FORMA_PAGAMENTO_VALUES.includes(formaPagamento)) {
    fieldErrors.forma_pagamento = "Forma de pagamento inválida.";
  }

  let valor = 0;
  if (!valorRaw) {
    fieldErrors.valor = "O valor é obrigatório.";
  } else {
    const normalizado = valorRaw.replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalizado);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      fieldErrors.valor = "Informe um valor válido.";
    } else {
      valor = Math.round(parsed * 100) / 100;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      descricao,
      tipo,
      valor,
      status: status || "previsto",
      data_competencia: toISODate(dataCompetencia),
      data_vencimento: toISODate(dataVencimento),
      categoria_id: null, // preenchido abaixo
      forma_pagamento: formaPagamento || null,
      produto_id: produtoId || null,
      projeto_id: projetoId || null,
      observacoes: observacoes || null,
      comprovante_url: comprovanteUrl || null,
    },
  };
}

export async function createMovimentacao(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseMovimentacao(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const dataConcluida = ["recebido", "pago"].includes(parsed.data.status);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("movimentacoes_financeiras")
    .insert({
      ...parsed.data,
      categoria_id: categoriaId || null,
      data_pagamento: dataConcluida ? toISODate(new Date().toISOString()) : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Erro ao criar movimentação:", error);
    return { ok: false, error: describeDbError(error) };
  }

  const redirectTo = redirectToFrom(formData);
  revalidarFinanceiro();
  redirect(`${redirectTo}?ok=criada`);
}

export async function updateMovimentacao(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseMovimentacao(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const dataConcluida = ["recebido", "pago"].includes(parsed.data.status);

  const supabase = createClient();
  const { error } = await supabase
    .from("movimentacoes_financeiras")
    .update({
      ...parsed.data,
      categoria_id: categoriaId || null,
      data_pagamento: dataConcluida ? toISODate(new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar movimentação:", error);
    return { ok: false, error: describeDbError(error) };
  }

  const redirectTo = redirectToFrom(formData);
  revalidarFinanceiro();
  redirect(`${redirectTo}?mov=${id}&ok=atualizada`);
}

export async function arquivarMovimentacao(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Movimentação inválida." };
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("movimentacoes_financeiras")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao arquivar movimentação:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  const redirectTo = redirectToFrom(formData);
  revalidarFinanceiro();
  redirect(`${redirectTo}?ok=arquivada`);
}

export async function excluirMovimentacao(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (!id) return { ok: false, error: "Movimentação inválida." };
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("movimentacoes_financeiras").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir movimentação:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  const redirectTo = redirectToFrom(formData);
  revalidarFinanceiro();
  redirect(`${redirectTo}?ok=excluida`);
}

// ============================================================
// Captura rápida (FAB) — criação enxuta, sem redirect
// ============================================================

/**
 * Resolve a categoria pelo nome (dentro do tipo). Cria uma nova se ainda
 * não existir. Devolve `null` quando o nome vem vazio ou a criação falha.
 */
async function resolverCategoriaId(
  supabase: ReturnType<typeof createClient>,
  nome: string,
  tipo: string,
): Promise<string | null> {
  const limpo = nome.trim();
  if (!limpo) return null;

  const { data: existente } = await supabase
    .from("categorias_financeiras")
    .select("id")
    .eq("tipo", tipo)
    .ilike("nome", limpo)
    .is("arquivado_em", null)
    .limit(1)
    .maybeSingle();
  if (existente?.id) return existente.id as string;

  const { data: criada, error } = await supabase
    .from("categorias_financeiras")
    .insert({ nome: limpo, tipo })
    .select("id")
    .single();
  if (error) {
    console.error("Erro ao criar categoria (captura rápida):", error);
    return null;
  }
  return (criada?.id as string) ?? null;
}

/**
 * Criação enxuta para a Captura Rápida: descrição, valor, data e categoria
 * (por nome). Status sempre "previsto"; não redireciona — devolve
 * `{ ok: true }` para o modal fechar e o toast aparecer.
 */
export async function criarMovimentacao(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const tipo = String(formData.get("tipo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const data = toISODate(String(formData.get("data") ?? ""));
  const categoriaNome = String(formData.get("categoria") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (tipo !== "receita" && tipo !== "despesa") {
    fieldErrors.tipo = "Tipo inválido.";
  }
  if (!descricao) {
    fieldErrors.descricao = "A descrição é obrigatória.";
  } else if (descricao.length > 300) {
    fieldErrors.descricao = "Descrição muito longa.";
  }

  let valor = 0;
  if (!valorRaw) {
    fieldErrors.valor = "O valor é obrigatório.";
  } else {
    const parsed = Number(valorRaw.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      fieldErrors.valor = "Informe um valor válido.";
    } else {
      valor = Math.round(parsed * 100) / 100;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Revise os campos.", fieldErrors };
  }

  const supabase = createClient();
  const categoriaId = await resolverCategoriaId(supabase, categoriaNome, tipo);
  const dataComp = data ?? ymd();

  const { error } = await supabase.from("movimentacoes_financeiras").insert({
    descricao,
    tipo,
    valor,
    status: "previsto",
    data_competencia: dataComp,
    data_vencimento: dataComp,
    categoria_id: categoriaId,
  });

  if (error) {
    console.error("Erro ao criar movimentação (captura rápida):", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidarFinanceiro();
  return { ok: true };
}

// ============================================================
// Categorias financeiras
// ============================================================

function parseCategoria(
  formData: FormData,
): { data: { nome: string; tipo: string; cor: string | null } } | { fieldErrors: Record<string, string> } {
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const cor = String(formData.get("cor") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!nome) fieldErrors.nome = "O nome é obrigatório.";
  if (tipo !== "receita" && tipo !== "despesa") fieldErrors.tipo = "Escolha Receita ou Despesa.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return { data: { nome, tipo, cor: cor || null } };
}

export async function createCategoria(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCategoria(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from("categorias_financeiras").insert(parsed.data);

  if (error) {
    console.error("Erro ao criar categoria:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/financeiro/categorias");
  redirect("/dashboard/financeiro/categorias?ok=categoria_criada");
}

export async function updateCategoria(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCategoria(formData);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("categorias_financeiras")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar categoria:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidatePath("/dashboard/financeiro/categorias");
  redirect("/dashboard/financeiro/categorias?ok=categoria_atualizada");
}

export async function arquivarCategoria(id: string) {
  const supabase = createClient();
  await supabase
    .from("categorias_financeiras")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard/financeiro/categorias");
}
