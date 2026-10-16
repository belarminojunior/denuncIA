"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, Circle, Search } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { STAGE_ICONS } from "@/components/report/ReportBadges";
import { ApiError, apiGet } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS, STATUS_PUBLIC_DESCRIPTIONS } from "@/lib/labels";
import type { PublicReportStatus, ReportStatus } from "@/lib/types";
import { MAIN_PATH, STAGE_LABELS, isClosed, stageOf, type Stage } from "@/lib/workflow";

const PROTOCOL_PARAM = "protocolo";

const STAGE_BANNER_CLASSES: Record<Stage, string> = {
  IN_PROGRESS: "border-teal/30 bg-teal-soft text-teal",
  UNDER_INVESTIGATION: "border-amber/30 bg-amber-soft text-amber",
  CLOSED: "border-border-strong bg-bg-alt text-ink-soft",
};

/**
 * Open reports show the whole main path ahead of them. A process can close from
 * any step, so closed reports show only the steps actually reached.
 */
function timelineFor(result: PublicReportStatus): ReportStatus[] {
  if (result.status === "UNDER_INVESTIGATION") return [...MAIN_PATH, result.status];
  if (!isClosed(result.status)) return MAIN_PATH;
  const reached = new Set<ReportStatus>(["RECEIVED", ...result.history.map((event) => event.status)]);
  const path = [...MAIN_PATH, "UNDER_INVESTIGATION" as const].filter((status) => reached.has(status));
  return [...path, result.status];
}

export function StatusLookup() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialProtocol = searchParams.get(PROTOCOL_PARAM) ?? "";

  const [protocol, setProtocol] = useState(initialProtocol);
  const [result, setResult] = useState<PublicReportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function lookup(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await apiGet<PublicReportStatus>(`/api/reports/${encodeURIComponent(normalized)}`));
      // Keeps the protocol in the URL so the page can be bookmarked or reloaded.
      router.replace(`${pathname}?${PROTOCOL_PARAM}=${encodeURIComponent(normalized)}`, { scroll: false });
    } catch (lookupError) {
      setError(lookupError instanceof ApiError ? lookupError.message : "Não foi possível consultar o protocolo.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function lookupFromUrl() {
      if (initialProtocol) await lookup(initialProtocol);
    }
    lookupFromUrl();
    // Runs once: later lookups are triggered by the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="label-eyebrow">Acompanhamento</p>
      <h1 className="mt-2 text-3xl text-ink">Consultar denúncia</h1>
      <p className="mt-2 text-ink-soft">Introduza o protocolo recebido no momento da submissão.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          lookup(protocol);
        }}
        className="mt-6 rounded-xl border border-border bg-bg-alt p-5 sm:p-6"
      >
        <label htmlFor="protocol" className="mb-1.5 block text-sm font-medium text-ink">
          Protocolo
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="protocol"
            value={protocol}
            onChange={(event) => setProtocol(event.target.value.toUpperCase())}
            placeholder="GCCC-2026-000000"
            autoComplete="off"
            spellCheck={false}
            className="protocol-code flex-1 uppercase"
          />
          <Button type="submit" loading={isLoading} disabled={!protocol.trim()}>
            {!isLoading && <Search size={16} aria-hidden />} Consultar
          </Button>
        </div>
      </form>

      <div aria-live="polite" className="mt-6">
        {error && <Alert tone="error">{error}</Alert>}
        {isLoading && <ResultSkeleton />}
        {result && <StatusResult result={result} />}
      </div>
    </div>
  );
}

function StatusResult({ result }: { result: PublicReportStatus }) {
  const stage = stageOf(result.status);
  const StageIcon = STAGE_ICONS[stage];
  const reachedAt = new Map(result.history.map((event) => [event.status, event.occurred_at]));
  reachedAt.set("RECEIVED", reachedAt.get("RECEIVED") ?? result.created_at);
  const timeline = timelineFor(result);
  const currentIndex = timeline.indexOf(result.status);

  return (
    <div className="animate-slide-up overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5 sm:p-6">
        <p className="text-xs text-muted">Protocolo</p>
        <p className="protocol-code mt-1 text-xl font-bold text-ink">{result.protocol}</p>
        <p className="mt-1 text-xs text-muted">
          Submetida a {formatDateTime(result.created_at)} · Última atualização: {formatDateTime(result.updated_at)}
        </p>
      </div>

      <div className={clsx("flex items-start gap-3 border-b p-5 sm:px-6", STAGE_BANNER_CLASSES[stage])}>
        <StageIcon size={22} className="mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{STAGE_LABELS[stage]}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{STATUS_PUBLIC_DESCRIPTIONS[result.status]}</p>
        </div>
      </div>

      <ol className="p-5 sm:p-6">
        {timeline.map((status, index) => {
          const isReached = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const occurredAt = reachedAt.get(status);
          return (
            <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
              {index < timeline.length - 1 && (
                <span
                  aria-hidden
                  className={clsx("absolute left-[9px] top-6 h-[calc(100%-1.25rem)] w-0.5", index < currentIndex ? "bg-green" : "bg-border")}
                />
              )}
              {isReached ? (
                <CheckCircle2 size={20} className={clsx("relative shrink-0", isCurrent ? "text-green" : "text-green/70")} aria-hidden />
              ) : (
                <Circle size={20} className="relative shrink-0 text-border-strong" aria-hidden />
              )}
              <div className="-mt-0.5">
                <p className={clsx("text-sm", isCurrent ? "font-semibold text-ink" : isReached ? "text-ink" : "text-muted")}>
                  {STATUS_LABELS[status]}
                  {isCurrent && <span className="sr-only"> (estado atual)</span>}
                </p>
                {isReached && occurredAt && <p className="text-xs text-muted">{formatDateTime(occurredAt)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-36" />
    </div>
  );
}
