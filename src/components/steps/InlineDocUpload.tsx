import { useRef, useState } from "react";
import { toast } from "sonner";
import { Eye, Loader2, Paperclip, Trash2 } from "lucide-react";
import { resolveDocFilePolicy, validateDocFile } from "@/lib/doc-file-types";
import {
  deleteStepDocument,
  openStepDocument,
  uploadStepDocument,
  type ProjectDocRef,
  type StepDocRecord,
} from "@/lib/doc-upload";

type Props = {
  project: ProjectDocRef;
  stepNumber: number;
  documentType: string;
  label: string;
  existing: StepDocRecord[];
  onChange: () => void;
};

/** ปุ่มอัปโหลดแบบกะทัดรัดใต้ฟิลด์ — แสดงชื่อไฟล์ + เปิดดู + ลบในแถวเดียว */
export function InlineDocUpload({
  project,
  stepNumber,
  documentType,
  label,
  existing,
  onChange,
}: Props) {
  const policy = resolveDocFilePolicy(documentType);
  const file = existing.find((d) => d.document_type === documentType);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const tryUpload = async (f: File) => {
    const check = validateDocFile(f, documentType);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    setUploading(true);
    try {
      const ok = await uploadStepDocument(project, stepNumber, documentType, f);
      if (ok) onChange();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!file || !confirm(`ลบไฟล์ "${file.file_name}" ?`)) return;
    setBusy(true);
    try {
      const ok = await deleteStepDocument(project, file);
      if (ok) onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) void tryUpload(f);
  };

  return (
    <div className="mt-1.5">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={policy.accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void tryUpload(f);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs">
          <span className="text-muted-foreground truncate max-w-[200px]" title={file.file_name}>
            {file.file_name}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => openStepDocument(file.storage_path)}
            className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            เปิดดูไฟล์
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="inline-flex items-center text-destructive hover:bg-destructive/10 rounded p-0.5 disabled:opacity-50"
            title="ลบไฟล์"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`inline-flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs transition disabled:opacity-50 ${
              dragOver
                ? "border-primary bg-primary/5 text-foreground"
                : "border-muted-foreground/40 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Paperclip className="h-3.5 w-3.5" />
            )}
            {label}
          </button>
          <p className="mt-1 text-[11px] text-muted-foreground">{policy.helperText}</p>
        </div>
      )}
    </div>
  );
}
