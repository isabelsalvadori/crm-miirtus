/**
 * Opções e helpers do módulo de Tarefas (tabela `tarefas`).
 */

export const STATUS_OPTIONS = [
  { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando", label: "Aguardando" },
  { value: "concluida", label: "Concluído" },
] as const;

export const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export const STATUS_VALUES: readonly string[] = STATUS_OPTIONS.map((o) => o.value);
export const PRIORIDADE_VALUES: readonly string[] = PRIORIDADE_OPTIONS.map(
  (o) => o.value,
);

export const DEFAULT_STATUS = "a_fazer";
export const DEFAULT_PRIORIDADE = "normal";

export function statusLabel(value: string | null | undefined): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "A fazer";
}

export function prioridadeLabel(value: string | null | undefined): string {
  return PRIORIDADE_OPTIONS.find((o) => o.value === value)?.label ?? "Normal";
}

export function normalizeStatus(value: string | null | undefined): string {
  return value && STATUS_VALUES.includes(value) ? value : DEFAULT_STATUS;
}

/** Cor da flag de prioridade (texto). */
export const PRIORIDADE_FLAG_CLASS: Record<string, string> = {
  baixa: "text-gray-400",
  normal: "text-blue-500",
  alta: "text-amber-500",
  urgente: "text-red-500",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  a_fazer: "bg-gray-100 text-gray-700",
  em_andamento: "bg-sky-100 text-sky-800",
  aguardando: "bg-amber-100 text-amber-800",
  concluida: "bg-emerald-100 text-emerald-800",
};

/** Paleta para tags criadas inline. */
export const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

export function randomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Contraste de texto (preto/branco) para um fundo hex. */
export function tagTextColor(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "#111827";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

export function ymd(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Formata "YYYY-MM-DD..." como "DD/MM/YYYY" sem passar por Date (evita shift de fuso). */
export function formatPrazo(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Prazo no passado e tarefa não concluída. */
export function isVencido(
  iso: string | null | undefined,
  status: string | null | undefined,
): boolean {
  if (!iso || status === "concluida") return false;
  return iso.slice(0, 10) < ymd();
}

export function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

export function toDateTimeLocalValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const OK_MESSAGES: Record<string, string> = {
  criada: "Tarefa criada.",
  atualizada: "Tarefa atualizada.",
  arquivada: "Tarefa arquivada.",
  excluida: "Tarefa excluída.",
};
