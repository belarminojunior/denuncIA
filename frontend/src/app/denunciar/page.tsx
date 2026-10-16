import type { Metadata } from "next";
import { ReportWizard } from "@/components/report/ReportWizard";
import { PublicShell } from "@/components/site/PublicShell";

export const metadata: Metadata = { title: "Fazer denúncia" };

export default function ReportPage() {
  return (
    <PublicShell>
      <ReportWizard />
    </PublicShell>
  );
}
