import { forwardRef, useMemo } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import {
  formatThaiDateSlash,
  formatThaiMonthYear,
  parseLocalISODate,
  THAI_DATE_PICKER_PLACEHOLDER,
  toGregorianISODate,
} from "@/lib/thai-date";
import { cn } from "@/lib/utils";
import { isWorkday } from "@/lib/workdays";

registerLocale("th", th);

interface ThaiDatePickerProps {
  value?: string; // yyyy-mm-dd (Gregorian ISO — ค.ศ.)
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
  /** วันที่เลือกได้ตั้งแต่ (yyyy-mm-dd) — วันก่อนหน้าจะถูกปิดในปฏิทิน */
  minDate?: string;
  /** วันที่เลือกได้ไม่เกิน (yyyy-mm-dd) */
  maxDate?: string;
  /** อนุญาตเฉพาะวันทำการ (ข้ามเสาร์-อาทิตย์และวันหยุดราชการ) */
  workdaysOnly?: boolean;
  disabled?: boolean;
  /** เรียกเมื่อผู้ใช้เลือก/กรอกวันที่นอกช่วง min–max */
  onInvalidDate?: () => void;
}

function parseBoundary(iso?: string): Date | undefined {
  const d = parseLocalISODate(iso);
  if (!d) return undefined;
  d.setHours(0, 0, 0, 0);
  return d;
}

type ThaiDateInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  displayValue: string;
};

const ThaiDateInput = forwardRef<HTMLInputElement, ThaiDateInputProps>(
  function ThaiDateInput({ displayValue, className, onClick, onChange: _onChange, value: _value, ...props }, ref) {
    return (
      <input
        {...props}
        ref={ref}
        readOnly
        onClick={onClick}
        value={displayValue}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
    );
  },
);

export function ThaiDatePicker({
  value,
  onChange,
  className,
  placeholder = THAI_DATE_PICKER_PLACEHOLDER,
  id,
  minDate,
  maxDate,
  workdaysOnly = false,
  disabled,
  onInvalidDate,
}: ThaiDatePickerProps) {
  const selected = useMemo(() => parseLocalISODate(value), [value]);
  const min = parseBoundary(minDate);
  const max = parseBoundary(maxDate);
  const displayValue = value ? formatThaiDateSlash(value) : "";

  const customInput = useMemo(
    () => <ThaiDateInput displayValue={displayValue} className={className} id={id} />,
    [displayValue, className, id],
  );

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
    if (workdaysOnly && !isWorkday(normalized)) {
      onInvalidDate?.();
      return;
    }
    onChange(toGregorianISODate(normalized));
  };

  return (
    <DatePicker
      selected={selected}
      onChange={handleChange}
      minDate={min}
      maxDate={max}
      disabled={disabled}
      filterDate={(date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        if (min && d < min) return false;
        if (max && d > max) return false;
        if (workdaysOnly && !isWorkday(d)) return false;
        return true;
      }}
      locale="th"
      placeholderText={placeholder}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      autoComplete="off"
      customInput={customInput}
      wrapperClassName="w-full"
      renderYearContent={(year) => <span>{year + 543}</span>}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <button
            type="button"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            className="rounded p-1 hover:bg-muted disabled:opacity-40"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground">{formatThaiMonthYear(date)}</span>
          <button
            type="button"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            className="rounded p-1 hover:bg-muted disabled:opacity-40"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  );
}
