"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, FileSearch, Send, ShieldCheck, Users, LogOut } from "lucide-react";
import { getStoredUser, getToken, clearSession } from "@/lib/auth";
import type { UserOut } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/admin/denuncias", label: "Denúncias", icon: FileSearch, enabled: true },
  { href: "/admin/encaminhamentos", label: "Encaminhamentos", icon: Send, enabled: false },
  { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck, enabled: false },
  { href: "/admin/utilizadores", label: "Utilizadores", icon: Users, enabled: false },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserOut | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function verificarSessao() {
      const token = getToken();
      if (!token) {
        router.replace("/admin/login");
        return;
      }
      setUser(getStoredUser());
      setChecked(true);
    }
    verificarSessao();
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-64 flex-shrink-0 flex-col justify-between border-r border-dark-border bg-dark text-dark-muted">
        <div>
          <div className="flex items-center gap-3 border-b border-dark-border px-6 py-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green text-xs font-semibold text-bg">
              GC
            </span>
            <span>
              <span className="block text-sm font-semibold text-bg">GCCC</span>
              <span className="block text-xs">Gestão de denúncias</span>
            </span>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              if (!item.enabled) {
                return (
                  <span
                    key={item.href}
                    className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-dark-muted/50"
                    title="Disponível em versão futura do protótipo"
                  >
                    <Icon size={16} /> {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-green text-bg font-medium" : "hover:bg-dark-alt hover:text-bg"
                  )}
                >
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-dark-border p-5 text-xs">
          <p className="text-sm font-semibold text-bg">{user?.name ?? "Técnico GCCC"}</p>
          <p className="mt-0.5">{user?.email}</p>
          <p className="mt-0.5">ROLE: {user?.role}</p>
          <button
            onClick={() => {
              clearSession();
              router.replace("/admin/login");
            }}
            className="mt-3 flex items-center gap-2 text-dark-muted hover:text-bg"
          >
            <LogOut size={14} /> Terminar sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-10 py-10">{children}</main>
    </div>
  );
}
