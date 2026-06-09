/** ชื่อ Milestone e-GP — อ้างอิงจาก `egp-milestones.ts` (แหล่งเดียวกับ Executive Dashboard) */
export {
  EGP_MILESTONES,
  EGP_MILESTONE_SHORT,
  EGP_STEP_LEGAL_HINTS,
  EGP_TOTAL_STEPS,
  getMilestoneLabel,
  milestoneProgressPercent,
} from "@/lib/egp-milestones";
import { STEP3_DOC, STEP4_DOC, STEP5_DOC } from "@/lib/step-doc-types";

export type DocItem = { name: string; required: boolean };

/** เอกสารอ้างอิงต่อ Milestone e-GP (10 ขั้น) — สำหรับตรวจครบก่อนปิดขั้น */
export const STEP_DOCS_DETAILED: DocItem[][] = [
  [
    { name: "คำสั่งแต่งตั้งผู้รับผิดชอบงาน e-GP", required: true },
    { name: "แบบรูปรายการงานก่อสร้าง (BOQ)", required: true },
    { name: "เอกสารอนุมัติโครงการ/จัดสรรงบประมาณ", required: true },
    { name: "ประมาณการราคาเบื้องต้น", required: false },
  ],
  [
    { name: "คำสั่งแต่งตั้งคณะกรรมการจัดทำ TOR และราคากลาง", required: true },
    { name: "คำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ", required: true },
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
  ],
  [
    { name: STEP5_DOC.EGP_WINNER_ANNOUNCEMENT, required: true },
    { name: STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT, required: true },
  ],
  [
    { name: "บันทึกรับเรื่องอุทธรณ์ (ถ้ามี)", required: false },
    { name: "มติ/คำวินิจฉัยคณะกรรมการอุทธรณ์", required: false },
    { name: "หนังสือแจ้งผลอุทธรณ์", required: false },
  ],
  [
    { name: "ร่างสัญญาจ้างก่อสร้าง", required: true },
    { name: "หนังสือโต้ตอบก่อนลงนาม (ถ้ามี)", required: false },
  ],
  [
    { name: "หลักประกันสัญญา (LG/แคชเชียร์เช็ค)", required: true },
    { name: "สัญญาจ้างก่อสร้าง (ต้นฉบับ ติดอากรแสตมป์)", required: true },
    { name: "สำเนาทะเบียนบริษัทผู้รับจ้าง", required: true },
    { name: "หนังสือมอบอำนาจ (ถ้ามี)", required: false },
  ],
  [
    { name: "สรุปสาระสำคัญสัญญา (วงเงิน/ระยะเวลา/งวดงาน)", required: true },
    { name: "แผนปฏิบัติการก่อสร้าง (Gantt)", required: true },
  ],
  [
    { name: "รายงานความคืบหน้ารายสัปดาห์", required: true },
    { name: "รูปถ่ายหน้างานประกอบรายงาน", required: true },
    { name: "ใบแจ้งส่งมอบงาน/ใบตรวจรับ (บก.11)", required: true },
    { name: "บันทึกคืนหลักประกันสัญญา", required: false },
  ],
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
