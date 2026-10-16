"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gauge,
  Inbox,
  LayoutGrid,
  PieChart,
  Search,
  Send,
  ShieldAlert,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { BarList } from "@/components/admin/BarList";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { PriorityBadge } from "@/components/report/ReportBadges";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, apiGet, withQuery } from "@/lib/api";
import { formatMonth, timeAgo } from "@/lib/format";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import type {
  CategoryCount,
  DashboardStats,
  MonthlyCount,
  Page,
  Priority,
  PriorityCount,
  ReportStatus,
  ReportSummary,
  StatusCount,
} from "@/lib/types";

const API = "/api/admin/dashboard";
const REVIEW_QUEUE_SIZE = 5;

// Recharts and inline styles need literal colours; these match the theme tokens.
const CHART_COLORS = { green: "#1e4d33", grid: "#e4dbc3", axis: "#776d5a", cursor: "#f2ecda" };

const STATUS_COLORS: Record<ReportStatus, string> = {
  RECEIVED: "#b8ab90",
  PENDING_REVIEW: "#9a5a17",
  UNDER_REVIEW: "#6f8f7a",
  VALIDATED: "#3f6b52",
  ROUTED: "#1e4d33",
  UNDER_INVESTIGATION: "#c48a3f",
  ARCHIVED: "#d8cbac",
  REJECTED: "#7d2634",
};

const PRIORITY_BAR_CLASSES: Record<Priority, string> = {
  CRITICAL: "bg-red",
  HIGH: "bg-amber",
  MEDIUM: "bg-teal",
  LOW: "bg-gray-badge",
};

interface DashboardData {
  stats: DashboardStats;
  categories: CategoryCount[];
  statuses: StatusCount[];
  priorities: PriorityCount[];
  monthly: MonthlyCount[];
  reviewQueue: ReportSummary[];
}

async function loadDashboard(): Promise<DashboardData> {
  const [stats, categories, statuses, priorities, monthly, reviewQueue] = await Promise.all([
    apiGet<DashboardStats>(`${API}/stats`),
    apiGet<CategoryCount[]>(`${API}/categories`),
    apiGet<StatusCount[]>(`${API}/statuses`),
    apiGet<PriorityCount[]>(`${API}/priorities`),
    apiGet<MonthlyCount[]>(`${API}/monthly`),
    apiGet<Page<ReportSummary>>(
      withQuery("/api/admin/reports", { status: "PENDING_REVIEW", page_size: REVIEW_QUEUE_SIZE }),
    ),
  ]);
  return { stats, categories, statuses, priorities, monthly, reviewQueue: reviewQueue.items };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setData(await loadDashboard());
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar o dashboard.");
      }
    }
    load();
  }, []);

  const stats = data?.stats;
  const listByStatus = (status: ReportStatus) => `/admin/denuncias?status=${status}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral das denúncias recebidas · dados fictícios para demonstração"
        action={
          <ButtonLink href={listByStatus("PENDING_REVIEW")}>
            Rever pendentes <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total de denúncias" value={stats?.total} icon={Inbox} tone="accent" href="/admin/denuncias" />
        <StatCard
          label="Pendentes de validação"
          value={stats?.pending_review}
          icon={Clock}
          tone="highlight"
          href={listByStatus("PENDING_REVIEW")}
        />
        <StatCard label="Em análise" value={stats?.under_review} icon={Search} href={listByStatus("UNDER_REVIEW")} />
        <StatCard label="Validadas" value={stats?.validated} icon={CheckCircle2} href={listByStatus("VALIDATED")} />
        <StatCard label="Encaminhadas" value={stats?.routed} icon={Send} href={listByStatus("ROUTED")} />
        <StatCard
          label="Em investigação"
          value={stats?.under_investigation}
          icon={ShieldAlert}
          href={listByStatus("UNDER_INVESTIGATION")}
        />
        <StatCard label="Arquivadas" value={stats?.archived} icon={Archive} href={listByStatus("ARCHIVED")} />
        <StatCard label="Rejeitadas" value={stats?.rejected} icon={XCircle} href={listByStatus("REJECTED")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card
          title="A aguardar validação"
          icon={AlertCircle}
          description="Denúncias já classificadas pela IA que precisam de revisão humana."
          bodyClassName="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6"
        >
          <ReviewQueue reports={data?.reviewQueue} />
        </Card>

        <Card title="Denúncias por estado" icon={PieChart}>
          {data ? <StatusDistribution statuses={data.statuses} /> : <Skeleton className="h-32 w-full" />}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Por categoria" icon={LayoutGrid}>
          {data ? (
            <BarList
              items={data.categories.map(({ category, total }) => ({
                key: category,
                label: CATEGORY_LABELS[category],
                value: total,
              }))}
            />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </Card>

        <Card title="Por prioridade" icon={Gauge}>
          {data ? (
            <BarList
              items={data.priorities.map(({ priority, total }) => ({
                key: priority,
                label: PRIORITY_LABELS[priority],
                value: total,
                barClassName: PRIORITY_BAR_CLASSES[priority],
              }))}
            />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </Card>
      </div>

      <Card title="Denúncias por mês" icon={TrendingUp} description="Últimos sete meses">
        <div className="h-64">
          {data ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly.map((entry) => ({ ...entry, label: formatMonth(entry.month) }))}>
                <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: CHART_COLORS.cursor }}
                  formatter={(value) => [value, "Denúncias"]}
                  contentStyle={{ borderRadius: 8, borderColor: CHART_COLORS.grid }}
                />
                <Bar dataKey="total" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </Card>
    </div>
  );
}

function ReviewQueue({ reports }: { reports: ReportSummary[] | undefined }) {
  if (!reports) {
    return (
      <div className="space-y-3 px-5 pb-5 sm:px-6">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (reports.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Nada pendente" description="Todas as denúncias classificadas foram revistas." />;
  }
  return (
    <ul className="divide-y divide-border border-t border-border">
      {reports.map((report) => {
        const category = report.validated_category ?? report.ai_category;
        const priority = report.validated_priority ?? report.ai_priority;
        return (
          <li key={report.id}>
            <Link
              href={`/admin/denuncias/${report.id}`}
              className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-bg-alt/60 sm:px-6"
            >
              <span className="min-w-0">
                <span className="protocol-code block text-sm font-semibold text-ink">{report.protocol}</span>
                <span className="block truncate text-xs text-muted">
                  {category ? CATEGORY_LABELS[category] : "Sem categoria"} · {timeAgo(report.created_at)}
                </span>
              </span>
              {priority && <PriorityBadge priority={priority} />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function StatusDistribution({ statuses }: { statuses: StatusCount[] }) {
  const total = statuses.reduce((sum, entry) => sum + entry.total, 0);
  if (total === 0) return <p className="text-sm text-muted">Sem dados.</p>;

  return (
    <>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-alt">
        {statuses.map((entry) => (
          <div
            key={entry.status}
            title={`${STATUS_LABELS[entry.status]}: ${entry.total}`}
            style={{ width: `${(entry.total / total) * 100}%`, background: STATUS_COLORS[entry.status] }}
          />
        ))}
      </div>
      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
        {statuses.map((entry) => (
          <li key={entry.status} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLORS[entry.status] }} aria-hidden />
            <span className="truncate text-ink-soft">{STATUS_LABELS[entry.status]}</span>
            <span className="ml-auto font-medium tabular-nums text-ink">{entry.total}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
