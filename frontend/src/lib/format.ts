const LOCALE = "pt-PT";
const DAY_MS = 86_400_000;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// The API returns naive UTC timestamps; marking them as UTC makes the browser
// convert them to the user's local time instead of treating them as local.
// Date-only values (e.g. the incident date) are calendar days, so no conversion.
function parseApiDate(value: string): Date {
  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  return new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
}

export function formatDate(value: string): string {
  return parseApiDate(value).toLocaleDateString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string): string {
  return parseApiDate(value).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-09" -> "set. 2026" */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  // Formatting month and year together yields "09/2026" in pt-PT, so they are joined by hand.
  return `${new Date(year, month - 1, 1).toLocaleDateString(LOCALE, { month: "short" })} ${year}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export function timeAgo(value: string): string {
  const minutes = Math.floor((Date.now() - parseApiDate(value).getTime()) / 60_000);
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

export function todayIsoDate(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function daysSince(value: string): number {
  return Math.floor((Date.now() - parseApiDate(value).getTime()) / DAY_MS);
}
