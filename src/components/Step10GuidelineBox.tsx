import {
  STEP10_GUIDELINE_ACTION_TEXT,
  STEP10_GUIDELINE_WARNING_AUDIT,
  STEP10_SCHEDULE_INCOMPLETE_MSG,
} from "@/lib/step10-guideline";
import { formatThaiDateSlash } from "@/lib/utils";

type Props = {
  contractStartDate?: string | null;
  contractEndDate?: string | null;
};

/** Guideline ขั้นตอนที่ 10 — บริหารสัญญาและตรวจรับพัสดุ (ข้อ 176–179) */
export function Step10GuidelineBox({ contractStartDate, contractEndDate }: Props) {
  const startISO = contractStartDate?.trim() ?? "";
  const endISO = contractEndDate?.trim() ?? "";
  const hasSchedule = !!startISO && !!endISO;

  return (
    <div className="mb-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 สิ่งที่ต้องดำเนินการในขั้นตอนนี้</h3>
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">{STEP10_GUIDELINE_ACTION_TEXT}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">⏱️ กรอบเวลาและเดดไลน์สัญญารวม</h3>
        {hasSchedule ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              <span className="text-muted-foreground">วันเริ่มต้นสัญญา (จากขั้นตอนที่ 9):</span>{" "}
              <span className="font-semibold text-blue-700 tabular-nums">
                {formatThaiDateSlash(startISO)}
              </span>
            </li>
            <li>
              <span className="text-muted-foreground">วันสิ้นสุดสัญญา (จากขั้นตอนที่ 9):</span>{" "}
              <span className="font-semibold text-blue-700 tabular-nums">
                {formatThaiDateSlash(endISO)}
              </span>
            </li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {STEP10_SCHEDULE_INCOMPLETE_MSG}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">
          ⚠️ ข้อควรระวังสูงสุด (สตง. ตรวจสอบอย่างเคร่งครัด)
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-red-700">{STEP10_GUIDELINE_WARNING_AUDIT}</p>
      </section>
    </div>
  );
}
