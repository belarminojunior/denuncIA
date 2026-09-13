import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { DenunciaWizard } from "@/components/denuncia/DenunciaWizard";

export const metadata = {
  title: "Fazer denúncia — GCCC",
};

export default function DenunciarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <DenunciaWizard />
      </main>
      <SiteFooter />
    </div>
  );
}
