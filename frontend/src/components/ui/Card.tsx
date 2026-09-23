import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export function Card({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("rounded-xl border border-border bg-card p-6", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && (
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              {Icon && <Icon size={16} className="text-muted" />} {title}
            </p>
          )}
          {action}
        </div>
      )}
      <div className={clsx(title || action ? "mt-5" : undefined, bodyClassName)}>{children}</div>
    </div>
  );
}
