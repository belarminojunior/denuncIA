import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import type { ReportFormState } from "@/components/report/reportForm";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";

interface ReviewStepProps {
  form: ReportFormState;
  files: File[];
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  onEdit: (step: number) => void;
  showErrors: boolean;
  submitError: string | null;
}

const NOT_PROVIDED = "Não indicado";

function identityLabel(form: ReportFormState): string {
  if (form.isAnonymous) return "Anónima";
  const contacts = [form.reporterName, form.reporterEmail, form.reporterPhone].filter((value) => value.trim());
  return contacts.length ? `Identificada — ${contacts.join(" · ")}` : "Identificada (sem contactos)";
}

export function ReviewStep({ form, files, acknowledged, onAcknowledgedChange, onEdit, showErrors, submitError }: ReviewStepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">Confirme os dados. Depois de submetida, a denúncia não pode ser editada.</p>

      <ReviewSection title="Ocorrência" onEdit={() => onEdit(0)}>
        <dl>
          <ReviewRow label="Denúncia" value={identityLabel(form)} />
          <ReviewRow label="Tipo" value={form.reportedCategory ? CATEGORY_LABELS[form.reportedCategory] : "Não sei — a plataforma sugere"} />
          <ReviewRow label="Local" value={form.location || NOT_PROVIDED} />
          <ReviewRow label="Data" value={form.incidentDate ? formatDate(form.incidentDate) : NOT_PROVIDED} />
          <ReviewRow label="Envolvidos" value={form.involvedParties || NOT_PROVIDED} />
          <ReviewRow label="Valor" value={form.amountInvolved || NOT_PROVIDED} />
        </dl>
      </ReviewSection>

      <ReviewSection title="Descrição" onEdit={() => onEdit(1)}>
        <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-ink">{form.description.trim()}</p>
      </ReviewSection>

      <ReviewSection title="Evidências" onEdit={() => onEdit(2)}>
        <p className="px-5 py-4 text-sm text-ink">
          {files.length ? files.map((file) => file.name).join(", ") : "Nenhum ficheiro anexado"}
        </p>
      </ReviewSection>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber/30 bg-amber-soft p-4 text-sm text-ink">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => onAcknowledgedChange(event.target.checked)}
          aria-invalid={showErrors && !acknowledged}
          className="mt-0.5 h-4 w-4 shrink-0 accent-green"
        />
        <span>
          Declaro que as informações correspondem a factos de que tenho conhecimento e que sei que a prestação de
          informações falsas pode ter consequências legais.
        </span>
      </label>
      {showErrors && !acknowledged && (
        <p role="alert" className="-mt-3 text-xs text-red">
          Confirme a declaração para submeter.
        </p>
      )}

      {submitError && <Alert tone="error">{submitError}</Alert>}
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border bg-bg-alt/60 px-5 py-2.5">
        <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-green hover:underline">
          <Pencil size={12} aria-hidden /> Editar
        </button>
      </header>
      {children}
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border px-5 py-3 text-sm last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
