import { clearSession, getToken } from "@/lib/auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FALLBACK_ERROR = "Ocorreu um erro inesperado. Tente novamente.";
const NETWORK_ERROR = "Não foi possível contactar o servidor. Verifique a ligação e tente novamente.";
export const SESSION_EXPIRED_PATH = "/admin/login?sessao=expirada";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type QueryValue = string | number | null | undefined;

/** Builds "path?a=1&b=2", skipping empty values so optional filters can be passed as-is. */
export function withQuery(path: string, params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// FastAPI returns either a string or a list of validation errors in `detail`.
function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
    return detail[0].msg.replace(/^Value error, /, "");
  }
  return FALLBACK_ERROR;
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...init.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, NETWORK_ERROR);
  }

  // An expired token makes every admin request fail, so send the user to log in again.
  if (response.status === 401 && getToken()) {
    clearSession();
    // This module runs outside React, so there is no router; a full load also resets admin state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(SESSION_EXPIRED_PATH);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorMessage(body.detail));
  }
  return response;
}

export async function apiGet<T>(path: string): Promise<T> {
  return (await send(path)).json();
}

export async function apiSend<T>(method: "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  const response = await send(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.json();
}

export async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  return (await send(path, { method: "POST", body: form })).json();
}

/** Posts JSON and calls `onChunk` with each piece of streamed text as it arrives. */
export async function apiStream(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await send(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

/** Downloads an authenticated file (a plain link cannot send the Authorization header). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const blob = await (await send(path)).blob();
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
