import type { Categoria, EstadoDenuncia, EstadoResposta, Prioridade, TipoOperacao, UserRole } from "@/lib/types";

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  SUBORNO: "Suborno",
  NEPOTISMO: "Nepotismo",
  PECULATO: "Peculato",
  ABUSO_DE_PODER: "Abuso de poder",
  TRAFICO_DE_INFLUENCIA: "Tráfico de influência",
  CONFLITO_DE_INTERESSES: "Conflito de interesses",
  FRAUDE: "Fraude",
  CORRUPCAO_ELEITORAL: "Corrupção eleitoral",
  OUTROS: "Outros",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const ESTADO_LABEL: Record<EstadoDenuncia, string> = {
  RECEBIDA: "Recebida",
  PENDENTE_VALIDACAO: "Pendente de validação",
  EM_ANALISE: "Em análise",
  VALIDADA: "Validada",
  ENCAMINHADA: "Encaminhada",
  EM_INVESTIGACAO: "Em investigação",
  ARQUIVADA: "Arquivada",
  REJEITADA: "Rejeitada",
};

export const ESTADO_DESCRICAO_PUBLICA: Record<EstadoDenuncia, string> = {
  RECEBIDA: "A denúncia foi recebida pela plataforma.",
  PENDENTE_VALIDACAO: "Classificação preliminar concluída, aguarda revisão de um técnico.",
  EM_ANALISE: "Em revisão por um técnico do GCCC.",
  VALIDADA: "Classificação confirmada por um técnico do GCCC.",
  ENCAMINHADA: "Encaminhada para a entidade competente.",
  EM_INVESTIGACAO: "Em investigação pela entidade competente.",
  ARQUIVADA: "Processo arquivado.",
  REJEITADA: "Denúncia rejeitada após análise.",
};

export const ESTADO_RESPOSTA_LABEL: Record<EstadoResposta, string> = {
  AGUARDA: "Aguarda",
  RESPONDIDO: "Respondido",
  ACUSACAO: "Acusação",
  ARQUIVADO: "Arquivado",
};

export const TIPO_OPERACAO_LABEL: Record<TipoOperacao, string> = {
  CRIACAO: "Criação",
  CLASSIFICACAO_LLM: "Classificação LLM",
  ACESSO: "Acesso",
  ALTERACAO_ESTADO: "Alteração de estado",
  VALIDACAO: "Validação",
  ENCAMINHAMENTO: "Encaminhamento",
  LOGIN: "Login",
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Admin",
  COORDENADOR: "Coordenador",
  TECNICO: "Técnico",
  CONSULTA: "Consulta",
};

export function estadoRespostaDisplay(e: EstadoResposta, forwardedAt?: string | null): string {
  if (e === "AGUARDA" && forwardedAt) {
    const dias = (Date.now() - new Date(forwardedAt).getTime()) / 86400000;
    if (dias > 30) return "SEM_RESPOSTA";
  }
  return e;
}

export function estadoRespostaBadgeClass(e: EstadoResposta, forwardedAt?: string | null): string {
  if (e === "AGUARDA" && forwardedAt) {
    const dias = (Date.now() - new Date(forwardedAt).getTime()) / 86400000;
    if (dias > 30) return "bg-amber-soft text-amber";
  }
  switch (e) {
    case "ACUSACAO":
      return "bg-green-soft text-green";
    case "RESPONDIDO":
      return "bg-gray-badge-soft text-gray-badge";
    case "ARQUIVADO":
      return "bg-bg-alt text-muted border border-border-strong";
    case "AGUARDA":
    default:
      return "bg-teal-soft text-teal";
  }
}

export function respostaResumo(estado: EstadoResposta, forwardedAt: string, dataResposta: string | null): string {
  if (estado === "AGUARDA") {
    const dias = Math.floor((Date.now() - new Date(forwardedAt).getTime()) / 86400000);
    return dias > 30 ? "+30 dias" : "aguarda";
  }
  return dataResposta ? timeAgo(dataResposta) : "—";
}

export function prioridadeBadgeClass(p: Prioridade | null | undefined): string {
  switch (p) {
    case "CRITICA":
      return "bg-red-soft text-red";
    case "ALTA":
      return "bg-amber-soft text-amber";
    case "BAIXA":
      return "bg-gray-badge-soft text-gray-badge";
    case "MEDIA":
    default:
      return "bg-teal-soft text-teal";
  }
}

export function estadoBadgeClass(e: EstadoDenuncia): string {
  switch (e) {
    case "VALIDADA":
    case "ENCAMINHADA":
      return "bg-green-soft text-green";
    case "REJEITADA":
      return "bg-red-soft text-red";
    case "ARQUIVADA":
      return "bg-gray-badge-soft text-gray-badge";
    case "EM_INVESTIGACAO":
      return "bg-amber-soft text-amber";
    default:
      return "bg-bg-alt text-ink-soft border border-border-strong";
  }
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months > 1 ? "meses" : "mês"}`;
}
