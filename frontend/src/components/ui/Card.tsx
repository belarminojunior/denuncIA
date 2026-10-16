import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Card({ title, description, icon: Icon, action, className, bodyClassName, children }: CardProps) {
  const hasHeader = Boolean(title || action);
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 sm:p-6", className)}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal text-ink">
                {Icon && <Icon size={16} className="text-muted" aria-hidden />}
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(hasHeader && "mt-5", bodyClassName)}>{children}</div>
    </section>
  );
}
