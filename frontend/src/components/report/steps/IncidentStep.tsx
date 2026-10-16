import { EyeOff, UserRound } from "lucide-react";
import clsx from "clsx";
import { Field, Input, Select } from "@/components/ui/Field";
import { emailError, type ReportFormState, type StepProps } from "@/components/report/reportForm";
import { todayIsoDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CATEGORIES } from "@/lib/types";

const IDENTITY_OPTIONS = [
  {
    anonymous: true,
    icon: EyeOff,
    title: "Anónima",
    description: "Não pedimos nenhum dado pessoal. Acompanha o caso apenas pelo protocolo.",
  },
  {
    anonymous: false,
    icon: UserRound,
    title: "Identificada",
    description: "O GCCC pode contactá-lo para pedir esclarecimentos. Os dados são confidenciais.",
  },
];

export function IncidentStep({ form, update }: StepProps) {
  const reporterEmailError = emailError(form.reporterEmail);

  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Como quer fazer a denúncia?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {IDENTITY_OPTIONS.map((option) => {
            const isSelected = form.isAnonymous === option.anonymous;
            return (
              <label
                key={option.title}
                className={clsx(
                  "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                  isSelected ? "border-green bg-green-soft" : "border-border-strong bg-card hover:border-green/60",
                )}
              >
                <input
                  type="radio"
                  name="identity"
                  checked={isSelected}
                  onChange={() => update("isAnonymous", option.anonymous)}
                  className="sr-only"
                />
                <option.icon size={20} className={clsx("mt-0.5 shrink-0", isSelected ? "text-green" : "text-muted")} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{option.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {!form.isAnonymous && (
        <div className="grid animate-fade-in gap-5 md:grid-cols-3">
          <Field label="Nome" htmlFor="reporter-name" optional>
            <Input
              id="reporter-name"
              autoComplete="name"
              value={form.reporterName}
              onChange={(event) => update("reporterName", event.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="Email" htmlFor="reporter-email" optional error={reporterEmailError}>
            <Input
              id="reporter-email"
              type="email"
              autoComplete="email"
              value={form.reporterEmail}
              aria-invalid={Boolean(reporterEmailError)}
              onChange={(event) => update("reporterEmail", event.target.value)}
              placeholder="nome@exemplo.mz"
            />
          </Field>
          <Field label="Telefone" htmlFor="reporter-phone" optional>
            <Input
              id="reporter-phone"
              type="tel"
              autoComplete="tel"
              value={form.reporterPhone}
              onChange={(event) => update("reporterPhone", event.target.value)}
              placeholder="+258 8X XXX XXXX"
            />
          </Field>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          label="Tipo de situação"
          htmlFor="reported-category"
          optional
          hint="Se não souber, a plataforma propõe uma categoria e um técnico confirma."
        >
          <Select
            id="reported-category"
            value={form.reportedCategory}
            onChange={(event) => update("reportedCategory", event.target.value as ReportFormState["reportedCategory"])}
          >
            <option value="">Não sei</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Onde aconteceu" htmlFor="location" optional>
          <Input
            id="location"
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Instituição, cidade, província"
          />
        </Field>
        <Field label="Quando aconteceu" htmlFor="incident-date" optional hint="Uma data aproximada é suficiente.">
          <Input
            id="incident-date"
            type="date"
            max={todayIsoDate()}
            value={form.incidentDate}
            onChange={(event) => update("incidentDate", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Pessoas ou entidades envolvidas"
          htmlFor="involved-parties"
          optional
          hint="Prefira cargos ou instituições (ex.: «agente de trânsito», «direção distrital»)."
        >
          <Input
            id="involved-parties"
            value={form.involvedParties}
            onChange={(event) => update("involvedParties", event.target.value)}
          />
        </Field>
        <Field label="Valor envolvido" htmlFor="amount-involved" optional>
          <Input
            id="amount-involved"
            value={form.amountInvolved}
            onChange={(event) => update("amountInvolved", event.target.value)}
            placeholder="Ex.: 5 000 MT"
          />
        </Field>
      </div>
    </div>
  );
}
