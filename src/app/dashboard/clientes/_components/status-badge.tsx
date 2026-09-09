import { STATUS_BADGE_CLASS, statusLabel } from "../constants";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const cls = STATUS_BADGE_CLASS[value] ?? "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {statusLabel(value)}
    </span>
  );
}
