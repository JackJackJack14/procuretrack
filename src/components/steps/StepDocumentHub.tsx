import { useState } from "react";
import JSZip from "jszip";
import { Download, Eye, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HELPER_BUTTON_SM, HELPER_BUTTON_XS } from "@/lib/helper-button-styles";
import type { DocItem } from "@/lib/procurement";
import {
  downloadStepDocument,
  openStepDocument,
  type StepDocRecord,
} from "@/lib/doc-upload";

type Props = {
  stepNumber: number;
  docList: DocItem[];
  docs: StepDocRecord[];
  projectName?: string;
};

export function StepDocumentHub({ stepNumber, docList, docs, projectName }: Props) {
  const [zipping, setZipping] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const docByType = new Map(docs.map((d) => [d.document_type, d]));
  const extraDocs = docs.filter((d) => !docList.some((i) => i.name === d.document_type));
  const allRows = [
    ...docList.map((item) => ({ label: item.name, doc: docByType.get(item.name) })),
    ...extraDocs.map((d) => ({ label: d.document_type, doc: d })),
  ];

  const uploadedCount = allRows.filter((r) => r.doc).length;

  const handleZip = async () => {
    if (!docs.length) {
      toast.error("ยังไม่มีเอกสารให้ดาวน์โหลด");
      return;
    }
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const doc of docs) {
        const { data, error } = await supabase.storage
          .from("procurement-docs")
          .download(doc.storage_path);
        if (error) {
          console.error("[StepDocumentHub] zip download error", doc.file_name, error);
          continue;
        }
        if (data) zip.file(doc.file_name, data);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName ?? "project"}-step${stepNumber}-docs.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลด ZIP เรียบร้อย");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown";
      toast.error("สร้างไฟล์ ZIP ไม่สำเร็จ: " + msg);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground">
            📁 เอกสารแนบประจำขั้นตอน (สำหรับ สตง. ตรวจสอบ)
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            รวม {uploadedCount}/{allRows.length} รายการ
          </p>
        </div>
        {docs.length > 0 && (
          <button
            type="button"
            disabled={zipping}
            onClick={handleZip}
            className={HELPER_BUTTON_SM}
          >
            {zipping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Package className="h-3.5 w-3.5" />
            )}
            📦 ดาวน์โหลดเอกสารของขั้นตอนนี้ทั้งหมด (.zip)
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">รายการที่ต้องมี</th>
              <th className="px-3 py-2 font-medium">ชื่อไฟล์</th>
              <th className="px-3 py-2 font-medium w-24 text-center">เปิดดู</th>
              <th className="px-3 py-2 font-medium w-28 text-center">ดาวน์โหลด</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map(({ label, doc }) => (
              <tr key={label} className="border-b last:border-b-0">
                <td className="px-3 py-2.5 text-foreground align-middle">{label}</td>
                <td className="px-3 py-2.5 align-middle">
                  {doc ? (
                    <span
                      className="text-xs text-muted-foreground truncate block max-w-[200px]"
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">ยังไม่มีการแนบหลักฐาน</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center align-middle">
                  {doc ? (
                    <button
                      type="button"
                      disabled={openingId === doc.id}
                      onClick={async () => {
                        setOpeningId(doc.id);
                        await openStepDocument(doc.storage_path);
                        setOpeningId(null);
                      }}
                      className={HELPER_BUTTON_XS}
                    >
                      {openingId === doc.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      เปิดดู
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center align-middle">
                  {doc ? (
                    <button
                      type="button"
                      onClick={() => downloadStepDocument(doc)}
                      className={HELPER_BUTTON_XS}
                    >
                      <Download className="h-3 w-3" />
                      ดาวน์โหลด
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
