"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { FileSearch, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ROLE_LABELS } from "@/lib/labels";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/denuncias", label: "Denúncias", icon: FileSearch },
  { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck },
  { href: "/admin/utilizadores", label: "Utilizadores", icon: Users },
];

interface AdminSidebarProps {
  user: User | null;
  onLogout: () => void;
}

/** Fixed sidebar on desktop; a top bar with a slide-in drawer on small screens. */
export function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = () => setIsDrawerOpen(false);

  const content = (
    <>
      <div>
        <div className="flex items-center justify-between border-b border-dark-border px-5 py-5">
          <Link href="/admin/dashboard" onClick={closeDrawer}>
            <Logo theme="dark" subtitle="Gestão de denúncias" />
          </Link>
          <button type="button" onClick={closeDrawer} aria-label="Fechar menu" className="rounded-md p-1 hover:text-bg lg:hidden">
            <X size={20} aria-hidden />
          </button>
        </div>

        <nav aria-label="Área de gestão" className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive ? "bg-green font-medium text-bg" : "hover:bg-dark-alt hover:text-bg",
                )}
              >
                <Icon size={17} aria-hidden /> {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-dark-border p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-alt text-sm font-semibold text-bg" aria-hidden>
            {user?.name.charAt(0).toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 text-xs">
            <p className="truncate text-sm font-semibold text-bg">{user?.name ?? "Técnico GCCC"}</p>
            <p className="truncate">{user ? ROLE_LABELS[user.role] : ""}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="mt-4 flex items-center gap-2 text-xs transition-colors hover:text-bg">
          <LogOut size={14} aria-hidden /> Terminar sessão
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-dark-border bg-dark px-4 py-3 text-dark-muted lg:hidden">
        <Logo theme="dark" subtitle={null} />
        <button type="button" onClick={() => setIsDrawerOpen(true)} aria-label="Abrir menu" className="rounded-md p-1.5 hover:text-bg">
          <Menu size={22} aria-hidden />
        </button>
      </div>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-dark text-dark-muted lg:flex">
        {content}
      </aside>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-dark/60" onClick={closeDrawer} aria-hidden />
          <aside className="relative flex h-full w-72 max-w-[85vw] animate-slide-up flex-col justify-between bg-dark text-dark-muted">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
