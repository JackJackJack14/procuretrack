import { cn } from "@/lib/utils";

/** ธีมปุ่มเครื่องมือ/ปุ่มลัด — สีฟ้าอ่อนทั้งระบบ */
const HELPER_BUTTON_THEME =
  "rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed";

/** ปุ่มลัดขนาดจิ๋ว — เปิดดู/ดาวน์โหลดในตาราง (h-7) */
export const HELPER_BUTTON_XS =
  `${HELPER_BUTTON_THEME} inline-flex items-center gap-1 h-7 px-2 text-xs`;

/** ปุ่มลัดขนาดเล็ก — เพิ่มแถว / คัดลอก (h-8, text-xs) */
export const HELPER_BUTTON_SM =
  `${HELPER_BUTTON_THEME} inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium`;

/** ปุ่มลัดขนาดเล็กกลาง — คัดลอกรายชื่อ (h-8, text-xs, px-3) */
export const HELPER_BUTTON_SM_WIDE =
  `${HELPER_BUTTON_THEME} inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium`;

/** ปุ่มลัดขนาดกลาง — พิมพ์/Download, จัดการข้อมูล (h-9, text-sm) */
export const HELPER_BUTTON_MD =
  `${HELPER_BUTTON_THEME} inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium`;

/** ปุ่มลัดขนาดกลางกว้าง — พิมพ์/Download ข้อความยาว (h-9, px-4) */
export const HELPER_BUTTON_MD_WIDE =
  `${HELPER_BUTTON_THEME} inline-flex items-center gap-2 h-9 px-4 text-sm font-medium`;

/** ปุ่มลัดขนาดใหญ่ — รายงาน PDF (h-10) */
export const HELPER_BUTTON_LG =
  `${HELPER_BUTTON_THEME} inline-flex items-center gap-2 h-10 px-4 text-sm font-medium`;

export function helperButtonClass(
  size: "sm" | "sm-wide" | "md" | "md-wide" | "lg" = "md",
  extra?: string,
): string {
  const base =
    size === "sm"
      ? HELPER_BUTTON_SM
      : size === "sm-wide"
        ? HELPER_BUTTON_SM_WIDE
        : size === "md-wide"
          ? HELPER_BUTTON_MD_WIDE
          : size === "lg"
            ? HELPER_BUTTON_LG
            : HELPER_BUTTON_MD;
  return cn(base, extra);
}
