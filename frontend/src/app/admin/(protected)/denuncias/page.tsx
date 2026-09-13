"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import {
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  PRIORIDADE_LABEL,
  estadoBadgeClass,
  prioridadeBadgeClass,
  formatDate,
  timeAgo,
} from "@/lib/format";
import { CATEGORIAS, ESTADOS, PRIORIDADES } from "@/lib/types";
import type { DenunciaListOut } from "@/lib/types";

const PAGE_SIZE = 10;

export default function DenunciasListPage() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DenunciaListOut | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function carregar() {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (categoria) params.set("categoria", categoria);
      if (estado) params.set("estado", estado);
      if (prioridade) params.set("prioridade", prioridade);

      apiGet<DenunciaListOut>(`/api/admin/denuncias?${params.toString()}`)
        .then(setData)
        .finally(() => setLoading(false));
    }
    carregar();
  }, [search, categoria, estado, prioridade, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <h1 className="text-3xl text-ink">Denúncias</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {data ? `${data.total} registos` : "…"} · dados fictícios para demonstração
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Pesquisar por protocolo, local ou palavra-chave"
          className="min-w-[16rem] flex-1 rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
        />
        <select
          value={categoria}
          onChange={(e) => {
            setPage(1);
            setCategoria(e.target.value);
          }}
          className="rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
        >
          <option value="">Categoria: todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABEL[c]}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => {
            setPage(1);
            setEstado(e.target.value);
          }}
          className="rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
        >
          <option value="">Estado: todos</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
        <select
          value={prioridade}
          onChange={(e) => {
            setPage(1);
            setPrioridade(e.target.value);
          }}
          className="rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
        >
          <option value="">Prioridade: todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {PRIORIDADE_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3.5">Protocolo</th>
              <th className="px-5 py-3.5">Data</th>
              <th className="px-5 py-3.5">Categoria sugerida</th>
              <th className="px-5 py-3.5">Confiança</th>
              <th className="px-5 py-3.5">Prioridade</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Atualização</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => {
              const categoriaEfetiva = item.categoria_validada ?? item.categoria_llm;
              const prioridadeEfetiva = item.prioridade_validada ?? item.prioridade_llm;
              return (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg-alt">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/denuncias/${item.id}`} className="protocol-code font-medium text-green hover:underline">
                      {item.protocolo}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(item.created_at)}</td>
                  <td className="px-5 py-3.5 text-ink">
                    {categoriaEfetiva ? CATEGORIA_LABEL[categoriaEfetiva] : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {item.confianca_llm != null ? `${Math.round(item.confianca_llm * 100)}%` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {prioridadeEfetiva && (
                      <Badge className={prioridadeBadgeClass(prioridadeEfetiva)}>
                        {PRIORIDADE_LABEL[prioridadeEfetiva]}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge className={estadoBadgeClass(item.estado)}>{ESTADO_LABEL[item.estado]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{timeAgo(item.updated_at)}</td>
                </tr>
              );
            })}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">
                  Nenhuma denúncia encontrada com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span className="text-muted">
            {data ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.total)} de ${data.total}` : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-border-strong px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 5)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1.5 ${p === page ? "bg-green text-bg" : "border border-border-strong text-ink"}`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-border-strong px-3 py-1.5 disabled:opacity-40"
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
