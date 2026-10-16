import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "green" | "teal" | "amber" | "red" | "gray";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border border-border-strong bg-bg-alt text-ink-soft",
  green: "bg-green-soft text-green",
  teal: "bg-teal-soft text-teal",
  amber: "bg-amber-soft text-amber",
  red: "bg-red-soft text-red",
  gray: "bg-gray-badge-soft text-gray-badge",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
