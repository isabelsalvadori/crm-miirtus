"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  META_STATUS_VALUES,
  META_TIPO_VALUES,
  META_UNIDADE_VALUES,
} from "./constants";
import { detectarColunasMeta, selecionarColunasMeta } from "./db";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

function texto(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function nuloOu(valor: string): string | null {
  return valor ? valor : null;
}

function numeroOuNulo(valor: string): number | null {
  if (!valor) return null;
  const n = Number(valor.replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function describeDbError(
  error: { message?: string; code?: string | null } | null,
): string {
  if (!error) return "Erro desconhecido ao salvar.";
  return `${error.message ?? "Erro ao salvar."}${
    error.code ? ` [${error.code}]` : ""
  }`;
}

function revalidar() {
  revalidatePath("/dashboard/metas");
}

// ============================================================
// Parsing / validação
// ============================================================

type MetaParsed = {
  data: Record<string, unknown>;
  opcionais: Record<string, unknown>;
};

function parseMeta(
  fd: FormData,
): { data: MetaParsed } | { fieldErrors: Record<string, string> } {
  const nome = texto(fd, "nome");
  const descricao = texto(fd, "descricao");
  const indicador = texto(fd, "indicador");
  const tipo = texto(fd, "tipo");
  const unidade = texto(fd, "unidade");
  const status = texto(fd, "status");
  const periodoInicio = texto(fd, "periodo_inicio");
  const periodoFim = texto(fd, "periodo_fim");
  const valorAlvo = texto(fd, "valor_alvo");
  const projetoId = texto(fd, "projeto_id");
  const produtoId = texto(fd, "produto_id");
  const eventoId = texto(fd, "evento_id");

  const fieldErrors: Record<string, string> = {};
  if (!nome) fieldErrors.nome = "O título é obrigatório.";
  else if (nome.length > 200)
    fieldErrors.nome = "O título deve ter no máximo 200 caracteres.";
  if (tipo && !META_TIPO_VALUES.includes(tipo))
    fieldErrors.tipo = "Tipo inválido.";
  if (unidade && !META_UNIDADE_VALUES.includes(unidade))
    fieldErrors.unidade = "Unidade inválida.";
  if (status && !META_STATUS_VALUES.includes(status))
    fieldErrors.status = "Status inválido.";
  if (valorAlvo && numeroOuNulo(valorAlvo) === null)
    fieldErrors.valor_alvo = "Informe um número válido.";
  if (
    periodoInicio &&
    periodoFim &&
    periodoFim.slice(0, 10) < periodoInicio.slice(0, 10)
  )
    fieldErrors.periodo_fim = "O fim não pode ser anterior ao início.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      data: {
        nome,
        descricao: nuloOu(descricao),
        indicador: nuloOu(indicador),
        tipo: tipo || "corporativa",
        unidade: unidade || "outro",
        status: status || "ativa",
        valor_alvo: numeroOuNulo(valorAlvo),
        periodo_inicio: nuloOu(periodoInicio),
        periodo_fim: nuloOu(periodoFim),
        projeto_id: nuloOu(projetoId),
      },
      opcionais: {
        produto_id: nuloOu(produtoId),
        evento_id: nuloOu(eventoId),
      },
    },
  };
}

// ============================================================
// CRUD
// ============================================================

export async function criarMeta(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseMeta(fd);
  if ("fieldErrors" in parsed) {
    return {
      ok: false,
      error: "Revise os campos.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = createClient();
  const cols = await detectarColunasMeta(supabase);
  const { data: dados, opcionais } = parsed.data;

  const { error } = await supabase.from("metas").insert({
    ...dados,
    ...selecionarColunasMeta(cols, opcionais),
  });
  if (error) {
    console.error("Erro ao criar meta:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

export async function atualizarMeta(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Meta inválida." };
  const parsed = parseMeta(fd);
  if ("fieldErrors" in parsed) {
    return {
      ok: false,
      error: "Revise os campos.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = createClient();
  const cols = await detectarColunasMeta(supabase);
  const { data: dados, opcionais } = parsed.data;

  const { error } = await supabase
    .from("metas")
    .update({
      ...dados,
      ...selecionarColunasMeta(cols, opcionais),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Erro ao atualizar meta:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

/** Atualiza `valor_atual` manualmente (metas não-financeiras). */
export async function atualizarValorAtual(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Meta inválida." };

  const valor = numeroOuNulo(texto(fd, "valor"));
  if (valor === null || valor < 0) {
    return { ok: false, error: "Informe um número válido (≥ 0)." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("metas")
    .update({ valor_atual: valor, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao atualizar progresso da meta:", error);
    return { ok: false, error: "Não foi possível atualizar. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function arquivarMeta(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Meta inválida." };
  if (texto(fd, "confirmacao") !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("metas")
    .update({
      arquivado_em: new Date().toISOString(),
      status: "arquivada",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Erro ao arquivar meta:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function excluirMeta(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Meta inválida." };
  if (texto(fd, "confirmacao") !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("metas").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir meta:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}
