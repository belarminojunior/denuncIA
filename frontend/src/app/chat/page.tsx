import { PublicShell } from "@/components/site/PublicShell";
import { ChatAssistant } from "@/components/denuncia/ChatAssistant";

export const metadata = {
  title: "Assistente — GCCC",
};

export default function ChatPage() {
  return (
    <PublicShell showChatWidget={false}>
      <ChatAssistant />
    </PublicShell>
  );
}
