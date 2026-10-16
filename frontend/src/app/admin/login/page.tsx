"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { ApiError, apiSend } from "@/lib/api";
import { clearSession, saveSession } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

// Seeded by backend/scripts/init_db.py; shown only because this is a prototype.
const DEMO_EMAIL = "tecnico@gccc.gov.mz";
const DEMO_PASSWORD = "Admin123!";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-14">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="mb-8 inline-block">
          <Logo subtitle="Área de gestão do GCCC" />
        </Link>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-green hover:underline">
          <ArrowLeft size={14} aria-hidden /> Voltar à área pública
        </Link>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const sessionExpired = useSearchParams().get("sessao") === "expirada";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    clearSession();
    try {
      const response = await apiSend<LoginResponse>("POST", "/api/auth/login", { email, password });
      saveSession(response.access_token, response.user);
      router.push("/admin/dashboard");
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : "Não foi possível iniciar sessão.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-bg-alt p-6 sm:p-8">
      <h1 className="text-xl text-ink">Iniciar sessão</h1>
      <p className="mt-1 text-sm text-muted">Acesso restrito a técnicos autorizados.</p>

      {sessionExpired && !error && (
        <Alert tone="warning" className="mt-5">
          A sua sessão expirou. Inicie sessão novamente.
        </Alert>
      )}

      <div className="mt-6 space-y-5">
        <Field label="Email institucional" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Palavra-passe" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>
        </Field>
      </div>

      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      <Button type="submit" fullWidth loading={isLoading} className="mt-6">
        {!isLoading && <LogIn size={16} aria-hidden />} Entrar
      </Button>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted">
        <span>
          Demo: <span className="protocol-code">{DEMO_EMAIL}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setEmail(DEMO_EMAIL);
            setPassword(DEMO_PASSWORD);
          }}
          className="shrink-0 font-medium text-green hover:underline"
        >
          Preencher credenciais demo
        </button>
      </div>
    </form>
  );
}
