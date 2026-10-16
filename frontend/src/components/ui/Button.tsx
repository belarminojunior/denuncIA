import Link from "next/link";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-green text-bg hover:bg-green-dark",
  secondary: "border border-border-strong bg-card text-ink hover:border-green hover:text-green",
  outline: "border border-green text-green hover:bg-green-soft",
  ghost: "text-green hover:bg-green-soft",
  danger: "border border-red/40 text-red hover:bg-red-soft",
  destructive: "bg-red text-bg hover:bg-red/90",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2.5 text-sm",
  lg: "gap-2 px-5 py-3 text-sm",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

function buttonClasses({ variant = "primary", size = "md", fullWidth }: StyleProps, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & StyleProps & { loading?: boolean };

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth }, className)}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth }, className)} {...props} />;
}
