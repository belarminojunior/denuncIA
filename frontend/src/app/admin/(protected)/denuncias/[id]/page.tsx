"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileX } from "lucide-react";
import { AiClassificationCard } from "@/components/admin/review/AiClassificationCard";
import { AuditTrail } from "@/components/admin/review/AuditTrail";
import { ReportFacts } from "@/components/admin/review/ReportFacts";
import { ReviewPanel } from "@/components/admin/review/ReviewPanel";
import { StageBadge, StatusBadge } from "@/components/report/ReportBadges";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, apiGet } from "@/lib/api";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { ReportDetail } from "@/lib/types";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setReport(await apiGet<ReportDetail>(`/api/admin/reports/${id}`));
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar a denúncia.");
    }
  }, [id]);

  useEffect(() => {
    async function loadOnMount() {
      await load();
    }
    loadOnMount();
  }, [load]);

  async function refresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  if (error) {
    return (
      <EmptyState
        icon={FileX}
        title="Denúncia indisponível"
        description={error}
        action={<ButtonLink href="/admin/denuncias" variant="secondary">Voltar à lista</ButtonLink>}
      />
    );
  }

  if (!report) return <DetailSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/denuncias" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-green">
          <ArrowLeft size={14} aria-hidden /> Denúncias
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="protocol-code text-2xl font-bold text-ink sm:text-3xl">{report.protocol}</h1>
          <StatusBadge status={report.status} />
          <StageBadge status={report.status} />
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          Recebida a {formatDateTime(report.created_at)} · atualizada {timeAgo(report.updated_at)}
          {report.assignee_name && ` · responsável: ${report.assignee_name}`}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <AiClassificationCard report={report} onRefresh={refresh} isRefreshing={isRefreshing} />
          <ReportFacts report={report} />
          <AuditTrail logs={report.audit_logs} />
        </div>
        <div className="lg:sticky lg:top-6">
          {/* Re-mounts once the AI result arrives so the form picks up its suggestion. */}
          <ReviewPanel key={report.ai_category ?? "pending"} report={report} onUpdated={setReport} />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
