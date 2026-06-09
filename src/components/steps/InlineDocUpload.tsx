import { useRef, useState } from "react";
import { toast } from "sonner";
import { Eye, Loader2, Paperclip, Trash2 } from "lucide-react";
import {
  type DocFilePolicyId,
  resolveDocFilePolicy,
  resolveDocFilePolicyById,
  validateDocFile,
} from "@/lib/doc-file-types";
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
  /** แถว Smart Checklist — กะทัดรัด */
  compact?: boolean;
  /** บังคับนโยบายไฟล์ (เช่น screenshot_evidence) */
  filePolicyId?: DocFilePolicyId;
};

/** ปุ่มอัปโหลดแบบ inline — แสดงชื่อไฟล์ + เปิดดู + ลบในแถวเดียว */
export function InlineDocUpload({
  project,
  stepNumber,
  documentType,
  label,
  existing,
  onChange,
  compact = false,
  filePolicyId,
}: Props) {
  const policy = filePolicyId
    ? resolveDocFilePolicyById(filePolicyId)
    : resolveDocFilePolicy(documentType);
  const file = existing.find((d) => d.document_type === documentType);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const tryUpload = async (f: File) => {
    const check = filePolicyId
      ? validateDocFileWithPolicy(f, policy)
      : validateDocFile(f, documentType);
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

  const wrapperCls = compact ? "" : "mt-1.5";

  return (
    <div className={wrapperCls}>
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
        <div
          className={`flex flex-wrap items-center gap-1.5 rounded-md border border-success/30 bg-success/5 text-xs ${
            compact ? "px-2 py-1" : "px-2.5 py-1.5"
          }`}
        >
          <span className="text-success font-medium shrink-0">✓</span>
          <span className="text-foreground truncate max-w-[140px] sm:max-w-[200px]" title={file.file_name}>
            {file.file_name}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => openStepDocument(file.storage_path)}
            className="inline-flex items-center gap-0.5 text-primary hover:underline disabled:opacity-50"
          >
            <Eye className="h-3 w-3" />
            {!compact && "เปิดดู"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="inline-flex items-center text-destructive hover:bg-destructive/10 rounded p-0.5 disabled:opacity-50"
            title="ลบไฟล์"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
            className={`inline-flex items-center gap-1 rounded-md border border-dashed text-xs transition disabled:opacity-50 ${
              compact ? "px-2 py-1" : "px-2.5 py-1.5 gap-1.5"
            } ${
              dragOver
                ? "border-primary bg-primary/5 text-foreground"
                : "border-muted-foreground/40 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Paperclip className="h-3 w-3" />
            )}
            <span className={compact ? "max-w-[180px] truncate" : ""}>{label}</span>
          </button>
          {!compact && (
            <p className="mt-1 text-[11px] text-muted-foreground">{policy.helperText}</p>
          )}
        </div>
      )}
    </div>
  );
}

function validateDocFileWithPolicy(
  file: File,
  policy: ReturnType<typeof resolveDocFilePolicyById>,
): { ok: true } | { ok: false; message: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (policy.extensions.includes(ext)) return { ok: true };
  return { ok: false, message: policy.rejectMessage };
}
