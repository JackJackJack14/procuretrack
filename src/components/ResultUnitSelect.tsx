import {
  PROJECT_RESULT_UNIT_OPTIONS,
  PROJECT_RESULT_UNIT_OTHER,
  getResultUnitDropdownValue,
} from "@/lib/project-profile";

type ResultUnitSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputClassName?: string;
  hint?: string;
};

/** Dropdown หน่วยวัดผลสัมฤทธิ์ — preset + «อื่น ๆ (พิมพ์ระบุเอง)» */
export function ResultUnitSelect({
  value,
  onChange,
  disabled,
  inputClassName,
  hint,
}: ResultUnitSelectProps) {
  const selectValue = getResultUnitDropdownValue(value);
  const showCustom = selectValue === PROJECT_RESULT_UNIT_OTHER;

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") onChange("");
          else if (next === PROJECT_RESULT_UNIT_OTHER) onChange("");
          else onChange(next);
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
      {showCustom && (
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
