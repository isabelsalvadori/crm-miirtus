/**
 * Opções e helpers do módulo de Financeiro (tabelas `movimentacoes_financeiras`
 * e `categorias_financeiras`).
 */

export const TIPO_OPTIONS = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
] as const;

/**
 * Status possíveis por tipo, para labels/badges — inclui "atrasado", que
 * NUNCA é gravado no banco: é sempre calculado (ver `statusEfetivo`).
 */
export const STATUS_RECEITA_OPTIONS = [
  { value: "previsto", label: "Previsto" },
  { value: "recebido", label: "Recebido" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const STATUS_DESPESA_OPTIONS = [
  { value: "previsto", label: "Previsto" },
  { value: "pago", label: "Pago" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

/** Opções realmente selecionáveis no formulário — "Atrasado" fica de fora por ser automático. */
export const STATUS_RECEITA_FORM_OPTIONS = STATUS_RECEITA_OPTIONS.filter(
  (o) => o.value !== "atrasado",
);
export const STATUS_DESPESA_FORM_OPTIONS = STATUS_DESPESA_OPTIONS.filter(
  (o) => o.value !== "atrasado",
);

export const FORMA_PAGAMENTO_OPTIONS = [
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "kiwify", label: "Kiwify" },
  { value: "outro", label: "Outro" },
] as const;

/** Escopo é só um controle de UI para a despesa: decide qual vínculo mostrar. */
export const ESCOPO_OPTIONS = [
  { value: "geral", label: "Geral MIIRTUS" },
  { value: "produto", label: "Produto específico" },
  { value: "projeto", label: "Projeto específico" },
] as const;

export const PERIODO_OPTIONS = [
  { value: "mes_atual", label: "Este mês" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "ultimos_3_meses", label: "Últimos 3 meses" },
  { value: "este_ano", label: "Este ano" },
  { value: "personalizado", label: "Personalizado" },
] as const;

export const TIPO_VALUES: readonly string[] = TIPO_OPTIONS.map((o) => o.value);
export const STATUS_RECEITA_FORM_VALUES: readonly string[] = STATUS_RECEITA_FORM_OPTIONS.map(
  (o) => o.value,
);
export const STATUS_DESPESA_FORM_VALUES: readonly string[] = STATUS_DESPESA_FORM_OPTIONS.map(
  (o) => o.value,
);
export const FORMA_PAGAMENTO_VALUES: readonly string[] = FORMA_PAGAMENTO_OPTIONS.map(
  (o) => o.value,
);
export const ESCOPO_VALUES: readonly string[] = ESCOPO_OPTIONS.map((o) => o.value);
export const PERIODO_VALUES: readonly string[] = PERIODO_OPTIONS.map((o) => o.value);

export const DEFAULT_STATUS_RECEITA = "previsto";
export const DEFAULT_STATUS_DESPESA = "previsto";

export function tipoLabel(value: string | null | undefined): string {
  return TIPO_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function statusLabel(
  tipo: string | null | undefined,
  status: string | null | undefined,
): string {
  const options = tipo === "despesa" ? STATUS_DESPESA_OPTIONS : STATUS_RECEITA_OPTIONS;
  return options.find((o) => o.value === status)?.label ?? "Previsto";
}

export function formaPagamentoLabel(value: string | null | undefined): string {
  return FORMA_PAGAMENTO_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export const STATUS_BADGE_CLASS: Record<string, string> = {
  previsto: "bg-gray-100 text-gray-700",
  recebido: "bg-emerald-100 text-emerald-800",
  pago: "bg-emerald-100 text-emerald-800",
  atrasado: "bg-red-100 text-red-700",
  cancelado: "bg-rose-100 text-rose-800",
};

// ----------------------------------------------------------------
// Datas
// ----------------------------------------------------------------

const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function ymd(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function mesAnoLabel(date: Date): string {
  return `${MESES_ABREV[date.getMonth()]}/${date.getFullYear()}`;
}

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

export function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ----------------------------------------------------------------
// Regras de negócio
// ----------------------------------------------------------------

/**
 * Status "Atrasado" nunca é gravado: é `previsto` cujo vencimento já passou.
 * Essa função é a única fonte de verdade pra decidir o status exibido.
 */
export function statusEfetivo(
  status: string | null | undefined,
  dataVencimento: string | null | undefined,
): string {
  const s = status || "previsto";
  if (s === "previsto" && dataVencimento && dataVencimento.slice(0, 10) < ymd()) {
    return "atrasado";
  }
  return s;
}

export function isPendente(status: string | null | undefined): boolean {
  const s = status || "previsto";
  return s === "previsto";
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (num === null || num === undefined || !Number.isFinite(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

/** Variação percentual em relação ao mês anterior; null = sem base de comparação. */
export function calcVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? null : null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 100);
}

/** Intervalo [inicio, fim] (YYYY-MM-DD) correspondente a um valor de período. */
export function rangeParaPeriodo(
  periodo: string,
  custom?: { inicio?: string; fim?: string },
  hoje = new Date(),
): { inicio: string; fim: string } {
  switch (periodo) {
    case "mes_anterior": {
      const ref = addMonths(hoje, -1);
      return { inicio: ymd(startOfMonth(ref)), fim: ymd(endOfMonth(ref)) };
    }
    case "ultimos_3_meses": {
      const ref = addMonths(hoje, -2);
      return { inicio: ymd(startOfMonth(ref)), fim: ymd(endOfMonth(hoje)) };
    }
    case "este_ano":
      return { inicio: `${hoje.getFullYear()}-01-01`, fim: `${hoje.getFullYear()}-12-31` };
    case "personalizado":
      return {
        inicio: custom?.inicio || ymd(startOfMonth(hoje)),
        fim: custom?.fim || ymd(endOfMonth(hoje)),
      };
    case "mes_atual":
    default:
      return { inicio: ymd(startOfMonth(hoje)), fim: ymd(endOfMonth(hoje)) };
  }
}

export const OK_MESSAGES: Record<string, string> = {
  criada: "Movimentação criada.",
  atualizada: "Movimentação atualizada.",
  arquivada: "Movimentação arquivada.",
  excluida: "Movimentação excluída.",
  categoria_criada: "Categoria criada.",
  categoria_atualizada: "Categoria atualizada.",
  categoria_arquivada: "Categoria arquivada.",
};
