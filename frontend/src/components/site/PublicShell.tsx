import type { ReactNode } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

interface PublicShellProps {
  children: ReactNode;
  /** Off on pages that already embed the chat, to avoid two views of one conversation. */
  showChatWidget?: boolean;
}

export function PublicShell({ children, showChatWidget = true }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-green focus:px-4 focus:py-2 focus:text-bg"
      >
        Saltar para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {showChatWidget && <ChatWidget />}
    </div>
  );
}
