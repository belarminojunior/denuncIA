import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata = {
  title: "Perguntas frequentes — GCCC",
};

const SECCOES = [
  {
    titulo: "Antes de denunciar",
    perguntas: [
      {
        q: "Preciso de saber que tipo de corrupção é?",
        a: "Não. Deixe o campo do tipo em Não sei e descreva o que aconteceu pelas suas palavras. A plataforma propõe a categoria e um técnico do GCCC confirma-a.",
      },
      {
        q: "Que informação devo incluir?",
        a: "O facto, o local, a data aproximada e, se souber, as pessoas ou entidades envolvidas. Basta indicar o cargo ou a instituição.",
      },
      {
        q: "Preciso de ter provas?",
        a: "Não é obrigatório. Documentos ajudam a análise, mas a denúncia é aceite apenas com o relato dos factos.",
      },
      {
        q: "Que documentos posso anexar?",
        a: "Ficheiros PDF, JPG, PNG ou DOCX, até 10 MB cada e no máximo cinco por denúncia.",
      },
    ],
  },
  {
    titulo: "Anonimato e acompanhamento",
    perguntas: [
      {
        q: "Posso denunciar sem me identificar?",
        a: "Sim. Nome, email e telefone tornam-se opcionais quando escolhe a opção anónima.",
      },
      {
        q: "A denúncia anónima tem menos valor?",
        a: "Não. É analisada com o mesmo critério, embora a falta de contacto possa limitar pedidos de esclarecimento.",
      },
      {
        q: "Como acompanho o processo?",
        a: "Com o protocolo recebido na submissão, na página Consultar denúncia. Guarde-o: sem contacto, é o único acesso ao estado do processo.",
      },
      {
        q: "Posso corrigir uma denúncia já submetida?",
        a: "Não. Depois da submissão o conteúdo fica selado para efeitos de auditoria. Se houver informação nova, submeta uma denúncia complementar e refira o protocolo anterior.",
      },
    ],
  },
  {
    titulo: "Análise e decisão",
    perguntas: [
      {
        q: "Quem decide sobre a minha denúncia?",
        a: "Um técnico do GCCC. A classificação automática é apenas uma sugestão de apoio e não produz qualquer efeito por si só.",
      },
      {
        q: "Quanto tempo demora?",
        a: "A classificação preliminar é imediata. A validação por um técnico depende do volume de processos e da prioridade atribuída.",
      },
      {
        q: "Quem pode ver o que escrevi?",
        a: "Apenas técnicos autenticados do GCCC. Todos os acessos e alterações ficam registados no histórico de auditoria do processo.",
      },
    ],
  },
];

const CATEGORIAS_SIMPLES = [
  {
    nome: "Suborno",
    def: "Pedir ou aceitar dinheiro ou um favor para fazer — ou deixar de fazer — algo que é dever do cargo.",
  },
  {
    nome: "Nepotismo",
    def: "Dar emprego, contrato ou vantagem a familiares e próximos, à frente de quem tinha direito.",
  },
  {
    nome: "Peculato",
    def: "Usar ou desviar dinheiro, bens ou material do Estado para fins próprios.",
  },
  {
    nome: "Abuso de poder",
    def: "Usar a autoridade do cargo para prejudicar, pressionar ou beneficiar alguém indevidamente.",
  },
  {
    nome: "Tráfico de influência",
    def: "Vender ou prometer influência sobre uma decisão pública em troca de algo.",
  },
  {
    nome: "Conflito de interesses",
    def: "Decidir sobre um assunto em que se tem interesse pessoal ou de família.",
  },
  {
    nome: "Fraude",
    def: "Falsificar documentos, faturas, concursos ou registos para obter ganho indevido.",
  },
  {
    nome: "Corrupção eleitoral",
    def: "Comprar votos, pressionar eleitores ou manipular resultados.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-3xl text-ink">Perguntas frequentes</h1>
          <p className="mt-2 text-ink-soft">
            Se a sua dúvida não estiver aqui, o{" "}
            <Link href="/chat" className="text-green underline">
              assistente
            </Link>{" "}
            responde a perguntas sobre o processo.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              {SECCOES.map((seccao) => (
                <div key={seccao.titulo}>
                  <p className="label-eyebrow">{seccao.titulo}</p>
                  <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                    {seccao.perguntas.map((item) => (
                      <div key={item.q} className="p-5">
                        <p className="font-semibold text-ink">{item.q}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-green/30 bg-green-soft p-6">
                <p className="label-eyebrow !text-green">Em linguagem simples</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">O que é cada categoria</h2>
                <p className="mt-1.5 text-sm text-ink-soft">Só para referência. Não tem de escolher nenhuma para submeter.</p>

                <dl className="mt-5 space-y-4">
                  {CATEGORIAS_SIMPLES.map((c) => (
                    <div key={c.nome}>
                      <dt className="text-sm font-semibold text-ink">{c.nome}</dt>
                      <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{c.def}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-border bg-bg-alt p-6">
                <h2 className="text-lg font-semibold text-ink">Pronto para submeter?</h2>
                <p className="mt-1.5 text-sm text-ink-soft">O formulário tem quatro etapas e leva poucos minutos.</p>
                <Link
                  href="/denunciar"
                  className="mt-4 block rounded-md bg-green px-4 py-2.5 text-center text-sm font-medium text-bg hover:bg-green-dark"
                >
                  Fazer uma denúncia
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
