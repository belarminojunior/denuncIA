import { AlertTriangle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { PriorityBadge } from "@/components/report/ReportBadges";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ReportDetail } from "@/lib/types";

// Below this the suggestion is shown as unreliable and deserves extra scrutiny.
const LOW_CONFIDENCE = 0.6;

interface AiClassificationCardProps {
  report: ReportDetail;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AiClassificationCard({ report, onRefresh, isRefreshing }: AiClassificationCardProps) {
  const isPending = !report.ai_category && !report.ai_error;

  return (
    <Card
      title="Classificação sugerida pela IA"
      icon={Sparkles}
      description="Sugestão de apoio. A decisão final cabe ao técnico."
      action={report.ai_model && <span className="protocol-code text-xs text-muted">{report.ai_model}</span>}
    >
      {isPending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-alt p-4 text-sm text-ink-soft">
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-green" aria-hidden />
            A classificação automática ainda está em curso.
          </span>
          <Button size="sm" variant="secondary" onClick={onRefresh} loading={isRefreshing}>
            {!isRefreshing && <RefreshCw size={14} aria-hidden />} Atualizar
          </Button>
        </div>
      ) : report.ai_error ? (
        <Alert tone="warning" title="A classificação automática falhou">
          Classifique a denúncia manualmente no painel de revisão.
        </Alert>
      ) : (
        <SuggestionDetails report={report} />
      )}
    </Card>
  );
}

function SuggestionDetails({ report }: { report: ReportDetail }) {
  const confidence = report.ai_confidence ?? 0;
  const isLowConfidence = confidence < LOW_CONFIDENCE;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Categoria</p>
          <p className="mt-1 font-semibold text-ink">{report.ai_category ? CATEGORY_LABELS[report.ai_category] : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Confiança</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-bg-alt">
              <div
                className={isLowConfidence ? "h-2 rounded-full bg-amber" : "h-2 rounded-full bg-green"}
                style={{ width: formatPercent(confidence) }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums text-ink">{formatPercent(confidence)}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted">Prioridade</p>
          <div className="mt-1">{report.ai_priority ? <PriorityBadge priority={report.ai_priority} /> : "—"}</div>
        </div>
      </div>

      {isLowConfidence && (
        <p className="flex items-center gap-2 text-xs text-amber">
          <AlertTriangle size={14} aria-hidden /> Confiança baixa — confirme a categoria com atenção.
        </p>
      )}

      {report.ai_summary && (
        <div>
          <p className="text-xs text-muted">Resumo</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{report.ai_summary}</p>
        </div>
      )}
      {report.ai_justification && (
        <div>
          <p className="text-xs text-muted">Justificação</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{report.ai_justification}</p>
        </div>
      )}
      {report.ai_indicators && report.ai_indicators.length > 0 && (
        <div>
          <p className="text-xs text-muted">Indicadores identificados</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {report.ai_indicators.map((indicator) => (
              <li key={indicator} className="rounded-full bg-green-soft px-3 py-1 text-xs text-green">
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
