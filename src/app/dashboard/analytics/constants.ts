/**
 * Constantes, cores e helpers do módulo de Analytics (/dashboard/analytics).
 * Nada aqui grava no banco — só leitura e cálculo.
 */

import type { Intervalo } from "./types";

export const COR_RECEITA = "#24483F";
export const COR_DESPESA = "#B97059";
export const COR_RESULTADO = "#E3BD62";

export type PeriodoKey =
  | "mes_atual"
  | "mes_anterior"
  | "ultimos_30"
  | "este_ano"
  | "ano_anterior"
  | "personalizado";

export const PERIODO_OPTIONS: { value: PeriodoKey; label: string }[] = [
  { value: "mes_atual", label: "Este mês" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "ultimos_30", label: "Últimos 30 dias" },
  { value: "este_ano", label: "Este ano" },
  { value: "ano_anterior", label: "Ano anterior" },
  { value: "personalizado", label: "Personalizado" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function primeiroDia(ano: number, mes: number): Date {
  return new Date(ano, mes, 1);
}
function ultimoDia(ano: number, mes: number): Date {
  return new Date(ano, mes + 1, 0);
}

/** Resolve a chave de período (+ range custom) em { inicio, fim } YYYY-MM-DD. */
export function resolverPeriodo(
  key: PeriodoKey,
  custom?: { inicio: string; fim: string },
): Intervalo {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  switch (key) {
    case "mes_atual":
      return { inicio: ymd(primeiroDia(ano, mes)), fim: ymd(ultimoDia(ano, mes)) };
    case "mes_anterior":
      return {
        inicio: ymd(primeiroDia(ano, mes - 1)),
        fim: ymd(ultimoDia(ano, mes - 1)),
      };
    case "ultimos_30": {
      const ini = new Date(hoje);
      ini.setDate(ini.getDate() - 29);
      return { inicio: ymd(ini), fim: ymd(hoje) };
    }
    case "este_ano":
      return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
    case "ano_anterior":
      return { inicio: `${ano - 1}-01-01`, fim: `${ano - 1}-12-31` };
    case "personalizado":
      return {
        inicio: custom?.inicio || ymd(primeiroDia(ano, mes)),
        fim: custom?.fim || ymd(ultimoDia(ano, mes)),
      };
  }
}

/** Mês corrente e mês anterior como intervalos completos. */
export function mesAtualEAnterior(): { atual: Intervalo; anterior: Intervalo } {
  const hoje = new Date();
  const a = hoje.getFullYear();
  const m = hoje.getMonth();
  return {
    atual: { inicio: ymd(primeiroDia(a, m)), fim: ymd(ultimoDia(a, m)) },
    anterior: {
      inicio: ymd(primeiroDia(a, m - 1)),
      fim: ymd(ultimoDia(a, m - 1)),
    },
  };
}

/** Últimos `n` meses (inclui o corrente) como chaves "YYYY-MM" + label curto. */
export function ultimosMeses(n = 6): { chave: string; label: string; intervalo: Intervalo }[] {
  const hoje = new Date();
  const out: { chave: string; label: string; intervalo: Intervalo }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const a = d.getFullYear();
    const m = d.getMonth();
    out.push({
      chave: `${a}-${pad(m + 1)}`,
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      intervalo: { inicio: ymd(primeiroDia(a, m)), fim: ymd(ultimoDia(a, m)) },
    });
  }
  return out;
}

/** true quando `data` (YYYY-MM-DD... ou ISO) cai dentro de [inicio, fim]. */
export function dentro(
  data: string | null | undefined,
  intervalo: Intervalo,
): boolean {
  if (!data) return false;
  const d = data.slice(0, 10);
  return d >= intervalo.inicio && d <= intervalo.fim;
}

export function formatBRL(v: number | null | undefined): string {
  const n = typeof v === "number" ? v : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNum(v: number | null | undefined): string {
  const n = typeof v === "number" ? v : 0;
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** Crescimento %: (atual − anterior) ÷ anterior × 100. Null quando indefinido. */
export function crescimentoPct(atual: number, anterior: number): number | null {
  if (!anterior) {
    if (!atual) return 0;
    return null; // base zero, variação infinita
  }
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export function formatPct(v: number | null): string {
  if (v == null) return "—";
  const s = v.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  return `${v > 0 ? "+" : ""}${s}%`;
}

export function roas(
  receita: number | null | undefined,
  gasto: number | null | undefined,
): number | null {
  const r = receita ?? 0;
  const g = gasto ?? 0;
  return g > 0 ? r / g : null;
}

export function cac(
  gasto: number | null | undefined,
  vendas: number | null | undefined,
): number | null {
  const g = gasto ?? 0;
  const v = vendas ?? 0;
  return v > 0 ? g / v : null;
}
