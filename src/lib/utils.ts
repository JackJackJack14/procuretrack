import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/**
 * Format a date as Thai Buddhist-era short date.
 * @param input Date | ISO string | yyyy-mm-dd | null/undefined
 * @param opts.withTime append " เวลา HH:mm น."
 * @returns e.g. "24 พ.ค. 2569" or "24 พ.ค. 2569 เวลา 16:34 น." — "-" when missing/invalid
 */
export function formatThaiDate(
  input: Date | string | null | undefined,
  opts: { withTime?: boolean } = {},
): string {
  if (input === null || input === undefined || input === "") return "-";
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear() + 543;
  const base = `${day} ${month} ${year}`;
  if (!opts.withTime) return base;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${base} เวลา ${hh}:${mm} น.`;
}

/** รูปแบบ dd/MM/yyyy (พ.ศ.) เช่น 10/06/2569 */
export function formatThaiDateSlash(input: Date | string | null | undefined): string {
  if (input === null || input === undefined || input === "") return "-";
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear() + 543;
  return `${dd}/${mm}/${yyyy}`;
}

