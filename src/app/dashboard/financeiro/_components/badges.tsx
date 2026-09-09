import { STATUS_BADGE_CLASS, statusEfetivo, statusLabel } from "../constants";

export function StatusBadge({
  tipo,
  status,
  dataVencimento,
}: {
  tipo: string | null | undefined;
  status: string | null | undefined;
  dataVencimento?: string | null;
}) {
  const efetivo = statusEfetivo(status, dataVencimento);
  const cls = STATUS_BADGE_CLASS[efetivo] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {statusLabel(tipo, efetivo)}
    </span>
  );
}

export function TipoBadge({ tipo }: { tipo: string | null | undefined }) {
  const isDespesa = tipo === "despesa";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isDespesa ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {isDespesa ? "Despesa" : "Receita"}
    </span>
  );
}
