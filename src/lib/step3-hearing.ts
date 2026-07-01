/** ระดับการรับฟังความคิดเห็นร่างประกาศ/TOR ตามวงเงินงบประมาณ (ขั้นตอนที่ 3) */
export type Step3HearingTier = "mandatory" | "discretionary" | "exempt";

export type Step3SkipReason = "exempt" | "discretionary";

const TIER_10M = 10_000_000;
const TIER_5M = 5_000_000;

export function getStep3HearingTier(budget: number): Step3HearingTier {
  const b = Number(budget) || 0;
  if (b > TIER_10M) return "mandatory";
  if (b > TIER_5M) return "discretionary";
  return "exempt";
}

export function formatBudgetBahtShort(budget: number): string {
  return new Intl.NumberFormat("th-TH").format(Math.round(budget));
}

export const STEP3_MANDATORY_GUIDELINES = [
  "เลขที่หนังสือเห็นชอบ: ให้ระบุเลขที่หนังสือบันทึกข้อความภายในที่เสนอหัวหน้าหน่วยงานเพื่ออนุมัติเผยแพร่ร่างประกาศ (ไม่ใช่เลขคุมโครงการจาก e-GP)",
  "เกณฑ์ระยะเวลาเผยแพร่รับฟังความคิดเห็น (ตามระเบียบพัสดุฯ): ต้องเผยแพร่เพื่อรับฟังความคิดเห็น ไม่น้อยกว่า 3 วันทำการ",
  "ระบบจะไม่นับวันแรกที่กดเผยแพร่ (Day 0) และไม่รวมวันหยุดเสาร์-อาทิตย์/วันหยุดราชการไทย",
  "ระบบจะคำนวณวันสิ้นสุดขั้นต่ำให้อัตโนมัติ — เจ้าหน้าที่ขยายระยะเวลาได้ แต่ห้ามต่ำกว่าเกณฑ์ขั้นต่ำที่ระเบียบกำหนด",
] as const;

export function getStep3TierAlert(tier: Step3HearingTier): {
  bg: string;
  border: string;
  text: string;
  message: string;
} {
  switch (tier) {
    case "mandatory":
      return {
        bg: "#EFF6FF",
        border: "#2563EB",
        text: "#1E3A8A",
        message:
          "โครงการนี้มีวงเงินเกิน 10 ล้านบาท ระเบียบพัสดุฯ บังคับต้องเผยแพร่เพื่อรับฟังความคิดเห็นร่างประกาศและ TOR ไม่น้อยกว่า 3 วันทำการ",
      };
    case "discretionary":
      return {
        bg: "#FFF7ED",
        border: "#EA580C",
        text: "#9A3412",
        message:
          "โครงการนี้อยู่ในช่วงวงเงิน 5 - 10 ล้านบาท การเผยแพร่รับฟังความคิดเห็นร่างประกาศอยู่ในดุลยพินิจของหัวหน้าหน่วยงาน (จะไม่จัดฟังความคิดเห็นก็ได้)",
      };
    case "exempt":
      return {
        bg: "#ECFDF5",
        border: "#059669",
        text: "#065F46",
        message:
          "โครงการนี้วงเงินไม่เกิน 5 ล้านบาท ได้รับยกเว้นไม่ต้องจัดทำร่างประกาศเพื่อรับฟังความคิดเห็นตามระเบียบพัสดุฯ",
      };
  }
}

/** แสดงฟอร์มจัดฟังคำวิจารณ์เมื่อบังคับ หรือเลือกดำเนินการในช่วงดุลยพินิจ */
export function shouldShowStep3HearingForm(
  tier: Step3HearingTier,
  hearingProceed: boolean,
  hearingSkipped: boolean,
): boolean {
  if (hearingSkipped) return false;
  if (tier === "mandatory") return true;
  if (tier === "discretionary") return hearingProceed;
  return false;
}

export const STEP3_MANDATORY_HEARING_BLOCK_MSG =
  "โครงการวงเงินเกิน 10 ล้านบาท ต้องจัดรับฟังความคิดเห็นและกรอกรายงานผลการรับฟังความคิดเห็นให้ครบถ้วนก่อนผ่านขั้นตอนถัดไป";

export const STEP3_DISCRETIONARY_HEARING_WARNING_MSG =
  "โครงการวงเงินไม่เกิน 10 ล้านบาท — การจัดรับฟังความคิดเห็นอยู่ในดุลยพินิจของหัวหน้าหน่วยงาน";

export const STEP3_FEEDBACK_SOFT_WARNING_MSG =
  "ยังไม่ได้กรอก/แนบรายงานผลการรับฟังความคิดเห็น — โครงการวงเงินไม่เกิน 10 ล้านบาท อยู่ในดุลยพินิจของหัวหน้าหน่วยงาน";

/** โครงการจัดรับฟังความคิดเห็นจริงในขั้นตอนที่ 3 (ไม่ข้าม/ไม่ยกเว้น) */
export function step3HadPublicHearing(
  budget: number,
  announcement: {
    hearing_skipped?: boolean;
    hearing_proceed?: boolean;
  },
): boolean {
  if (announcement.hearing_skipped) return false;
  const tier = getStep3HearingTier(budget);
  if (tier === "exempt") return false;
  if (tier === "discretionary" && !announcement.hearing_proceed) return false;
  return true;
}
