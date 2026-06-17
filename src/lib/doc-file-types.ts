import {
  STEP2_DOC,
  STEP3_DOC,
  STEP4_DOC,
  STEP5_DOC,
  STEP6_DOC,
  STEP7_DOC,
  STEP8_DOC,
  STEP8_DOC_LEGACY,
} from "@/lib/step-doc-types";

export type DocFilePolicyId =
  | "pdf_only"
  | "tor_spec"
  | "bg06"
  | "egp_screenshot"
  | "screenshot_evidence"
  | "image_only";

export type DocFilePolicy = {
  id: DocFilePolicyId;
  extensions: string[];
  accept: string;
  helperText: string;
  rejectMessage: string;
};

const POLICIES: Record<DocFilePolicyId, DocFilePolicy> = {
  pdf_only: {
    id: "pdf_only",
    extensions: ["pdf"],
    accept: ".pdf,application/pdf",
    helperText: "รองรับเฉพาะไฟล์ .pdf",
    rejectMessage: "❌ ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ .pdf เท่านั้น",
  },
  tor_spec: {
    id: "tor_spec",
    extensions: ["pdf", "doc", "docx"],
    accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    helperText: "รองรับเฉพาะไฟล์ .pdf, .doc และ .docx",
    rejectMessage:
      "❌ ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ .doc, .docx และ .pdf เท่านั้น",
  },
  bg06: {
    id: "bg06",
    extensions: ["pdf", "xls", "xlsx"],
    accept:
      ".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    helperText: "รองรับเฉพาะไฟล์ .pdf, .xls และ .xlsx",
    rejectMessage:
      "❌ ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ .pdf, .xls และ .xlsx เท่านั้น",
  },
  egp_screenshot: {
    id: "egp_screenshot",
    extensions: ["pdf", "jpg", "jpeg", "png"],
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    helperText: "รองรับเฉพาะไฟล์ .pdf, .jpg, .jpeg และ .png",
    rejectMessage:
      "❌ ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ .pdf, .jpg, .jpeg และ .png เท่านั้น",
  },
  screenshot_evidence: {
    id: "screenshot_evidence",
    extensions: ["pdf", "jpg", "jpeg", "png"],
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    helperText: "รองรับ .pdf, .png, .jpg, .jpeg — แคปหน้าจอระบบภายนอกได้ทันที",
    rejectMessage:
      "❌ ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ .pdf, .png, .jpg, .jpeg เท่านั้น",
  },
  image_only: {
    id: "image_only",
    extensions: ["jpg", "jpeg", "png"],
    accept: ".jpg,.jpeg,.png,image/jpeg,image/png",
    helperText: "รองรับเฉพาะไฟล์ .png, .jpg, .jpeg",
    rejectMessage:
      "❌ ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ .png, .jpg, .jpeg เท่านั้น",
  },
};

