import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ChatAssistant } from "@/components/denuncia/ChatAssistant";

export const metadata = {
  title: "Assistente — GCCC",
};

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ChatAssistant />
      </main>
      <SiteFooter />
    </div>
  );
}
