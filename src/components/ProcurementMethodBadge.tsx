import { METHOD_LABEL } from "@/lib/procurement";
import { isSpecificMethodShortWorkflow } from "@/lib/dynamic-stepper";

type ProcurementMethodBadgeProps = {
  method: string | null | undefined;
  className?: string;
};

/** ป้ายวิธีจัดซื้อจัดจ้าง — มุมขวาบนกล่องฟอร์ม */
export function ProcurementMethodBadge({
  method,
  className = "",
}: ProcurementMethodBadgeProps) {
  const label = METHOD_LABEL[method ?? ""] ?? method ?? "—";
  const isSpecific = isSpecificMethodShortWorkflow(method);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${
        isSpecific
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-sky-50 text-sky-700 border-sky-200"
      } ${className}`}
    >
      {label}
    </span>
  );
}
