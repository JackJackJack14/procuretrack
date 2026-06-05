import DatePicker, { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils";

registerLocale("th", th);

interface ThaiDatePickerProps {
  value?: string; // yyyy-mm-dd
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
  /** วันที่เลือกได้ตั้งแต่ (yyyy-mm-dd) — วันก่อนหน้าจะถูกปิดในปฏิทิน */
  minDate?: string;
  /** วันที่เลือกได้ไม่เกิน (yyyy-mm-dd) */
  maxDate?: string;
  disabled?: boolean;
  /** เรียกเมื่อผู้ใช้เลือก/กรอกวันที่นอกช่วง min–max */
  onInvalidDate?: () => void;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseMinMax(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function ThaiDatePicker({
  value,
  onChange,
  className,
  placeholder = "วว/ดด/ปปปป",
  id,
  minDate,
  maxDate,
  disabled,
  onInvalidDate,
}: ThaiDatePickerProps) {
  const selected = value ? new Date(value) : null;
  const min = parseMinMax(minDate);
  const max = parseMinMax(maxDate);

  const handleChange = (d: Date | null) => {
    if (!d) {
      onChange("");
      return;
    }
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    if (min && normalized < min) {
      onInvalidDate?.();
      return;
    }
    if (max && normalized > max) {
      onInvalidDate?.();
      return;
    }
    onChange(toISODate(normalized));
  };

  return (
    <DatePicker
      id={id}
      selected={selected && !isNaN(selected.getTime()) ? selected : null}
      onChange={handleChange}
      minDate={min}
      maxDate={max}
      disabled={disabled}
      filterDate={(date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        if (min && d < min) return false;
        if (max && d > max) return false;
        return true;
      }}
      dateFormat="dd/MM/yyyy"
      locale="th"
      placeholderText={placeholder}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      autoComplete="off"
      className={cn(
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      wrapperClassName="w-full"
    />
  );
}
