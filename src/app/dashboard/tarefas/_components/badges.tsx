import {
  PRIORIDADE_FLAG_CLASS,
  STATUS_BADGE_CLASS,
  prioridadeLabel,
  statusLabel,
  tagTextColor,
} from "../constants";

export function PriorityFlag({
  value,
  withLabel = false,
}: {
  value: string | null | undefined;
  withLabel?: boolean;
}) {
  const cls = PRIORIDADE_FLAG_CLASS[value ?? "normal"] ?? "text-blue-500";
  return (
    <span className={`inline-flex items-center gap-1 ${cls}`}>
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 shrink-0"
        fill="currentColor"
        aria-hidden
      >
        <path d="M3 1.5a.75.75 0 0 1 .75.75v.4l1.9-.48a4 4 0 0 1 2.72.27 4 4 0 0 0 2.72.27l1.2-.3A.9.9 0 0 1 13.5 3.2v6.03a.75.75 0 0 1-.57.73l-1.7.42a4 4 0 0 1-2.72-.27 4 4 0 0 0-2.72-.27l-1.32.33V15a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 3 1.5Z" />
      </svg>
      {withLabel && (
        <span className="text-xs font-medium">{prioridadeLabel(value)}</span>
      )}
    </span>
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const cls = STATUS_BADGE_CLASS[value ?? "a_fazer"] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {statusLabel(value)}
    </span>
  );
}

export function TagBadge({
  nome,
  cor,
}: {
  nome: string;
  cor: string | null | undefined;
}) {
  const bg = cor && /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : "#e5e7eb";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: tagTextColor(bg) }}
    >
      {nome}
    </span>
  );
}
