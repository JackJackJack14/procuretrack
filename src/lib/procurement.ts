/** ชื่อ Milestone e-GP — อ้างอิงจาก `egp-milestones.ts` (แหล่งเดียวกับ Executive Dashboard) */
export {
  EGP_MILESTONES,
  EGP_MILESTONE_SHORT,
  EGP_STEP_LEGAL_HINTS,
  EGP_TOTAL_STEPS,
  getMilestoneLabel,
  milestoneProgressPercent,
} from "@/lib/egp-milestones";
import {
  STEP2_DOC,
  STEP3_DOC,
  STEP4_DOC,
  STEP5_DOC,
  STEP6_DOC,
  STEP7_DOC,
  STEP8_DOC,
} from "@/lib/step-doc-types";
import { STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE } from "@/lib/checklist-inline-evidence";

export type DocItem = { name: string; required: boolean };

/** เอกสารอ้างอิงต่อ Milestone e-GP (10 ขั้น) — สำหรับตรวจครบก่อนปิดขั้น */
export const STEP_DOCS_DETAILED: DocItem[][] = [
  [
    { name: STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE, required: true },
    { name: "ประมาณการราคาเบื้องต้น", required: false },
  ],
  [
    { name: STEP2_DOC.BOQ, required: true },
    { name: "คำสั่งแต่งตั้งคณะกรรมการจัดทำ TOR และราคากลาง", required: true },
    { name: "คำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ", required: false },
    { name: "แบบรายงานผลการกำหนดราคากลาง (บก.06)", required: true },
    { name: "ใบเสนอราคาท้องตลาดอย่างน้อย 3 ราย", required: true },
    { name: "หนังสือแสดงความบริสุทธิ์ใจของกรรมการ", required: true },
  ],
  [
    { name: STEP3_DOC.DRAFT_TOR_SPEC, required: true },
    { name: STEP3_DOC.DRAFT_ANNOUNCEMENT_BID, required: true },
    { name: STEP3_DOC.MEDIAN_BG06, required: false },
    { name: STEP3_DOC.MEMO_APPROVAL, required: true },
    { name: STEP3_DOC.EGP_ANNOUNCEMENT, required: true },
    { name: STEP3_DOC.EGP_SCREENSHOT, required: true },
    { name: STEP3_DOC.FEEDBACK_REPORT, required: true },
  ],
  [
    { name: STEP4_DOC.EGP_BID_SUMMARY, required: true },
    { name: STEP4_DOC.BLACKLIST_EVIDENCE, required: true },
    { name: STEP4_DOC.CONFLICT_EVIDENCE, required: true },
    { name: STEP4_DOC.COMMITTEE_EVALUATION_REPORT, required: true },
    { name: STEP2_DOC.EVALUATION_INSPECTION_ORDER, required: true },
  ],
  [
    { name: STEP5_DOC.EGP_WINNER_ANNOUNCEMENT, required: true },
    { name: STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT, required: true },
    { name: STEP5_DOC.ALL_BIDDERS_RESULT_NOTICE, required: true },
  ],
  [
    { name: STEP6_DOC.NO_APPEAL_EGP_SCREENSHOT, required: false },
    { name: STEP6_DOC.AGENCY_APPEAL_REPORT, required: false },
    { name: STEP6_DOC.CGD_APPEAL_REPORT, required: false },
  ],
  [
    { name: STEP7_DOC.CONTRACT_NOTICE_LETTER, required: true },
    { name: STEP7_DOC.CONTRACT_NOTICE_DELIVERY_PROOF, required: true },
    { name: STEP7_DOC.DRAFT_CONTRACT, required: true },
  ],
  [
    { name: STEP8_DOC.GUARANTEE_VERIFICATION, required: true },
    { name: STEP8_DOC.SIGNED_CONTRACT, required: true },
  ],
  [
    { name: "ใบประกาศสาระสำคัญสัญญาจาก e-GP", required: false },
    { name: "หนังสือแจ้งเริ่มงาน", required: false },
    { name: "แผนปฏิบัติการก่อสร้าง (Gantt)", required: false },
  ],
  [],
];

export const STEP_DOCS: string[][] = STEP_DOCS_DETAILED.map((items) =>
  items.map((i) => i.name),
);

export const METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "e_bidding", label: "e-bidding (ประกวดราคาอิเล็กทรอนิกส์) วงเงิน > 500,000" },
  { value: "e_market", label: "e-market (ตลาดอิเล็กทรอนิกส์) วงเงิน 10,000-500,000" },
  { value: "specific", label: "วิธีเฉพาะเจาะจง วงเงิน < 500,000" },
  { value: "selection", label: "วิธีคัดเลือก" },
];

export const METHOD_LABEL: Record<string, string> = Object.fromEntries(
  METHOD_OPTIONS.map((m) => [m.value, m.label.split(" ")[0]]),
);

export const STATUS_LABEL: Record<string, string> = {
  active: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  warranty: "ปิดงานจ้างสำเร็จ (อยู่ระหว่างค้ำประกันความชำรุด 2 ปี)",
  cancelled: "ยกเลิก",
  on_hold: "พักการดำเนินการ",
};

export function formatBaht(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

export function progressColor(pct: number) {
  if (pct < 30) return "bg-destructive";
  if (pct < 70) return "bg-warning";
  return "bg-success";
}
