"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import clsx from "clsx";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DISMISS_AFTER_MS = 4500;

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++nextToastId;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto flex w-full max-w-sm animate-slide-up items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg",
              toast.tone === "success" ? "bg-dark text-bg" : "bg-red text-bg",
            )}
          >
            {toast.tone === "success" ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Fechar notificação" className="opacity-70 hover:opacity-100">
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside <ToastProvider>");
  return notify;
}
