import type { StepDocRecord } from "@/lib/doc-upload";

export type InheritedDocSource = {
  fromStep: number;
  docs: StepDocRecord[];
};

export type ResolvedStepDocument = {
  file: StepDocRecord;
  mode: "current" | "inherited";
  fromStep?: number;
};

/** ค้นหาเอกสารสำหรับแสดงผล — ขั้นตอนปัจจุบันก่อน แล้วจึงขั้นตอนก่อนหน้า */
export function resolveStepDocumentForDisplay(
  documentType: string,
  currentDocs: StepDocRecord[],
  inheritedSources?: InheritedDocSource[],
  alternateDocumentTypes?: string[],
): ResolvedStepDocument | null {
  const types = new Set([documentType, ...(alternateDocumentTypes ?? [])]);
  const current = currentDocs.find((d) => types.has(d.document_type));
  if (current) return { file: current, mode: "current" };
  for (const src of inheritedSources ?? []) {
    const found = src.docs.find((d) => types.has(d.document_type));
    if (found) return { file: found, mode: "inherited", fromStep: src.fromStep };
  }
  return null;
}

/** รวมเอกสารขั้นปัจจุบัน + ที่สืบทอน — ใช้ตรวจสถานะ Checklist บน UI */
export function mergeDocsForChecklistDisplay(
  currentDocs: StepDocRecord[],
  inheritedSources?: InheritedDocSource[],
): StepDocRecord[] {
  const inherited = inheritedSources?.flatMap((s) => s.docs) ?? [];
  if (inherited.length === 0) return currentDocs;
  const seen = new Set(currentDocs.map((d) => d.id));
  const extra = inherited.filter((d) => !seen.has(d.id));
  return [...currentDocs, ...extra];
}
