"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { API_BASE_URL, apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { TIPO_OPERACAO_LABEL, formatDateTime } from "@/lib/format";
import { TIPOS_OPERACAO } from "@/lib/types";
import type { AuditoriaListOut, TipoOperacao, UserListItemOut } from "@/lib/types";

const PAGE_SIZE = 10;

const PERIODOS = [
  { value: 1, label: "Últimas 24 horas" },
  { value: 7, label: "Últimos 7 dias" },
  { value: 30, label: "Últimos 30 dias" },
  { value: 0, label: "Todo o período" },
];

const TIPO_BADGE: Record<TipoOperacao, string> = {
  CRIACAO: "bg-teal-soft text-teal",
  CLASSIFICACAO_LLM: "bg-bg-alt text-ink-soft border border-border-strong",
  ACESSO: "bg-gray-badge-soft text-gray-badge",
  ALTERACAO_ESTADO: "bg-amber-soft text-amber",
  VALIDACAO: "bg-green-soft text-green",
  ENCAMINHAMENTO: "bg-teal-soft text-teal",
  LOGIN: "bg-gray-badge-soft text-gray-badge",
};

export default function AuditoriaPage() {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [dias, setDias] = useState(7);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditoriaListOut | null>(null);
  const [users, setUsers] = useState<UserListItemOut[]>([]);

  useEffect(() => {
    apiGet<UserListItemOut[]>("/api/admin/utilizadores").then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE), dias: String(dias) });
    if (search) params.set("search", search);
    if (tipo) params.set("tipo", tipo);
    if (userId) params.set("user_id", userId);
    apiGet<AuditoriaListOut>(`/api/admin/auditoria?${params.toString()}`).then(setData);
  }, [search, tipo, userId, dias, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  function exportarCsv() {
    const params = new URLSearchParams({ dias: String(dias) });
    if (search) params.set("search", search);
    if (tipo) params.set("tipo", tipo);
    if (userId) params.set("user_id", userId);
    const token = getToken();
    fetch(`${API_BASE_URL}/api/admin/auditoria/export?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "auditoria_gccc.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  }

  return (
    <div>
      <h1 className="text-3xl text-ink">Auditoria</h1>
      <p className="mt-1 text-sm text-ink-soft">Registo imutável de operações sobre processos e contas · dados fictícios</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Pesquisar por protocolo, utilizador ou operação"
          className="min-w-[16rem] flex-1 rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
        />
        <select
          value={tipo}
          onChange={(e) => {
            setPage(1);
            setTipo(e.target.value);
          }}
          className="rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
        >
          <option value="">Operação: todas</option>
          {TIPOS_OPERACAO.map((t) => (
            <option key={t} value={t}>
              {TIPO_OPERACAO_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          value={userId}
          onChange={(e) => {
            setPage(1);
            setUserId(e.target.value);
          }}
          className="rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
        >
          <option value="">Autor: todos</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={dias}
          onChange={(e) => {
            setPage(1);
            setDias(Number(e.target.value));
          }}
          className="rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
        >
          {PERIODOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3.5">ID</th>
              <th className="px-5 py-3.5">Data e hora</th>
              <th className="px-5 py-3.5">Processo</th>
              <th className="px-5 py-3.5">Operação</th>
              <th className="px-5 py-3.5">Autor e detalhe</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg-alt">
                <td className="px-5 py-3.5 protocol-code text-muted">#{log.id}</td>
                <td className="px-5 py-3.5 text-ink-soft">{formatDateTime(log.created_at)}</td>
                <td className="px-5 py-3.5">
                  {log.protocolo && log.denuncia_id ? (
                    <Link href={`/admin/denuncias/${log.denuncia_id}`} className="protocol-code text-green hover:underline">
                      {log.protocolo}
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <Badge className={TIPO_BADGE[log.tipo]}>{log.tipo}</Badge>
                </td>
                <td className="px-5 py-3.5 text-ink">
                  <span className="font-semibold">{log.user_nome ?? "Sistema"}</span> {log.acao}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Nenhum registo encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm">
          <span className="text-muted">
            {data ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.total)} de ${data.total} registos` : ""}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">Os registos não podem ser editados nem apagados.</span>
            <button
              onClick={exportarCsv}
              className="flex items-center gap-2 rounded-md border border-border-strong px-3 py-1.5 text-ink hover:border-green hover:text-green"
            >
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        </div>
        {data && data.total > PAGE_SIZE && (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3 text-sm">
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
        )}
      </div>
    </div>
  );
}
