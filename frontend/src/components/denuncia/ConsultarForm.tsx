"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, Search } from "lucide-react";
import clsx from "clsx";
import { apiGet, ApiError } from "@/lib/api";
import type { EstadoDenuncia, ProtocoloStatusOut } from "@/lib/types";
import { ESTADO_DESCRICAO_PUBLICA, ESTADO_LABEL, formatDateTime } from "@/lib/format";

const FLUXO_PRINCIPAL: EstadoDenuncia[] = [
  "RECEBIDA",
  "PENDENTE_VALIDACAO",
  "EM_ANALISE",
  "VALIDADA",
  "ENCAMINHADA",
];

export function ConsultarForm() {
  const searchParams = useSearchParams();
  const [protocolo, setProtocolo] = useState(searchParams.get("protocolo") ?? "");
  const [resultado, setResultado] = useState<ProtocoloStatusOut | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function consultar(valor: string) {
    if (!valor.trim()) return;
    setLoading(true);
    setErro(null);
    setResultado(null);
    try {
      const res = await apiGet<ProtocoloStatusOut>(`/api/denuncias/protocolo/${encodeURIComponent(valor.trim().toUpperCase())}`);
      setResultado(res);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível consultar o protocolo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function consultarInicial() {
      const initial = searchParams.get("protocolo");
      if (initial) consultar(initial);
    }
    consultarInicial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passoAtualIndex = resultado ? FLUXO_PRINCIPAL.indexOf(resultado.estado) : -1;
  const forkedFora = resultado && !FLUXO_PRINCIPAL.includes(resultado.estado);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl text-ink">Consultar denúncia</h1>
      <p className="mt-2 text-ink-soft">Introduza o protocolo recebido no momento da submissão.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          consultar(protocolo);
        }}
        className="mt-6 rounded-xl border border-border bg-bg-alt p-6"
      >
        <label className="mb-1.5 block text-sm font-medium text-ink">Protocolo</label>
        <div className="flex gap-3">
          <input
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            placeholder="GCCC-2026-000123"
            className="protocol-code w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 whitespace-nowrap rounded-md bg-green px-5 py-2.5 text-sm font-medium text-bg hover:bg-green-dark disabled:opacity-60"
          >
            <Search size={16} /> {loading ? "A consultar…" : "Consultar"}
          </button>
        </div>
      </form>

      {erro && (
        <div className="mt-6 rounded-lg border border-red/30 bg-red-soft p-4 text-sm text-red">{erro}</div>
      )}

      {resultado && (
        <div className="mt-6 rounded-xl border border-border bg-bg-alt p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="protocol-code text-xl font-bold text-green">{resultado.protocolo}</p>
              <p className="mt-1 text-sm text-muted">
                Submetida a {formatDateTime(resultado.created_at)} · Última atualização a{" "}
                {formatDateTime(resultado.updated_at)}
              </p>
            </div>
            <span className="rounded-md border border-border-strong bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {resultado.estado}
            </span>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm font-semibold text-ink">Percurso do processo</p>
            <ol className="relative mt-4 space-y-5 border-l border-border-strong pl-6">
              {FLUXO_PRINCIPAL.map((estado, index) => {
                const atingido = passoAtualIndex >= index && passoAtualIndex !== -1;
                const atual = index === passoAtualIndex;
                const entradaHistorico = resultado.historico.find((h) => h.estado_novo === estado);
                return (
                  <li key={estado} className="relative">
                    <span
                      className={clsx(
                        "absolute -left-[1.72rem] top-0.5 flex h-4 w-4 items-center justify-center rounded-full",
                        atingido ? "bg-green text-bg" : "bg-card border border-border-strong text-transparent"
                      )}
                    >
                      {atingido ? <CheckCircle2 size={14} /> : <Circle size={8} />}
                    </span>
                    <p className={clsx("text-sm font-semibold", atingido ? "text-ink" : "text-muted")}>
                      {ESTADO_LABEL[estado]}
                      {entradaHistorico && (
                        <span className="ml-2 font-normal text-muted">{formatDateTime(entradaHistorico.created_at)}</span>
                      )}
                    </p>
                    {atual && <p className="text-sm text-ink-soft">{ESTADO_DESCRICAO_PUBLICA[estado]}</p>}
                  </li>
                );
              })}
              {forkedFora && (
                <li className="relative">
                  <span className="absolute -left-[1.72rem] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-bg">
                    <CheckCircle2 size={14} />
                  </span>
                  <p className="text-sm font-semibold text-ink">{ESTADO_LABEL[resultado.estado]}</p>
                  <p className="text-sm text-ink-soft">{ESTADO_DESCRICAO_PUBLICA[resultado.estado]}</p>
                </li>
              )}
            </ol>
          </div>

          <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted">
            Por razões de confidencialidade, não são divulgados dados internos do processo nem a
            identidade dos técnicos responsáveis.
          </p>
        </div>
      )}
    </div>
  );
}
