import clsx from "clsx";

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  /** Tailwind background class for the bar. */
  barClassName?: string;
}

/** Horizontal bars scaled to the largest value; lighter than a chart for short lists. */
export function BarList({ items, emptyLabel = "Sem dados." }: { items: BarListItem[]; emptyLabel?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted">{emptyLabel}</p>;
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate text-ink-soft">{item.label}</span>
            <span className="font-medium tabular-nums text-ink">{item.value}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-bg-alt">
            <div
              className={clsx("h-2 rounded-full transition-[width] duration-500", item.barClassName ?? "bg-green")}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
