/**
 * Opções e helpers do módulo de Projetos (tabela `projetos`).
 */

export const STATUS_OPTIONS = [
  { value: "planejamento", label: "Planejamento" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export const FASE_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
] as const;

export const STATUS_VALUES: readonly string[] = STATUS_OPTIONS.map((o) => o.value);
export const PRIORIDADE_VALUES: readonly string[] = PRIORIDADE_OPTIONS.map(
  (o) => o.value,
);
export const FASE_STATUS_VALUES: readonly string[] = FASE_STATUS_OPTIONS.map(
  (o) => o.value,
);

export const DEFAULT_STATUS = "planejamento";
export const DEFAULT_PRIORIDADE = "normal";
export const DEFAULT_FASE_STATUS = "pendente";

export function statusLabel(value: string | null | undefined): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function prioridadeLabel(value: string | null | undefined): string {
  return PRIORIDADE_OPTIONS.find((o) => o.value === value)?.label ?? "Normal";
}

export function faseStatusLabel(value: string | null | undefined): string {
  return FASE_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "Pendente";
}

export const STATUS_BADGE_CLASS: Record<string, string> = {
  planejamento: "bg-gray-100 text-gray-700",
  em_andamento: "bg-sky-100 text-sky-800",
  pausado: "bg-amber-100 text-amber-800",
  concluido: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-rose-100 text-rose-800",
};

export const PRIORIDADE_FLAG_CLASS: Record<string, string> = {
  baixa: "text-gray-400",
  normal: "text-blue-500",
  alta: "text-amber-500",
  urgente: "text-red-500",
};

export const FASE_STATUS_BADGE_CLASS: Record<string, string> = {
  pendente: "bg-gray-100 text-gray-700",
  em_andamento: "bg-sky-100 text-sky-800",
  concluida: "bg-emerald-100 text-emerald-800",
};

/** "YYYY-MM-DD..." -> "DD/MM/YYYY" sem passar por Date (evita shift de fuso). */
export function formatData(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ymd(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Prazo no passado e projeto ainda não concluído/cancelado. */
export function isVencido(
  iso: string | null | undefined,
  status: string | null | undefined,
): boolean {
  if (!iso || status === "concluido" || status === "cancelado") return false;
  return iso.slice(0, 10) < ymd();
}

export function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** Remove caracteres que quebrariam filtros do PostgREST. */
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const OK_MESSAGES: Record<string, string> = {
  criado: "Projeto criado com sucesso.",
  atualizado: "Alterações salvas.",
  arquivado: "Projeto arquivado.",
  excluido: "Projeto excluído.",
};
