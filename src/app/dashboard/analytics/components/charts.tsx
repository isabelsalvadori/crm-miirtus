"use client";

import type { ReactElement } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  COR_DESPESA,
  COR_RECEITA,
  COR_RESULTADO,
  formatBRL,
} from "../constants";

const eixoTick = { fontSize: 11, fill: "#6b7280" };
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  fontSize: 12,
};

const kFormat = (v: unknown) => {
  const n = Number(v);
  return Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
};
const brlTooltip = (v: unknown) => formatBRL(Number(v));

function ChartBox({ children }: { children: ReactElement }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/** Barras agrupadas: Receita x Despesa por mês. */
export function GraficoReceitaDespesa({
  data,
}: {
  data: { mes: string; receita: number; despesa: number }[];
}) {
  return (
    <ChartBox>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="mes" tick={eixoTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={eixoTick}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={kFormat}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={brlTooltip} />
        <Bar dataKey="receita" name="Receita" fill={COR_RECEITA} radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesa" name="Despesa" fill={COR_DESPESA} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartBox>
  );
}

/** Barras horizontais: ranking de receita por produto (top 5). */
export function GraficoReceitaPorProduto({
  data,
}: {
  data: { nome: string; receita: number }[];
}) {
  return (
    <ChartBox>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
        <XAxis type="number" tick={eixoTick} tickLine={false} axisLine={false} tickFormatter={kFormat} />
        <YAxis
          type="category"
          dataKey="nome"
          tick={eixoTick}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={brlTooltip} />
        <Bar dataKey="receita" name="Receita" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COR_RECEITA} />
          ))}
        </Bar>
      </BarChart>
    </ChartBox>
  );
}

/** Linha: resultado acumulado (receita − despesa) por mês. */
export function GraficoResultadoAcumulado({
  data,
}: {
  data: { mes: string; acumulado: number }[];
}) {
  return (
    <ChartBox>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="mes" tick={eixoTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={eixoTick}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={kFormat}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={brlTooltip} />
        <Line
          type="monotone"
          dataKey="acumulado"
          name="Resultado acumulado"
          stroke={COR_RESULTADO}
          strokeWidth={2.5}
          dot={{ r: 3, fill: COR_RESULTADO }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartBox>
  );
}
