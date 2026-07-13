import { createContext } from "react";

export const STEP5_COMPLIANCE_INLINE_ERROR_MSG =
  "❌ กรุณากรอกข้อมูล/แนบไฟล์หลักในช่องนี้ให้เรียบร้อย";

export type ComplianceFieldHighlightValue = {
  submitTriggered: boolean;
  activeIssueId: string | null;
  activeMessage: string | null;
  /** เคลียร์ error หลังผู้ใช้แก้ไขฟิลด์ (issue.id) */
  clearFieldHighlight?: (issueId: string) => void;
  /** เคลียร์ error หลังอัปโหลดเอกสารสำเร็จ */
  clearDocumentHighlight?: (documentType: string) => void;
  /** แสดง inline error + scroll (ใช้ใน Step 10 งวดงาน แทน toast) */
  raiseComplianceIssue?: (message: string, issueId: string, docType?: string) => void;
};

export const ComplianceFieldHighlightContext = createContext<ComplianceFieldHighlightValue>({
  submitTriggered: false,
  activeIssueId: null,
  activeMessage: null,
});

export function ComplianceFieldHighlightProvider({
  value,
  children,
}: {
  value: ComplianceFieldHighlightValue;
  children: React.ReactNode;
}) {
  return (
    <ComplianceFieldHighlightContext.Provider value={value}>
      {children}
    </ComplianceFieldHighlightContext.Provider>
  );
}
