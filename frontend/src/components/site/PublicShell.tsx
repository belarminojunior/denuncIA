"use client";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ChatWidgetProvider } from "@/components/site/ChatWidgetContext";
import { FloatingChatWidget } from "@/components/site/FloatingChatWidget";

export function PublicShell({
  children,
  showChatWidget = true,
}: {
  children: React.ReactNode;
  showChatWidget?: boolean;
}) {
  return (
    <ChatWidgetProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      {showChatWidget && <FloatingChatWidget />}
    </ChatWidgetProvider>
  );
}
