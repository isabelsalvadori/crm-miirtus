"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ORIGEM_VALUES, STATUS_VALUES } from "./constants";

export type FormState = {
  ok?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

type ParsedInput = {
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  tipo: string | null;
  observacoes: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAndValidate(
  formData: FormData,
):
  | { data: ParsedInput; fieldErrors?: undefined }
  | { data?: undefined; fieldErrors: Record<string, string> } {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const origem = String(formData.get("origem") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "O nome é obrigatório.";
  } else if (nome.length > 200) {
    fieldErrors.nome = "O nome deve ter no máximo 200 caracteres.";
  }

  if (email && !EMAIL_RE.test(email)) {
    fieldErrors.email = "Informe um e-mail válido.";
  }

  if (telefone && telefone.length > 40) {
    fieldErrors.telefone = "Telefone muito longo.";
  }

  if (origem && !ORIGEM_VALUES.includes(origem)) {
    fieldErrors.origem = "Origem inválida.";
  }

  if (tipo && !STATUS_VALUES.includes(tipo)) {
    fieldErrors.tipo = "Status inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      nome,
      email: email || null,
      telefone: telefone || null,
      origem: origem || null,
      tipo: tipo || null,
      observacoes: observacoes || null,
    },
  };
}

export async function createCliente(
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
    .from("pessoas")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Não foi possível salvar o cliente. Tente novamente." };
  }

  revalidatePath("/dashboard/clientes");
  redirect(`/dashboard/clientes/${data.id}?ok=criado`);
}

export async function updateCliente(
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
    .from("pessoas")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}`);
  redirect(`/dashboard/clientes/${id}?ok=atualizado`);
}

export async function arquivarCliente(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Cliente inválido." };
  }
  if (confirmacao !== "ARQUIVAR") {
    return { ok: false, error: 'Digite ARQUIVAR para confirmar.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("pessoas")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível arquivar. Tente novamente." };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes?ok=arquivado");
}

export async function excluirCliente(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Cliente inválido." };
  }
  if (confirmacao !== "EXCLUIR") {
    return { ok: false, error: 'Digite EXCLUIR para confirmar.' };
  }

  const supabase = createClient();
  const { error } = await supabase.from("pessoas").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível excluir. Tente novamente." };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes?ok=excluido");
}
