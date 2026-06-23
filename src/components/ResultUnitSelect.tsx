import { useEffect, useState } from "react";
import {
  PROJECT_RESULT_UNIT_OPTIONS,
  PROJECT_RESULT_UNIT_OTHER,
  getResultUnitDropdownValue,
  isPresetResultUnit,
} from "@/lib/project-profile";

type ResultUnitSelectProps = {
  value: string;
  onChange: (value: string) => void;
  /** true เมื่อเลือก «อื่น ๆ» แต่ยังไม่ได้พิมพ์หน่วย — ใช้ล็อกปุ่ม Submit */
  onOtherModeChange?: (otherPending: boolean) => void;
  disabled?: boolean;
  inputClassName?: string;
  hint?: string;
};

/** Dropdown หน่วยวัดผลสัมฤทธิ์ — preset + «อื่น ๆ (พิมพ์ระบุเอง)» */
export function ResultUnitSelect({
  value,
  onChange,
  onOtherModeChange,
  disabled,
  inputClassName,
  hint,
}: ResultUnitSelectProps) {
  const [otherActive, setOtherActive] = useState(
    () => getResultUnitDropdownValue(value) === PROJECT_RESULT_UNIT_OTHER,
  );

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed && isPresetResultUnit(trimmed)) {
      setOtherActive(false);
      return;
    }
    if (trimmed && !isPresetResultUnit(trimmed)) {
      setOtherActive(true);
      return;
    }
    if (!trimmed && !otherActive) {
      onOtherModeChange?.(false);
    }
  }, [value, otherActive, onOtherModeChange]);

  useEffect(() => {
    onOtherModeChange?.(otherActive && !value.trim());
  }, [otherActive, value, onOtherModeChange]);

  const selectValue = otherActive
    ? PROJECT_RESULT_UNIT_OTHER
    : getResultUnitDropdownValue(value);

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            setOtherActive(false);
            onChange("");
          } else if (next === PROJECT_RESULT_UNIT_OTHER) {
            setOtherActive(true);
            onChange("");
          } else {
            setOtherActive(false);
            onChange(next);
          }
        }}
        disabled={disabled}
        className={inputClassName}
      >
        <option value="">— เลือกหน่วย —</option>
        {PROJECT_RESULT_UNIT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        <option value={PROJECT_RESULT_UNIT_OTHER}>อื่น ๆ (พิมพ์ระบุเอง)</option>
      </select>
      {otherActive && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ระบุหน่วยวัด เช่น ตัน, ลบ.ม."
          disabled={disabled}
          className={inputClassName}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
