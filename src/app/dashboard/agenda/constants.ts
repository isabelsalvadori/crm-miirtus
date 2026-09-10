/**
 * Constantes e helpers de data/horário do módulo de Agenda
 * (/dashboard/agenda).
 */

export type ModoAgenda = "dia" | "semana" | "mes";

export const MODOS: { value: ModoAgenda; label: string }[] = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

/** Faixa de horas exibida nas grades de Dia e Semana. */
export const HORA_INICIO = 6;
export const HORA_FIM = 22;
/** Altura em px de cada faixa de 1 hora. */
export const HORA_PX = 48;

export const DIAS_SEMANA_CURTO = [
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sáb",
  "dom",
];

export const CORES = {
  tarefa: { bg: "#24483F", fg: "#FFFFFF", borda: "#1c3a33" },
  edicao: { bg: "#E3BD62", fg: "#2D3230", borda: "#c9a94f" },
  prazo: { bg: "#B97059", fg: "#FFFFFF", borda: "#a25f49" },
} as const;

// ------------------------------------------------------------
// Datas (trabalhamos com datas de calendário no fuso local)
// ------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "yyyy-mm-dd" (componentes locais). */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "yyyy-mm-dd..." -> Date à meia-noite local. */
export function parseYmd(s: string): Date {
  const [y, m, dia] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, dia ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
}

/** Segunda-feira da semana que contém `d`. */
export function inicioSemana(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // seg = 0 ... dom = 6
  x.setDate(x.getDate() - dow);
  return x;
}

export function inicioMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function mesmoMes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** 6 semanas (42 células) a partir da segunda-feira que abre o mês. */
export function gradeMes(cursor: Date): Date[] {
  const inicio = inicioSemana(inicioMes(cursor));
  return Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
}

export function diasDaSemana(cursor: Date): Date[] {
  const inicio = inicioSemana(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
}

// ------------------------------------------------------------
// Horários
// ------------------------------------------------------------

/** "HH:MM[:SS]" -> minutos desde 00:00. */
export function hhmmParaMin(v: string): number {
  const [h, m] = v.slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** minutos -> "HH:MM". */
export function minParaHhmm(min: number): string {
  const total = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function horasDaGrade(): number[] {
  return Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);
}

// ------------------------------------------------------------
// Formatação pt-BR
// ------------------------------------------------------------

const capitalizar = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function tituloPeriodo(modo: ModoAgenda, cursor: Date): string {
  if (modo === "dia") {
    return capitalizar(
      cursor.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }
  if (modo === "semana") {
    const dias = diasDaSemana(cursor);
    const ini = dias[0];
    const fim = dias[6];
    const iniFmt = ini.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
    const fimFmt = fim.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${iniFmt} – ${fimFmt}`;
  }
  return capitalizar(
    cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  );
}
