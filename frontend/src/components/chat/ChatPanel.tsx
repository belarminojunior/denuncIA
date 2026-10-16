"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { RotateCcw, SendHorizontal, X } from "lucide-react";
import { ChatMessageBubble, TypingIndicator } from "@/components/chat/ChatMessageBubble";
import { useChat } from "@/components/chat/ChatProvider";

const MAX_INPUT_LENGTH = 2000;
const MAX_INPUT_HEIGHT_PX = 140;

interface ChatPanelProps {
  suggestions?: string[];
  /** Tailwind height classes for the message area. */
  heightClassName?: string;
  compact?: boolean;
  onClose?: () => void;
  className?: string;
}

/** Conversation UI shared by the home page, the floating widget and the /chat page. */
export function ChatPanel({
  suggestions = [],
  heightClassName = "h-[26rem]",
  compact = false,
  onClose,
  className,
}: ChatPanelProps) {
  const { messages, status, isBusy, send, reset } = useChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const hasConversation = messages.length > 1;
  const lastMessage = messages[messages.length - 1];
  const awaitingFirstChunk = status === "waiting" && lastMessage.role === "assistant" && !lastMessage.content;
  const visibleMessages = awaitingFirstChunk ? messages.slice(0, -1) : messages;

  // Scroll only the message list, never the page around the panel.
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function resizeInput() {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT_PX)}px`;
  }

  function submit(text: string) {
    if (!text.trim() || isBusy) return;
    send(text);
    setDraft("");
    requestAnimationFrame(resizeInput);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(draft);
  }

  // Enter sends; Shift+Enter inserts a new line.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  }

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-bg-alt", className)}>
      <div className={cn("flex items-center justify-between gap-2 border-b border-border bg-card", compact ? "px-4 py-3" : "px-5 py-3.5")}>
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
          Assistente denuncIA
        </p>
        <div className="flex items-center gap-1">
          {hasConversation && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-bg-alt hover:text-ink"
            >
              <RotateCcw size={13} aria-hidden /> Nova conversa
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar assistente"
              className="rounded-md p-1 text-muted transition-colors hover:bg-bg-alt hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        aria-busy={isBusy}
        className={cn("flex flex-col gap-3 overflow-y-auto", compact ? "p-4" : "p-5", heightClassName)}
      >
        {visibleMessages.map((message, index) => (
          <ChatMessageBubble key={index} message={message} compact={compact} />
        ))}
        {awaitingFirstChunk && <TypingIndicator />}
      </div>

      {!hasConversation && suggestions.length > 0 && (
        <div className={cn("flex flex-wrap gap-2 pb-3", compact ? "px-4" : "px-5")}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-full border border-green/30 bg-card px-3 py-1.5 text-xs text-green transition-colors hover:border-green hover:bg-green-soft"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={cn("border-t border-border bg-card", compact ? "p-3" : "p-4")}>
        <label htmlFor={inputId} className="sr-only">
          Mensagem para o assistente
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_INPUT_LENGTH}
            onChange={(event) => {
              setDraft(event.target.value);
              resizeInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escreva a sua pergunta ou conte o que aconteceu…"
            className="max-h-36 min-h-[42px] flex-1 resize-none rounded-md border border-border-strong bg-bg px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted/80 focus:border-green focus:outline-none focus:ring-3 focus:ring-green-soft"
          />
          <button
            type="submit"
            disabled={isBusy || !draft.trim()}
            aria-label="Enviar mensagem"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md bg-green text-bg transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal size={18} aria-hidden />
          </button>
        </div>
        {!compact && (
          <p className="mt-2 text-xs text-muted">
            Enter para enviar · Shift+Enter para nova linha · respostas meramente informativas
          </p>
        )}
      </form>
    </div>
  );
}
