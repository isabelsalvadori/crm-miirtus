"use client";

import type { ReactNode } from "react";
import { formatPct } from "../constants";

/** Título de seção + divisor sutil. */
export function SecaoTitulo({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="border-b border-black/10 pb-3">
      <h2 className="text-lg font-semibold text-[#24483F]">{titulo}</h2>
      {descricao && <p className="mt-0.5 text-sm text-gray-500">{descricao}</p>}
    </div>
  );
}

/** Card de KPI: valor grande + label pequeno + variação % opcional. */
export function KpiCard({
  label,
  valor,
  variacao,
  tom = "neutro",
  hint,
}: {
  label: string;
  valor: ReactNode;
  variacao?: number | null;
  tom?: "neutro" | "positivo" | "negativo" | "auto";
  hint?: string;
}) {
  const corValor =
    tom === "positivo"
      ? "text-emerald-600"
      : tom === "negativo"
        ? "text-red-600"
        : tom === "auto"
          ? typeof valor === "number" && valor < 0
            ? "text-red-600"
            : "text-emerald-600"
          : "text-[#2D3230]";

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${corValor}`}>{valor}</p>
      {variacao !== undefined && (
        <p className="mt-1 text-xs">
          <Variacao valor={variacao} />
          {hint && <span className="ml-1 text-gray-400">{hint}</span>}
        </p>
      )}
      {variacao === undefined && hint && (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

/** Seta + percentual colorido (verde se sobe, vermelho se cai). */
export function Variacao({ valor }: { valor: number | null }) {
  if (valor == null) return <span className="text-gray-400">—</span>;
  const sobe = valor > 0;
  const desce = valor < 0;
  const cor = sobe ? "text-emerald-600" : desce ? "text-red-600" : "text-gray-400";
  const seta = sobe ? "↑" : desce ? "↓" : "→";
  return (
    <span className={`font-semibold ${cor}`}>
      {seta} {formatPct(valor)}
    </span>
  );
}

/** Barra horizontal simples (distribuições sem gráfico). */
export function MiniBar({
  label,
  valor,
  max,
  cor = "#24483F",
}: {
  label: string;
  valor: number;
  max: number;
  cor?: string;
}) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-gray-600">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, valor > 0 ? 4 : 0)}%`, backgroundColor: cor }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-medium text-gray-700">
        {valor}
      </span>
    </div>
  );
}
