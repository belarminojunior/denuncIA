import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = { title: "Utilizadores" };

export default function UsersLayout({ children }: { children: ReactNode }) {
  return children;
}
