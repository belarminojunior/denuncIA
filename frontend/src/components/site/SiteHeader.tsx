"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/denunciar", label: "Fazer denúncia" },
  { href: "/consultar", label: "Consultar denúncia" },
  { href: "/#faq", label: "Perguntas frequentes" },
  { href: "/chat", label: "Chatbot" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-bg/95 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-green text-sm font-semibold text-bg">
            GC
          </span>
          <span>
            <span className="block font-serif text-base font-semibold leading-tight text-ink">
              GCCC — Plataforma de Denúncias
            </span>
            <span className="block text-xs text-muted leading-tight">
              Gabinete Central de Combate à Corrupção
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "text-sm transition-colors hover:text-green",
                pathname === item.href ? "text-ink font-medium" : "text-ink-soft"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/denunciar"
          className="rounded-md bg-green px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-green-dark"
        >
          Fazer denúncia
        </Link>
      </div>
    </header>
  );
}
