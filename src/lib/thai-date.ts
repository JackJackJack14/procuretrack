/**
 * Global Thai Buddhist-era date utilities.
 * - UI display: พ.ศ. (BE)
 * - Storage/API: Gregorian ISO yyyy-mm-dd (ค.ศ.)
 */

export const THAI_DATE_LOCALE = "th-TH";
export const THAI_DATE_PICKER_PLACEHOLDER = "วว/ดด/ปปปป (พ.ศ.)";

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

const THAI_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

/** แปลงปี ค.ศ. เป็น พ.ศ. */
export function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543;
}

/** แปลงปี พ.ศ. กลับเป็น ค.ศ. */
export function toGregorianYear(buddhistYear: number): number {
  return buddhistYear - 543;
}

/** Parse yyyy-mm-dd เป็น Date แบบ local (ไม่โดน timezone shift) */
export function parseLocalISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso).trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** แปลง Date เป็น ISO yyyy-mm-dd (ค.ศ.) สำหรับ state/API */
export function toGregorianISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDisplayDate(input: Date | string | null | undefined): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const local = parseLocalISODate(String(input));
  if (local) return local;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * รูปแบบข้อความมาตรฐาน: "7 ธ.ค. 2571"
 * รับ Date, ISO yyyy-mm-dd (ค.ศ.), หรือ datetime string
 */
export function formatThaiDate(
  input: Date | string | null | undefined,
  opts: { withTime?: boolean } = {},
): string {
  const d = toDisplayDate(input);
  if (!d) return "-";
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = toBuddhistYear(d.getFullYear());
  const base = `${day} ${month} ${year}`;
  if (!opts.withTime) return base;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${base} เวลา ${hh}:${mm} น.`;
}

/** รูปแบบ Hint/Helper: "วันที่ 7 ธ.ค. 2571" */
export function formatThaiDateHint(input: Date | string | null | undefined): string {
  const formatted = formatThaiDate(input);
  if (formatted === "-") return formatted;
  return `วันที่ ${formatted}`;
}

/** รูปแบบ DatePicker input: "07/12/2571" (พ.ศ.) */
export function formatThaiDateSlash(input: Date | string | null | undefined): string {
  const d = toDisplayDate(input);
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = toBuddhistYear(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

/** ชื่อเดือนเต็มภาษาไทย — ใช้ในหัวปฏิทิน */
export function formatThaiMonthYear(date: Date): string {
  const month = THAI_MONTHS_FULL[date.getMonth()];
  const year = toBuddhistYear(date.getFullYear());
  return `${month} ${year}`;
}

/** แปลงข้อความ dd/MM/yyyy (พ.ศ.) กลับเป็น ISO ค.ศ. — สำหรับ parse manual input */
export function parseThaiSlashDateToISO(input: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const beYear = Number(m[3]);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(beYear)) return null;
  const gregorianYear = toGregorianYear(beYear);
  const d = new Date(gregorianYear, mm - 1, dd);
  if (
    d.getFullYear() !== gregorianYear ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }
  return toGregorianISODate(d);
}
