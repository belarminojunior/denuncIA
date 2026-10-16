"use client";

import { useRef, useState, type DragEvent } from "react";
import clsx from "clsx";
import { FileText, ShieldCheck, Upload, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { ALLOWED_EXTENSIONS, MAX_FILES, MAX_FILE_SIZE_MB } from "@/components/report/reportForm";
import { formatBytes } from "@/lib/format";

interface EvidenceStepProps {
  files: File[];
  error: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}

const ACCEPTED_FORMATS = ALLOWED_EXTENSIONS.map((extension) => extension.slice(1).toUpperCase())
  .filter((format) => format !== "JPEG")
  .join(", ");

export function EvidenceStep({ files, error, onAdd, onRemove }: EvidenceStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isFull = files.length >= MAX_FILES;

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    onAdd(Array.from(event.dataTransfer.files));
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        As evidências são opcionais, mas ajudam muito a análise. {ACCEPTED_FORMATS} · até {MAX_FILE_SIZE_MB} MB cada ·
        máximo {MAX_FILES} ficheiros.
      </p>

      <button
        type="button"
        disabled={isFull}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging ? "border-green bg-green-soft" : "border-border-strong bg-card hover:border-green",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <Upload className={isDragging ? "text-green" : "text-muted"} size={24} aria-hidden />
        <span className="mt-3 text-sm font-semibold text-ink">
          {isFull ? "Limite de ficheiros atingido" : "Arraste ficheiros para aqui"}
        </span>
        {!isFull && (
          <span className="text-sm text-ink-soft">
            ou <span className="text-green underline">escolha no dispositivo</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []));
          // Reset so the same file can be picked again after removing it.
          event.target.value = "";
        }}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3 text-sm text-ink">
                <FileText size={16} className="shrink-0 text-muted" aria-hidden />
                <span className="truncate">{file.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                {formatBytes(file.size)}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remover ${file.name}`}
                  className="rounded p-1 text-red hover:bg-red-soft"
                >
                  <X size={15} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <ShieldCheck size={15} className="mt-px shrink-0 text-green" aria-hidden />
        Antes de enviar fotografias ou documentos, verifique se não revelam a sua identidade (nomes, assinaturas,
        localização).
      </p>
    </div>
  );
}
