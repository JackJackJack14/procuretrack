import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  THAI_DATE_LOCALE,
  THAI_DATE_PICKER_PLACEHOLDER,
  formatThaiDate,
  formatThaiDateHint,
  formatThaiDateSlash,
  formatThaiMonthYear,
  parseLocalISODate,
  parseThaiSlashDateToISO,
  toBuddhistYear,
  toGregorianISODate,
  toGregorianYear,
} from "@/lib/thai-date";
