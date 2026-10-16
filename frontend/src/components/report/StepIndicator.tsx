import clsx from "clsx";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  /** Zero-based index of the current step. */
  current: number;
  /** Only steps already visited can be revisited. */
  onSelect: (index: number) => void;
}

export function StepIndicator({ steps, current, onSelect }: StepIndicatorProps) {
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li key={label}>
            <button
              type="button"
              disabled={!isDone}
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? "step" : undefined}
              className="group w-full text-left disabled:cursor-default"
            >
              <span className={clsx("block h-1.5 rounded-full transition-colors", index <= current ? "bg-green" : "bg-border-strong")} />
              <span
                className={clsx(
                  "mt-2 flex items-center gap-1.5 text-xs",
                  isCurrent ? "font-semibold text-ink" : isDone ? "text-ink-soft group-hover:text-green" : "text-muted",
                )}
              >
                {isDone ? <Check size={13} className="text-green" aria-hidden /> : <span aria-hidden>{index + 1}.</span>}
                <span className="truncate">{label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
