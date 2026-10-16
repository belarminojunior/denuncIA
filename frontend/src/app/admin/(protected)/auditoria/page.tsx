"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/report/ReportBadges";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiError, apiGet, downloadFile, withQuery } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS } from "@/lib/labels";
import { AUDIT_ACTIONS, type AuditAction, type AuditLogEntry, type Page, type UserSummary } from "@/lib/types";

const API = "/api/admin/audit-logs";
const PAGE_SIZE = 15;
const EXPORT_FILENAME = "auditoria_denuncia.csv";

const PERIODS = [
  { days: 1, label: "Últimas 24 horas" },
  { days: 7, label: "Últimos 7 dias" },
  { days: 30, label: "Últimos 30 dias" },
  { days: 0, label: "Todo o período" },
];

const ACTION_TONES: Record<AuditAction, BadgeTone> = {
  CREATED: "teal",
  AI_CLASSIFICATION: "neutral",
  ACCESS: "gray",
  STATUS_CHANGE: "amber",
  VALIDATION: "green",
  ROUTING: "teal",
  LOGIN: "gray",
};

const COLUMNS = ["Data e hora", "Operação", "Processo", "Autor", "Descrição", "Estado"];

export default function AuditLogPage() {
  const notify = useToast();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [days, setDays] = useState(7);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<AuditLogEntry> | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const filters = { search: debouncedSearch, action, user_id: userId, days };

  useEffect(() => {
    async function loadUsers() {
      try {
        setUsers(await apiGet<UserSummary[]>("/api/admin/users"));
      } catch {
        // The author filter is optional; the log still works without it.
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        setData(await apiGet<Page<AuditLogEntry>>(withQuery(API, { ...filters, page, page_size: PAGE_SIZE })));
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar o registo de auditoria.");
      }
    }
    load();
    // `filters` is rebuilt every render; its fields are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, action, userId, days, page]);

  function changeFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function exportCsv() {
    setIsExporting(true);
    try {
      await downloadFile(withQuery(`${API}/export`, filters), EXPORT_FILENAME);
    } catch (exportError) {
      notify(exportError instanceof ApiError ? exportError.message : "Não foi possível exportar.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        subtitle="Registo imutável das operações sobre processos e contas"
        action={
          <Button variant="secondary" onClick={exportCsv} loading={isExporting}>
            {!isExporting && <Download size={16} aria-hidden />} Exportar CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            type="search"
            aria-label="Pesquisar no registo"
            value={search}
            onChange={(event) => changeFilter(setSearch)(event.target.value)}
            placeholder="Protocolo, utilizador ou descrição"
            className="pl-9"
          />
        </div>
        <Select aria-label="Operação" value={action} onChange={(event) => changeFilter(setAction)(event.target.value)} className="w-auto">
          <option value="">Operação: todas</option>
          {AUDIT_ACTIONS.map((value) => (
            <option key={value} value={value}>
              {AUDIT_ACTION_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select aria-label="Autor" value={userId} onChange={(event) => changeFilter(setUserId)(event.target.value)} className="w-auto">
          <option value="">Autor: todos</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Período" value={days} onChange={(event) => changeFilter(setDays)(Number(event.target.value))} className="w-auto">
          {PERIODS.map((period) => (
            <option key={period.days} value={period.days}>
              {period.label}
            </option>
          ))}
        </Select>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50 text-left text-xs uppercase tracking-wide text-muted">
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className="px-5 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data
                ? data.items.map((log) => <AuditRow key={log.id} log={log} />)
                : Array.from({ length: 6 }, (_, row) => (
                    <tr key={row} className="border-b border-border last:border-0">
                      {COLUMNS.map((column) => (
                        <td key={column} className="px-5 py-4">
                          <Skeleton className="h-4 w-full max-w-28" />
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {data && data.items.length === 0 && (
          <EmptyState icon={ShieldCheck} title="Sem operações registadas" description="Nenhuma operação corresponde aos filtros escolhidos." />
        )}
        {data && data.total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-ink-soft">{formatDateTime(log.created_at)}</td>
      <td className="px-5 py-3.5">
        <Badge tone={ACTION_TONES[log.action]}>{AUDIT_ACTION_LABELS[log.action]}</Badge>
      </td>
      <td className="px-5 py-3.5">
        {log.report_id && log.protocol ? (
          <Link href={`/admin/denuncias/${log.report_id}`} className="protocol-code whitespace-nowrap font-medium text-green hover:underline">
            {log.protocol}
          </Link>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-ink">{log.user_name ?? "Sistema"}</td>
      <td className="max-w-md px-5 py-3.5 text-ink-soft">
        {log.description}
        {log.note && <span className="mt-1 block text-xs italic text-muted">“{log.note}”</span>}
      </td>
      <td className="px-5 py-3.5">{log.new_status ? <StatusBadge status={log.new_status} /> : <span className="text-muted">—</span>}</td>
    </tr>
  );
}
