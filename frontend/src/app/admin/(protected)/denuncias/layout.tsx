import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = { title: "Denúncias" };

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return children;
}
