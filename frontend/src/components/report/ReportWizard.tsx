"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/report/StepIndicator";
import { SubmissionSuccess } from "@/components/report/SubmissionSuccess";
import {
  INITIAL_FORM,
  descriptionError,
  emailError,
  isFormDirty,
  mergeFiles,
  toFormData,
  type ReportFormState,
} from "@/components/report/reportForm";
import { DescriptionStep } from "@/components/report/steps/DescriptionStep";
import { EvidenceStep } from "@/components/report/steps/EvidenceStep";
import { IncidentStep } from "@/components/report/steps/IncidentStep";
import { ReviewStep } from "@/components/report/steps/ReviewStep";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError, apiPostForm } from "@/lib/api";
import type { ReportSubmitted } from "@/lib/types";

const STEPS = [
  { label: "Ocorrência", title: "Informações da ocorrência" },
  { label: "Descrição", title: "Descreva o que aconteceu" },
  { label: "Evidências", title: "Evidências" },
  { label: "Revisão", title: "Revisão e submissão" },
];
const LAST_STEP = STEPS.length - 1;

export function ReportWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ReportFormState>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportSubmitted | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useUnsavedChangesWarning(!result && isFormDirty(form, files));

  function update<K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function stepIsValid(index: number): boolean {
    if (index === 0) return form.isAnonymous || !emailError(form.reporterEmail);
    if (index === 1) return !descriptionError(form.description);
    return true;
  }

  function goTo(index: number) {
    setStep(index);
    setShowErrors(false);
    // Move focus to the new step title so keyboard and screen-reader users follow along.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function goNext() {
    if (!stepIsValid(step)) {
      setShowErrors(true);
      return;
    }
    goTo(step + 1);
  }

  function addFiles(incoming: File[]) {
    const merged = mergeFiles(files, incoming);
    setFiles(merged.files);
    setFileError(merged.error);
  }

  async function submit() {
    if (!acknowledged) {
      setShowErrors(true);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      setResult(await apiPostForm<ReportSubmitted>("/api/reports", toFormData(form, files)));
      window.scrollTo({ top: 0 });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Não foi possível submeter a denúncia. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset() {
    setForm(INITIAL_FORM);
    setFiles([]);
    setFileError(null);
    setAcknowledged(false);
    setResult(null);
    setStep(0);
  }

  if (result) return <SubmissionSuccess result={result} onNewReport={reset} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="label-eyebrow">Nova denúncia</p>
      <h1 className="mt-2 text-3xl text-ink">Fazer uma denúncia</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
        <Lock size={14} className="text-green" aria-hidden />
        Nada é enviado até carregar em «Submeter denúncia».
      </p>

      <div className="mt-7">
        <StepIndicator steps={STEPS.map((item) => item.label)} current={step} onSelect={goTo} />
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step === LAST_STEP) submit();
          else goNext();
        }}
        className="mt-6 rounded-xl border border-border bg-bg-alt p-5 sm:p-8"
      >
        <h2 ref={headingRef} tabIndex={-1} className="mb-6 text-xl text-ink focus:outline-none">
          {STEPS[step].title}
        </h2>

        <div key={step} className="animate-fade-in">
          {step === 0 && <IncidentStep form={form} update={update} />}
          {step === 1 && <DescriptionStep form={form} update={update} showErrors={showErrors} />}
          {step === 2 && (
            <EvidenceStep
              files={files}
              error={fileError}
              onAdd={addFiles}
              onRemove={(index) => setFiles((current) => current.filter((_, position) => position !== index))}
            />
          )}
          {step === LAST_STEP && (
            <ReviewStep
              form={form}
              files={files}
              acknowledged={acknowledged}
              onAcknowledgedChange={setAcknowledged}
              onEdit={goTo}
              showErrors={showErrors}
              submitError={submitError}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={isSubmitting}>
              <ArrowLeft size={16} aria-hidden /> Anterior
            </Button>
          ) : (
            <span />
          )}
          {step < LAST_STEP ? (
            <Button type="submit">
              Continuar <ArrowRight size={16} aria-hidden />
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "A submeter…" : "Submeter denúncia"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
