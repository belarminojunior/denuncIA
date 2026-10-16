"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useChatConversation } from "@/components/chat/useChatConversation";

type Conversation = ReturnType<typeof useChatConversation>;

interface ChatContextValue extends Conversation {
  isWidgetOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Holds a single conversation for the whole site, so the chat started on the
 * home page continues in the floating widget on any other page.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const conversation = useChatConversation();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        ...conversation,
        isWidgetOpen,
        openWidget: () => setIsWidgetOpen(true),
        closeWidget: () => setIsWidgetOpen(false),
        toggleWidget: () => setIsWidgetOpen((open) => !open),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside <ChatProvider>");
  return context;
}
