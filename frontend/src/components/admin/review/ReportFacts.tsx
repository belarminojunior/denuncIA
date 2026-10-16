"use client";

import { useState, type ReactNode } from "react";
import { Download, FileText, Paperclip, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ApiError, downloadFile } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { Attachment, ReportDetail } from "@/lib/types";

const NOT_PROVIDED = "Não indicado";

export function ReportFacts({ report }: { report: ReportDetail }) {
  return (
    <Card title="Relato do denunciante" icon={FileText}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{report.description}</p>

      <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
        <Fact label="Tipo indicado">{report.reported_category ? CATEGORY_LABELS[report.reported_category] : "Não sabia"}</Fact>
        <Fact label="Local">{report.location || NOT_PROVIDED}</Fact>
        <Fact label="Data da ocorrência">{report.incident_date ? formatDate(report.incident_date) : NOT_PROVIDED}</Fact>
        <Fact label="Valor envolvido">{report.amount_involved || NOT_PROVIDED}</Fact>
        <Fact label="Envolvidos" wide>
          {report.involved_parties || NOT_PROVIDED}
        </Fact>
        <Fact label="Denunciante" wide>
          <ReporterIdentity report={report} />
        </Fact>
      </dl>

      <div className="mt-6 border-t border-border pt-5">
        <p className="flex items-center gap-2 text-xs text-muted">
          <Paperclip size={13} aria-hidden /> Evidências ({report.attachments.length})
        </p>
        {report.attachments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Sem anexos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {report.attachments.map((attachment) => (
              <AttachmentRow key={attachment.id} reportId={report.id} attachment={attachment} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Fact({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

function ReporterIdentity({ report }: { report: ReportDetail }) {
  if (report.is_anonymous) return <span className="text-ink-soft">Anónimo</span>;
  const contacts = [report.reporter_name, report.reporter_email, report.reporter_phone].filter(Boolean);
  return (
    <span className="flex items-center gap-2">
      <UserRound size={14} className="text-muted" aria-hidden />
      {contacts.length ? contacts.join(" · ") : "Identificado, sem contactos"}
    </span>
  );
}

function AttachmentRow({ reportId, attachment }: { reportId: string; attachment: Attachment }) {
  const notify = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  async function download() {
    setIsDownloading(true);
    try {
      await downloadFile(`/api/admin/reports/${reportId}/attachments/${attachment.id}`, attachment.filename);
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "Não foi possível descarregar o anexo.", "error");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="flex min-w-0 items-center gap-2.5">
        <FileText size={15} className="shrink-0 text-muted" aria-hidden />
        <span className="truncate text-ink">{attachment.filename}</span>
        <span className="shrink-0 text-xs text-muted">{formatBytes(attachment.size_bytes)}</span>
      </span>
      <button
        type="button"
        onClick={download}
        disabled={isDownloading}
        className="flex shrink-0 items-center gap-1 text-xs font-medium text-green hover:underline disabled:opacity-50"
      >
        <Download size={14} aria-hidden /> {isDownloading ? "A descarregar…" : "Descarregar"}
      </button>
    </li>
  );
}
