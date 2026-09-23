"use client";

import { useChatWidget } from "@/components/site/ChatWidgetContext";

export function FaqAssistantLink() {
  const { openChat } = useChatWidget();
  return (
    <button onClick={openChat} className="text-green underline">
      assistente
    </button>
  );
}
