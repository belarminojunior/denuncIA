export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function extractMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first && typeof first === "object" && "msg" in first) {
      return String((first as { msg: unknown }).msg);
    }
  }
  return fallback;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown;
    try {
      const body = await res.json();
      detail = body.detail;
    } catch {
      detail = undefined;
    }
    throw new ApiError(res.status, extractMessage(detail, `Erro ${res.status}`), detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("gccc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleResponse<T>(res);
}

export function attachmentDownloadUrl(denunciaId: string, attachmentId: string): string {
  return `${API_BASE_URL}/api/admin/denuncias/${denunciaId}/anexos/${attachmentId}`;
}

export async function downloadAttachment(denunciaId: string, attachmentId: string, filename: string): Promise<void> {
  const res = await fetch(attachmentDownloadUrl(denunciaId, attachmentId), { headers: { ...authHeaders() } });
  if (!res.ok) throw new ApiError(res.status, "Não foi possível transferir o ficheiro.");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
