import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value?: number | string | null;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "warning";
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-card p-5",
        tone === "warning" ? "border-l-4 border-l-amber border-border" : "border-border"
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted">
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>
      <p className={clsx("mt-2 text-2xl font-semibold", tone === "accent" ? "text-green" : "text-ink")}>
        {value ?? "—"}
      </p>
    </div>
  );
}
