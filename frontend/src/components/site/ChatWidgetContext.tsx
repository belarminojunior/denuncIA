"use client";

import { createContext, useContext, useState } from "react";
import { useChatConversation } from "@/components/denuncia/useChatConversation";
import type { ChatMessage } from "@/lib/types";

interface ChatWidgetState {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  messages: ChatMessage[];
  loading: boolean;
  send: (text: string) => Promise<void>;
}

const ChatWidgetContext = createContext<ChatWidgetState | null>(null);

export function ChatWidgetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, loading, send } = useChatConversation();

  return (
    <ChatWidgetContext.Provider
      value={{
        isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
        toggleChat: () => setIsOpen((v) => !v),
        messages,
        loading,
        send,
      }}
    >
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget(): ChatWidgetState {
  const ctx = useContext(ChatWidgetContext);
  if (!ctx) throw new Error("useChatWidget deve ser usado dentro de ChatWidgetProvider");
  return ctx;
}
