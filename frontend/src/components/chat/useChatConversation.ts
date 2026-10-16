"use client";

import { useRef, useState } from "react";
import { ApiError, apiStream } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export type ChatStatus = "idle" | "waiting" | "streaming";

const HISTORY_LIMIT = 16;
const NO_REPLY_MESSAGE = "Não recebi resposta do assistente. Pode tentar novamente?";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Olá! Sou o assistente da **denuncIA**. Pode conversar comigo à vontade sobre a sua situação — conte-me o que aconteceu, com as suas palavras, e ajudo-o a perceber se é corrupção, que informação vale a pena reunir e como denunciar.\n\nNão investigo nem decido sobre denúncias: isso é sempre feito por um técnico do GCCC.",
};

function replaceLastMessage(messages: ChatMessage[], update: (content: string) => string): ChatMessage[] {
  const last = messages[messages.length - 1];
  return [...messages.slice(0, -1), { ...last, content: update(last.content) }];
}

export function useChatConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const controllerRef = useRef<AbortController | null>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || status !== "idle") return;

    // The greeting is generated client-side, so it is not sent as context.
    const history = messages.slice(1).slice(-HISTORY_LIMIT);
    setMessages((current) => [...current, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStatus("waiting");

    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      await apiStream(
        "/api/chat",
        { message, history },
        (chunk) => {
          setStatus("streaming");
          setMessages((current) => replaceLastMessage(current, (content) => content + chunk));
        },
        controller.signal,
      );
      setMessages((current) => replaceLastMessage(current, (content) => content.trim() || NO_REPLY_MESSAGE));
    } catch (error) {
      if (controller.signal.aborted) return;
      const reason = error instanceof ApiError ? error.message : NO_REPLY_MESSAGE;
      setMessages((current) => replaceLastMessage(current, () => reason));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setStatus("idle");
      }
    }
  }

  function reset() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setMessages([GREETING]);
    setStatus("idle");
  }

  return { messages, status, isBusy: status !== "idle", send, reset };
}
