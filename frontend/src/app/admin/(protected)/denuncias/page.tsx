"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileSearch, Search, X } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { PriorityBadge, StatusBadge } from "@/components/report/ReportBadges";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiError, apiGet, withQuery } from "@/lib/api";
import { formatDate, formatPercent, timeAgo } from "@/lib/format";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { CATEGORIES, PRIORITIES, REPORT_STATUSES, type Page, type ReportSummary } from "@/lib/types";

const PAGE_SIZE = 10;
const FILTER_KEYS = ["search", "category", "status", "priority"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type Filters = Record<FilterKey, string>;

const COLUMNS = ["Protocolo", "Recebida", "Categoria", "Confiança IA", "Prioridade", "Estado", "Atualização"];

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportList />
    </Suspense>
  );
}

function ReportList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters are initialised from the URL so dashboard links and reloads keep them.
  const [filters, setFilters] = useState<Filters>(() =>
    Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""])) as Filters,
  );
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<ReportSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(filters.search);
  const hasFilters = FILTER_KEYS.some((key) => filters[key]);

  useEffect(() => {
    const query = { ...filters, search: debouncedSearch };
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        setData(await apiGet<Page<ReportSummary>>(withQuery("/api/admin/reports", { ...query, page, page_size: PAGE_SIZE })));
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar as denúncias.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
    router.replace(withQuery(pathname, query), { scroll: false });
    // `filters.search` is excluded on purpose: the request waits for the debounced value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.status, filters.priority, page]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ search: "", category: "", status: "", priority: "" });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Denúncias" subtitle={data ? `${data.total} registo${data.total === 1 ? "" : "s"}` : "A carregar…"} />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            type="search"
            aria-label="Pesquisar denúncias"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Protocolo, local ou palavra-chave"
            className="pl-9"
          />
        </div>
        <FilterSelect
          label="Categoria"
          allLabel="todas"
          value={filters.category}
          onChange={(value) => updateFilter("category", value)}
          options={CATEGORIES.map((value) => [value, CATEGORY_LABELS[value]])}
        />
        <FilterSelect
          label="Estado"
          allLabel="todos"
          value={filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={REPORT_STATUSES.map((value) => [value, STATUS_LABELS[value]])}
        />
        <FilterSelect
          label="Prioridade"
          allLabel="todas"
          value={filters.priority}
          onChange={(value) => updateFilter("priority", value)}
          options={PRIORITIES.map((value) => [value, PRIORITY_LABELS[value]])}
        />
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X size={16} aria-hidden /> Limpar
          </Button>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50 text-left text-xs uppercase tracking-wide text-muted">
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className="px-5 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isLoading && data ? "opacity-60 transition-opacity" : undefined}>
              {isLoading && !data ? (
                <SkeletonRows />
              ) : (
                data?.items.map((report) => (
                  <ReportRow key={report.id} report={report} onOpen={() => router.push(`/admin/denuncias/${report.id}`)} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.items.length === 0 && (
          <EmptyState
            icon={FileSearch}
            title="Nenhuma denúncia encontrada"
            description={hasFilters ? "Experimente alterar ou limpar os filtros." : "Ainda não foram recebidas denúncias."}
            action={
              hasFilters && (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )
            }
          />
        )}
        {data && data.total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  /** "todas"/"todos", agreeing in gender with the label. */
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}

function FilterSelect({ label, allLabel, value, onChange, options }: FilterSelectProps) {
  return (
    <Select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-auto">
      <option value="">
        {label}: {allLabel}
      </option>
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </Select>
  );
}

function ReportRow({ report, onOpen }: { report: ReportSummary; onOpen: () => void }) {
  const category = report.validated_category ?? report.ai_category;
  const priority = report.validated_priority ?? report.ai_priority;
  return (
    // The whole row is clickable; the protocol stays a real link for keyboard and new-tab use.
    <tr onClick={onOpen} className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-alt/60">
      <td className="px-5 py-3.5">
        <Link
          href={`/admin/denuncias/${report.id}`}
          onClick={(event) => event.stopPropagation()}
          className="protocol-code font-semibold text-green hover:underline"
        >
          {report.protocol}
        </Link>
      </td>
      <td className="px-5 py-3.5 text-ink-soft">{formatDate(report.created_at)}</td>
      <td className="px-5 py-3.5 text-ink">
        {category ? CATEGORY_LABELS[category] : <span className="text-muted">A classificar…</span>}
        {report.validated_category && <span className="ml-1.5 text-xs text-green" title="Confirmada por técnico">✓</span>}
      </td>
      <td className="px-5 py-3.5 tabular-nums text-ink-soft">{report.ai_confidence != null ? formatPercent(report.ai_confidence) : "—"}</td>
      <td className="px-5 py-3.5">{priority ? <PriorityBadge priority={priority} /> : "—"}</td>
      <td className="px-5 py-3.5">
        <StatusBadge status={report.status} />
      </td>
      <td className="px-5 py-3.5 text-ink-soft">{timeAgo(report.updated_at)}</td>
    </tr>
  );
}

function SkeletonRows() {
  return Array.from({ length: 6 }, (_, row) => (
    <tr key={row} className="border-b border-border last:border-0">
      {COLUMNS.map((column) => (
        <td key={column} className="px-5 py-4">
          <Skeleton className="h-4 w-full max-w-28" />
        </td>
      ))}
    </tr>
  ));
}
