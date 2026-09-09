/**
 * Opções e helpers compartilhados do módulo de Clientes.
 * O "Status" do cliente é persistido na coluna `pessoas.tipo`.
 */

export const STATUS_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "cliente", label: "Cliente" },
  { value: "participante", label: "Participante" },
  { value: "membro", label: "Membro" },
  { value: "parceiro", label: "Parceiro" },
] as const;

export const ORIGEM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "indicacao", label: "Indicação" },
  { value: "evento", label: "Evento" },
  { value: "organico", label: "Orgânico" },
  { value: "outro", label: "Outro" },
] as const;

export const STATUS_VALUES: readonly string[] = STATUS_OPTIONS.map((o) => o.value);
export const ORIGEM_VALUES: readonly string[] = ORIGEM_OPTIONS.map((o) => o.value);

export const PAGE_SIZE = 20;

export function statusLabel(value: string | null | undefined): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function origemLabel(value: string | null | undefined): string {
  return ORIGEM_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

/** Classes Tailwind do badge de status. */
export const STATUS_BADGE_CLASS: Record<string, string> = {
  lead: "bg-amber-100 text-amber-800",
  cliente: "bg-emerald-100 text-emerald-800",
  participante: "bg-sky-100 text-sky-800",
  membro: "bg-violet-100 text-violet-800",
  parceiro: "bg-rose-100 text-rose-800",
};

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

/** Remove caracteres que quebrariam a expressão `or=` do PostgREST. */
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const OK_MESSAGES: Record<string, string> = {
  criado: "Cliente criado com sucesso.",
  atualizado: "Alterações salvas.",
  arquivado: "Cliente arquivado.",
  excluido: "Cliente excluído.",
};
