import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-dark-border bg-dark text-dark-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-serif text-base font-semibold text-bg">GCCC — Plataforma de Denúncias</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed">
            Protótipo académico, desenvolvido no âmbito de um trabalho de monografia. Não deve ser
            utilizado em produção sem mecanismos adicionais de segurança, proteção de dados e
            validação jurídica.
          </p>
        </div>
        <Link href="/admin/login" className="text-sm text-dark-muted hover:text-bg whitespace-nowrap">
          Acesso técnico GCCC
        </Link>
      </div>
    </footer>
  );
}
