export type Categoria =
  | "SUBORNO"
  | "NEPOTISMO"
  | "PECULATO"
  | "ABUSO_DE_PODER"
  | "TRAFICO_DE_INFLUENCIA"
  | "CONFLITO_DE_INTERESSES"
  | "FRAUDE"
  | "CORRUPCAO_ELEITORAL"
  | "OUTROS";

export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type EstadoDenuncia =
  | "RECEBIDA"
  | "PENDENTE_VALIDACAO"
  | "EM_ANALISE"
  | "VALIDADA"
  | "ENCAMINHADA"
  | "EM_INVESTIGACAO"
  | "ARQUIVADA"
  | "REJEITADA";

export const CATEGORIAS: Categoria[] = [
  "SUBORNO",
  "NEPOTISMO",
  "PECULATO",
  "ABUSO_DE_PODER",
  "TRAFICO_DE_INFLUENCIA",
  "CONFLITO_DE_INTERESSES",
  "FRAUDE",
  "CORRUPCAO_ELEITORAL",
  "OUTROS",
];

export const PRIORIDADES: Prioridade[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

export const ESTADOS: EstadoDenuncia[] = [
  "RECEBIDA",
  "PENDENTE_VALIDACAO",
  "EM_ANALISE",
  "VALIDADA",
  "ENCAMINHADA",
  "EM_INVESTIGACAO",
  "ARQUIVADA",
  "REJEITADA",
];

export type EstadoResposta = "AGUARDA" | "RESPONDIDO" | "ACUSACAO" | "ARQUIVADO";

export const ESTADOS_RESPOSTA: EstadoResposta[] = ["AGUARDA", "RESPONDIDO", "ACUSACAO", "ARQUIVADO"];

export const ENTIDADES_DESTINATARIAS = [
  "Procuradoria-Geral da República",
  "Inspeção-Geral de Finanças",
  "Tribunal Administrativo",
  "Autoridade Tributária",
  "Comissão Nacional de Eleições",
];

export type TipoOperacao =
  | "CRIACAO"
  | "CLASSIFICACAO_LLM"
  | "ACESSO"
  | "ALTERACAO_ESTADO"
  | "VALIDACAO"
  | "ENCAMINHAMENTO"
  | "LOGIN";

export const TIPOS_OPERACAO: TipoOperacao[] = [
  "CRIACAO",
  "CLASSIFICACAO_LLM",
  "ACESSO",
  "ALTERACAO_ESTADO",
  "VALIDACAO",
  "ENCAMINHAMENTO",
  "LOGIN",
];

export type UserRole = "ADMIN" | "COORDENADOR" | "TECNICO" | "CONSULTA";

export const USER_ROLES: UserRole[] = ["ADMIN", "COORDENADOR", "TECNICO", "CONSULTA"];

export interface AttachmentOut {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface AuditLogOut {
  id: number;
  tipo: TipoOperacao;
  acao: string;
  estado_anterior: string | null;
  estado_novo: string | null;
  observacao: string | null;
  created_at: string;
  user_nome?: string | null;
}

export interface AuditoriaItemOut extends AuditLogOut {
  denuncia_id: string | null;
  protocolo: string | null;
}

export interface AuditoriaListOut {
  total: number;
  page: number;
  page_size: number;
  items: AuditoriaItemOut[];
}

export interface ProtocoloStatusOut {
  protocolo: string;
  estado: EstadoDenuncia;
  created_at: string;
  updated_at: string;
  historico: AuditLogOut[];
}

export interface DenunciaSubmetidaOut {
  protocolo: string;
  estado: EstadoDenuncia;
  created_at: string;
}

export interface DenunciaListItemOut {
  id: string;
  protocolo: string;
  created_at: string;
  updated_at: string;
  categoria_llm: Categoria | null;
  categoria_validada: Categoria | null;
  confianca_llm: number | null;
  prioridade_llm: Prioridade | null;
  prioridade_validada: Prioridade | null;
  estado: EstadoDenuncia;
  local_ocorrencia: string | null;
  entidade_destinataria?: string | null;
  estado_resposta?: EstadoResposta | null;
}

export interface DenunciaListOut {
  total: number;
  page: number;
  page_size: number;
  items: DenunciaListItemOut[];
}

export interface DenunciaDetailOut {
  id: string;
  protocolo: string;
  nome_denunciante: string | null;
  email_denunciante: string | null;
  telefone_denunciante: string | null;
  anonima: boolean;
  tipo_denuncia: string | null;
  local_ocorrencia: string | null;
  data_ocorrencia: string | null;
  descricao: string;
  envolvidos: string | null;
  valor_envolvido: string | null;

  categoria_llm: Categoria | null;
  confianca_llm: number | null;
  prioridade_llm: Prioridade | null;
  resumo_llm: string | null;
  justificacao_llm: string | null;
  indicadores_llm: string[] | null;
  llm_modelo: string | null;
  llm_erro: string | null;

  categoria_validada: Categoria | null;
  prioridade_validada: Prioridade | null;
  observacoes_tecnico: string | null;

  estado: EstadoDenuncia;
  tecnico_responsavel_nome: string | null;

  entidade_destinataria: string | null;
  numero_oficio: string | null;
  estado_resposta: EstadoResposta | null;
  data_resposta: string | null;

  created_at: string;
  updated_at: string;
  validated_at: string | null;
  forwarded_at: string | null;

  attachments: AttachmentOut[];
  audit_logs: AuditLogOut[];
}

export interface EncaminhamentoItemOut {
  id: string;
  protocolo: string;
  entidade_destinataria: string;
  numero_oficio: string | null;
  forwarded_at: string;
  estado: EstadoDenuncia;
  estado_resposta: EstadoResposta;
  data_resposta: string | null;
}

export interface EncaminhamentoListOut {
  total: number;
  page: number;
  page_size: number;
  items: EncaminhamentoItemOut[];
}

export interface EncaminhamentoStatsOut {
  total_encaminhados: number;
  sem_resposta_30_dias: number;
  com_acusacao: number;
  prazo_medio_resposta_dias: number | null;
}

export interface EncaminhamentoPorEntidadeOut {
  entidade: string;
  total: number;
}

export interface UserOut {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserListItemOut {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