/** Explicit mapping for known procurement document labels. */
const DOC_TYPE_POLICY: Record<string, DocFilePolicyId> = {
  [STEP2_DOC.APPOINTMENT_ORDER]: "pdf_only",
  [STEP2_DOC.EVALUATION_INSPECTION_ORDER]: "pdf_only",
  [STEP2_DOC.SITE_SUPERVISOR_ORDER]: "pdf_only",
  [STEP2_DOC.MEDIAN_PRICE_BG06]: "bg06",

  [STEP3_DOC.DRAFT_TOR_SPEC]: "tor_spec",
  [STEP3_DOC.DRAFT_ANNOUNCEMENT_BID]: "tor_spec",
  [STEP3_DOC.MEDIAN_BG06]: "bg06",
  [STEP3_DOC.MEMO_APPROVAL]: "pdf_only",
  [STEP3_DOC.EGP_ANNOUNCEMENT]: "pdf_only",
  [STEP3_DOC.EGP_SCREENSHOT]: "egp_screenshot",
  [STEP3_DOC.FEEDBACK_REPORT]: "pdf_only",

  [STEP4_DOC.SIGNED_PROCUREMENT_REQUEST]: "pdf_only",
  [STEP4_DOC.EGP_BID_SUMMARY]: "pdf_only",
  [STEP4_DOC.BLACKLIST_EVIDENCE]: "screenshot_evidence",
  [STEP4_DOC.CONFLICT_EVIDENCE]: "screenshot_evidence",
  "ภาพหน้าจอ/เอกสารตรวจ Blacklist (e-GP)": "screenshot_evidence",
  "ภาพหน้าจอ/เอกสารตรวจผลประโยชน์ร่วมกัน": "screenshot_evidence",
  [STEP4_DOC.COMMITTEE_EVALUATION_REPORT]: "pdf_only",
  [STEP4_DOC.PRICE_COMPARISON_TABLE]: "pdf_only",
  [STEP4_DOC.EVALUATION_REPORT]: "pdf_only",

  [STEP5_DOC.EGP_WINNER_ANNOUNCEMENT]: "screenshot_evidence",
  [STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT]: "image_only",
  [STEP5_DOC.ALL_BIDDERS_RESULT_NOTICE]: "screenshot_evidence",
  "ประกาศผู้ชนะการเสนอราคา (e-GP)": "screenshot_evidence",

  [STEP6_DOC.NO_APPEAL_EGP_SCREENSHOT]: "screenshot_evidence",
  [STEP6_DOC.AGENCY_APPEAL_REPORT]: "pdf_only",
  [STEP6_DOC.CGD_APPEAL_REPORT]: "pdf_only",
  [STEP6_DOC.APPEAL_RESULT_EVIDENCE]: "screenshot_evidence",

  [STEP7_DOC.CONTRACT_NOTICE_LETTER]: "pdf_only",
  [STEP7_DOC.CONTRACT_NOTICE_DELIVERY_PROOF]: "screenshot_evidence",
  [STEP7_DOC.DRAFT_CONTRACT]: "pdf_only",

  [STEP8_DOC.GUARANTEE_VERIFICATION]: "screenshot_evidence",
  [STEP8_DOC.SIGNED_CONTRACT]: "pdf_only",
  [STEP8_DOC_LEGACY.GUARANTEE]: "screenshot_evidence",
  [STEP8_DOC_LEGACY.SIGNED]: "pdf_only",
};

/** นโยบายไฟล์ตาม inline evidence config */
export function resolveDocFilePolicyById(policyId: DocFilePolicyId): DocFilePolicy {
  return POLICIES[policyId];
}

function inferPolicyId(documentType: string): DocFilePolicyId {
  const normalized = documentType.trim();

  const explicit = DOC_TYPE_POLICY[normalized];
  if (explicit) return explicit;

  const lower = normalized.toLowerCase();

  if (
    lower.includes("บก.06") ||
    lower.includes("บก06") ||
    lower.includes("ตารางแสดงวงเงิน") ||
    lower.includes("ราคากลาง")
  ) {
    return "bg06";
  }

  if (
    lower.includes("ภาพหน้าจอ") ||
    lower.includes("e-gp") ||
    lower.includes("egp") ||
    lower.includes("รูปถ่าย")
  ) {
    return "egp_screenshot";
  }

  if (
    lower.includes("ร่าง tor") ||
    lower.includes("ร่างประกาศ") ||
    lower.includes("ร่างเอกสารประกวด") ||
    lower.includes("ร่างสัญญา") ||
    lower.includes("รายละเอียดคุณลักษณะ") ||
    lower.includes("tor/spec") ||
    lower.includes("tor / spec")
  ) {
    return "tor_spec";
  }

  if (
    lower.includes("แบบรูปรายการ") ||
    lower.includes("boq") ||
    lower.includes("แผนปฏิบัติการ") ||
    lower.includes("gantt")
  ) {
    return "bg06";
  }

  if (lower.includes("หลักประกัน") || (lower.includes("ใบเสนอราคา") && lower.includes("ตลาด"))) {
    return "egp_screenshot";
  }

  return "pdf_only";
}

export function resolveDocFilePolicy(documentType: string): DocFilePolicy {
  return POLICIES[inferPolicyId(documentType)];
}

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

export function isFileAllowedForPolicy(file: File, policy: DocFilePolicy): boolean {
  const ext = getFileExtension(file.name);
  return policy.extensions.includes(ext);
}

export function validateDocFile(
  file: File,
  documentType: string,
): { ok: true; policy: DocFilePolicy } | { ok: false; policy: DocFilePolicy; message: string } {
  const policy = resolveDocFilePolicy(documentType);
  if (isFileAllowedForPolicy(file, policy)) {
    return { ok: true, policy };
  }
  return { ok: false, policy, message: policy.rejectMessage };
}
