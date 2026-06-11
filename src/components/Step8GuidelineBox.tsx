import {
  STEP8_GUIDELINE_DURATION,
  STEP8_GUIDELINE_TODO,
  STEP8_GUIDELINE_WARNING,
} from "@/lib/step8-guideline";
import {
  computeAppealDeadlineISO,
  computeContractEarliestISO,
} from "@/lib/workdays";
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
  /** วันที่ลงนามในประกาศผู้ชนะ — จากขั้นตอนที่ 5 (yyyy-mm-dd) */
  winnerAnnouncementDate?: string | null;
};

export function Step8GuidelineBox({ winnerAnnouncementDate }: Props) {
  const announcementISO = winnerAnnouncementDate?.trim() ?? "";
  const appealDeadlineISO = announcementISO
    ? computeAppealDeadlineISO(announcementISO)
    : "";
  const earliestSigningISO = announcementISO
    ? computeContractEarliestISO(announcementISO)
    : "";

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
        <GuidelineBulletList items={STEP8_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">⏱ ระยะเวลาดำเนินการ</h3>
        <GuidelineBulletList items={STEP8_GUIDELINE_DURATION} />
        {earliestSigningISO ? (
          <p className="text-sm text-foreground/90 mt-2">
            <span className="text-muted-foreground">
              📅 วันที่เริ่มลงนามสัญญาได้เร็วที่สุด:
            </span>{" "}
            <span className="font-medium text-primary">
              ตั้งแต่วันที่ {formatThaiDateSlash(earliestSigningISO)} เป็นต้นไป
            </span>
            {appealDeadlineISO && (
              <span className="block text-xs text-muted-foreground mt-1">
                คำนวณจากวันสิ้นสุดอุทธรณ์ ({formatThaiDateSlash(appealDeadlineISO)}) + 1 วันทำการ
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            กรุณาบันทึกขั้นตอนที่ 5–6 ก่อน — ระบบจะคำนวณวันเริ่มลงนามสัญญาได้เร็วที่สุดให้อัตโนมัติ
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
          {STEP8_GUIDELINE_WARNING}
        </p>
      </section>
    </div>
  );
}
