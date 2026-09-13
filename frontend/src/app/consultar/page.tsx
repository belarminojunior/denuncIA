import { Suspense } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ConsultarForm } from "@/components/denuncia/ConsultarForm";

export const metadata = {
  title: "Consultar denúncia — GCCC",
};

export default function ConsultarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={null}>
          <ConsultarForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
