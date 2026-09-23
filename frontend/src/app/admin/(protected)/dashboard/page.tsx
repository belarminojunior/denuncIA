"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Inbox,
  Clock,
  Search,
  CheckCircle2,
  Send,
  ShieldAlert,
  Archive,
  XCircle,
  LayoutGrid,
  PieChart,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/ui/Card";
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
  RECEBIDA: "#b8ab90",
  PENDENTE_VALIDACAO: "#a8631c",
  EM_ANALISE: "#3f6b52",
  VALIDADA: "#1e4d33",
  ENCAMINHADA: "#163a26",
  EM_INVESTIGACAO: "#756c5a",
  ARQUIVADA: "#d8cbac",
  REJEITADA: "#7d2634",
};

const PRIORIDADE_BAR: Record<Prioridade, string> = {
  CRITICA: "bg-red",
  ALTA: "bg-amber",
  MEDIA: "bg-green",
  BAIXA: "bg-gray-badge",
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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Dados fictícios para demonstração · atualizado a ${new Date().toLocaleString("pt-PT")}`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total de denúncias" value={stats?.total} icon={Inbox} tone="accent" />
        <StatCard label="Pendentes de validação" value={stats?.pendentes_validacao} icon={Clock} tone="warning" />
        <StatCard label="Em análise" value={stats?.em_analise} icon={Search} />
        <StatCard label="Validadas" value={stats?.validadas} icon={CheckCircle2} />
        <StatCard label="Encaminhadas" value={stats?.encaminhadas} icon={Send} />
        <StatCard label="Em investigação" value={stats?.em_investigacao} icon={ShieldAlert} />
        <StatCard label="Arquivadas" value={stats?.arquivadas} icon={Archive} />
        <StatCard label="Rejeitadas" value={stats?.rejeitadas} icon={XCircle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Denúncias por categoria" icon={LayoutGrid}>
          <div className="space-y-4">
            {categorias.map((c) => (
              <div key={c.categoria}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">{CATEGORIA_LABEL[c.categoria] ?? c.categoria}</span>
                  <span className="font-medium text-ink">{c.total}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-bg-alt">
                  <div className="h-2 rounded-full bg-green" style={{ width: `${(c.total / maxCategoria) * 100}%` }} />
                </div>
              </div>
            ))}
            {categorias.length === 0 && <p className="text-sm text-muted">Sem dados ainda.</p>}
          </div>
        </Card>

        <Card title="Denúncias por estado" icon={PieChart}>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-alt">
            {estados.map((e) => (
              <div key={e.estado} style={{ width: `${(e.total / totalEstados) * 100}%`, background: ESTADO_COLORS[e.estado] ?? "#7a705d" }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {estados.map((e) => (
              <div key={e.estado} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ESTADO_COLORS[e.estado] ?? "#7a705d" }} />
                <span className="truncate text-ink-soft">{ESTADO_LABEL[e.estado]}</span>
                <span className="ml-auto font-medium text-ink">{e.total}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Prioridade" icon={Gauge}>
          <div className="space-y-4">
            {prioridades.map((p) => (
              <div key={p.prioridade}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">{PRIORIDADE_LABEL[p.prioridade]}</span>
                  <span className="font-medium text-ink">{p.total}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-bg-alt">
                  <div
                    className={`h-2 rounded-full ${PRIORIDADE_BAR[p.prioridade]}`}
                    style={{ width: `${(p.total / maxPrioridade) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Denúncias por mês" icon={TrendingUp}>
        <div className="h-64">
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
      </Card>
    </div>
  );
}
