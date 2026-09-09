/**
 * Opções e helpers compartilhados do módulo de Produtos (tabela `produtos`).
 */

export const TIPO_OPTIONS = [
  { value: "curso", label: "Curso" },
  { value: "mentoria", label: "Mentoria" },
  { value: "servico", label: "Serviço" },
  { value: "infoproduto", label: "Infoproduto" },
  { value: "fisico", label: "Físico" },
  { value: "outro", label: "Outro" },
] as const;

export const STATUS_OPTIONS = [
  { value: "rascunho", label: "Rascunho" },
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "encerrado", label: "Encerrado" },
] as const;

/** Opções de status oferecidas no filtro da listagem (inclui o pseudo-status "Arquivado"). */
export const STATUS_FILTER_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "encerrado", label: "Encerrado" },
  { value: "arquivado", label: "Arquivado" },
] as const;

export const MODELO_ACESSO_OPTIONS = [
  { value: "pago", label: "Pago" },
  { value: "gratuito", label: "Gratuito" },
  { value: "assinatura", label: "Assinatura" },
  { value: "incluso", label: "Incluso" },
  { value: "interno", label: "Interno" },
  { value: "outro", label: "Outro" },
] as const;

/** Modelos de acesso em que o campo Preço é exibido/relevante. */
export const MODELOS_COM_PRECO: readonly string[] = ["pago", "assinatura"];

export const TIPO_VALUES: readonly string[] = TIPO_OPTIONS.map((o) => o.value);
export const STATUS_VALUES: readonly string[] = STATUS_OPTIONS.map((o) => o.value);
export const MODELO_ACESSO_VALUES: readonly string[] = MODELO_ACESSO_OPTIONS.map(
  (o) => o.value,
);

export function tipoLabel(value: string | null | undefined): string {
  return TIPO_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function statusLabel(value: string | null | undefined): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function modeloAcessoLabel(value: string | null | undefined): string {
  return MODELO_ACESSO_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export const STATUS_BADGE_CLASS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  ativo: "bg-emerald-100 text-emerald-800",
  pausado: "bg-amber-100 text-amber-800",
  encerrado: "bg-rose-100 text-rose-800",
};

/** Converte um texto livre em slug: minúsculo, sem acento, hifens. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatPreco(
  value: number | string | null | undefined,
  moeda = "BRL",
): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda || "BRL",
  }).format(num);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Remove caracteres que quebrariam filtros do PostgREST. */
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const OK_MESSAGES: Record<string, string> = {
  criado: "Produto criado com sucesso.",
  atualizado: "Alterações salvas.",
  arquivado: "Produto arquivado.",
  excluido: "Produto excluído.",
};
