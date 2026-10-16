import { History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { AuditLog } from "@/lib/types";

/** Newest first, so the latest decision is visible without scrolling. */
export function AuditTrail({ logs }: { logs: AuditLog[] }) {
  const ordered = [...logs].sort((first, second) => second.created_at.localeCompare(first.created_at));

  return (
    <Card title="Histórico do processo" icon={History} description="Registo imutável de todas as operações.">
      <ol className="space-y-5">
        {ordered.map((log) => (
          <li key={log.id} className="relative border-l-2 border-border pl-4">
            <p className="text-sm text-ink">{log.description}</p>
            {log.previous_status && log.new_status && (
              <p className="mt-0.5 text-xs text-ink-soft">
                {STATUS_LABELS[log.previous_status]} → {STATUS_LABELS[log.new_status]}
              </p>
            )}
            {log.note && <p className="mt-1.5 rounded-md bg-bg-alt px-3 py-2 text-xs leading-relaxed text-ink-soft">{log.note}</p>}
            <p className="mt-1 text-xs text-muted">
              {AUDIT_ACTION_LABELS[log.action]} · {log.user_name ?? "Sistema"} · {formatDateTime(log.created_at)}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
