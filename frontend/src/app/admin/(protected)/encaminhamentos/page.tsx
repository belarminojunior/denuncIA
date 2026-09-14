"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { estadoRespostaBadgeClass, estadoRespostaDisplay, formatDate, respostaResumo } from "@/lib/format";
import type { EncaminhamentoListOut, EncaminhamentoPorEntidadeOut, EncaminhamentoStatsOut } from "@/lib/types";

const PAGE_SIZE = 10;

export default function EncaminhamentosPage() {
  const [data, setData] = useState<EncaminhamentoListOut | null>(null);
  const [stats, setStats] = useState<EncaminhamentoStatsOut | null>(null);
  const [porEntidade, setPorEntidade] = useState<EncaminhamentoPorEntidadeOut[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    apiGet<EncaminhamentoStatsOut>("/api/admin/encaminhamentos/stats").then(setStats).catch(() => {});
    apiGet<EncaminhamentoPorEntidadeOut[]>("/api/admin/encaminhamentos/por-entidade").then(setPorEntidade).catch(() => {});
  }, []);

  useEffect(() => {
    apiGet<EncaminhamentoListOut>(`/api/admin/encaminhamentos?page=${page}&page_size=${PAGE_SIZE}`).then(setData);
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const maxEntidade = Math.max(1, ...porEntidade.map((e) => e.total));

  return (
    <div>
      <h1 className="text-3xl text-ink">Encaminhamentos</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {stats ? `${stats.total_encaminhados} processos encaminhados para entidades externas` : "…"} · dados
        fictícios
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Encaminhados" value={stats?.total_encaminhados} />
        <StatCard label="Sem resposta há +30 dias" value={stats?.sem_resposta_30_dias} highlight />
        <StatCard label="Com acusação" value={stats?.com_acusacao} />
        <StatCard
          label="Prazo médio de resposta"
          value={stats?.prazo_medio_resposta_dias != null ? `${stats.prazo_medio_resposta_dias} d` : "—"}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3.5">Protocolo</th>
              <th className="px-5 py-3.5">Entidade destinatária</th>
              <th className="px-5 py-3.5">Enviado</th>
              <th className="px-5 py-3.5">Ofício</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Resposta</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg-alt">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/denuncias/${item.id}`} className="protocol-code font-medium text-green hover:underline">
                    {item.protocolo}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-ink">{item.entidade_destinataria}</td>
                <td className="px-5 py-3.5 text-ink-soft">{formatDate(item.forwarded_at)}</td>
                <td className="px-5 py-3.5 protocol-code text-ink-soft">{item.numero_oficio || "—"}</td>
                <td className="px-5 py-3.5">
                  <Badge className={estadoRespostaBadgeClass(item.estado_resposta, item.forwarded_at)}>
                    {estadoRespostaDisplay(item.estado_resposta, item.forwarded_at)}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-ink-soft">
                  {respostaResumo(item.estado_resposta, item.forwarded_at, item.data_resposta)}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  Nenhum processo encaminhado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
            <span className="text-muted">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} de {data.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-border-strong px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-border-strong px-3 py-1.5 disabled:opacity-40"
              >
                Seguinte
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-ink">Distribuição por entidade</p>
        <div className="mt-5 space-y-4">
          {porEntidade.map((e) => (
            <div key={e.entidade}>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">{e.entidade}</span>
                <span className="font-medium text-ink">{e.total}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-bg-alt">
                <div className="h-2 rounded-full bg-green" style={{ width: `${(e.total / maxEntidade) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value?: number | string | null; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${highlight ? "border-l-4 border-l-amber border-border" : "border-border"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value ?? "—"}</p>
    </div>
  );
}
