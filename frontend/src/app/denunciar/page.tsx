import { PublicShell } from "@/components/site/PublicShell";
import { DenunciaWizard } from "@/components/denuncia/DenunciaWizard";

export const metadata = {
  title: "Fazer denúncia — GCCC",
};

export default function DenunciarPage() {
  return (
    <PublicShell>
      <DenunciaWizard />
    </PublicShell>
  );
}
