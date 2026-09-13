"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Download, FileText } from "lucide-react";
import clsx from "clsx";
import { apiGet, apiPost, apiPut, ApiError, downloadAttachment } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import {
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  PRIORIDADE_LABEL,
  estadoBadgeClass,
  prioridadeBadgeClass,
  formatDateTime,
} from "@/lib/format";
import { CATEGORIAS, PRIORIDADES } from "@/lib/types";
import type { Categoria, DenunciaDetailOut, Prioridade } from "@/lib/types";

export default function DenunciaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [denuncia, setDenuncia] = useState<DenunciaDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoriaValidada, setCategoriaValidada] = useState<Categoria | "">("");
  const [prioridadeValidada, setPrioridadeValidada] = useState<Prioridade | "">("");
  const [observacoes, setObservacoes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<DenunciaDetailOut>(`/api/admin/denuncias/${params.id}`);
      setDenuncia(data);
      setCategoriaValidada(data.categoria_validada ?? data.categoria_llm ?? "");
      setPrioridadeValidada(data.prioridade_validada ?? data.prioridade_llm ?? "");
      setObservacoes(data.observacoes_tecnico ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar a denúncia.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    function iniciar() {
      carregar();
    }
    iniciar();
  }, [carregar]);

  async function runAction(
    action: "validar" | "encaminhar" | "rejeitar" | "arquivar" | "guardar"
  ) {
    if (!denuncia) return;
    setActionError(null);

    if (action === "validar" && !categoriaValidada) {
      setActionError("Selecione a categoria validada antes de validar a denúncia.");
      return;
    }

    setActionLoading(action);
    try {
      let updated: DenunciaDetailOut;
      if (action === "guardar") {
        updated = await apiPut<DenunciaDetailOut>(`/api/admin/denuncias/${denuncia.id}`, {
          categoria_validada: categoriaValidada || null,
          prioridade_validada: prioridadeValidada || null,
          observacoes_tecnico: observacoes,
        });
      } else if (action === "validar") {
        updated = await apiPost<DenunciaDetailOut>(`/api/admin/denuncias/${denuncia.id}/validar`, {
          categoria_validada: categoriaValidada,
          prioridade_validada: prioridadeValidada || "MEDIA",
          observacoes_tecnico: observacoes,
        });
      } else {
        updated = await apiPost<DenunciaDetailOut>(`/api/admin/denuncias/${denuncia.id}/${action}`, {
          observacoes_tecnico: observacoes,
        });
      }
      setDenuncia(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível concluir a ação.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">A carregar denúncia…</p>;
  if (error || !denuncia) {
    return (
      <div>
        <p className="text-sm text-red">{error ?? "Denúncia não encontrada."}</p>
        <button onClick={() => router.push("/admin/denuncias")} className="mt-4 text-sm text-green hover:underline">
          Voltar à lista
        </button>
      </div>
    );
  }

  const podeEncaminhar = denuncia.estado === "VALIDADA";
  const jaFinalizada = ["ENCAMINHADA", "EM_INVESTIGACAO", "ARQUIVADA", "REJEITADA"].includes(denuncia.estado);

  return (
    <div>
      <Link href="/admin/denuncias" className="flex items-center gap-1.5 text-sm text-muted hover:text-green">
        <ChevronLeft size={14} /> Denúncias / <span className="protocol-code">{denuncia.protocolo}</span>
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="protocol-code text-2xl font-bold text-ink">{denuncia.protocolo}</h1>
        <div className="flex gap-2">
          <Badge className={estadoBadgeClass(denuncia.estado)}>{ESTADO_LABEL[denuncia.estado]}</Badge>
          {(denuncia.prioridade_validada ?? denuncia.prioridade_llm) && (
            <Badge className={prioridadeBadgeClass(denuncia.prioridade_validada ?? denuncia.prioridade_llm)}>
              Prioridade {PRIORIDADE_LABEL[(denuncia.prioridade_validada ?? denuncia.prioridade_llm)!]}
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">
        Submetida a {formatDateTime(denuncia.created_at)} ·{" "}
        {denuncia.anonima ? "Denúncia anónima" : denuncia.nome_denunciante || "Identificada"} ·{" "}
        {denuncia.local_ocorrencia || "Local não indicado"}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-ink">Dados da denúncia</h2>
            <dl className="mt-4 divide-y divide-border text-sm">
              <Row label="Protocolo" value={denuncia.protocolo} mono />
              <Row label="Identificação" value={denuncia.anonima ? "Anónima — sem dados de contacto" : denuncia.nome_denunciante || "—"} />
              {!denuncia.anonima && denuncia.email_denunciante && <Row label="Email" value={denuncia.email_denunciante} />}
              {!denuncia.anonima && denuncia.telefone_denunciante && <Row label="Telefone" value={denuncia.telefone_denunciante} />}
              <Row label="Local" value={denuncia.local_ocorrencia || "Não indicado"} />
              <Row label="Data do facto" value={denuncia.data_ocorrencia || "Não indicada"} />
              <Row
                label="Tipo indicado"
                value={denuncia.tipo_denuncia ? CATEGORIA_LABEL[denuncia.tipo_denuncia as Categoria] : "Não indicado — o denunciante declarou não saber a categoria"}
              />
              <Row label="Descrição" value={denuncia.descricao} multiline />
              {denuncia.envolvidos && <Row label="Envolvidos" value={denuncia.envolvidos} />}
              {denuncia.valor_envolvido && <Row label="Valor envolvido" value={denuncia.valor_envolvido} />}
              <div className="grid grid-cols-[10rem_1fr] gap-4 px-1 py-3.5">
                <dt className="text-muted">Anexos</dt>
                <dd className="flex flex-wrap gap-2">
                  {denuncia.attachments.length === 0 && <span className="text-ink-soft">Nenhum anexo</span>}
                  {denuncia.attachments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => downloadAttachment(denuncia.id, a.id, a.filename)}
                      className="flex items-center gap-2 rounded-md border border-border-strong bg-bg-alt px-3 py-1.5 text-xs text-ink hover:border-green hover:text-green"
                    >
                      <FileText size={13} /> {a.filename} <Download size={12} />
                    </button>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Classificação preliminar</h2>
              <span className="rounded-md bg-bg-alt px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted">
                Sugestão automática · {denuncia.llm_modelo || "—"}
              </span>
            </div>

            {denuncia.llm_erro ? (
              <p className="mt-4 rounded-md border border-amber/30 bg-amber-soft p-4 text-sm text-ink">
                A classificação automática falhou: {denuncia.llm_erro}. A validação deve ser feita
                manualmente pelo técnico.
              </p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted">Categoria sugerida</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {denuncia.categoria_llm ? CATEGORIA_LABEL[denuncia.categoria_llm] : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Confiança</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {denuncia.confianca_llm != null ? `${Math.round(denuncia.confianca_llm * 100)}%` : "—"}
                    </p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-bg-alt">
                      <div
                        className="h-1.5 rounded-full bg-green"
                        style={{ width: `${(denuncia.confianca_llm ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Prioridade sugerida</p>
                    <p className="mt-1 text-lg font-semibold text-amber">
                      {denuncia.prioridade_llm ? PRIORIDADE_LABEL[denuncia.prioridade_llm] : "—"}
                    </p>
                  </div>
                </div>

                {denuncia.resumo_llm && (
                  <div className="mt-4">
                    <p className="text-xs text-muted">Resumo</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink">{denuncia.resumo_llm}</p>
                  </div>
                )}
                {denuncia.justificacao_llm && (
                  <div className="mt-4">
                    <p className="text-xs text-muted">Justificação</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink">{denuncia.justificacao_llm}</p>
                  </div>
                )}
                {denuncia.indicadores_llm && denuncia.indicadores_llm.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted">Indicadores identificados</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {denuncia.indicadores_llm.map((ind) => (
                        <span key={ind} className="rounded-full bg-green-soft px-3 py-1 text-xs text-green">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted">
              A classificação é gerada por um modelo de linguagem local e serve apenas de apoio à
              decisão. Não determina a veracidade da denúncia nem produz efeitos jurídicos.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-ink">Histórico e auditoria</h2>
            <ol className="relative mt-4 space-y-4 border-l border-border-strong pl-5">
              {denuncia.audit_logs.map((log) => (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[1.42rem] top-1 h-2 w-2 rounded-full bg-green" />
                  <p className="text-sm font-semibold text-ink">
                    {log.acao} <span className="font-normal text-muted">{formatDateTime(log.created_at)}</span>
                  </p>
                  {(log.user_nome || log.observacao) && (
                    <p className="text-sm text-ink-soft">
                      {log.user_nome ? `${log.user_nome}` : "sistema"}
                      {log.observacao ? ` — ${log.observacao}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink">Validação humana</h2>
            <p className="text-sm text-muted">A decisão final é do técnico responsável.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Categoria validada</label>
            <select
              value={categoriaValidada}
              onChange={(e) => setCategoriaValidada(e.target.value as Categoria)}
              disabled={jaFinalizada}
              className="w-full rounded-md border border-border-strong bg-bg-alt px-3.5 py-2.5 text-sm text-ink disabled:opacity-60"
            >
              <option value="">Selecionar categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
            {denuncia.categoria_llm && (
              <p className="mt-1.5 text-xs text-muted">
                Sugerido: {CATEGORIA_LABEL[denuncia.categoria_llm]}
                {categoriaValidada === denuncia.categoria_llm ? " · sem alteração" : ""}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Prioridade</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES.map((p) => (
                <button
                  key={p}
                  disabled={jaFinalizada}
                  onClick={() => setPrioridadeValidada(p)}
                  className={clsx(
                    "rounded-md border px-2 py-2 text-xs font-medium disabled:opacity-60",
                    prioridadeValidada === p
                      ? "border-amber bg-amber text-bg"
                      : "border-border-strong bg-bg-alt text-ink hover:border-amber"
                  )}
                >
                  {PRIORIDADE_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Observações do técnico</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={jaFinalizada}
              rows={5}
              placeholder="Fundamente a validação, correção de categoria ou arquivamento..."
              className="w-full resize-y rounded-md border border-border-strong bg-bg-alt px-3.5 py-2.5 text-sm text-ink disabled:opacity-60"
            />
          </div>

          {actionError && <p className="text-sm text-red">{actionError}</p>}

          {!jaFinalizada && (
            <div className="space-y-2.5">
              <button
                onClick={() => runAction("validar")}
                disabled={actionLoading !== null}
                className="w-full rounded-md bg-green px-4 py-2.5 text-sm font-semibold text-bg hover:bg-green-dark disabled:opacity-60"
              >
                {actionLoading === "validar" ? "A validar…" : "Validar denúncia"}
              </button>
              <button
                onClick={() => runAction("encaminhar")}
                disabled={actionLoading !== null || !podeEncaminhar}
                title={!podeEncaminhar ? "Valide a denúncia antes de encaminhar" : undefined}
                className="w-full rounded-md border border-green px-4 py-2.5 text-sm font-semibold text-green hover:bg-green-soft disabled:opacity-40"
              >
                {actionLoading === "encaminhar" ? "A encaminhar…" : "Encaminhar denúncia"}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => runAction("rejeitar")}
                  disabled={actionLoading !== null}
                  className="rounded-md border border-red/40 px-4 py-2.5 text-sm font-semibold text-red hover:bg-red-soft disabled:opacity-60"
                >
                  Rejeitar
                </button>
                <button
                  onClick={() => runAction("arquivar")}
                  disabled={actionLoading !== null}
                  className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink disabled:opacity-60"
                >
                  Arquivar
                </button>
              </div>
            </div>
          )}
          {jaFinalizada && (
            <p className="rounded-md bg-bg-alt p-3 text-sm text-ink-soft">
              Este processo já se encontra em estado final ({ESTADO_LABEL[denuncia.estado]}) e não
              pode ser editado.
            </p>
          )}

          <div className="border-t border-border pt-4 text-xs text-muted">
            <p>Técnico responsável: <span className="font-medium text-ink">{denuncia.tecnico_responsavel_nome ?? "—"}</span></p>
            {denuncia.validated_at && <p className="mt-1">Validado em: {formatDateTime(denuncia.validated_at)}</p>}
            {denuncia.forwarded_at && <p className="mt-1">Encaminhado em: {formatDateTime(denuncia.forwarded_at)}</p>}
            <p className="mt-1">Toda a decisão fica registada no histórico de auditoria.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, multiline, mono }: { label: string; value: string; multiline?: boolean; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 px-1 py-3.5">
      <dt className="text-muted">{label}</dt>
      <dd className={clsx("text-ink", multiline && "whitespace-pre-wrap leading-relaxed", mono && "protocol-code")}>
        {value}
      </dd>
    </div>
  );
}
