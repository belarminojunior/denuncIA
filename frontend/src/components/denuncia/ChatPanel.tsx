"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export function ChatPanel({
  messages,
  loading,
  send,
  suggestions = [],
  heightClassName = "min-h-[22rem] max-h-[30rem]",
  className,
}: {
  messages: ChatMessage[];
  loading: boolean;
  send: (text: string) => void;
  suggestions?: string[];
  heightClassName?: string;
  className?: string;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className={clsx("flex flex-col rounded-xl border border-border bg-bg-alt", className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="h-2 w-2 rounded-full bg-green" /> Assistente GCCC
        </p>
        <p className="text-xs text-muted">converse à vontade · modelo local</p>
      </div>

      <div ref={scrollRef} className={clsx("flex flex-col gap-3 overflow-y-auto px-5 py-5", heightClassName)}>
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

      {suggestions.length > 0 && messages.length < 2 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-green/40 px-3 py-1.5 text-xs text-green hover:bg-green-soft"
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
        className="flex gap-3 border-t border-border p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Conte o que aconteceu, com as suas palavras..."
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
  );
}
