import { STEP2_DOC, STEP3_DOC, STEP4_DOC, STEP5_DOC } from "@/lib/step-doc-types";

export const COMPLIANCE_TARGET_ATTR = "data-compliance-target";

/** สร้าง id สำหรับกล่องอัปโหลด — ต้องตรงกับ InlineDocUpload */
export function docUploadElementId(documentType: string): string {
  return `doc-upload-${encodeURIComponent(documentType)}`;
}

const COMPLIANCE_ISSUE_TO_DOC_TYPE: Record<string, string> = {
  draft_tor_doc: STEP3_DOC.DRAFT_TOR_SPEC,
  draft_announcement_doc: STEP3_DOC.DRAFT_ANNOUNCEMENT_BID,
  bg06_doc: STEP3_DOC.MEDIAN_BG06,
  memo_approval_doc: STEP3_DOC.MEMO_APPROVAL,
  egp_announcement_doc: STEP3_DOC.EGP_ANNOUNCEMENT,
  egp_screenshot_doc: STEP3_DOC.EGP_SCREENSHOT,
  feedback_report_doc: STEP3_DOC.FEEDBACK_REPORT,
  signed_procurement_request_doc: STEP4_DOC.SIGNED_PROCUREMENT_REQUEST,
  price_comparison_doc: STEP4_DOC.PRICE_COMPARISON_TABLE,
  committee_evaluation_report_doc: STEP4_DOC.COMMITTEE_EVALUATION_REPORT,
  egp_bid_summary_doc: STEP4_DOC.EGP_BID_SUMMARY,
  committee_order_doc: STEP2_DOC.EVALUATION_INSPECTION_ORDER,
  supervisor_order_doc: STEP2_DOC.SITE_SUPERVISOR_ORDER,
  egp_winner_doc: STEP5_DOC.EGP_WINNER_ANNOUNCEMENT,
  physical_board_doc: STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT,
};

const DOC_TYPE_TO_COMPLIANCE_TARGET: Record<string, string> = {
  [STEP3_DOC.DRAFT_TOR_SPEC]: "draft_tor_doc",
  [STEP3_DOC.DRAFT_ANNOUNCEMENT_BID]: "draft_announcement_doc",
  [STEP3_DOC.MEDIAN_BG06]: "bg06_doc",
  [STEP3_DOC.MEMO_APPROVAL]: "memo_approval_doc",
  [STEP3_DOC.EGP_ANNOUNCEMENT]: "egp_announcement_doc",
  [STEP3_DOC.EGP_SCREENSHOT]: "egp_screenshot_doc",
  [STEP3_DOC.FEEDBACK_REPORT]: "feedback_report_doc",
  [STEP4_DOC.SIGNED_PROCUREMENT_REQUEST]: "signed_procurement_request_doc",
  [STEP4_DOC.PRICE_COMPARISON_TABLE]: "price_comparison_doc",
  [STEP4_DOC.COMMITTEE_EVALUATION_REPORT]: "committee_evaluation_report_doc",
  [STEP4_DOC.EGP_BID_SUMMARY]: "egp_bid_summary_doc",
  [STEP2_DOC.EVALUATION_INSPECTION_ORDER]: "committee_order_doc",
  [STEP2_DOC.SITE_SUPERVISOR_ORDER]: "supervisor_order_doc",
  [STEP5_DOC.EGP_WINNER_ANNOUNCEMENT]: "egp_winner_doc",
  [STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT]: "physical_board_doc",
};

const ISSUE_ID_ALIASES: Record<string, string> = {
  mandatory_hearing_skipped: "step3_hearing_gate",
  mandatory_hearing_incomplete: "step3_hearing_gate",
  procurement_request_approval_before_publication_end: "procurement_request_approval_date",
  evaluation_committee_text: "evaluation_committee_members",
  inspection_committee_text: "inspection_committee_members",
};

export function mapRequiredDocToComplianceTarget(documentType: string): string {
  return DOC_TYPE_TO_COMPLIANCE_TARGET[documentType] ?? documentType;
}

