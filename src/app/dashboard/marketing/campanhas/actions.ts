"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CAMPANHA_STATUS_VALUES, CAMPANHA_TIPO_VALUES } from "../constants";
import { CAMPANHA_COLS, apenasColunas, detectarColunas } from "../db";

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

/** Aceita "5.000,00" (pt-BR) e "5000.50" (en). */
function numeroOuNulo(valor: string): number | null {
  if (!valor) return null;
  let s = valor.replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
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
  revalidatePath("/dashboard/marketing/campanhas");
}

function parseCampanha(
  fd: FormData,
): { data: Record<string, unknown> } | { fieldErrors: Record<string, string> } {
  const nome = texto(fd, "nome");
  const tipo = texto(fd, "tipo");
  const status = texto(fd, "status");
  const orcamento = texto(fd, "orcamento_planejado");
  const inicio = texto(fd, "periodo_inicio");
  const fim = texto(fd, "periodo_fim");

  const fieldErrors: Record<string, string> = {};
  if (!nome) fieldErrors.nome = "O nome é obrigatório.";
  else if (nome.length > 200)
    fieldErrors.nome = "O nome deve ter no máximo 200 caracteres.";
  if (tipo && !CAMPANHA_TIPO_VALUES.includes(tipo))
    fieldErrors.tipo = "Tipo inválido.";
  if (status && !CAMPANHA_STATUS_VALUES.includes(status))
    fieldErrors.status = "Status inválido.";
  if (orcamento && numeroOuNulo(orcamento) === null)
    fieldErrors.orcamento_planejado = "Informe um número válido.";
  if (inicio && fim && fim.slice(0, 10) < inicio.slice(0, 10))
    fieldErrors.periodo_fim = "O fim não pode ser anterior ao início.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      nome,
      tipo: tipo || "organica",
      objetivo: nuloOu(texto(fd, "objetivo")),
      status: status || "planejada",
      canal_principal: nuloOu(texto(fd, "canal_principal")),
      orcamento_planejado: numeroOuNulo(orcamento),
      produto_id: nuloOu(texto(fd, "produto_id")),
      projeto_id: nuloOu(texto(fd, "projeto_id")),
      evento_id: nuloOu(texto(fd, "evento_id")),
      periodo_inicio: nuloOu(inicio),
      periodo_fim: nuloOu(fim),
    },
  };
}

export async function criarCampanha(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseCampanha(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "campanhas", CAMPANHA_COLS);
  const { error } = await supabase
    .from("campanhas")
    .insert(apenasColunas(cols, parsed.data));
  if (error) {
    console.error("Erro ao criar campanha:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

export async function atualizarCampanha(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Campanha inválida." };
  const parsed = parseCampanha(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "campanhas", CAMPANHA_COLS);
  const { error } = await supabase
    .from("campanhas")
    .update({
      ...apenasColunas(cols, parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Erro ao atualizar campanha:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

export async function arquivarCampanha(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Campanha inválida." };
  if (texto(fd, "confirmacao") !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("campanhas")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao arquivar campanha:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function excluirCampanha(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Campanha inválida." };
  if (texto(fd, "confirmacao") !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("campanhas").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir campanha:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}
