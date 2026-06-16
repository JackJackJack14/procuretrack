import { AlertTriangle } from "lucide-react";

type Props = {
  show: boolean;
  progressPct: number;
  issues?: string[];
};

/** แบนเนอร์เตือน Strict Lock — แสดงเมื่อยังไม่พร้อมไปขั้นถัดไป */
export function ComplianceGateBanner({ show, progressPct, issues = [] }: Props) {
  if (!show) return null;

  return (
    <div
      className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 space-y-2"
      role="alert"
    >
      <p className="text-sm font-semibold text-destructive flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        ยังไม่สามารถไปขั้นตอนถัดไปได้ — ความพร้อม {progressPct}% (ต้อง 100%)
      </p>
      <p className="text-xs text-destructive/90 leading-relaxed">
        ปุ่ม «บันทึกร่าง» บันทึกข้อมูลตัวอักษร/ตัวเลขได้ตลอด · ปุ่ม «บันทึกและไปขั้นตอนถัดไป»
        ล็อกจนกว่าจะแนบหลักฐานครบทุกข้อ
      </p>
      {issues.length > 0 && (
        <ul className="text-xs text-destructive/90 list-disc list-inside space-y-0.5">
          {issues.slice(0, 5).map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
          {issues.length > 5 && <li>และอีก {issues.length - 5} รายการ...</li>}
        </ul>
      )}
    </div>
  );
}