/** แปลง issue.id หรือชื่อประเภทเอกสาร → documentType สำหรับ scroll/highlight */
export function resolveDocTypeFromComplianceIssue(issueIdOrDocType: string): string | null {
  if (COMPLIANCE_ISSUE_TO_DOC_TYPE[issueIdOrDocType]) {
    return COMPLIANCE_ISSUE_TO_DOC_TYPE[issueIdOrDocType];
  }
  if (issueIdOrDocType.startsWith("doc-upload-")) {
    try {
      return decodeURIComponent(issueIdOrDocType.slice("doc-upload-".length));
    } catch {
      return null;
    }
  }
  if (
    Object.values(STEP3_DOC).includes(issueIdOrDocType as (typeof STEP3_DOC)[keyof typeof STEP3_DOC]) ||
    Object.values(STEP4_DOC).includes(issueIdOrDocType as (typeof STEP4_DOC)[keyof typeof STEP4_DOC]) ||
    Object.values(STEP2_DOC).includes(issueIdOrDocType as (typeof STEP2_DOC)[keyof typeof STEP2_DOC])
  ) {
    return issueIdOrDocType;
  }
  return null;
}

export function inferPublicationComplianceTarget(message: string): string {
  if (message.includes("เหตุผล") || message.includes("ขยายระยะเวลา")) {
    return "publication_end_extension_reason";
  }
  if (message.includes("วันสิ้นสุด")) {
    return "publication_end";
  }
  if (message.includes("วันเริ่ม")) {
    return "publication_start";
  }
  return "publication_dates";
}

function resolveComplianceTargetId(issueId: string): string {
  return ISSUE_ID_ALIASES[issueId] ?? issueId;
}

function describeElement(el: Element, resolvedId: string): string {
  const tag = el.tagName.toLowerCase();
  const idPart = el.id ? `#${el.id}` : "";
  const className = typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : "";
  const classPart = className ? `.${className}` : "";
  return `${resolvedId} (${tag}${idPart}${classPart})`;
}

/** เลื่อนหน้าจอไปยังกล่องอัปโหลดเอกสารที่ขาด — ยิงตรง id */
export function scrollToMissingDocUpload(documentType: string): boolean {
  const errorElement = document.getElementById(docUploadElementId(documentType));
  console.log("🎯 [TARGET SCROLL DEBUG] Found Missing Doc Element & Scrolling to:", {
    docType: documentType,
    elementExists: !!errorElement,
  });
  if (errorElement) {
    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = errorElement.querySelector<HTMLElement>("button[type='button']");
    focusable?.focus({ preventScroll: true });
    return true;
  }
  return false;
}

function findComplianceElement(issueId: string): Element | null {
  const docType = resolveDocTypeFromComplianceIssue(issueId);
  if (docType) {
    const docEl = document.getElementById(docUploadElementId(docType));
    if (docEl) return docEl;
  }

  const resolvedId = resolveComplianceTargetId(issueId);
  const direct =
    document.querySelector(`[${COMPLIANCE_TARGET_ATTR}="${resolvedId}"]`) ??
    document.querySelector(`[${COMPLIANCE_TARGET_ATTR}="${issueId}"]`);
  if (direct) return direct;

  if (issueId.startsWith("bidder_")) {
    const bidderRow = document.querySelector(`[${COMPLIANCE_TARGET_ATTR}="${issueId}"]`);
    if (bidderRow) return bidderRow;
    const table = document.querySelector(`[${COMPLIANCE_TARGET_ATTR}="step4_bidders_table"]`);
    if (table) return table;
  }

  const formRoot = document.getElementById("step-workflow-form");
  if (formRoot) {
    const firstInForm = formRoot.querySelector(`[${COMPLIANCE_TARGET_ATTR}]`);
    if (firstInForm) return firstInForm;
  }

  return document.querySelector(`[${COMPLIANCE_TARGET_ATTR}]`);
}

/** เลื่อนหน้าจอไปยังฟิลด์/อัปโหลดแรกที่ยังไม่ครบ */
export function scrollToComplianceError(issueId: string, docType?: string): string {
  const resolvedDocType = docType ?? resolveDocTypeFromComplianceIssue(issueId);
  if (resolvedDocType && scrollToMissingDocUpload(resolvedDocType)) {
    return docUploadElementId(resolvedDocType);
  }

  const resolvedId = resolveComplianceTargetId(issueId);
  const el = findComplianceElement(issueId);
  const targetLabel = el ? describeElement(el, resolvedId) : issueId;

  console.log(
    "🚀 [UX AUTO-SCROLL] Form Validation Failed! Target Focus Missing Element:",
    targetLabel,
  );

  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = el.querySelector<HTMLElement>(
      "input:not([type='hidden']), textarea, select, button[type='button']",
    );
    if (focusable && !focusable.disabled) {
      focusable.focus({ preventScroll: true });
    }
  }

  return targetLabel;
}

export function scrollToComplianceErrorAfterPaint(issueId: string, docType?: string): void {
  requestAnimationFrame(() => {
    scrollToComplianceError(issueId, docType);
  });
}
