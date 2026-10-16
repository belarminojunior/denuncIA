import clsx from "clsx";
import { Lightbulb } from "lucide-react";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { Field, Textarea } from "@/components/ui/Field";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_RECOMMENDED_LENGTH,
  descriptionError,
  type StepProps,
} from "@/components/report/reportForm";

const GUIDING_QUESTIONS = [
  "O que aconteceu, e por que ordem?",
  "Quem pediu ou ofereceu o quê (cargo ou função)?",
  "Onde e quando, ainda que aproximadamente?",
  "Há testemunhas, recibos, mensagens ou outros registos?",
];

export function DescriptionStep({ form, update, showErrors }: StepProps & { showErrors: boolean }) {
  const length = form.description.trim().length;
  const error = showErrors || length > 0 ? descriptionError(form.description) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <Field
        label="O que aconteceu?"
        htmlFor="description"
        error={error}
        hint="Escreva com as suas palavras. Não precisa de termos jurídicos."
      >
        <Textarea
          id="description"
          rows={11}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={form.description}
          aria-invalid={Boolean(error)}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Descreva os factos de que tem conhecimento…"
        />
        <div className="mt-1.5 flex justify-end text-xs">
          <span className={clsx(length >= DESCRIPTION_RECOMMENDED_LENGTH ? "text-green" : "text-muted")}>
            {form.description.length} / {DESCRIPTION_MAX_LENGTH}
            {length < DESCRIPTION_RECOMMENDED_LENGTH && ` · recomendado ${DESCRIPTION_RECOMMENDED_LENGTH}+`}
          </span>
        </div>
      </Field>

      <aside className="h-fit rounded-lg border border-green/25 bg-green-soft p-4 text-sm text-ink-soft">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Lightbulb size={16} className="text-green" aria-hidden /> Um bom relato responde a:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          {GUIDING_QUESTIONS.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
        <p className="mt-4 border-t border-green/20 pt-3 text-xs leading-relaxed">
          Indique só o que viu ou pode documentar. Com dúvidas, <OpenChatButton>fale com o assistente</OpenChatButton>.
        </p>
      </aside>
    </div>
  );
}
