import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PublicShell } from "@/components/site/PublicShell";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Assistente" };

const SUGGESTIONS = [
  "Um funcionário pediu-me dinheiro para tratar um documento",
  "Posso denunciar anonimamente?",
  "Que provas devo juntar?",
  "O que acontece depois de denunciar?",
];

export default function ChatPage() {
  return (
    <PublicShell showChatWidget={false}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="label-eyebrow">Assistente</p>
          <h1 className="mt-2 text-3xl text-ink">Converse sobre a sua situação</h1>
          <p className="mt-2 text-ink-soft">
            Conte o que aconteceu com as suas palavras. O assistente ajuda a perceber se é corrupção e como denunciar.
          </p>
          <ChatPanel suggestions={SUGGESTIONS} heightClassName="h-[min(32rem,60vh)]" className="mt-6 shadow-sm" />
        </div>

        <aside className="space-y-4 lg:pt-24">
          <div className="rounded-xl border border-amber/30 bg-amber-soft p-5 text-sm text-ink">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldAlert size={16} className="text-amber" aria-hidden /> Proteja-se
            </p>
            <p className="mt-2 leading-relaxed text-ink-soft">
              A conversa não é uma denúncia e não é guardada. Evite escrever nomes completos ou dados pessoais aqui.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-alt p-5">
            <p className="text-sm font-semibold text-ink">Pronto para avançar?</p>
            <p className="mt-1 text-sm text-ink-soft">Submeta a denúncia no formulário seguro.</p>
            <ButtonLink href="/denunciar" fullWidth className="mt-4">
              Fazer uma denúncia
            </ButtonLink>
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}
