"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";
import type { ReportSubmitted } from "@/lib/types";

const COPIED_FEEDBACK_MS = 2000;

export function SubmissionSuccess({ result, onNewReport }: { result: ReportSubmitted; onNewReport: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyProtocol() {
    await navigator.clipboard.writeText(result.protocol);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <div className="mx-auto max-w-2xl animate-slide-up px-4 py-14 sm:px-6">
      <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green text-bg">
          <CheckCircle2 size={28} aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl text-ink">Denúncia submetida com sucesso</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Guarde o protocolo abaixo. É a única forma de acompanhar o processo — sobretudo numa denúncia anónima, não o
          conseguimos recuperar por si.
        </p>

        <div className="mt-8 rounded-lg bg-green-soft p-6">
          <p className="label-eyebrow !text-green">Protocolo</p>
          <p className="protocol-code mt-2 break-all text-2xl font-bold text-green sm:text-3xl">{result.protocol}</p>
          <p className="mt-2 text-xs text-ink-soft">Submetida a {formatDateTime(result.created_at)}</p>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={copyProtocol}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? "Copiado" : "Copiar protocolo"}
          </Button>
          <ButtonLink href={`/consultar?protocolo=${result.protocol}`} variant="secondary">
            Acompanhar estado
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-center text-sm text-muted">
        <p>
          A plataforma está a preparar uma classificação preliminar. Um técnico do GCCC revê-a sempre antes de dar
          seguimento.
        </p>
        <button type="button" onClick={onNewReport} className="font-medium text-green hover:underline">
          Fazer outra denúncia
        </button>
      </div>
    </div>
  );
}
