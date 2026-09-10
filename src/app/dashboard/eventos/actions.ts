"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DOCUMENTO_TIPO_VALUES,
  EDICAO_STATUS_VALUES,
  EVENTO_FORMATO_VALUES,
  EVENTO_STATUS_VALUES,
  EVENTO_TIPO_VALUES,
  FORMATO_VALUES,
  MODELO_ACESSO_VALUES,
  PAPEL_VALUES,
  PARTICIPANTE_STATUS_VALUES,
} from "./constants";
import {
  detectarColunasEdicao,
  eventoTemTipoFormato,
  selecionarColunasEdicao,
} from "./db";

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

function numeroOuNulo(valor: string): number | null {
  if (!valor) return null;
  const n = Number(valor.replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function describeDbError(
  error: { message?: string; code?: string | null } | null,
): string {
  if (!error) return "Erro desconhecido ao salvar.";
  return `${error.message ?? "Erro ao salvar."}${error.code ? ` [${error.code}]` : ""}`;
}

function revalidarEvento(eventoId?: string | null) {
  revalidatePath("/dashboard/eventos");
  if (eventoId) revalidatePath(`/dashboard/eventos/${eventoId}`);
}

// ============================================================
// Eventos
// ============================================================

type EdicaoUnica = {
  base: Record<string, unknown>;
  opcionais: Record<string, unknown>;
};

type EventoParsed = {
  data: Record<string, unknown>;
  tipoFormato: string;
  unica: EdicaoUnica;
};

/** Campos inline da edição única (só usados quando tipo_formato = 'unico'). */
function parseEdicaoUnica(fd: FormData): EdicaoUnica {
  const formato = texto(fd, "formato");
  const localOuLink = texto(fd, "local_ou_link");
  const modeloAcesso = texto(fd, "modelo_acesso");
  const online = formato === "online";

  return {
    base: {
      formato: formato || null,
      local: online ? null : nuloOu(localOuLink),
      link_transmissao: online ? nuloOu(localOuLink) : null,
      capacidade: inteiroOuNulo(texto(fd, "capacidade")),
      data_inicio: nuloOu(texto(fd, "data_inicio")),
      data_fim: nuloOu(texto(fd, "data_fim")),
    },
    opcionais: {
      modelo_acesso: modeloAcesso || null,
      preco: modeloAcesso === "pago" ? numeroOuNulo(texto(fd, "preco")) : null,
    },
  };
}

function parseEvento(
  fd: FormData,
): { data: EventoParsed } | { fieldErrors: Record<string, string> } {
  const nome = texto(fd, "nome");
  const descricao = texto(fd, "descricao");
  const tipo = texto(fd, "tipo");
  const status = texto(fd, "status");
  const tipoFormato = texto(fd, "tipo_formato");

  const fieldErrors: Record<string, string> = {};
  if (!nome) fieldErrors.nome = "O nome é obrigatório.";
  else if (nome.length > 200)
    fieldErrors.nome = "O nome deve ter no máximo 200 caracteres.";
  if (tipo && !EVENTO_TIPO_VALUES.includes(tipo))
    fieldErrors.tipo = "Tipo inválido.";
  if (status && !EVENTO_STATUS_VALUES.includes(status))
    fieldErrors.status = "Status inválido.";
  if (tipoFormato && !EVENTO_FORMATO_VALUES.includes(tipoFormato))
    fieldErrors.tipo_formato = "Formato inválido.";

  if (tipoFormato === "unico") {
    const formato = texto(fd, "formato");
    const modeloAcesso = texto(fd, "modelo_acesso");
    if (formato && !FORMATO_VALUES.includes(formato))
      fieldErrors.formato = "Formato inválido.";
    if (modeloAcesso && !MODELO_ACESSO_VALUES.includes(modeloAcesso))
      fieldErrors.modelo_acesso = "Modelo de acesso inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      data: {
        nome,
        descricao: nuloOu(descricao),
        tipo: tipo || "outro",
        status: status || "ativo",
      },
      tipoFormato: tipoFormato || "edicoes",
      unica: parseEdicaoUnica(fd),
    },
  };
}

export async function criarEvento(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseEvento(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }
  const { data: dados, tipoFormato, unica } = parsed.data;

  const supabase = createClient();
  const temTipoFormato = await eventoTemTipoFormato(supabase);
  const insert = temTipoFormato
    ? { ...dados, tipo_formato: tipoFormato }
    : dados;

  const { data: novo, error } = await supabase
    .from("eventos")
    .insert(insert)
    .select("id")
    .single();
  if (error || !novo) {
    console.error("Erro ao criar evento:", error);
    return { ok: false, error: describeDbError(error) };
  }

  if (temTipoFormato && tipoFormato === "unico") {
    const cols = await detectarColunasEdicao(supabase);
    const { error: edError } = await supabase.from("edicoes_evento").insert({
      evento_id: novo.id,
      numero: 1,
      status: "planejada",
      ...unica.base,
      ...selecionarColunasEdicao(cols, unica.opcionais),
    });
    if (edError)
      console.error("Erro ao criar edição única do evento:", edError);
  }

  revalidarEvento(novo.id as string);
  return { ok: true };
}

