import type { User } from "@/lib/types";

// Prototype-level session storage; a production system would prefer httpOnly cookies.
const TOKEN_KEY = "denuncia_token";
const USER_KEY = "denuncia_user";

const isBrowser = () => typeof window !== "undefined";

export function saveSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
}

export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as User | null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
