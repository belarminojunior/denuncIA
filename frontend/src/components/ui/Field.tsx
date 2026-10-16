import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

const CONTROL_CLASSES = cn(
  "w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink",
  "placeholder:text-muted/80 transition-colors",
  "focus:border-green focus:outline-none focus:ring-3 focus:ring-green-soft",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-red aria-invalid:ring-red-soft",
);

interface FieldProps {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, with ids wired for screen readers. */
export function Field({ label, htmlFor, optional, hint, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {optional && <span className="font-normal text-muted">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs text-red">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL_CLASSES, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CONTROL_CLASSES, "pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL_CLASSES, "resize-y leading-relaxed", className)} {...props} />;
}
