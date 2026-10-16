export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Antes de denunciar",
    items: [
      {
        question: "Preciso de saber que tipo de corrupção é?",
        answer:
          "Não. Deixe o tipo em «Não sei» e descreva o que aconteceu pelas suas palavras. A plataforma propõe a categoria e um técnico do GCCC confirma-a.",
      },
      {
        question: "Que informação devo incluir?",
        answer:
          "O facto, o local, a data aproximada e, se souber, as pessoas ou entidades envolvidas. Basta indicar o cargo ou a instituição.",
      },
      {
        question: "Preciso de ter provas?",
        answer: "Não é obrigatório. Documentos ajudam a análise, mas a denúncia é aceite apenas com o relato dos factos.",
      },
      {
        question: "Que documentos posso anexar?",
        answer: "Ficheiros PDF, JPG, PNG ou DOCX, até 10 MB cada e no máximo cinco por denúncia.",
      },
    ],
  },
  {
    title: "Anonimato e acompanhamento",
    items: [
      {
        question: "Posso denunciar sem me identificar?",
        answer: "Sim. Ao escolher a opção anónima não lhe é pedido nome, email nem telefone.",
      },
      {
        question: "A denúncia anónima tem menos valor?",
        answer:
          "Não. É analisada com o mesmo critério, embora a falta de contacto possa limitar pedidos de esclarecimento.",
      },
      {
        question: "Como acompanho o processo?",
        answer:
          "Com o protocolo recebido na submissão, na página «Consultar denúncia». Guarde-o: numa denúncia anónima é o único acesso ao processo.",
      },
      {
        question: "Posso corrigir uma denúncia já submetida?",
        answer:
          "Não. Depois da submissão o conteúdo fica selado para efeitos de auditoria. Se tiver informação nova, submeta uma denúncia complementar e refira o protocolo anterior.",
      },
    ],
  },
  {
    title: "Análise e decisão",
    items: [
      {
        question: "Quem decide sobre a minha denúncia?",
        answer:
          "Um técnico do GCCC. A classificação automática é apenas uma sugestão de apoio e não produz qualquer efeito por si só.",
      },
      {
        question: "O que significa «encaminhada»?",
        answer:
          "Que a denúncia foi validada e aceite formalmente no sistema de gestão do GCCC para tratamento. A partir daí pode passar a «Sob investigação» e, no fim, a «Finalizada».",
      },
      {
        question: "Quanto tempo demora?",
        answer:
          "A classificação preliminar é feita automaticamente pouco depois da submissão. A validação por um técnico depende do volume de processos e da prioridade atribuída.",
      },
      {
        question: "Quem pode ver o que escrevi?",
        answer:
          "Apenas técnicos autenticados do GCCC. Todos os acessos e alterações ficam registados no histórico de auditoria do processo.",
      },
    ],
  },
];

/** Short selection shown on the home page. */
export const HOME_FAQ: FaqItem[] = [
  FAQ_SECTIONS[0].items[0],
  FAQ_SECTIONS[0].items[3],
  FAQ_SECTIONS[1].items[0],
  FAQ_SECTIONS[1].items[2],
  FAQ_SECTIONS[2].items[0],
];
