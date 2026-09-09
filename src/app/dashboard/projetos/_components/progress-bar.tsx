export function ProgressBar({
  percentual,
  size = "md",
}: {
  percentual: number;
  size?: "sm" | "md";
}) {
  const pct = Math.min(100, Math.max(0, percentual));
  const height = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-black/5 ${height}`}
    >
      <div
        className="h-full rounded-full bg-[#24483F] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
