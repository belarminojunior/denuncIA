"use client";

import clsx from "clsx";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useChat } from "@/components/chat/ChatProvider";

const SUGGESTIONS = ["Posso denunciar anonimamente?", "Como anexo evidências?"];

/** Floating launcher that opens the shared conversation from any public page. */
export function ChatWidget() {
  const { isWidgetOpen, toggleWidget, closeWidget } = useChat();

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isWidgetOpen && (
        <ChatPanel
          compact
          suggestions={SUGGESTIONS}
          onClose={closeWidget}
          heightClassName="h-[min(22rem,55vh)]"
          className="w-[min(24rem,calc(100vw-2rem))] animate-slide-up shadow-2xl"
        />
      )}
      <button
        type="button"
        onClick={toggleWidget}
        aria-expanded={isWidgetOpen}
        aria-label={isWidgetOpen ? "Fechar assistente" : "Abrir assistente"}
        className={clsx(
          "flex h-14 items-center justify-center gap-2 rounded-full bg-green text-bg shadow-lg transition-all hover:bg-green-dark",
          isWidgetOpen ? "w-14" : "w-14 sm:w-auto sm:px-5",
        )}
      >
        {isWidgetOpen ? (
          <X size={22} aria-hidden />
        ) : (
          <>
            <MessageCircle size={22} aria-hidden />
            <span className="hidden text-sm font-medium sm:inline">Tirar dúvidas</span>
          </>
        )}
      </button>
    </div>
  );
}
