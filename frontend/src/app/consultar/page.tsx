import { Suspense } from "react";
import { PublicShell } from "@/components/site/PublicShell";
import { ConsultarForm } from "@/components/denuncia/ConsultarForm";

export const metadata = {
  title: "Consultar denúncia — GCCC",
};

export default function ConsultarPage() {
  return (
    <PublicShell>
      <Suspense fallback={null}>
        <ConsultarForm />
      </Suspense>
    </PublicShell>
  );
}