export async function atualizarEvento(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Evento inválido." };
  const parsed = parseEvento(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }
  const { data: dados, tipoFormato, unica } = parsed.data;

  const supabase = createClient();
  const temTipoFormato = await eventoTemTipoFormato(supabase);
  const update = {
    ...dados,
    ...(temTipoFormato ? { tipo_formato: tipoFormato } : {}),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("eventos").update(update).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar evento:", error);
    return { ok: false, error: describeDbError(error) };
  }

  if (temTipoFormato && tipoFormato === "unico") {
    const cols = await detectarColunasEdicao(supabase);
    const payload = {
      ...unica.base,
      ...selecionarColunasEdicao(cols, unica.opcionais),
    };
    const edicaoUnicaId = texto(fd, "edicao_unica_id");
    const { error: edError } = edicaoUnicaId
      ? await supabase
          .from("edicoes_evento")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", edicaoUnicaId)
      : await supabase.from("edicoes_evento").insert({
          evento_id: id,
          numero: 1,
          status: "planejada",
          ...payload,
        });
    if (edError)
      console.error("Erro ao salvar edição única do evento:", edError);
  }

  revalidarEvento(id);
  return { ok: true };
}

export async function arquivarEvento(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  if (!id) return { ok: false, error: "Evento inválido." };
  if (String(fd.get("confirmacao") ?? "").trim() !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("eventos")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao arquivar evento:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidatePath("/dashboard/eventos");
  redirect("/dashboard/eventos");
}

export async function excluirEvento(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  if (!id) return { ok: false, error: "Evento inválido." };
  if (String(fd.get("confirmacao") ?? "").trim() !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir evento:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidatePath("/dashboard/eventos");
  redirect("/dashboard/eventos");
}

// ============================================================
// Edições
// ============================================================

function parseEdicao(
  fd: FormData,
):
  | { base: Record<string, unknown>; opcionais: Record<string, unknown> }
  | { fieldErrors: Record<string, string> } {
  const nome = texto(fd, "nome");
  const numero = texto(fd, "numero");
  const status = texto(fd, "status");
  const formato = texto(fd, "formato");
  const localOuLink = texto(fd, "local_ou_link");
  const capacidade = texto(fd, "capacidade");
  const dataInicio = texto(fd, "data_inicio");
  const dataFim = texto(fd, "data_fim");
  const modeloAcesso = texto(fd, "modelo_acesso");
  const preco = texto(fd, "preco");
  const projetoId = texto(fd, "projeto_id");
  const resumo = texto(fd, "resumo");

  const fieldErrors: Record<string, string> = {};
  if (nome.length > 200) fieldErrors.nome = "Nome muito longo.";
  if (status && !EDICAO_STATUS_VALUES.includes(status))
    fieldErrors.status = "Status inválido.";
  if (formato && !FORMATO_VALUES.includes(formato))
    fieldErrors.formato = "Formato inválido.";
  if (modeloAcesso && !MODELO_ACESSO_VALUES.includes(modeloAcesso))
    fieldErrors.modelo_acesso = "Modelo de acesso inválido.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Online -> link_transmissao; demais -> local.
  const online = formato === "online";

  return {
    base: {
      nome: nuloOu(nome),
      numero: inteiroOuNulo(numero),
      status: status || "planejada",
      formato: formato || null,
      local: online ? null : nuloOu(localOuLink),
      link_transmissao: online ? nuloOu(localOuLink) : null,
      capacidade: inteiroOuNulo(capacidade),
      data_inicio: nuloOu(dataInicio),
      data_fim: nuloOu(dataFim),
    },
    opcionais: {
      modelo_acesso: modeloAcesso || null,
      preco: modeloAcesso === "pago" ? numeroOuNulo(preco) : null,
      projeto_id: nuloOu(projetoId),
      resumo: nuloOu(resumo),
    },
  };
}

export async function criarEdicao(
  eventoId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!eventoId) return { ok: false, error: "Evento inválido." };
  const parsed = parseEdicao(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunasEdicao(supabase);
  const { error } = await supabase.from("edicoes_evento").insert({
    evento_id: eventoId,
    ...parsed.base,
    ...selecionarColunasEdicao(cols, parsed.opcionais),
  });
  if (error) {
    console.error("Erro ao criar edição:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

export async function atualizarEdicao(
  edicaoId: string,
  eventoId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!edicaoId) return { ok: false, error: "Edição inválida." };
  const parsed = parseEdicao(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunasEdicao(supabase);
  const { error } = await supabase
    .from("edicoes_evento")
    .update({
      ...parsed.base,
      ...selecionarColunasEdicao(cols, parsed.opcionais),
      updated_at: new Date().toISOString(),
    })
    .eq("id", edicaoId);
  if (error) {
    console.error("Erro ao atualizar edição:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

export async function arquivarEdicao(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const edicaoId = String(fd.get("edicao_id") ?? "");
  const eventoId = String(fd.get("evento_id") ?? "");
  if (!edicaoId) return { ok: false, error: "Edição inválida." };
  if (String(fd.get("confirmacao") ?? "").trim() !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("edicoes_evento")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", edicaoId);
  if (error) {
    console.error("Erro ao arquivar edição:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

export async function excluirEdicao(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const edicaoId = String(fd.get("edicao_id") ?? "");
  const eventoId = String(fd.get("evento_id") ?? "");
  if (!edicaoId) return { ok: false, error: "Edição inválida." };
  if (String(fd.get("confirmacao") ?? "").trim() !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("edicoes_evento")
    .delete()
    .eq("id", edicaoId);
  if (error) {
    console.error("Erro ao excluir edição:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

// ============================================================
// Participantes (pessoa_edicao — PK composta pessoa_id + edicao_id)
// ============================================================

function parseParticipante(fd: FormData): {
  papel: string;
  status: string;
} | null {
  const papel = texto(fd, "papel") || "inscrito";
  const status = texto(fd, "status") || "confirmado";
  if (!PAPEL_VALUES.includes(papel)) return null;
  if (!PARTICIPANTE_STATUS_VALUES.includes(status)) return null;
  return { papel, status };
}

export async function vincularParticipante(
  edicaoId: string,
  eventoId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const pessoaId = texto(fd, "pessoa_id");
  if (!edicaoId || !pessoaId) {
    return { ok: false, error: "Selecione um cliente para adicionar." };
  }
  const dados = parseParticipante(fd);
  if (!dados) return { ok: false, error: "Papel ou status inválido." };

  const supabase = createClient();
  const { error } = await supabase
    .from("pessoa_edicao")
    .upsert(
      { pessoa_id: pessoaId, edicao_id: edicaoId, ...dados },
      { onConflict: "pessoa_id,edicao_id" },
    );
  if (error) {
    console.error("Erro ao vincular participante:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

export async function atualizarParticipante(
  edicaoId: string,
  pessoaId: string,
  eventoId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!edicaoId || !pessoaId) return { ok: false, error: "Participante inválido." };
  const dados = parseParticipante(fd);
  if (!dados) return { ok: false, error: "Papel ou status inválido." };

  const supabase = createClient();
  const { error } = await supabase
    .from("pessoa_edicao")
    .update(dados)
    .eq("edicao_id", edicaoId)
    .eq("pessoa_id", pessoaId);
  if (error) {
    console.error("Erro ao atualizar participante:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

// ============================================================
// Documentos do evento (tabela `documentos`, vínculo polimórfico
// entidade_tipo = 'evento' / entidade_id = evento.id)
// ============================================================

export async function criarDocumentoEvento(
  eventoId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!eventoId) return { ok: false, error: "Evento inválido." };

  const titulo = texto(fd, "titulo");
  const url = texto(fd, "url");
  const tipo = texto(fd, "tipo");
  const descricao = texto(fd, "descricao");

  const fieldErrors: Record<string, string> = {};
  if (!titulo) fieldErrors.titulo = "O título é obrigatório.";
  else if (titulo.length > 200) fieldErrors.titulo = "Título muito longo.";
  if (!url) fieldErrors.url = "Informe uma URL ou link.";
  if (tipo && !DOCUMENTO_TIPO_VALUES.includes(tipo))
    fieldErrors.tipo = "Tipo inválido.";
  if (Object.keys(fieldErrors).length > 0)
    return { ok: false, error: "Revise os campos.", fieldErrors };

  const supabase = createClient();
  const { error } = await supabase.from("documentos").insert({
    titulo,
    url,
    tipo: tipo || "outro",
    descricao: nuloOu(descricao),
    entidade_tipo: "evento",
    entidade_id: eventoId,
  });
  if (error) {
    console.error("Erro ao criar documento do evento:", error);
    return { ok: false, error: describeDbError(error) };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

export async function removerDocumentoEvento(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  const eventoId = texto(fd, "evento_id");
  if (!id) return { ok: false, error: "Documento inválido." };

  const supabase = createClient();
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) {
    console.error("Erro ao remover documento do evento:", error);
    return { ok: false, error: "Não foi possível remover. Tente novamente." };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}

export async function removerParticipante(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const edicaoId = texto(fd, "edicao_id");
  const pessoaId = texto(fd, "pessoa_id");
  const eventoId = texto(fd, "evento_id");
  if (!edicaoId || !pessoaId) return { ok: false, error: "Participante inválido." };
  if (String(fd.get("confirmacao") ?? "").trim() !== "REMOVER") {
    return { ok: false, error: "Digite REMOVER para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("pessoa_edicao")
    .delete()
    .eq("edicao_id", edicaoId)
    .eq("pessoa_id", pessoaId);
  if (error) {
    console.error("Erro ao remover participante:", error);
    return { ok: false, error: "Não foi possível remover. Tente novamente." };
  }

  revalidarEvento(eventoId);
  return { ok: true };
}
