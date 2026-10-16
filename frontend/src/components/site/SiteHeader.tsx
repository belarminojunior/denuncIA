"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/denunciar", label: "Fazer denúncia" },
  { href: "/consultar", label: "Consultar denúncia" },
  { href: "/faq", label: "Perguntas frequentes" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="denuncIA — página inicial" onClick={() => setIsMenuOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={clsx(
                "text-sm transition-colors hover:text-green",
                pathname === item.href ? "font-medium text-ink" : "text-ink-soft",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/denunciar" className="hidden sm:inline-flex">
            Fazer denúncia
          </ButtonLink>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            className="rounded-md p-2 text-ink hover:bg-bg-alt lg:hidden"
          >
            {isMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-menu" aria-label="Navegação principal" className="animate-fade-in border-t border-border px-4 py-3 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className={clsx(
                "block rounded-md px-3 py-2.5 text-sm",
                pathname === item.href ? "bg-green-soft font-medium text-green" : "text-ink-soft hover:bg-bg-alt",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
