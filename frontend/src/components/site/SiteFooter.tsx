import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const FOOTER_LINKS = [
  { href: "/denunciar", label: "Fazer denúncia" },
  { href: "/consultar", label: "Consultar denúncia" },
  { href: "/faq", label: "Perguntas frequentes" },
  { href: "/chat", label: "Assistente" },
];

export function SiteFooter() {
  return (
    <footer className="bg-dark text-dark-muted">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto_auto] md:gap-14">
        <div>
          <Logo theme="dark" />
          <p className="mt-4 max-w-md text-sm leading-relaxed">
            Protótipo académico desenvolvido no âmbito de um trabalho de monografia. Não deve ser utilizado em produção
            sem mecanismos adicionais de segurança, proteção de dados e validação jurídica.
          </p>
        </div>

        <nav aria-label="Ligações do rodapé">
          <p className="text-xs font-semibold uppercase tracking-wider text-bg">Plataforma</p>
          <ul className="mt-3 space-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-bg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-bg">GCCC</p>
          <Link
            href="/admin/login"
            className="mt-3 inline-flex items-center gap-2 text-sm transition-colors hover:text-bg"
          >
            <Lock size={14} aria-hidden /> Acesso técnico
          </Link>
        </div>
      </div>
      <div className="border-t border-dark-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs sm:px-6">© {new Date().getFullYear()} denuncIA · Moçambique</p>
      </div>
    </footer>
  );
}
