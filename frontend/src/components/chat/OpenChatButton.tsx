"use client";

import type { ReactNode } from "react";
import { useChat } from "@/components/chat/ChatProvider";

/** Inline text button that opens the floating assistant (e.g. inside a paragraph). */
export function OpenChatButton({ children }: { children: ReactNode }) {
  const { openWidget } = useChat();
  return (
    <button type="button" onClick={openWidget} className="font-medium text-green underline underline-offset-2 hover:text-green-dark">
      {children}
    </button>
  );
}
