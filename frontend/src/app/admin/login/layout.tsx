import type { Metadata } from "next";
import type { ReactNode } from "react";

// The login page is a client component, so its metadata lives here.
export const metadata: Metadata = { title: "Iniciar sessão" };

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
