"use client";

import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const MENSAGEM_INICIAL: ChatMessage = {
  role: "assistant",
  content:
    "Olá. Sou o assistente do GCCC — pode conversar comigo à vontade sobre a sua situação, não só por perguntas fixas. Conte-me o que aconteceu, com as suas palavras, e ajudo-o a perceber se é corrupção, que informação vale a pena reunir e como denunciar. Não investigo nem decido sobre denúncias — isso é sempre feito por um técnico do GCCC.",
};

export function useChatConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([MENSAGEM_INICIAL]);
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages.slice(-16);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await apiPost<{ reply: string }>("/api/chatbot", { message: trimmed, history });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível contactar o assistente.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, send };
}
