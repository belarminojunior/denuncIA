"use client";

import { useChatConversation } from "@/components/denuncia/useChatConversation";
import { ChatPanel } from "@/components/denuncia/ChatPanel";

const SUGESTOES = ["Não sei que tipo de corrupção é", "Posso denunciar anonimamente?", "Como anexo evidências?"];

export function ChatAssistant() {
  const { messages, loading, send } = useChatConversation();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl text-ink">Assistente de denúncias</h1>
      <p className="mt-2 text-ink-soft">
        Converse à vontade sobre a sua situação — não precisa de se limitar a perguntas fixas.
      </p>

      <div className="mt-6 rounded-lg border border-amber/30 bg-amber-soft p-4 text-sm text-ink">
        As respostas são meramente informativas. O assistente não investiga pessoas, não presta
        aconselhamento jurídico e não decide sobre denúncias.
      </div>

      <ChatPanel messages={messages} loading={loading} send={send} suggestions={SUGESTOES} className="mt-6" />
    </div>
  );
}
