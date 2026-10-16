import type { Metadata } from "next";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { FaqList } from "@/components/site/FaqList";
import { PublicShell } from "@/components/site/PublicShell";
import { ButtonLink } from "@/components/ui/Button";
import { FAQ_SECTIONS } from "@/lib/faq";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Perguntas frequentes" };

const CATEGORY_ENTRIES = Object.entries(CATEGORY_DESCRIPTIONS) as [keyof typeof CATEGORY_DESCRIPTIONS, string][];

export default function FaqPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="label-eyebrow">Ajuda</p>
        <h1 className="mt-2 text-3xl text-ink">Perguntas frequentes</h1>
        <p className="mt-2 text-ink-soft">
          Não encontra a sua dúvida? <OpenChatButton>Pergunte ao assistente</OpenChatButton>.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            {FAQ_SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="label-eyebrow">{section.title}</h2>
                <div className="mt-3">
                  <FaqList items={section.items} />
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-green/30 bg-green-soft p-6">
              <p className="label-eyebrow !text-green">Em linguagem simples</p>
              <h2 className="mt-2 font-sans text-lg font-semibold text-ink">O que é cada categoria</h2>
              <p className="mt-1.5 text-sm text-ink-soft">Só para referência — não tem de escolher nenhuma para submeter.</p>
              <dl className="mt-5 space-y-4">
                {CATEGORY_ENTRIES.map(([category, description]) => (
                  <div key={category}>
                    <dt className="text-sm font-semibold text-ink">{CATEGORY_LABELS[category]}</dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{description}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-xl border border-border bg-bg-alt p-6">
              <h2 className="font-sans text-lg font-semibold text-ink">Pronto para submeter?</h2>
              <p className="mt-1.5 text-sm text-ink-soft">O formulário tem quatro etapas e leva poucos minutos.</p>
              <ButtonLink href="/denunciar" fullWidth className="mt-4">
                Fazer uma denúncia
              </ButtonLink>
            </section>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
