"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Send } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const SUGESTOES = ["Não sei que tipo de corrupção é", "Posso denunciar anonimamente?", "Como anexo evidências?"];

const MENSAGEM_INICIAL: ChatMessage = {
  role: "assistant",
  content:
    "Olá. Posso explicar como funciona a plataforma, que informação reunir antes de denunciar e como acompanhar o processo. Não investigo casos nem presto aconselhamento jurídico.",
};

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([MENSAGEM_INICIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = [...messages, { role: "user", content: trimmed } as ChatMessage];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await apiPost<{ reply: string }>("/api/chatbot", {
        message: trimmed,
        history: messages.slice(-8),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível contactar o assistente.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl text-ink">Assistente de denúncias</h1>
      <p className="mt-2 text-ink-soft">Esclareça dúvidas sobre o processo antes de submeter.</p>

      <div className="mt-6 rounded-lg border border-amber/30 bg-amber-soft p-4 text-sm text-ink">
        As respostas são meramente informativas. O assistente não investiga pessoas, não presta
        aconselhamento jurídico e não decide sobre denúncias.
      </div>

      <div className="mt-6 flex flex-col rounded-xl border border-border bg-bg-alt">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-green" /> Assistente GCCC
          </p>
          <p className="text-xs text-muted">modelo local · sem dados externos</p>
        </div>

        <div ref={scrollRef} className="flex max-h-[26rem] min-h-[20rem] flex-col gap-3 overflow-y-auto px-5 py-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={clsx(
                "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                m.role === "user" ? "self-end bg-green text-bg" : "self-start bg-card border border-border text-ink"
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="self-start rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted">
              A escrever…
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-green/40 px-3 py-1.5 text-xs text-green hover:bg-green-soft"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-3 border-t border-border p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva a sua pergunta..."
            className="w-full rounded-md border border-border-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-green focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 whitespace-nowrap rounded-md bg-green px-5 py-2.5 text-sm font-medium text-bg hover:bg-green-dark disabled:opacity-60"
          >
            <Send size={15} /> Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
