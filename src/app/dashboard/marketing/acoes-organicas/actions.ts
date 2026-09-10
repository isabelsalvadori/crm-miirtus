"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACAO_STATUS_VALUES, ACAO_TIPO_VALUES } from "../constants";
import { ACAO_COLS, apenasColunas, detectarColunas } from "../db";

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

function inteiroOuNulo(valor: string): number | null {
  if (!valor) return null;
  const n = Number.parseInt(valor, 10);
  return Number.isNaN(n) ? null : n;
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
  revalidatePath("/dashboard/marketing/acoes-organicas");
}

function parseAcao(
  fd: FormData,
): { data: Record<string, unknown> } | { fieldErrors: Record<string, string> } {
  const nome = texto(fd, "nome");
  const tipo = texto(fd, "tipo");
  const status = texto(fd, "status");
  const custo = texto(fd, "custo");
  const receita = texto(fd, "receita_atribuida");

  const fieldErrors: Record<string, string> = {};
  if (!nome) fieldErrors.nome = "O nome é obrigatório.";
  else if (nome.length > 200)
    fieldErrors.nome = "O nome deve ter no máximo 200 caracteres.";
  if (tipo && !ACAO_TIPO_VALUES.includes(tipo)) fieldErrors.tipo = "Tipo inválido.";
  if (status && !ACAO_STATUS_VALUES.includes(status))
    fieldErrors.status = "Status inválido.";
  if (custo && numeroOuNulo(custo) === null)
    fieldErrors.custo = "Informe um número válido.";
  if (receita && numeroOuNulo(receita) === null)
    fieldErrors.receita_atribuida = "Informe um número válido.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      nome,
      tipo: tipo || "outro",
      canal_local: nuloOu(texto(fd, "canal_local")),
      data: nuloOu(texto(fd, "data")),
      status: status || "planejada",
      custo: numeroOuNulo(custo),
      contatos_gerados: inteiroOuNulo(texto(fd, "contatos_gerados")),
      cliques: inteiroOuNulo(texto(fd, "cliques")),
      inscricoes: inteiroOuNulo(texto(fd, "inscricoes")),
      leads: inteiroOuNulo(texto(fd, "leads")),
      vendas: inteiroOuNulo(texto(fd, "vendas")),
      receita_atribuida: numeroOuNulo(receita),
      produto_id: nuloOu(texto(fd, "produto_id")),
      projeto_id: nuloOu(texto(fd, "projeto_id")),
      evento_id: nuloOu(texto(fd, "evento_id")),
      campanha_id: nuloOu(texto(fd, "campanha_id")),
    },
  };
}

export async function criarAcaoOrganica(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseAcao(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "acoes_organicas", ACAO_COLS);
  const { error } = await supabase
    .from("acoes_organicas")
    .insert(apenasColunas(cols, parsed.data));
  if (error) {
    console.error("Erro ao criar ação orgânica:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

export async function atualizarAcaoOrganica(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Ação inválida." };
  const parsed = parseAcao(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "acoes_organicas", ACAO_COLS);
  const { error } = await supabase
    .from("acoes_organicas")
    .update({
      ...apenasColunas(cols, parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Erro ao atualizar ação orgânica:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidar();
  return { ok: true };
}

export async function arquivarAcaoOrganica(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Ação inválida." };
  if (texto(fd, "confirmacao") !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("acoes_organicas")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao arquivar ação orgânica:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}

export async function excluirAcaoOrganica(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Ação inválida." };
  if (texto(fd, "confirmacao") !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("acoes_organicas")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Erro ao excluir ação orgânica:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidar();
  return { ok: true };
}
