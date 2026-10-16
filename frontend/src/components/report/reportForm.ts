import type { Category } from "@/lib/types";

// Mirrors the backend limits so the citizen gets feedback before uploading.
export const DESCRIPTION_MIN_LENGTH = 20;
export const DESCRIPTION_RECOMMENDED_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const MAX_FILES = 5;
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];

export interface ReportFormState {
  isAnonymous: boolean;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  reportedCategory: Category | "";
  location: string;
  incidentDate: string;
  description: string;
  involvedParties: string;
  amountInvolved: string;
}

export const INITIAL_FORM: ReportFormState = {
  isAnonymous: true,
  reporterName: "",
  reporterEmail: "",
  reporterPhone: "",
  reportedCategory: "",
  location: "",
  incidentDate: "",
  description: "",
  involvedParties: "",
  amountInvolved: "",
};

export interface StepProps {
  form: ReportFormState;
  update: <K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) => void;
}

export function isFormDirty(form: ReportFormState, files: File[]): boolean {
  return files.length > 0 || (Object.keys(INITIAL_FORM) as (keyof ReportFormState)[]).some((key) => form[key] !== INITIAL_FORM[key]);
}

export function descriptionError(description: string): string | null {
  const length = description.trim().length;
  if (length === 0) return "Descreva o que aconteceu.";
  if (length < DESCRIPTION_MIN_LENGTH) return `A descrição deve ter pelo menos ${DESCRIPTION_MIN_LENGTH} caracteres.`;
  return null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(email: string): string | null {
  return email.trim() && !EMAIL_PATTERN.test(email.trim()) ? "Indique um email válido." : null;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

/** Adds the acceptable files and returns the reason the others were refused, if any. */
export function mergeFiles(current: File[], incoming: File[]): { files: File[]; error: string | null } {
  const files = [...current];
  let error: string | null = null;
  for (const file of incoming) {
    if (files.length >= MAX_FILES) {
      error = `Pode anexar no máximo ${MAX_FILES} ficheiros.`;
      break;
    }
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
      error = `"${file.name}" não é um formato aceite.`;
    } else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      error = `"${file.name}" excede ${MAX_FILE_SIZE_MB} MB.`;
    } else if (files.some((existing) => existing.name === file.name && existing.size === file.size)) {
      error = `"${file.name}" já foi adicionado.`;
    } else {
      files.push(file);
    }
  }
  return { files, error };
}

/** Builds the multipart body expected by POST /api/reports. */
export function toFormData(form: ReportFormState, files: File[]): FormData {
  const data = new FormData();
  const append = (key: string, value: string) => {
    if (value.trim()) data.append(key, value.trim());
  };

  data.append("is_anonymous", String(form.isAnonymous));
  // Identity fields are dropped for anonymous reports even if typed before toggling.
  if (!form.isAnonymous) {
    append("reporter_name", form.reporterName);
    append("reporter_email", form.reporterEmail);
    append("reporter_phone", form.reporterPhone);
  }
  append("reported_category", form.reportedCategory);
  append("location", form.location);
  append("incident_date", form.incidentDate);
  append("description", form.description);
  append("involved_parties", form.involvedParties);
  append("amount_involved", form.amountInvolved);
  for (const file of files) data.append("files", file);
  return data;
}
