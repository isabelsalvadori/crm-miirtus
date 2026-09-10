import {
  META_STATUS_BADGE,
  corBarraMeta,
  formatValorMeta,
  metaStatusLabel,
  percentualMeta,
  periodoLabel,
} from "@/app/dashboard/metas/constants";
import { SecaoShell } from "./SecaoShell";
import type { MetaLite } from "./types";

export function MetasVinculadas({ metas }: { metas: MetaLite[] }) {
  return (
    <SecaoShell
      titulo="Metas vinculadas"
      count={metas.length}
      vazio="Nenhuma meta vinculada a este produto."
    >
      <ul className="space-y-3">
        {metas.map((meta) => {
          const pct = percentualMeta(meta.valor_atual, meta.valor_alvo);
          const cor = corBarraMeta(pct, meta.periodo_fim);
          return (
            <li key={meta.id} className="rounded-lg border border-black/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {meta.nome}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    META_STATUS_BADGE[meta.status ?? "ativa"] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {metaStatusLabel(meta.status)}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className={`font-semibold ${cor.texto}`}>{pct}%</span>
                <span className="text-gray-500">
                  {formatValorMeta(meta.valor_atual, meta.unidade)} /{" "}
                  {formatValorMeta(meta.valor_alvo, meta.unidade)}
                </span>
              </div>

              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className={`h-full rounded-full ${cor.barra}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                {periodoLabel(meta.periodo_inicio, meta.periodo_fim)}
              </p>
            </li>
          );
        })}
      </ul>
    </SecaoShell>
  );
}
