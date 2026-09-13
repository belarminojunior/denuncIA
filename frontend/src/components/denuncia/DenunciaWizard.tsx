"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { apiPostForm, ApiError } from "@/lib/api";
import { CATEGORIAS } from "@/lib/types";
import type { DenunciaSubmetidaOut } from "@/lib/types";
import { CATEGORIA_LABEL } from "@/lib/format";

const STEPS = [
  { id: 1, label: "Ocorrência" },
  { id: 2, label: "Descrição" },
  { id: 3, label: "Evidências" },
  { id: 4, label: "Revisão" },
];

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];
const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

interface FormState {
  anonima: boolean;
  nome_denunciante: string;
  email_denunciante: string;
  telefone_denunciante: string;
  tipo_denuncia: string;
  local_ocorrencia: string;
  data_ocorrencia: string;
  descricao: string;
  envolvidos: string;
  valor_envolvido: string;
}

const INITIAL_STATE: FormState = {
  anonima: true,
  nome_denunciante: "",
  email_denunciante: "",
  telefone_denunciante: "",
  tipo_denuncia: "",
  local_ocorrencia: "",
  data_ocorrencia: "",
  descricao: "",
  envolvidos: "",
  valor_envolvido: "",
};

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

export function DenunciaWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DenunciaSubmetidaOut | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addFiles(newFiles: FileList | File[]) {
    setFileError(null);
    const incoming = Array.from(newFiles);
    const combined = [...files];

    for (const file of incoming) {
      if (combined.length >= MAX_FILES) {
        setFileError(`Máximo de ${MAX_FILES} ficheiros por denúncia.`);
        break;
      }
      if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
        setFileError(`Extensão não permitida: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setFileError(`'${file.name}' excede ${MAX_SIZE_MB} MB.`);
        continue;
      }
      combined.push(file);
    }
    setFiles(combined);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const descricaoValida = form.descricao.trim().length >= 20;
  const canContinueStep2 = descricaoValida;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append("anonima", String(form.anonima));
      if (!form.anonima) {
        if (form.nome_denunciante) fd.append("nome_denunciante", form.nome_denunciante);
        if (form.email_denunciante) fd.append("email_denunciante", form.email_denunciante);
        if (form.telefone_denunciante) fd.append("telefone_denunciante", form.telefone_denunciante);
      }
      if (form.tipo_denuncia) fd.append("tipo_denuncia", form.tipo_denuncia);
      if (form.local_ocorrencia) fd.append("local_ocorrencia", form.local_ocorrencia);
      if (form.data_ocorrencia) fd.append("data_ocorrencia", form.data_ocorrencia);
      fd.append("descricao", form.descricao.trim());
      if (form.envolvidos) fd.append("envolvidos", form.envolvidos);
      if (form.valor_envolvido) fd.append("valor_envolvido", form.valor_envolvido);
      for (const file of files) fd.append("files", file);

      const res = await apiPostForm<DenunciaSubmetidaOut>("/api/denuncias", fd);
      setResultado(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Não foi possível submeter a denúncia. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (resultado) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green text-bg">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="mt-6 text-2xl text-ink">Denúncia submetida com sucesso.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Guarde o protocolo abaixo. É a única forma de acompanhar o estado do processo, sobretudo
            em denúncias anónimas.
          </p>

          <div className="mt-8 rounded-lg bg-green-soft p-6">
            <p className="label-eyebrow !text-green">Protocolo</p>
            <p className="protocol-code mt-2 text-3xl font-bold text-green">{resultado.protocolo}</p>
            <p className="mt-2 text-xs text-ink-soft">
              Submetido a {new Date(resultado.created_at).toLocaleString("pt-PT")} · Estado inicial:{" "}
              {resultado.estado}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(resultado.protocolo).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="rounded-md bg-green px-5 py-2.5 text-sm font-medium text-bg hover:bg-green-dark"
            >
              {copied ? "Protocolo copiado!" : "Copiar protocolo"}
            </button>
            <Link
              href={`/consultar?protocolo=${resultado.protocolo}`}
              className="rounded-md border border-border-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-green hover:text-green"
            >
              Consultar estado
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          A classificação inicial é preliminar e será revista por um técnico do GCCC antes de qualquer
          encaminhamento.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl text-ink">Fazer uma denúncia</h1>
      <p className="mt-2 text-sm text-ink-soft">Etapa 0{step} de 4. Os dados são guardados apenas quando submeter.</p>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {STEPS.map((s) => (
          <div key={s.id}>
            <div className={clsx("h-1.5 rounded-full", s.id <= step ? "bg-green" : "bg-border-strong")} />
            <p className={clsx("mt-2 text-xs", s.id <= step ? "text-ink" : "text-muted")}>
              0{s.id} · {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-bg-alt p-8">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-ink">Informações da ocorrência</h2>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-green/40 bg-green-soft p-4">
              <input
                type="checkbox"
                checked={form.anonima}
                onChange={(e) => update("anonima", e.target.checked)}
                className="mt-1 h-4 w-4 accent-green"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  Desejo realizar esta denúncia anonimamente
                </span>
                <span className="block text-sm text-ink-soft">
                  Com esta opção, nome, email e telefone tornam-se opcionais.
                </span>
              </span>
            </label>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <Field label="Nome" optional>
                <input
                  value={form.nome_denunciante}
                  onChange={(e) => update("nome_denunciante", e.target.value)}
                  placeholder="Nome completo"
                  className="input"
                />
              </Field>
              <Field label="Email" optional>
                <input
                  value={form.email_denunciante}
                  onChange={(e) => update("email_denunciante", e.target.value)}
                  placeholder="nome@exemplo.mz"
                  type="email"
                  className="input"
                />
              </Field>
              <Field label="Telefone" optional>
                <input
                  value={form.telefone_denunciante}
                  onChange={(e) => update("telefone_denunciante", e.target.value)}
                  placeholder="+258 ..."
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <Field label="Tipo de denúncia" optional>
                <select
                  value={form.tipo_denuncia}
                  onChange={(e) => update("tipo_denuncia", e.target.value)}
                  className="input"
                >
                  <option value="">Não sei — a plataforma sugere</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Local onde ocorreu">
                <input
                  value={form.local_ocorrencia}
                  onChange={(e) => update("local_ocorrencia", e.target.value)}
                  placeholder="Instituição, cidade, província"
                  className="input"
                />
              </Field>
              <Field label="Data aproximada">
                <input
                  value={form.data_ocorrencia}
                  onChange={(e) => update("data_ocorrencia", e.target.value)}
                  type="date"
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Pessoas/entidades envolvidas" optional>
                <input
                  value={form.envolvidos}
                  onChange={(e) => update("envolvidos", e.target.value)}
                  placeholder="Se souber, cargo ou instituição (evite acusar por nome)"
                  className="input"
                />
              </Field>
              <Field label="Valor envolvido" optional>
                <input
                  value={form.valor_envolvido}
                  onChange={(e) => update("valor_envolvido", e.target.value)}
                  placeholder="Ex.: 5 000 MT"
                  className="input"
                />
              </Field>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted">
              Não precisa de saber a designação legal. Se escolher <em>Não sei</em>, a plataforma propõe
              a categoria a partir da sua descrição e um técnico do GCCC confirma-a.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-ink">Descrição</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Descreva os factos pela sua ordem, com o máximo de detalhe possível. Escreva pelas suas
              palavras: não é necessário usar termos jurídicos nem saber em que categoria o caso se
              enquadra. Evite juízos de valor e indique apenas o que observou ou pode documentar.
            </p>

            <div className="mt-5 rounded-lg border border-green/30 bg-green-soft p-4 text-sm text-ink-soft">
              É deste texto que a plataforma parte para propor uma categoria e um nível de prioridade.
              Quanto mais concreto for o relato — o que foi pedido, por quem, em que circunstância —
              mais precisa será a sugestão apresentada ao técnico.
            </div>

            <textarea
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
              placeholder="Descreva o que aconteceu..."
              rows={10}
              maxLength={5000}
              className="input mt-5 resize-y"
            />
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Mínimo recomendado: 200 caracteres</span>
              <span>
                {form.descricao.length} / 5000
              </span>
            </div>
            {!descricaoValida && form.descricao.length > 0 && (
              <p className="mt-2 text-xs text-red">A descrição deve ter pelo menos 20 caracteres.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-ink">Evidências</h2>
            <p className="mt-2 text-sm text-ink-soft">
              PDF, JPG, PNG ou DOCX. Até {MAX_SIZE_MB} MB por ficheiro, máximo {MAX_FILES} ficheiros.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-card px-6 py-10 text-center hover:border-green"
            >
              <Upload className="text-muted" size={22} />
              <p className="mt-3 text-sm font-semibold text-ink">Arraste ficheiros para aqui</p>
              <p className="text-sm text-ink-soft">
                ou <span className="text-green underline">selecione do dispositivo</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>
            {fileError && <p className="mt-2 text-xs text-red">{fileError}</p>}

            {files.length > 0 && (
              <ul className="mt-5 divide-y divide-border rounded-lg border border-border bg-card">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between px-4 py-3">
                    <span className="flex items-center gap-3 text-sm text-ink">
                      <FileText size={16} className="text-muted" />
                      {file.name}
                    </span>
                    <span className="flex items-center gap-4 text-xs text-muted">
                      {(file.size / 1024).toFixed(0)} KB
                      <button
                        onClick={() => removeFile(index)}
                        className="flex items-center gap-1 text-red hover:underline"
                      >
                        <X size={14} /> remover
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-ink">Revisão e submissão</h2>
            <p className="mt-2 text-sm text-ink-soft">Confirme os dados antes de submeter. Depois da submissão não é possível editar a denúncia.</p>

            <dl className="mt-5 divide-y divide-border rounded-lg border border-border bg-card text-sm">
              <Row label="Identificação" value={form.anonima ? "Denúncia anónima" : form.nome_denunciante || "Identificada"} />
              <Row label="Tipo" value={form.tipo_denuncia ? CATEGORIA_LABEL[form.tipo_denuncia as keyof typeof CATEGORIA_LABEL] : "Não sei — a plataforma sugere"} />
              <Row label="Local" value={form.local_ocorrencia || "Não indicado"} />
              <Row label="Data do facto" value={form.data_ocorrencia || "Não indicada"} />
              <Row label="Descrição" value={form.descricao} multiline />
              <Row label="Evidências" value={`${files.length} ficheiro${files.length === 1 ? "" : "s"}`} />
            </dl>

            <div className="mt-5 rounded-lg border border-amber/30 bg-amber-soft p-4 text-sm text-ink">
              <span className="font-semibold">Aviso legal.</span> A prestação de informações falsas ou
              de acusações sem fundamento pode ter consequências legais. Submeta apenas factos de que
              tenha conhecimento.
            </div>

            {submitError && (
              <div className="mt-4 rounded-lg border border-red/30 bg-red-soft p-4 text-sm text-red">
                {submitError}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-border pt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-md border border-border-strong px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
          >
            Anterior
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={step === 2 && !canContinueStep2}
              className="rounded-md bg-green px-5 py-2.5 text-sm font-medium text-bg hover:bg-green-dark disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green px-5 py-2.5 text-sm font-medium text-bg hover:bg-green-dark disabled:opacity-60"
            >
              {submitting ? "A submeter…" : "Submeter denúncia"}
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border-strong);
          background: var(--color-card);
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          color: var(--color-ink);
        }
        .input:focus {
          outline: none;
          border-color: var(--color-green);
          box-shadow: 0 0 0 3px var(--color-green-soft);
        }
      `}</style>
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label} {optional && <span className="font-normal text-muted">(opcional)</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 px-5 py-3.5">
      <dt className="text-muted">{label}</dt>
      <dd className={clsx("text-ink", multiline && "whitespace-pre-wrap leading-relaxed")}>{value}</dd>
    </div>
  );
}
