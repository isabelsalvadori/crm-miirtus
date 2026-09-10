"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CONTEUDO_CANAL_VALUES,
  CONTEUDO_STATUS_VALUES,
  CONTEUDO_TIPO_VALUES,
} from "../constants";
import { CONTEUDO_COLS, apenasColunas, detectarColunas } from "../db";

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

/** <input datetime-local> ("2026-09-10T09:00") -> ISO com fuso, ou null. */
function tsOuNulo(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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
  revalidatePath("/dashboard/marketing/conteudo");
  revalidatePath("/dashboard/marketing/calendario");
}

function parseConteudo(
  fd: FormData,
): { data: Record<string, unknown> } | { fieldErrors: Record<string, string> } {
  const titulo = texto(fd, "titulo");
  const tipo = texto(fd, "tipo");
  const canal = texto(fd, "canal");
  const status = texto(fd, "status");

  const fieldErrors: Record<string, string> = {};
  if (!titulo) fieldErrors.titulo = "O título é obrigatório.";
  else if (titulo.length > 200)
    fieldErrors.titulo = "O título deve ter no máximo 200 caracteres.";
  if (tipo && !CONTEUDO_TIPO_VALUES.includes(tipo))
    fieldErrors.tipo = "Tipo inválido.";
  if (canal && !CONTEUDO_CANAL_VALUES.includes(canal))
    fieldErrors.canal = "Canal inválido.";
  if (status && !CONTEUDO_STATUS_VALUES.includes(status))
    fieldErrors.status = "Status inválido.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      titulo,
      tipo: nuloOu(tipo),
      canal: nuloOu(canal),
      status: status || "backlog",
      pilar: nuloOu(texto(fd, "pilar")),
      resumo: nuloOu(texto(fd, "resumo")),
      corpo_roteiro: nuloOu(texto(fd, "corpo_roteiro")),
      produto_id: nuloOu(texto(fd, "produto_id")),
      projeto_id: nuloOu(texto(fd, "projeto_id")),
      campanha_id: nuloOu(texto(fd, "campanha_id")),
      data_agendada: tsOuNulo(texto(fd, "data_agendada")),
      data_publicacao: tsOuNulo(texto(fd, "data_publicacao")),
      link_publicado: nuloOu(texto(fd, "link_publicado")),
    },
  };
}

export async function criarConteudo(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseConteudo(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "conteudos", CONTEUDO_COLS);
  const { error } = await supabase
    .from("conteudos")
    .insert(apenasColunas(cols, parsed.data));
  if (error) {
    console.error("Erro ao criar conteúdo:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

export async function atualizarConteudo(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Conteúdo inválido." };
  const parsed = parseConteudo(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "conteudos", CONTEUDO_COLS);
  const { error } = await supabase
    .from("conteudos")
    .update({
      ...apenasColunas(cols, parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Erro ao atualizar conteúdo:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

/** Move o card para outra coluna do Kanban (atualiza o status). */
export async function moverConteudo(id: string, novoStatus: string) {
  if (!id || !CONTEUDO_STATUS_VALUES.includes(novoStatus)) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("conteudos")
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("Erro ao mover conteúdo:", error);
  revalidar();
}

export async function arquivarConteudo(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Conteúdo inválido." };
  if (texto(fd, "confirmacao") !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("conteudos")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao arquivar conteúdo:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function excluirConteudo(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Conteúdo inválido." };
  if (texto(fd, "confirmacao") !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("conteudos").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir conteúdo:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}
