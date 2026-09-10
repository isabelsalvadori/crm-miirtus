"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ABA_POR_ENTIDADE, randomTagColor, slugify } from "./constants";
import { DOC_COLS, apenasColunas, detectarColunas } from "./db";
import type { DraftTag, EntidadeBiblioteca } from "./types";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

const ENTIDADES: EntidadeBiblioteca[] = [
  "biblioteca_produto",
  "biblioteca_estudo",
  "biblioteca_acervo",
];

function texto(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function nuloOu(valor: string): string | null {
  return valor ? valor : null;
}

function describeDbError(
  error: { message?: string; code?: string | null } | null,
): string {
  if (!error) return "Erro desconhecido ao salvar.";
  return `${error.message ?? "Erro ao salvar."}${
    error.code ? ` [${error.code}]` : ""
  }`;
}

function entidadeValida(v: string): v is EntidadeBiblioteca {
  return (ENTIDADES as string[]).includes(v);
}

function revalidar(entidadeTipo?: string | null) {
  revalidatePath("/dashboard/biblioteca");
  const aba = entidadeTipo
    ? ABA_POR_ENTIDADE[entidadeTipo as EntidadeBiblioteca]
    : null;
  if (aba) {
    revalidatePath(`/dashboard/biblioteca/${aba}`);
  } else {
    for (const a of Object.values(ABA_POR_ENTIDADE)) {
      revalidatePath(`/dashboard/biblioteca/${a}`);
    }
  }
}

// ------------------------------------------------------------
// Tags (tabela `tags` + junção `documento_tag`)
// ------------------------------------------------------------

function parseTags(fd: FormData): DraftTag[] {
  const raw = String(fd.get("tags_json") ?? "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t): DraftTag | null => {
        const nome = String(t?.nome ?? "").trim();
        if (!nome) return null;
        return {
          id: typeof t?.id === "string" ? t.id : undefined,
          nome,
          cor: typeof t?.cor === "string" ? t.cor : randomTagColor(),
        };
      })
      .filter((t): t is DraftTag => t !== null);
  } catch {
    return [];
  }
}

async function resolveTagIds(
  supabase: SupabaseClient,
  tags: DraftTag[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const tag of tags) {
    if (tag.id) {
      ids.push(tag.id);
      continue;
    }
    const { data: existente } = await supabase
      .from("tags")
      .select("id")
      .ilike("nome", tag.nome)
      .limit(1)
      .maybeSingle();
    if (existente?.id) {
      ids.push(existente.id);
      continue;
    }
    const { data: criada } = await supabase
      .from("tags")
      .insert({ nome: tag.nome, cor: tag.cor, slug: slugify(tag.nome) })
      .select("id")
      .single();
    if (criada?.id) ids.push(criada.id);
  }
  return Array.from(new Set(ids));
}

async function syncDocumentoTags(
  supabase: SupabaseClient,
  documentoId: string,
  tags: DraftTag[],
) {
  try {
    const tagIds = await resolveTagIds(supabase, tags);
    await supabase.from("documento_tag").delete().eq("documento_id", documentoId);
    if (tagIds.length > 0) {
      await supabase
        .from("documento_tag")
        .insert(tagIds.map((tagId) => ({ documento_id: documentoId, tag_id: tagId })));
    }
  } catch (e) {
    console.error("Erro ao sincronizar tags do documento:", e);
  }
}

// ------------------------------------------------------------
// Parsing do documento
// ------------------------------------------------------------

type ParsedDoc =
  | { data: Record<string, unknown>; tags: DraftTag[] }
  | { fieldErrors: Record<string, string> };

function parseDocumento(fd: FormData): ParsedDoc {
  const titulo = texto(fd, "titulo");
  const url = texto(fd, "url");
  const urlObrigatoria = texto(fd, "url_obrigatoria") === "1";

  const fieldErrors: Record<string, string> = {};
  if (!titulo) fieldErrors.titulo = "O título é obrigatório.";
  else if (titulo.length > 200)
    fieldErrors.titulo = "O título deve ter no máximo 200 caracteres.";
  if (urlObrigatoria && !url) fieldErrors.url = "Informe uma URL ou link.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      titulo,
      tipo: nuloOu(texto(fd, "tipo")),
      descricao: nuloOu(texto(fd, "descricao")),
      url: nuloOu(url),
      produto_id: nuloOu(texto(fd, "produto_id")),
      projeto_id: nuloOu(texto(fd, "projeto_id")),
      fonte: nuloOu(texto(fd, "fonte")),
      resumo: nuloOu(texto(fd, "resumo")),
      anotacoes: nuloOu(texto(fd, "anotacoes")),
      aplicacoes: nuloOu(texto(fd, "aplicacoes")),
    },
    tags: parseTags(fd),
  };
}

// ------------------------------------------------------------
// CRUD
// ------------------------------------------------------------

export async function criarDocumento(
  entidadeTipo: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!entidadeValida(entidadeTipo)) {
    return { ok: false, error: "Acervo inválido." };
  }
  const parsed = parseDocumento(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "documentos", DOC_COLS);
  const payload = {
    ...apenasColunas(cols, parsed.data),
    entidade_tipo: entidadeTipo,
  };

  const { data: novo, error } = await supabase
    .from("documentos")
    .insert(payload)
    .select("id")
    .single();
  if (error || !novo) {
    console.error("Erro ao criar documento da biblioteca:", error);
    return { ok: false, error: describeDbError(error) };
  }

  await syncDocumentoTags(supabase, novo.id as string, parsed.tags);
  revalidar(entidadeTipo);
  return { ok: true };
}

export async function atualizarDocumento(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!id) return { ok: false, error: "Documento inválido." };
  const parsed = parseDocumento(fd);
  if ("fieldErrors" in parsed) {
    return { ok: false, error: "Revise os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = createClient();
  const cols = await detectarColunas(supabase, "documentos", DOC_COLS);
  const { error } = await supabase
    .from("documentos")
    .update({
      ...apenasColunas(cols, parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Erro ao atualizar documento da biblioteca:", error);
    return { ok: false, error: describeDbError(error) };
  }

  await syncDocumentoTags(supabase, id, parsed.tags);
  revalidar(texto(fd, "entidade_tipo"));
  return { ok: true };
}

export async function arquivarDocumento(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Documento inválido." };
  if (texto(fd, "confirmacao") !== "ARQUIVAR") {
    return { ok: false, error: "Digite ARQUIVAR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("documentos")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao arquivar documento da biblioteca:", error);
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidar(texto(fd, "entidade_tipo"));
  return { ok: true };
}

export async function excluirDocumento(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = texto(fd, "id");
  if (!id) return { ok: false, error: "Documento inválido." };
  if (texto(fd, "confirmacao") !== "EXCLUIR") {
    return { ok: false, error: "Digite EXCLUIR para confirmar." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir documento da biblioteca:", error);
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidar(texto(fd, "entidade_tipo"));
  return { ok: true };
}
