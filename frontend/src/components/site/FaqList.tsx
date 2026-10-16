import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/faq";

/** Native <details> accordion: keyboard accessible and works without JavaScript. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-ink transition-colors hover:text-green [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="-mt-1 px-5 pb-5 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
