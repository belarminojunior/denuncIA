"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("tecnico@gccc.gov.mz");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<LoginResponse>("/api/auth/login", { email, password });
      saveSession(res.access_token, res.user);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-green text-sm font-semibold text-bg">
            GC
          </span>
          <span>
            <span className="block font-serif text-base font-semibold text-ink">GCCC — Área de gestão</span>
            <span className="block text-xs text-muted">Acesso restrito a técnicos autorizados</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-bg-alt p-8">
          <h1 className="text-xl font-semibold text-ink">Autenticação</h1>

          <label className="mt-6 block text-sm font-medium text-ink">Email institucional</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1.5 w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
          />

          <label className="mt-5 block text-sm font-medium text-ink">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="mt-1.5 w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
          />

          {error && <p className="mt-4 text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-green px-4 py-2.5 text-sm font-medium text-bg hover:bg-green-dark disabled:opacity-60"
          >
            {loading ? "A entrar…" : "Entrar"}
          </button>

          <div className="mt-6 border-t border-border pt-4 text-xs text-muted">
            <p className="label-eyebrow !text-muted">Credenciais demo</p>
            <p className="mt-1.5 protocol-code">tecnico@gccc.gov.mz · Admin123!</p>
            <p className="mt-1">apenas para o protótipo</p>
          </div>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-green hover:underline">
          Voltar à área pública
        </Link>
      </div>
    </div>
  );
}
