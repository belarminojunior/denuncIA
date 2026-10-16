import { Suspense } from "react";
import type { Metadata } from "next";
import { StatusLookup } from "@/components/report/StatusLookup";
import { PublicShell } from "@/components/site/PublicShell";

export const metadata: Metadata = { title: "Consultar denúncia" };

export default function StatusPage() {
  return (
    <PublicShell>
      {/* useSearchParams needs a Suspense boundary for static rendering. */}
      <Suspense fallback={null}>
        <StatusLookup />
      </Suspense>
    </PublicShell>
  );
}
