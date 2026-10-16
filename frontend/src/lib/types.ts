export const CATEGORIES = [
  "BRIBERY",
  "NEPOTISM",
  "EMBEZZLEMENT",
  "ABUSE_OF_POWER",
  "INFLUENCE_PEDDLING",
  "CONFLICT_OF_INTEREST",
  "FRAUD",
  "ELECTORAL_CORRUPTION",
  "OTHER",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REPORT_STATUSES = [
  "RECEIVED",
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "VALIDATED",
  "ROUTED",
  "UNDER_INVESTIGATION",
  "ARCHIVED",
  "REJECTED",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const AUDIT_ACTIONS = [
  "CREATED",
  "AI_CLASSIFICATION",
  "ACCESS",
  "STATUS_CHANGE",
  "VALIDATION",
  "ROUTING",
  "LOGIN",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const USER_ROLES = ["ADMIN", "COORDINATOR", "TECHNICIAN", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface Page<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export interface AuditLog {
  id: number;
  action: AuditAction;
  description: string;
  previous_status: ReportStatus | null;
  new_status: ReportStatus | null;
  note: string | null;
  created_at: string;
  user_name: string | null;
}

export interface AuditLogEntry extends AuditLog {
  report_id: string | null;
  protocol: string | null;
}

export interface ReportSubmitted {
  protocol: string;
  status: ReportStatus;
  created_at: string;
}

export interface PublicStatusEvent {
  status: ReportStatus;
  occurred_at: string;
}

export interface PublicReportStatus {
  protocol: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  history: PublicStatusEvent[];
}

export interface ReportSummary {
  id: string;
  protocol: string;
  created_at: string;
  updated_at: string;
  status: ReportStatus;
  location: string | null;
  ai_category: Category | null;
  ai_confidence: number | null;
  ai_priority: Priority | null;
  validated_category: Category | null;
  validated_priority: Priority | null;
}

export interface ReportDetail extends ReportSummary {
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  is_anonymous: boolean;
  reported_category: Category | null;
  incident_date: string | null;
  description: string;
  involved_parties: string | null;
  amount_involved: string | null;
  ai_summary: string | null;
  ai_justification: string | null;
  ai_indicators: string[] | null;
  ai_model: string | null;
  ai_error: string | null;
  reviewer_notes: string | null;
  assignee_name: string | null;
  validated_at: string | null;
  routed_at: string | null;
  attachments: Attachment[];
  audit_logs: AuditLog[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserSummary extends User {
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DashboardStats {
  total: number;
  pending_review: number;
  under_review: number;
  validated: number;
  routed: number;
  under_investigation: number;
  archived: number;
  rejected: number;
}

export interface CategoryCount {
  category: Category;
  total: number;
}

export interface StatusCount {
  status: ReportStatus;
  total: number;
}

export interface PriorityCount {
  priority: Priority;
  total: number;
}

export interface MonthlyCount {
  month: string;
  total: number;
}
