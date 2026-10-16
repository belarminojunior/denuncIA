import Link from "next/link";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  /** "highlight" marks the card as needing attention. */
  tone?: "default" | "accent" | "highlight";
  /** Optional link, e.g. to the list filtered by this status. */
  href?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "default", href }: StatCardProps) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-xs text-muted">
        <Icon size={14} aria-hidden /> {label}
      </span>
      {value === undefined ? (
        <Skeleton className="mt-2.5 h-7 w-12" />
      ) : (
        <span className={clsx("mt-2 block text-2xl font-semibold", tone === "accent" ? "text-green" : "text-ink")}>{value}</span>
      )}
    </>
  );

  const classes = clsx(
    "block rounded-xl border border-border bg-card p-5",
    tone === "highlight" && "border-l-4 border-l-amber",
    href && "transition-colors hover:border-green/50 hover:shadow-sm",
  );

  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
