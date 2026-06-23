import { createContext, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, Loader2, Paperclip, Trash2 } from "lucide-react";
import {
  type DocFilePolicyId,
  resolveDocFilePolicy,
  resolveDocFilePolicyById,
  validateDocFile,
} from "@/lib/doc-file-types";
import {
  deleteStepDocument,
  downloadStepDocument,
  openStepDocument,
  uploadStepDocument,
  type ProjectDocRef,
  type StepDocRecord,
} from "@/lib/doc-upload";
import { docUploadElementId } from "@/lib/compliance-scroll";
import {
  resolveStepDocumentForDisplay,
  type InheritedDocSource,
} from "@/lib/step-doc-display";

/** รายการประเภทเอกสารที่ต้องเน้นแดงหลัง validation ไม่ผ่าน */
export const MissingDocHighlightContext = createContext<readonly string[]>([]);

type Props = {
  project: ProjectDocRef;
  stepNumber: number;
  documentType: string;
  label: string;
  existing: StepDocRecord[];
  onChange: () => void | Promise<void>;
  /** แถว Smart Checklist — กะทัดรัด */
  compact?: boolean;
  /** บังคับนโยบายไฟล์ (เช่น screenshot_evidence) */
  filePolicyId?: DocFilePolicyId;
  /** เอกสารจากขั้นตอนก่อนหน้า — แสดงแบบ inherited (ไม่อัปโหลดซ้ำ) */
  inheritedDocs?: InheritedDocSource[];
  /** ประเภทเอกสารที่เทียบได้ข้ามขั้นตอน */
  alternateDocumentTypes?: string[];
  /** ปิดการลบไฟล์ (เช่น เอกสารสืบทอน) */
  readOnly?: boolean;
  /** อนุญาตลบไฟล์ที่สืบทอนจากขั้นตอนที่ก่อนหน้า เพื่ออัปโหลดฉบับใหม่ */
  allowInheritedDelete?: boolean;
  /** เรียกหลังอัปโหลดสำเร็จ (ก่อน/หลัง onChange ตามที่ parent กำหนด) */
  onUploadSuccess?: (info: {
    documentType: string;
    fileName: string;
    storagePath: string;
  }) => void;
  /** บังคับเน้นแดง (override context) */
  hasError?: boolean;
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
  inheritedDocs,
  alternateDocumentTypes,
  readOnly = false,
  allowInheritedDelete = false,
  onUploadSuccess,
  hasError: hasErrorProp,
}: Props) {
  const highlightedMissingDocs = useContext(MissingDocHighlightContext);
  const policy = filePolicyId
    ? resolveDocFilePolicyById(filePolicyId)
    : resolveDocFilePolicy(documentType);
  const resolved = resolveStepDocumentForDisplay(
    documentType,
    existing,
    inheritedDocs,
    alternateDocumentTypes,
  );
  const file = resolved?.file;
  const isInherited = resolved?.mode === "inherited";
  const inheritedFromStep = resolved?.fromStep;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadElementId = docUploadElementId(documentType);
  const showDocError =
    !file &&
    (hasErrorProp ?? highlightedMissingDocs.includes(documentType));

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
      const saved = await uploadStepDocument(project, stepNumber, documentType, f);
      if (saved) {
        onUploadSuccess?.({
          documentType,
          fileName: saved.file_name,
          storagePath: saved.storage_path,
        });
        await Promise.resolve(onChange());
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !file ||
      readOnly ||
      (!allowInheritedDelete && isInherited) ||
      !confirm(`ลบไฟล์ "${file.file_name}" ?`)
    ) {
      return;
    }
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
    if (isInherited || readOnly) return;
    const f = e.dataTransfer.files[0];
    if (f) void tryUpload(f);
  };

  const wrapperCls = compact ? "" : "mt-1.5";
  const inheritedBarCls = compact
    ? "px-2 py-1.5 space-y-1"
    : "px-3 py-2.5 space-y-1.5";
  const currentBarCls = compact ? "px-2 py-1" : "px-2.5 py-1.5";

  const outerWrapperProps = {
    id: uploadElementId,
    "data-doc-type": documentType,
    "data-compliance-target": uploadElementId,
    className: wrapperCls,
  } as const;

  if (file && isInherited) {
    return (
      <div {...outerWrapperProps}>
        <div
          className={`rounded-md border-2 border-success/50 bg-success/10 text-xs ${inheritedBarCls}`}
        >
          <p className="text-success font-semibold">
            ✅ มีเอกสารในระบบแล้ว (ดึงข้อมูลอัตโนมัติจากขั้นตอนที่ {inheritedFromStep ?? 2})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-foreground font-medium truncate max-w-[180px] sm:max-w-[240px]"
              title={file.file_name}
            >
              {file.file_name}
            </span>
            <button
              type="button"
              onClick={() => openStepDocument(file.storage_path)}
              className="inline-flex items-center gap-0.5 rounded-md border border-success/40 bg-background px-2 py-0.5 text-success font-medium hover:bg-success/5"
            >
              <Eye className="h-3 w-3" />
              ดูเอกสาร
            </button>
            <button
              type="button"
              onClick={() => void downloadStepDocument(file)}
              className="inline-flex items-center gap-0.5 rounded-md border border-border bg-background px-2 py-0.5 text-foreground hover:bg-muted/50"
            >
              <Download className="h-3 w-3" />
              {!compact && "ดาวน์โหลด"}
            </button>
            {allowInheritedDelete && !readOnly && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete()}
                className="inline-flex items-center text-destructive hover:bg-destructive/10 rounded p-0.5 disabled:opacity-50"
                title="ลบไฟล์เพื่ออัปโหลดฉบับใหม่"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div {...outerWrapperProps}>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={policy.accept}
        disabled={readOnly}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void tryUpload(f);
          e.target.value = "";
        }}
      />
      {file ? (
        <div
          className={`flex flex-wrap items-center gap-1.5 rounded-md border border-success/30 bg-success/5 text-xs ${currentBarCls}`}
        >
          <span className="text-success font-medium shrink-0">✓</span>
          <span className="text-success font-medium shrink-0">มีเอกสารในระบบแล้ว</span>
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
            {!compact && "ดูเอกสาร"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void downloadStepDocument(file)}
            className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="ดาวน์โหลด"
          >
            <Download className="h-3 w-3" />
          </button>
          {!readOnly && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="inline-flex items-center text-destructive hover:bg-destructive/10 rounded p-0.5 disabled:opacity-50"
              title="ลบไฟล์"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={uploading || readOnly}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!readOnly) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`inline-flex items-center gap-1 rounded-md border text-xs transition disabled:opacity-50 ${
              compact ? "px-2 py-1" : "px-2.5 py-1.5 gap-1.5"
            } ${
              showDocError
                ? "border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                : dragOver
                  ? "border-primary bg-primary/5 text-foreground border-dashed"
                  : "border-dashed border-muted-foreground/40 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {uploading ? (
              <Loader2 className={`h-3 w-3 animate-spin ${showDocError ? "text-red-600" : ""}`} />
            ) : (
              <Paperclip className={`h-3 w-3 ${showDocError ? "text-red-600" : ""}`} />
            )}
            <span className={compact ? "max-w-[180px] truncate" : ""}>{label}</span>
          </button>
          {showDocError ? (
            <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
              ⚠️ จำเป็นต้องแนบเอกสารชิ้นนี้ก่อนไปขั้นตอนถัดไป
            </p>
          ) : (
            !compact && (
              <p className="mt-1 text-[11px] text-muted-foreground">{policy.helperText}</p>
            )
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
