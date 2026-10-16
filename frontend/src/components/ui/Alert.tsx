import { cn } from "@/lib/cn";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { classes: string; icon: LucideIcon }> = {
  info: { classes: "border-green/25 bg-green-soft text-ink", icon: Info },
  success: { classes: "border-green/30 bg-green-soft text-green", icon: CheckCircle2 },
  warning: { classes: "border-amber/30 bg-amber-soft text-ink", icon: AlertTriangle },
  error: { classes: "border-red/30 bg-red-soft text-red", icon: XCircle },
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Alert({ tone = "info", title, className, children }: AlertProps) {
  const { classes, icon: Icon } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cn("flex gap-3 rounded-lg border p-4 text-sm", classes, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
