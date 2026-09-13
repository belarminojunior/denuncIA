"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiGet } from "@/lib/api";
import { CATEGORIA_LABEL, ESTADO_LABEL, PRIORIDADE_LABEL } from "@/lib/format";
import type { Categoria, EstadoDenuncia, Prioridade } from "@/lib/types";

interface Stats {
  total: number;
  pendentes_validacao: number;
  em_analise: number;
  validadas: number;
  encaminhadas: number;
  em_investigacao: number;
  arquivadas: number;
  rejeitadas: number;
}

const ESTADO_COLORS: Record<string, string> = {
  PENDENTE_VALIDACAO: "#241d15",
  EM_ANALISE: "#1e4d33",
  VALIDADA: "#3f6b52",
  ENCAMINHADA: "#9db8a7",
  ARQUIVADA: "#d8cbac",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categorias, setCategorias] = useState<{ categoria: Categoria; total: number }[]>([]);
  const [estados, setEstados] = useState<{ estado: EstadoDenuncia; total: number }[]>([]);
  const [prioridades, setPrioridades] = useState<{ prioridade: Prioridade; total: number }[]>([]);
  const [mensal, setMensal] = useState<{ mes: string; total: number }[]>([]);

  useEffect(() => {
    apiGet<Stats>("/api/admin/dashboard/stats").then(setStats).catch(() => {});
    apiGet<{ categoria: Categoria; total: number }[]>("/api/admin/dashboard/categories").then(setCategorias).catch(() => {});
    apiGet<{ estado: EstadoDenuncia; total: number }[]>("/api/admin/dashboard/status").then(setEstados).catch(() => {});
    apiGet<{ prioridade: Prioridade; total: number }[]>("/api/admin/dashboard/priority").then(setPrioridades).catch(() => {});
    apiGet<{ mes: string; total: number }[]>("/api/admin/dashboard/monthly").then(setMensal).catch(() => {});
  }, []);

  const maxCategoria = Math.max(1, ...categorias.map((c) => c.total));
  const maxPrioridade = Math.max(1, ...prioridades.map((p) => p.total));
  const totalEstados = estados.reduce((sum, e) => sum + e.total, 0) || 1;

  return (
    <div>
      <h1 className="text-3xl text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dados fictícios para demonstração · atualizado a {new Date().toLocaleString("pt-PT")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total de denúncias" value={stats?.total} accent />
        <StatCard label="Pendentes de validação" value={stats?.pendentes_validacao} highlight />
        <StatCard label="Em análise" value={stats?.em_analise} />
        <StatCard label="Validadas" value={stats?.validadas} />
        <StatCard label="Encaminhadas" value={stats?.encaminhadas} />
        <StatCard label="Arquivadas" value={stats?.arquivadas} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-semibold text-ink">Denúncias por categoria</p>
          <div className="mt-5 space-y-4">
            {categorias.map((c) => (
              <div key={c.categoria}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">{CATEGORIA_LABEL[c.categoria] ?? c.categoria}</span>
                  <span className="font-medium text-ink">{c.total}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-bg-alt">
                  <div
                    className="h-2 rounded-full bg-green"
                    style={{ width: `${(c.total / maxCategoria) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-semibold text-ink">Denúncias por estado</p>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-bg-alt">
              {estados.map((e) => (
                <div
                  key={e.estado}
                  style={{ width: `${(e.total / totalEstados) * 100}%`, background: ESTADO_COLORS[e.estado] ?? "#7a705d" }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {estados.map((e) => (
                <div key={e.estado} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: ESTADO_COLORS[e.estado] ?? "#7a705d" }}
                  />
                  <span className="text-ink-soft">{ESTADO_LABEL[e.estado]}</span>
                  <span className="ml-auto font-medium text-ink">{e.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-semibold text-ink">Prioridade</p>
            <div className="mt-5 space-y-4">
              {prioridades.map((p) => (
                <div key={p.prioridade}>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">{PRIORIDADE_LABEL[p.prioridade]}</span>
                    <span className="font-medium text-ink">{p.total}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-bg-alt">
                    <div
                      className={
                        p.prioridade === "CRITICA"
                          ? "h-2 rounded-full bg-red"
                          : p.prioridade === "ALTA"
                          ? "h-2 rounded-full bg-amber"
                          : p.prioridade === "BAIXA"
                          ? "h-2 rounded-full bg-gray-badge"
                          : "h-2 rounded-full bg-green"
                      }
                      style={{ width: `${(p.total / maxPrioridade) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-ink">Denúncias por mês</p>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mensal}>
              <CartesianGrid vertical={false} stroke="#e4dbc3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#7a705d" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#7a705d" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f2ecda" }} contentStyle={{ borderRadius: 8, borderColor: "#e4dbc3" }} />
              <Bar dataKey="total" fill="#1e4d33" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 ${
        highlight ? "border-l-4 border-l-amber border-border" : "border-border"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-green" : "text-ink"}`}>{value ?? "—"}</p>
    </div>
  );
}
