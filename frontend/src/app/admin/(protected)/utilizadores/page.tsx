"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserPlus, Users, X } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiGet, apiSend } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";
import { USER_ROLES, type UserRole, type UserSummary } from "@/lib/types";

const API = "/api/admin/users";
const PASSWORD_MIN_LENGTH = 8;

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  ADMIN: "red",
  COORDINATOR: "amber",
  TECHNICIAN: "green",
  VIEWER: "gray",
};

const COLUMNS = ["Nome", "Perfil", "Estado", "Último acesso", "Criado em"];

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: NewUserForm = { name: "", email: "", password: "", role: "TECHNICIAN" };

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setUsers(await apiGet<UserSummary[]>(API));
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar os utilizadores.");
      }
    }
    load();
  }, []);

  const activeCount = users?.filter((user) => user.is_active).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        subtitle={users ? `${users.length} contas · ${activeCount} ativas` : "A carregar…"}
        action={
          !isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)}>
              <UserPlus size={16} aria-hidden /> Novo utilizador
            </Button>
          )
        }
      />

      {isFormOpen && (
        <NewUserCard
          onCancel={() => setIsFormOpen(false)}
          onCreated={(user) => {
            setUsers((current) => [...(current ?? []), user]);
            setIsFormOpen(false);
          }}
        />
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
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
              {users
                ? users.map((user) => <UserRow key={user.id} user={user} />)
                : Array.from({ length: 4 }, (_, row) => (
                    <tr key={row} className="border-b border-border last:border-0">
                      {COLUMNS.map((column) => (
                        <td key={column} className="px-5 py-4">
                          <Skeleton className="h-4 w-full max-w-32" />
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {users?.length === 0 && <EmptyState icon={Users} title="Sem utilizadores" />}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: UserSummary }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-soft text-xs font-semibold text-green" aria-hidden>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-ink">{user.name}</span>
            <span className="block truncate text-xs text-muted">{user.email}</span>
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <Badge tone={ROLE_TONES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
      </td>
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-2 text-ink-soft">
          <span className={user.is_active ? "h-2 w-2 rounded-full bg-green" : "h-2 w-2 rounded-full bg-border-strong"} aria-hidden />
          {user.is_active ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="px-5 py-3.5 text-ink-soft">{user.last_login_at ? timeAgo(user.last_login_at) : "Nunca"}</td>
      <td className="px-5 py-3.5 text-ink-soft">{formatDate(user.created_at)}</td>
    </tr>
  );
}

function NewUserCard({ onCancel, onCreated }: { onCancel: () => void; onCreated: (user: UserSummary) => void }) {
  const notify = useToast();
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const passwordTooShort = form.password.length > 0 && form.password.length < PASSWORD_MIN_LENGTH;

  function update<K extends keyof NewUserForm>(key: K, value: NewUserForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const user = await apiSend<UserSummary>("POST", API, form);
      notify(`Conta de ${user.name} criada.`);
      onCreated(user);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "Não foi possível criar o utilizador.");
      setIsSaving(false);
    }
  }

  return (
    <Card
      title="Novo utilizador"
      icon={UserPlus}
      className="animate-slide-up"
      action={
        <button type="button" onClick={onCancel} aria-label="Fechar" className="rounded-md p-1 text-muted hover:bg-bg-alt hover:text-ink">
          <X size={18} aria-hidden />
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome completo" htmlFor="user-name">
            <Input id="user-name" required autoComplete="off" value={form.name} onChange={(event) => update("name", event.target.value)} />
          </Field>
          <Field label="Email institucional" htmlFor="user-email">
            <Input
              id="user-email"
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="nome@gccc.gov.mz"
            />
          </Field>
          <Field
            label="Palavra-passe inicial"
            htmlFor="user-password"
            hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres. Partilhe-a por um canal seguro.`}
            error={passwordTooShort ? `Faltam ${PASSWORD_MIN_LENGTH - form.password.length} caracteres.` : null}
          >
            <Input
              id="user-password"
              type="password"
              required
              autoComplete="new-password"
              aria-invalid={passwordTooShort}
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
            />
          </Field>
          <Field label="Perfil" htmlFor="user-role">
            <Select id="user-role" value={form.role} onChange={(event) => update("role", event.target.value as UserRole)}>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSaving} disabled={form.password.length < PASSWORD_MIN_LENGTH}>
            Criar utilizador
          </Button>
        </div>
      </form>
    </Card>
  );
}
