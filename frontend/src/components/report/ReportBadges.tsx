import { Archive, Clock, ShieldAlert, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { Priority, ReportStatus } from "@/lib/types";
import { STAGE_LABELS, stageOf, type Stage } from "@/lib/workflow";

const STATUS_TONES: Record<ReportStatus, BadgeTone> = {
  RECEIVED: "neutral",
  PENDING_REVIEW: "amber",
  UNDER_REVIEW: "neutral",
  VALIDATED: "green",
  ROUTED: "green",
  UNDER_INVESTIGATION: "teal",
  ARCHIVED: "gray",
  REJECTED: "red",
};

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  LOW: "gray",
  MEDIUM: "teal",
  HIGH: "amber",
  CRITICAL: "red",
};

export const STAGE_TONES: Record<Stage, BadgeTone> = {
  IN_PROGRESS: "teal",
  UNDER_INVESTIGATION: "amber",
  CLOSED: "gray",
};

export const STAGE_ICONS: Record<Stage, LucideIcon> = {
  IN_PROGRESS: Clock,
  UNDER_INVESTIGATION: ShieldAlert,
  CLOSED: Archive,
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

export function StageBadge({ status }: { status: ReportStatus }) {
  const stage = stageOf(status);
  const Icon = STAGE_ICONS[stage];
  return (
    <Badge tone={STAGE_TONES[stage]}>
      <Icon size={12} aria-hidden />
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
