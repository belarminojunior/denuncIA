import { cn } from "@/lib/cn";
import { APP_NAME, INSTITUTION_NAME } from "@/lib/labels";

interface LogoProps {
  /** "dark" for use on dark backgrounds (footer, admin sidebar). */
  theme?: "light" | "dark";
  subtitle?: string | null;
  className?: string;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green font-serif text-sm font-bold tracking-tight text-bg",
        className,
      )}
    >
      IA
    </span>
  );
}

/** Wordmark "denunc" + highlighted "IA", the platform's brand. */
export function Logo({ theme = "light", subtitle = INSTITUTION_NAME, className }: LogoProps) {
  const isDark = theme === "dark";
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className={cn("block font-serif text-lg font-semibold", isDark ? "text-bg" : "text-ink")}>
          {APP_NAME.slice(0, -2)}
          <span className={isDark ? "text-green-soft" : "text-green"}>{APP_NAME.slice(-2)}</span>
        </span>
        {subtitle && (
          <span className={cn("hidden text-xs sm:block", isDark ? "text-dark-muted" : "text-muted")}>{subtitle}</span>
        )}
      </span>
    </span>
  );
}
