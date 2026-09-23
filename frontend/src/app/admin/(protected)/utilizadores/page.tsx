"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShieldCheck, X } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { USER_ROLE_LABEL, timeAgo, formatDate } from "@/lib/format";
import { USER_ROLES } from "@/lib/types";
import type { UserListItemOut, UserRole } from "@/lib/types";

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: "bg-gray-badge-soft text-gray-badge",
  COORDENADOR: "bg-teal-soft text-teal",
  TECNICO: "bg-bg-alt text-ink-soft border border-border-strong",
  CONSULTA: "bg-amber-soft text-amber",
};

const PERMISSOES: { acao: string; tecnico: boolean; coord: boolean; admin: boolean }[] = [
  { acao: "Consultar denúncias", tecnico: true, coord: true, admin: true },
  { acao: "Validar classificação", tecnico: true, coord: true, admin: false },
  { acao: "Corrigir categoria", tecnico: true, coord: true, admin: false },
  { acao: "Encaminhar para entidade", tecnico: false, coord: true, admin: false },
  { acao: "Arquivar processo", tecnico: false, coord: true, admin: false },
  { acao: "Consultar auditoria", tecnico: false, coord: true, admin: true },
  { acao: "Gerir utilizadores", tecnico: false, coord: false, admin: true },
];

const CAMPOS_INICIAIS = { name: "", email: "", password: "", role: "TECNICO" as UserRole };

export default function UtilizadoresPage() {
  const [users, setUsers] = useState<UserListItemOut[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(CAMPOS_INICIAIS);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    apiGet<UserListItemOut[]>("/api/admin/utilizadores").then(setUsers);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarUtilizador(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await apiPost("/api/admin/utilizadores", form);
      setForm(CAMPOS_INICIAIS);
      setShowForm(false);
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o utilizador.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        subtitle={`${users ? `${users.length} contas com acesso à área de gestão` : "…"} · dados fictícios`}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-md bg-green px-4 py-2.5 text-sm font-medium text-bg hover:bg-green-dark"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancelar" : "Criar utilizador"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={criarUtilizador} className="grid gap-4 rounded-xl border border-border bg-bg-alt p-6 md:grid-cols-4">
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-sm font-medium text-ink">Nome</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-sm font-medium text-ink">Perfil</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>

          {erro && <p className="text-sm text-red md:col-span-4">{erro}</p>}

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-green px-5 py-2.5 text-sm font-medium text-bg hover:bg-green-dark disabled:opacity-60"
            >
              {salvando ? "A criar…" : "Criar utilizador"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3.5">Utilizador</th>
              <th className="px-5 py-3.5">Perfil</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-alt">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <Badge className={ROLE_BADGE[u.role]}>{u.role}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  {u.ativo ? (
                    <span className="text-sm font-medium text-green">Ativo</span>
                  ) : (
                    <span className="text-sm font-medium text-amber">Suspenso</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-ink-soft">
                  {u.last_login_at ? timeAgo(u.last_login_at) : `criado a ${formatDate(u.created_at)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card title="Permissões por perfil" icon={ShieldCheck}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2.5">Ação</th>
                <th className="py-2.5 text-center">Técnico</th>
                <th className="py-2.5 text-center">Coord.</th>
                <th className="py-2.5 text-center">Admin</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSOES.map((p) => (
                <tr key={p.acao} className="border-b border-border last:border-0">
                  <td className="py-2.5 text-ink-soft">{p.acao}</td>
                  <PermCell ok={p.tecnico} />
                  <PermCell ok={p.coord} />
                  <PermCell ok={p.admin} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          A classificação automática não é um perfil: nenhuma conta pode validar em nome do sistema.
          Toda a validação fica associada ao técnico autenticado. Esta tabela é informativa — neste
          protótipo, qualquer conta autenticada pode executar todas as ações sobre denúncias.
        </p>
      </Card>
    </div>
  );
}

function PermCell({ ok }: { ok: boolean }) {
  return (
    <td className="py-2.5 text-center">
      {ok ? <Check size={16} className="mx-auto text-green" /> : <Minus size={14} className="mx-auto text-muted" />}
    </td>
  );
}
