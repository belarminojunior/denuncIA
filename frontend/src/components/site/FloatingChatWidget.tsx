"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { MessageCircle, Send, X } from "lucide-react";
import { useChatWidget } from "@/components/site/ChatWidgetContext";

const SUGESTOES = ["Posso denunciar anonimamente?", "Como anexo evidências?"];

export function FloatingChatWidget() {
  const { isOpen, toggleChat, closeChat, messages, loading, send } = useChatWidget();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, isOpen]);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="flex h-[30rem] max-h-[75vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-bg-alt shadow-xl">
          <div className="flex items-center justify-between border-b border-border bg-dark px-4 py-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-bg">
              <span className="h-2 w-2 rounded-full bg-green" /> Assistente GCCC
            </p>
            <button onClick={closeChat} aria-label="Fechar assistente" className="text-dark-muted hover:text-bg">
              <X size={16} />
            </button>
          </div>

          <div className="border-b border-border bg-amber-soft px-4 py-2.5 text-xs leading-relaxed text-ink">
            Respostas meramente informativas. Não investiga pessoas nem decide sobre denúncias.
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "self-end bg-green text-bg" : "self-start border border-border bg-card text-ink"
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-muted">
                A escrever…
              </div>
            )}
          </div>

          {messages.length < 2 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2.5">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-green/40 px-2.5 py-1 text-xs text-green hover:bg-green-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
              setInput("");
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva a sua pergunta..."
              className="w-full rounded-md border border-border-strong bg-card px-3 py-2 text-sm text-ink focus:border-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Enviar"
              className="flex shrink-0 items-center justify-center rounded-md bg-green px-3 text-bg hover:bg-green-dark disabled:opacity-60"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={toggleChat}
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green text-bg shadow-lg transition-transform hover:scale-105 hover:bg-green-dark"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
