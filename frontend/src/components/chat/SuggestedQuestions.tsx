"use client";

import { ArrowUpRight } from "lucide-react";
import { useChat } from "@/components/chat/ChatProvider";

interface SuggestedQuestionsProps {
  questions: string[];
  /** Id of the embedded chat to scroll to after asking. */
  chatAnchorId: string;
}

/** Buttons that ask the embedded assistant a question and bring it into view. */
export function SuggestedQuestions({ questions, chatAnchorId }: SuggestedQuestionsProps) {
  const { send, isBusy } = useChat();

  function ask(question: string) {
    send(question);
    document.getElementById(chatAnchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-2">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={isBusy}
          onClick={() => ask(question)}
          className="flex items-center justify-between gap-2 rounded-md border border-green/30 bg-card px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:border-green hover:text-green disabled:opacity-50"
        >
          {question}
          <ArrowUpRight size={15} className="shrink-0" aria-hidden />
        </button>
      ))}
    </div>
  );
}
