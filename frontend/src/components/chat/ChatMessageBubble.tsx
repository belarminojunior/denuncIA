import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";
import type { ChatMessage } from "@/lib/types";

// react-markdown never renders raw HTML, so model output cannot inject markup.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  ),
};

export function ChatMessageBubble({ message, compact }: { message: ChatMessage; compact?: boolean }) {
  const isUser = message.role === "user";
  return (
    <div
      className={clsx(
        "max-w-[88%] animate-fade-in rounded-2xl text-sm leading-relaxed",
        compact ? "px-3.5 py-2.5" : "px-4 py-3",
        isUser
          ? "self-end rounded-br-md bg-green text-bg"
          : "self-start rounded-bl-md border border-border bg-card text-ink",
      )}
    >
      {isUser ? (
        <p className="whitespace-pre-wrap">{message.content}</p>
      ) : (
        <div className="chat-markdown">
          <ReactMarkdown components={MARKDOWN_COMPONENTS}>{message.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3.5 text-muted">
      <span className="sr-only">O assistente está a escrever…</span>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}
