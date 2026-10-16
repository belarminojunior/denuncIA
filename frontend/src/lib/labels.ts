// All user-facing Portuguese text for domain values lives here, keyed by the
// English codes used across the API and the codebase.
import type { AuditAction, Category, Priority, ReportStatus, UserRole } from "@/lib/types";

export const APP_NAME = "denuncIA";
export const INSTITUTION_NAME = "Gabinete Central de Combate à Corrupção";

export const CATEGORY_LABELS: Record<Category, string> = {
  BRIBERY: "Suborno",
  NEPOTISM: "Nepotismo",
  EMBEZZLEMENT: "Peculato",
  ABUSE_OF_POWER: "Abuso de poder",
  INFLUENCE_PEDDLING: "Tráfico de influência",
  CONFLICT_OF_INTEREST: "Conflito de interesses",
  FRAUD: "Fraude",
  ELECTORAL_CORRUPTION: "Corrupção eleitoral",
  OTHER: "Outros",
};

export const CATEGORY_DESCRIPTIONS: Record<Exclude<Category, "OTHER">, string> = {
  BRIBERY: "Pedir ou aceitar dinheiro ou um favor para fazer — ou deixar de fazer — algo que é dever do cargo.",
  NEPOTISM: "Dar emprego, contrato ou vantagem a familiares e próximos, à frente de quem tinha direito.",
  EMBEZZLEMENT: "Usar ou desviar dinheiro, bens ou material do Estado para fins próprios.",
  ABUSE_OF_POWER: "Usar a autoridade do cargo para prejudicar, pressionar ou beneficiar alguém indevidamente.",
  INFLUENCE_PEDDLING: "Vender ou prometer influência sobre uma decisão pública em troca de algo.",
  CONFLICT_OF_INTEREST: "Decidir sobre um assunto em que se tem interesse pessoal ou de família.",
  FRAUD: "Falsificar documentos, faturas, concursos ou registos para obter ganho indevido.",
  ELECTORAL_CORRUPTION: "Comprar votos, pressionar eleitores ou manipular resultados.",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  RECEIVED: "Recebida",
  PENDING_REVIEW: "Pendente de validação",
  UNDER_REVIEW: "Em análise",
  VALIDATED: "Validada",
  ROUTED: "Encaminhada",
  UNDER_INVESTIGATION: "Em investigação",
  ARCHIVED: "Arquivada",
  REJECTED: "Rejeitada",
};

export const STATUS_PUBLIC_DESCRIPTIONS: Record<ReportStatus, string> = {
  RECEIVED: "A denúncia foi recebida e está a ser classificada.",
  PENDING_REVIEW: "Classificação preliminar concluída; aguarda revisão de um técnico.",
  UNDER_REVIEW: "Em revisão por um técnico do GCCC.",
  VALIDATED: "Classificação confirmada por um técnico do GCCC.",
  ROUTED: "Encaminhada para tratamento no GCCC.",
  UNDER_INVESTIGATION: "Em investigação.",
  ARCHIVED: "Processo concluído e arquivado.",
  REJECTED: "A denúncia não reuniu condições para prosseguir.",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATED: "Criação",
  AI_CLASSIFICATION: "Classificação IA",
  ACCESS: "Acesso",
  STATUS_CHANGE: "Mudança de estado",
  VALIDATION: "Validação",
  ROUTING: "Encaminhamento",
  LOGIN: "Sessão",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  COORDINATOR: "Coordenador",
  TECHNICIAN: "Técnico",
  VIEWER: "Consulta",
};
