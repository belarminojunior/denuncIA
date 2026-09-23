"use client";

import Link from "next/link";
import { ShieldCheck, Lock, ClipboardList, MessagesSquare, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/site/PublicShell";
import { useChatWidget } from "@/components/site/ChatWidgetContext";
import { ChatPanel } from "@/components/denuncia/ChatPanel";

const PERCURSO = [
  { titulo: "Submissão", desc: "Formulário em 4 etapas" },
  { titulo: "Classificação preliminar", desc: "Análise automática do texto" },
  { titulo: "Validação por técnico", desc: "Decisão sempre humana" },
  { titulo: "Encaminhamento", desc: "Aceite no sistema do GCCC para tratamento" },
];

const COMO_FUNCIONA = [
  {
    numero: "01",
    titulo: "Faça a denúncia",
    desc: "Descreve o que aconteceu, onde e quando. Pode anexar documentos e permanecer anónimo.",
  },
  {
    numero: "02",
    titulo: "A plataforma sugere a categoria",
    desc: "A partir do seu relato, o sistema propõe a categoria e a prioridade — mesmo que não tenha indicado o tipo.",
  },
  {
    numero: "03",
    titulo: "Um técnico do GCCC valida",
    desc: "A sugestão é revista, corrigida se necessário e validada por um técnico responsável.",
  },
  {
    numero: "04",
    titulo: "A denúncia é encaminhada",
    desc: "A denúncia é aceite no sistema de gestão do GCCC para tratamento e o estado é atualizado no seu protocolo.",
  },
];

const FAQ = [
  {
    q: "Que informação devo incluir na denúncia?",
    a: "Descreva o facto, o local, a data aproximada e, se souber, as pessoas ou entidades envolvidas.",
  },
  {
    q: "Que documentos posso anexar?",
    a: "Ficheiros PDF, JPG, PNG ou DOCX, até 10 MB por ficheiro.",
  },
  {
    q: "Como acompanho o processo?",
    a: "Com o protocolo recebido na submissão, na página Consultar denúncia.",
  },
  {
    q: "E se eu não souber que tipo de corrupção é?",
    a: "Deixe o campo em Não sei. A categoria é proposta pela plataforma a partir da sua descrição e confirmada por um técnico, por isso o relato basta.",
  },
  {
    q: "A denúncia anónima tem menos valor?",
    a: "Não. É analisada com o mesmo critério, embora a falta de contacto possa limitar pedidos de esclarecimento.",
  },
];

const CAPACIDADES = [
  "Perceber, através de conversa, se o que viveu se enquadra como corrupção",
  "Sugerir que informação e evidências vale a pena reunir",
  "Explicar anonimato, prazos e como acompanhar o processo",
];

const PERGUNTAS_RAPIDAS = ["Posso denunciar anonimamente?", "Como anexo evidências?", "Não sei que tipo de corrupção é"];

export default function HomePage() {
  return (
    <PublicShell showChatWidget={false}>
      <HomeContent />
    </PublicShell>
  );
}

function HomeContent() {
  const { messages, loading, send } = useChatWidget();

  function perguntarEIrParaChat(pergunta: string) {
    send(pergunta);
    document.getElementById("assistente")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="border-b border-border bg-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div>
            <p className="label-eyebrow mb-4">Canal oficial de denúncias</p>
            <h1 className="text-4xl leading-tight text-ink md:text-5xl">
              Denuncie. A sua informação pode fazer a diferença.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              Submeta uma denúncia de corrupção em poucos minutos, com ou sem identificação. Não
              precisa de saber em que categoria o caso se enquadra: descreva o que aconteceu pelas
              suas palavras e a plataforma propõe uma classificação que um técnico do GCCC confirma.
              Cada submissão recebe um protocolo que lhe permite acompanhar o estado do processo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/denunciar"
                className="rounded-md bg-green px-5 py-3 text-sm font-medium text-bg transition-colors hover:bg-green-dark"
              >
                Fazer uma denúncia
              </Link>
              <Link
                href="/consultar"
                className="rounded-md border border-border-strong bg-card px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
              >
                Consultar denúncia
              </Link>
              <a
                href="#assistente"
                className="flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-green hover:underline"
              >
                <MessagesSquare size={16} /> Falar com o assistente
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-border-strong bg-bg-alt p-6">
            <p className="label-eyebrow mb-5">O percurso da sua denúncia</p>
            <ol className="relative space-y-6 border-l border-border-strong pl-6">
              {PERCURSO.map((passo) => (
                <li key={passo.titulo} className="relative">
                  <span className="absolute -left-[1.62rem] top-1 h-2.5 w-2.5 rounded-full bg-green" />
                  <p className="text-sm font-semibold text-ink">{passo.titulo}</p>
                  <p className="text-sm text-muted">{passo.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="assistente" className="border-b border-border bg-bg-alt">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.3fr] lg:py-20">
          <div>
            <p className="label-eyebrow mb-3 flex items-center gap-2">
              <Sparkles size={14} /> Antes de denunciar
            </p>
            <h2 className="text-3xl text-ink">Não sabe por onde começar? Fale com o assistente.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
              Não é um menu de perguntas fixas — é uma conversa a sério. Conte o que aconteceu com
              as suas próprias palavras, à vontade, e o assistente ajuda-o a organizar o relato
              antes de submeter.
            </p>
            <ul className="mt-6 space-y-3">
              {CAPACIDADES.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-amber/30 bg-amber-soft p-3.5 text-xs leading-relaxed text-ink">
              As respostas são meramente informativas. O assistente não investiga pessoas, não
              presta aconselhamento jurídico definitivo e não decide sobre denúncias — isso é
              sempre feito por um técnico do GCCC.
            </p>
          </div>

          <ChatPanel
            messages={messages}
            loading={loading}
            send={send}
            suggestions={PERGUNTAS_RAPIDAS}
            heightClassName="h-[22rem]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="label-eyebrow mb-2">Do relato ao encaminhamento</p>
        <h2 className="text-3xl text-ink">Como funciona?</h2>
        <p className="mt-2 text-ink-soft">Quatro passos, do momento da submissão ao encaminhamento.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {COMO_FUNCIONA.map((item) => (
            <div key={item.numero} className="rounded-xl border border-border bg-card p-6">
              <p className="label-eyebrow">{item.numero}</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-2xl bg-dark p-8 text-dark-muted md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="label-eyebrow !text-dark-muted">Anonimato</p>
              <h2 className="mt-3 text-3xl text-bg">Pode denunciar sem se identificar.</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed">
                Ao escolher a opção anónima, os campos de nome, email e telefone tornam-se opcionais
                e não são exigidos em nenhuma etapa. A denúncia é tratada exatamente com o mesmo
                critério.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg border border-dark-border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-bg">
                  <Lock size={16} /> Dados mínimos
                </p>
                <p className="mt-1 text-sm">Só se recolhe o necessário para analisar o caso.</p>
              </div>
              <div className="rounded-lg border border-dark-border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-bg">
                  <ShieldCheck size={16} /> Acesso restrito
                </p>
                <p className="mt-1 text-sm">Apenas técnicos autenticados consultam o conteúdo.</p>
              </div>
              <div className="rounded-lg border border-dark-border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-bg">
                  <ClipboardList size={16} /> Registo de operações
                </p>
                <p className="mt-1 text-sm">Toda a alteração ao processo fica registada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-6 pb-20">
        <p className="label-eyebrow mb-2">Antes de submeter</p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-3xl text-ink">Perguntas frequentes</h2>
          <Link href="/faq" className="text-sm text-green hover:underline">
            Ver todas as perguntas →
          </Link>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {FAQ.map((item) => (
              <div key={item.q} className="p-5">
                <p className="font-semibold text-ink">{item.q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-green/30 bg-green-soft p-6">
            <p className="label-eyebrow flex items-center gap-2 !text-green">
              <MessagesSquare size={16} /> Assistente
            </p>
            <h3 className="mt-3 text-xl font-semibold text-ink">Ainda com dúvidas?</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Pergunte diretamente ao assistente, no topo da página — pode conversar livremente,
              não só com estas sugestões.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {PERGUNTAS_RAPIDAS.map((p) => (
                <button
                  key={p}
                  onClick={() => perguntarEIrParaChat(p)}
                  className="rounded-md border border-green/30 bg-card px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:border-green hover:text-green"
                >
                  {p}
                </button>
              ))}
            </div>

            <a
              href="#assistente"
              className="mt-4 inline-block rounded-md bg-green px-4 py-2.5 text-sm font-medium text-bg hover:bg-green-dark"
            >
              Ir para o assistente
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
