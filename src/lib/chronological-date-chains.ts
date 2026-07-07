/**
 * Global Chronological Date Chains — แผนที่ความสัมพันธ์วันที่ทุกขั้นตอน (Step 1–10)
 * Dependent Date >= Base Date เสมอ (ลำดับเวลาเหตุการณ์)
 */
export type ChronologicalFieldKey = `${number}.${string}`;

export function chronologicalFieldKey(
  stepNumber: number,
  fieldId: string,
): ChronologicalFieldKey {
  return `${stepNumber}.${fieldId}`;
}

/** กฎภายในขั้นตอน — dependent ต้อง >= base (ISO yyyy-mm-dd) */
export type IntraStepDateChainRule = {
  dependentFieldId: string;
  dependentLabel: string;
  baseFieldId: string;
  baseLabel: string;
  /** ข้อความเมื่อ dependent < base */
  message: (dependentLabel: string, baseLabel: string) => string;
};

export const INTRA_STEP_DATE_CHAINS: Record<number, IntraStepDateChainRule[]> = {
  2: [
    {
      dependentFieldId: "median_price_approval_date",
      dependentLabel: "วันที่อนุมัติราคากลาง",
      baseFieldId: "appointment_order_date",
      baseLabel: "วันที่ในคำสั่งแต่งตั้งคณะกรรมการ",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
  ],
  3: [
    {
      dependentFieldId: "publication_start",
      dependentLabel: "วันที่เริ่มเผยแพร่ร่างประกาศ",
      baseFieldId: "approval_letter_date",
      baseLabel: "วันที่หัวหน้าลงนามร่าง TOR",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
    {
      dependentFieldId: "publication_end",
      dependentLabel: "วันที่สิ้นสุดเผยแพร่ร่างประกาศ",
      baseFieldId: "publication_start",
      baseLabel: "วันที่เริ่มเผยแพร่ร่างประกาศ",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
    {
      dependentFieldId: "procurement_request_approval_date",
      dependentLabel: "วันที่หัวหน้าหน่วยงานอนุมัติรายงานขอซื้อขอจ้าง",
      baseFieldId: "publication_end",
      baseLabel: "วันที่สิ้นสุดเผยแพร่ร่างประกาศ",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
  ],
  5: [
    {
      dependentFieldId: "winner_result_notification_date",
      dependentLabel: "วันที่แจ้งผลให้ผู้เสนอราคาทราบ",
      baseFieldId: "winner_announcement_date",
      baseLabel: "วันที่ประกาศผล",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
  ],
  6: [
    {
      dependentFieldId: "appeal_head_signed_date",
      dependentLabel: "วันที่หัวหน้าหน่วยงานลงนามวินิจฉัยผลอุทธรณ์",
      baseFieldId: "appeal_received_date",
      baseLabel: "วันที่หน่วยงานได้รับหนังสืออุทธรณ์",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
    {
      dependentFieldId: "cgd_submission_date",
      dependentLabel: "วันที่ส่งเรื่องให้กรมบัญชีกลาง",
      baseFieldId: "appeal_head_signed_date",
      baseLabel: "วันที่หัวหน้าหน่วยงานลงนามวินิจฉัยผลอุทธรณ์",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
    {
      dependentFieldId: "appeal_resolved_date",
      dependentLabel: "วันที่ได้รับผลวินิจฉัยจากกรมบัญชีกลาง",
      baseFieldId: "cgd_submission_date",
      baseLabel: "วันที่ส่งเรื่องให้กรมบัญชีกลาง",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
  ],
  7: [
    {
      dependentFieldId: "contract_signing_deadline",
      dependentLabel: "กำหนดวันสุดท้ายที่ต้องมาลงนาม",
      baseFieldId: "contract_notice_letter_date",
      baseLabel: "วันที่ในหนังสือเชิญลงนาม",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
    {
      dependentFieldId: "contractor_received_date",
      dependentLabel: "วันที่ผู้ประกอบการได้รับหนังสือเชิญ",
      baseFieldId: "contract_notice_letter_date",
      baseLabel: "วันที่ออกหนังสือเชิญชวน",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
    {
      dependentFieldId: "actual_contract_signed_date",
      dependentLabel: "วันที่ลงนามในสัญญาจริง",
      baseFieldId: "contractor_received_date",
      baseLabel: "วันที่ผู้ประกอบการได้รับหนังสือเชิญ",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อน${b}`,
    },
  ],
  9: [
    {
      dependentFieldId: "contract_end_date",
      dependentLabel: "วันสิ้นสุดสัญญา",
      baseFieldId: "work_start_date",
      baseLabel: "วันเริ่มต้นสัญญา",
      message: (d, b) => `❌ ${d} ต้องไม่ก่อนหรือเท่ากับ${b} (ต้องหลังวันเริ่มสัญญา)`,
    },
  ],
};

/** กฎข้ามขั้นตอน — dependent ใน step N อ้างอิง base จาก snapshot */
export type CrossStepDateChainRule = {
  stepNumber: number;
  dependentFieldId: string;
  dependentLabel: string;
  resolveBaseISO: (snapshot: Record<string, unknown>) => string;
  baseLabel: string;
  message: (dependentLabel: string, baseLabel: string, baseISO: string) => string;
};