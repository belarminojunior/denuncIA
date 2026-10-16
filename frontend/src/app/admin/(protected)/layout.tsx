"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { clearSession, getStoredUser, getToken } from "@/lib/auth";
import type { User } from "@/lib/types";

const LOGIN_PATH = "/admin/login";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // The session lives in localStorage, so it can only be checked in the browser.
  // The API still rejects requests with an invalid or expired token.
  useEffect(() => {
    function checkSession() {
      if (!getToken()) {
        router.replace(LOGIN_PATH);
        return;
      }
      setUser(getStoredUser());
      setIsReady(true);
    }
    checkSession();
  }, [router]);

  function logout() {
    clearSession();
    router.replace(LOGIN_PATH);
  }

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-bg lg:flex">
      <AdminSidebar user={user} onLogout={logout} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
