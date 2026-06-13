import {
  STEP10_GUIDELINE_DURATION_REG176,
  STEP10_GUIDELINE_TODO,
  STEP10_GUIDELINE_WARNING,
  STEP10_PENALTY_RATE_PERCENT,
  computeStep10ContractStatus,
} from "@/lib/step10-guideline";
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
  /** วันสิ้นสุดสัญญาตัวจริง — จาก Step 9 (yyyy-mm-dd) */
  contractEndDate?: string | null;
};

/** Guideline ขั้นตอนที่ 10 — บริหารสัญญาและตรวจรับงาน (ข้อ 176 / สตง.) */
export function Step10GuidelineBox({ contractEndDate }: Props) {
  const endISO = contractEndDate?.trim() ?? "";
  const contractStatus = endISO ? computeStep10ContractStatus(endISO) : null;

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
        <GuidelineBulletList items={STEP10_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">
          ⏱ ระยะเวลาดำเนินการ (ระเบียบข้อ 176)
        </h3>
        <GuidelineBulletList items={STEP10_GUIDELINE_DURATION_REG176} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">
          📅 กรอบกำหนดการของโครงการ (ระบบดีดอัตโนมัติ)
        </h3>
        {endISO ? (
          <ul className="mt-2 space-y-2 text-sm text-foreground/90 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-muted-foreground shrink-0">•</span>
              <span>
                <span className="text-muted-foreground">
                  วันสิ้นสุดสัญญาตัวจริง (จาก Step 9):
                </span>{" "}
                <span className="font-medium text-primary">
                  {formatThaiDateSlash(endISO)}
                </span>
              </span>
            </li>
            {contractStatus && (
              <li className="flex gap-2">
                <span className="text-muted-foreground shrink-0">•</span>
                <span>
                  <span className="text-muted-foreground">สถานะสัญญาปัจจุบัน:</span>{" "}
                  <span
                    className={`font-medium ${contractStatus.isOverdue ? "text-destructive" : "text-primary"}`}
                  >
                    {contractStatus.statusText}
                  </span>
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            กรุณาบันทึกวันเริ่มงานและระยะเวลาสัญญาในขั้นตอนที่ 9 ก่อน — ระบบจะคำนวณวันสิ้นสุดสัญญาและสถานะนับถอยหลังให้อัตโนมัติ
          </p>
        )}
      </section>

      <section
        className="rounded-md px-3 py-3"
        style={{ backgroundColor: "#FFF7ED", border: "1px solid #FDBA74" }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "#9A3412" }}>
          <span className="font-semibold" style={{ color: "#C2410C" }}>
            ⚠️ ข้อควรระวัง (จุดตาย สตง.):
          </span>{" "}
          {STEP10_GUIDELINE_WARNING}
          {contractStatus?.isOverdue && (
            <span className="block mt-2 font-medium" style={{ color: "#C2410C" }}>
              โครงการนี้เกินกำหนดแล้ว {contractStatus.daysOverdue} วันปฏิทิน — ค่าปรับรายวัน{" "}
              {STEP10_PENALTY_RATE_PERCENT.toFixed(2)}% ของมูลค่าสัญญาเริ่มนับทันที
            </span>
          )}
        </p>
      </section>
    </div>
  );
}
