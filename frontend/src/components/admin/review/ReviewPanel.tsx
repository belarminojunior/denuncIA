"use client";

import { useState } from "react";
import { Archive, CheckCircle2, Lock, Save, Search, Send, XCircle, type LucideIcon } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiSend } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { CATEGORIES, PRIORITIES, type Category, type Priority, type ReportDetail } from "@/lib/types";
import { canEditClassification, isClosed, primaryActionFor, type ReviewAction } from "@/lib/workflow";

interface ActionConfig {
  label: string;
  icon: LucideIcon;
  success: string;
  /** Closing actions cannot be undone, so they ask for confirmation. */
  confirm?: { title: string; description: string };
}

const ACTIONS: Record<ReviewAction, ActionConfig> = {
  validate: { label: "Validar classificação", icon: CheckCircle2, success: "Denúncia validada." },
  route: { label: "Encaminhar para tratamento", icon: Send, success: "Denúncia encaminhada para tratamento no GCCC." },
  investigate: { label: "Iniciar investigação", icon: Search, success: "Denúncia marcada como em investigação." },
  archive: {
    label: "Arquivar processo",
    icon: Archive,
    success: "Processo arquivado.",
    confirm: {
      title: "Arquivar o processo?",
      description: "O processo fica encerrado e deixa de poder ser alterado. O denunciante verá o estado «Finalizada».",
    },
  },
  reject: {
    label: "Rejeitar denúncia",
    icon: XCircle,
    success: "Denúncia rejeitada.",
    confirm: {
      title: "Rejeitar a denúncia?",
      description: "Use quando a denúncia não reúne condições para prosseguir. A decisão é definitiva e fica registada.",
    },
  },
};

interface ReviewPanelProps {
  report: ReportDetail;
  onUpdated: (report: ReportDetail) => void;
}

export function ReviewPanel({ report, onUpdated }: ReviewPanelProps) {
  const notify = useToast();
  const [category, setCategory] = useState<Category | "">(report.validated_category ?? report.ai_category ?? "");
  const [priority, setPriority] = useState<Priority | "">(report.validated_priority ?? report.ai_priority ?? "");
  const [notes, setNotes] = useState(report.reviewer_notes ?? "");
  const [pendingAction, setPendingAction] = useState<ReviewAction | "save" | null>(null);
  const [confirming, setConfirming] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isClosed(report.status)) return <ClosedNotice report={report} />;

  const primaryAction = primaryActionFor(report.status);
  const isEditable = canEditClassification(report.status);
  const secondaryActions = (["archive", "reject"] as const).filter((action) => action !== primaryAction);
  const notesChanged = notes.trim() !== (report.reviewer_notes ?? "");
  const isBusy = pendingAction !== null;

  async function request(action: ReviewAction | "save") {
    setPendingAction(action);
    setError(null);
    try {
      const updated =
        action === "save"
          ? await apiSend<ReportDetail>("PATCH", `/api/admin/reports/${report.id}`, { notes })
          : await apiSend<ReportDetail>("POST", `/api/admin/reports/${report.id}/${action}`, {
              notes: notes.trim() || null,
              ...(action === "validate" && { category, priority }),
            });
      onUpdated(updated);
      notify(action === "save" ? "Notas guardadas." : ACTIONS[action].success);
      setConfirming(null);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Não foi possível concluir a operação.");
      setConfirming(null);
    } finally {
      setPendingAction(null);
    }
  }

  function run(action: ReviewAction) {
    if (ACTIONS[action].confirm) setConfirming(action);
    else request(action);
  }

  const canRunPrimary = primaryAction !== "validate" || (category !== "" && priority !== "");
  const PrimaryIcon = primaryAction ? ACTIONS[primaryAction].icon : null;

  return (
    <Card title="Revisão do técnico" description={`Estado atual: ${STATUS_LABELS[report.status]}`}>
      <div className="space-y-5">
        {isEditable && (
          <>
            <Field
              label="Categoria"
              htmlFor="review-category"
              hint={report.ai_category && category !== report.ai_category ? "Diferente da sugestão da IA — a correção fica registada." : undefined}
            >
              <Select id="review-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>
                <option value="" disabled>
                  Selecione…
                </option>
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade" htmlFor="review-priority">
              <Select id="review-priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                <option value="" disabled>
                  Selecione…
                </option>
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {!isEditable && report.validated_category && (
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-green-soft p-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Categoria validada</dt>
              <dd className="font-semibold text-ink">{CATEGORY_LABELS[report.validated_category]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Prioridade</dt>
              <dd className="font-semibold text-ink">{report.validated_priority ? PRIORITY_LABELS[report.validated_priority] : "—"}</dd>
            </div>
          </dl>
        )}

        <Field label="Notas do técnico" htmlFor="review-notes" optional hint="Ficam associadas à próxima operação no histórico.">
          <Textarea id="review-notes" rows={4} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="space-y-2.5">
          {primaryAction && PrimaryIcon && (
            <Button fullWidth onClick={() => run(primaryAction)} disabled={!canRunPrimary || isBusy} loading={pendingAction === primaryAction}>
              {pendingAction !== primaryAction && <PrimaryIcon size={16} aria-hidden />}
              {ACTIONS[primaryAction].label}
            </Button>
          )}
          <Button
            fullWidth
            variant="secondary"
            onClick={() => request("save")}
            disabled={!notesChanged || isBusy}
            loading={pendingAction === "save"}
          >
            {pendingAction !== "save" && <Save size={16} aria-hidden />} Guardar notas
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {secondaryActions.map((action) => {
            const Icon = ACTIONS[action].icon;
            return (
              <Button key={action} size="sm" variant="danger" onClick={() => run(action)} disabled={isBusy}>
                <Icon size={14} aria-hidden /> {ACTIONS[action].label}
              </Button>
            );
          })}
        </div>
      </div>

      {confirming && ACTIONS[confirming].confirm && (
        <ConfirmDialog
          open
          title={ACTIONS[confirming].confirm.title}
          description={ACTIONS[confirming].confirm.description}
          confirmLabel={ACTIONS[confirming].label}
          destructive={confirming === "reject"}
          loading={pendingAction === confirming}
          onConfirm={() => request(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </Card>
  );
}

function ClosedNotice({ report }: { report: ReportDetail }) {
  return (
    <Card title="Processo encerrado" icon={Lock}>
      <p className="text-sm text-ink-soft">
        Esta denúncia foi <strong className="text-ink">{STATUS_LABELS[report.status].toLowerCase()}</strong> a{" "}
        {formatDateTime(report.updated_at)}
        {report.assignee_name && ` por ${report.assignee_name}`}. Já não pode ser alterada.
      </p>
      {report.reviewer_notes && (
        <div className="mt-4">
          <p className="text-xs text-muted">Notas do técnico</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md bg-bg-alt p-3 text-sm text-ink">{report.reviewer_notes}</p>
        </div>
      )}
    </Card>
  );
}
