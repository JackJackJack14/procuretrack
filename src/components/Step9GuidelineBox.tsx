import {
  STEP9_GUIDELINE_DURATION_REG162,
  STEP9_GUIDELINE_TODO,
  STEP9_GUIDELINE_WARNING,
  STEP9_EGP_DEADLINE_CALENDAR_DAYS,
  computeStep9EgpDeadlineISO,
} from "@/lib/step9-guideline";
import { formatThaiDateSlash } from "@/lib/utils";

function GuidelineBulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-foreground/90 leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-muted-foreground shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  /** วันที่ลงนามในสัญญาจริง — จาก Step 8 (yyyy-mm-dd) */
  contractSignedDate?: string | null;
};

/** Guideline ขั้นตอนที่ 9 — บันทึกสาระสำคัญสัญญา (ข้อ 162) */
export function Step9GuidelineBox({ contractSignedDate }: Props) {
  const signedISO = contractSignedDate?.trim() ?? "";
  const egpDeadlineISO = signedISO ? computeStep9EgpDeadlineISO(signedISO) : "";

  return (
    <div
      className="rounded-lg p-4 mb-4 space-y-4"
      style={{
        backgroundColor: "#EFF6FF",
        borderLeft: "4px solid #2563EB",
      }}
    >
      <section>
        <h3 className="font-semibold text-foreground text-sm">📋 คุณต้องทำในขั้นตอนนี้</h3>
        <GuidelineBulletList items={STEP9_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">
          ⏱ ระยะเวลาดำเนินการ (ระเบียบข้อ 162)
        </h3>
        <GuidelineBulletList items={STEP9_GUIDELINE_DURATION_REG162} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">
          📅 กรอบกำหนดการของโครงการนี้ (ระบบคำนวณอัตโนมัติ)
        </h3>
        {signedISO ? (
          <ul className="mt-2 space-y-2 text-sm text-foreground/90 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-muted-foreground shrink-0">•</span>
              <span>
                <span className="text-muted-foreground">วันที่ลงนามสัญญาจริง (จาก Step 8):</span>{" "}
                <span className="font-medium text-primary">
                  {formatThaiDateSlash(signedISO)}
                </span>
              </span>
            </li>
            {egpDeadlineISO && (
              <li className="flex gap-2">
                <span className="text-muted-foreground shrink-0">•</span>
                <span>
                  <span className="font-semibold text-amber-800">⚠️ เดดไลน์สุดท้ายที่ต้องคีย์ e-GP เสร็จ:</span>{" "}
                  <span className="font-medium text-primary">
                    {formatThaiDateSlash(egpDeadlineISO)}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    คำนวณจากวันลงนามสัญญา + {STEP9_EGP_DEADLINE_CALENDAR_DAYS} วันปฏิทิน
                    (นับรวมวันหยุดราชการ — ไม่ใช่วันทำการ)
                  </span>
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            กรุณาบันทึกวันที่ลงนามในสัญญาในขั้นตอนที่ 8 ก่อน — ระบบจะคำนวณเดดไลน์คีย์ e-GP ให้อัตโนมัติ
          </p>
        )}
      </section>

      <section
        className="rounded-md px-3 py-3"
        style={{ backgroundColor: "#FFF7ED", border: "1px solid #FDBA74" }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "#9A3412" }}>
          <span className="font-semibold" style={{ color: "#C2410C" }}>
            ⚠️ ข้อควรระวัง:
          </span>{" "}
          {STEP9_GUIDELINE_WARNING}
        </p>
      </section>
    </div>
  );
}
