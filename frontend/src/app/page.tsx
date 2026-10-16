import Link from "next/link";
import { ArrowRight, ClipboardList, Lock, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { FaqList } from "@/components/site/FaqList";
import { PublicShell } from "@/components/site/PublicShell";
import { ButtonLink } from "@/components/ui/Button";
import { HOME_FAQ } from "@/lib/faq";

const CHAT_ANCHOR_ID = "assistente";

const JOURNEY = [
  { title: "Submissão", description: "Formulário em 4 etapas, com ou sem identificação" },
  { title: "Classificação preliminar", description: "A IA sugere categoria e prioridade" },
  { title: "Validação por técnico", description: "A decisão é sempre humana" },
  { title: "Encaminhamento", description: "Aceite no sistema do GCCC para tratamento" },
];

const HOW_IT_WORKS = [
  {
    title: "Faça a denúncia",
    description: "Descreva o que aconteceu, onde e quando. Pode anexar documentos e permanecer anónimo.",
  },
  {
    title: "A plataforma sugere a categoria",
    description: "A partir do seu relato, a IA propõe categoria e prioridade — mesmo que não saiba o tipo.",
  },
  {
    title: "Um técnico do GCCC valida",
    description: "A sugestão é revista, corrigida se necessário e confirmada por um técnico responsável.",
  },
  {
    title: "A denúncia é encaminhada",
    description: "É aceite no sistema do GCCC para tratamento e o estado fica visível no seu protocolo.",
  },
];

const ASSISTANT_CAPABILITIES = [
  "Perceber, em conversa, se o que viveu é corrupção",
  "Saber que informação e evidências vale a pena reunir",
  "Esclarecer anonimato, prazos e acompanhamento",
];

const QUICK_QUESTIONS = ["Posso denunciar anonimamente?", "Como anexo evidências?", "Não sei que tipo de corrupção é"];

const SAFEGUARDS = [
  { icon: Lock, title: "Dados mínimos", description: "Só se recolhe o necessário para analisar o caso." },
  { icon: ShieldCheck, title: "Acesso restrito", description: "Apenas técnicos autenticados consultam o conteúdo." },
  { icon: ClipboardList, title: "Registo de operações", description: "Cada alteração ao processo fica registada." },
];

export default function HomePage() {
  return (
    <PublicShell showChatWidget={false}>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div className="animate-fade-in">
            <p className="label-eyebrow mb-4">Canal de denúncias de corrupção</p>
            <h1 className="text-4xl leading-tight text-ink md:text-5xl">
              Denuncie. A sua informação pode fazer a diferença.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              Com a <strong className="font-semibold text-ink">denuncIA</strong> submete uma denúncia em poucos minutos,
              com ou sem identificação. Não precisa de saber a designação legal: descreva o que aconteceu e a plataforma
              propõe uma classificação que um técnico do GCCC confirma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/denunciar" size="lg">
                Fazer uma denúncia <ArrowRight size={16} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/consultar" size="lg" variant="secondary">
                Consultar denúncia
              </ButtonLink>
              <ButtonLink href={`#${CHAT_ANCHOR_ID}`} size="lg" variant="ghost">
                <MessagesSquare size={16} aria-hidden /> Falar com o assistente
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-xl border border-border-strong bg-bg-alt p-6">
            <p className="label-eyebrow mb-5">O percurso da sua denúncia</p>
            <ol className="relative space-y-6 border-l border-border-strong pl-6">
              {JOURNEY.map((step) => (
                <li key={step.title} className="relative">
                  <span className="absolute -left-[1.62rem] top-1 h-2.5 w-2.5 rounded-full bg-green ring-4 ring-bg-alt" />
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-sm text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id={CHAT_ANCHOR_ID} className="scroll-mt-20 border-b border-border bg-bg-alt">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:py-20">
          <div>
            <p className="label-eyebrow mb-3 flex items-center gap-2">
              <Sparkles size={14} aria-hidden /> Antes de denunciar
            </p>
            <h2 className="text-3xl text-ink">Não sabe por onde começar? Converse com o assistente.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
              Não é um menu de perguntas fixas. Conte o que aconteceu com as suas palavras e o assistente ajuda-o a
              organizar o relato antes de submeter.
            </p>
            <ul className="mt-6 space-y-3">
              {ASSISTANT_CAPABILITIES.map((capability) => (
                <li key={capability} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" aria-hidden />
                  {capability}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-amber/30 bg-amber-soft p-3.5 text-xs leading-relaxed text-ink">
              As respostas são meramente informativas. O assistente não investiga pessoas nem decide sobre denúncias —
              isso cabe sempre a um técnico do GCCC.
            </p>
          </div>

          <ChatPanel suggestions={QUICK_QUESTIONS} heightClassName="h-[24rem]" className="shadow-sm" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="label-eyebrow mb-2">Do relato ao encaminhamento</p>
        <h2 className="text-3xl text-ink">Como funciona</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => (
            <li key={item.title} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-soft text-sm font-semibold text-green">
                {index + 1}
              </span>
              <h3 className="mt-4 font-sans text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="grid gap-10 rounded-2xl bg-dark p-8 text-dark-muted md:grid-cols-[1.1fr_1fr] md:p-12">
          <div>
            <p className="label-eyebrow !text-dark-muted">Anonimato</p>
            <h2 className="mt-3 text-3xl text-bg">Pode denunciar sem se identificar.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed">
              Ao escolher a opção anónima não lhe pedimos nome, email nem telefone. A denúncia é tratada exatamente com
              o mesmo critério.
            </p>
          </div>
          <ul className="grid gap-3">
            {SAFEGUARDS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="rounded-lg border border-dark-border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-bg">
                  <Icon size={16} aria-hidden /> {title}
                </p>
                <p className="mt-1 text-sm">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <p className="label-eyebrow mb-2">Antes de submeter</p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-3xl text-ink">Perguntas frequentes</h2>
          <Link href="/faq" className="text-sm font-medium text-green hover:underline">
            Ver todas as perguntas →
          </Link>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <FaqList items={HOME_FAQ} />

          <aside className="h-fit rounded-xl border border-green/30 bg-green-soft p-6">
            <p className="label-eyebrow flex items-center gap-2 !text-green">
              <MessagesSquare size={16} aria-hidden /> Assistente
            </p>
            <h3 className="mt-3 font-sans text-lg font-semibold text-ink">Ainda com dúvidas?</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Pergunte ao assistente — pode escrever livremente, não só estas sugestões.
            </p>
            <div className="mt-4">
              <SuggestedQuestions questions={QUICK_QUESTIONS} chatAnchorId={CHAT_ANCHOR_ID} />
            </div>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
