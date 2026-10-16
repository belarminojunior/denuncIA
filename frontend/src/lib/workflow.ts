// Client-side mirror of the backend state machine (app/services/report_service.py).
// The backend remains the authority; this only decides which actions to offer.
import type { ReportStatus } from "@/lib/types";

/** Simplified status shown to citizens: in progress, under investigation or closed. */
export type Stage = "IN_PROGRESS" | "UNDER_INVESTIGATION" | "CLOSED";

export const STAGE_LABELS: Record<Stage, string> = {
  IN_PROGRESS: "Em tratamento",
  UNDER_INVESTIGATION: "Sob investigação",
  CLOSED: "Finalizada",
};

const CLOSED_STATUSES: ReadonlySet<ReportStatus> = new Set(["ARCHIVED", "REJECTED"]);

export function isClosed(status: ReportStatus): boolean {
  return CLOSED_STATUSES.has(status);
}

export function stageOf(status: ReportStatus): Stage {
  if (status === "UNDER_INVESTIGATION") return "UNDER_INVESTIGATION";
  return isClosed(status) ? "CLOSED" : "IN_PROGRESS";
}

/** Main path shown in the public timeline (closing statuses are appended when reached). */
export const MAIN_PATH: ReportStatus[] = ["RECEIVED", "PENDING_REVIEW", "UNDER_REVIEW", "VALIDATED", "ROUTED"];

export type ReviewAction = "validate" | "route" | "investigate" | "archive" | "reject";

/** The single "next step" offered as the primary button for each status. */
export function primaryActionFor(status: ReportStatus): ReviewAction | null {
  switch (status) {
    case "RECEIVED":
    case "PENDING_REVIEW":
    case "UNDER_REVIEW":
      return "validate";
    case "VALIDATED":
      return "route";
    case "ROUTED":
      return "investigate";
    case "UNDER_INVESTIGATION":
      return "archive";
    default:
      return null;
  }
}

export function canEditClassification(status: ReportStatus): boolean {
  return primaryActionFor(status) === "validate";
}
