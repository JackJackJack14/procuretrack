import { useEffect, useState } from "react";
import {
  formatBudgetInput,
  formatCurrencyDisplay,
  logCurrencyRawInput,
  parseCurrencyForDatabase,
} from "@/lib/currency-format";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** แสดงบรรทัดยืนยันจำนวนเงินที่ฟอร์แมตแล้วใต้ช่องกรอก */
  showFormattedHint?: boolean;
};

/** ช่องกรอกจำนวนเงิน — ฟอร์แมตลูกน้ำ real-time, รับเฉพาะตัวเลข 0-9 */
export function CurrencyInput({
  value,
  onChange,
  readOnly = false,
  placeholder = "0",
  className,
  showFormattedHint = false,
}: Props) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (value == null || value <= 0) {
      setDisplay("");
      return;
    }
    setDisplay(formatBudgetInput(String(value)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    logCurrencyRawInput(raw);
    const digitsOnly = raw.replace(/[^\d]/g, "");
    const formatted = digitsOnly ? formatBudgetInput(digitsOnly) : "";
    setDisplay(formatted);
    onChange(parseCurrencyForDatabase(formatted || raw));
  };

  if (readOnly) {
    return (
      <span className={className ?? "text-sm font-medium tabular-nums"}>
        {value != null && value > 0 ? formatCurrencyDisplay(value) : "—"}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showFormattedHint && value != null && value > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatCurrencyDisplay(value)} บาท
        </p>
      )}
    </div>
  );
}
