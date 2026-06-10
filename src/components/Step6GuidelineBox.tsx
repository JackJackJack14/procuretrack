import {
  STEP6_GUIDELINE_DURATION,
  STEP6_GUIDELINE_TODO,
  STEP6_GUIDELINE_WARNINGS,
} from "@/lib/step6-guideline";
import {
  computeAppealDeadlineISO,
  computeContractEarliestISO,
} from "@/lib/workdays";
import { formatThaiDate, formatThaiDateSlash } from "@/lib/utils";

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

export function Step6GuidelineBox({ winnerAnnouncementDate }: Props) {
  const announcementISO = winnerAnnouncementDate?.trim() ?? "";
  const appealDeadlineISO = announcementISO
    ? computeAppealDeadlineISO(announcementISO)
    : "";
  const contractEarliestISO = announcementISO
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
        <GuidelineBulletList items={STEP6_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3">
        <h3 className="font-semibold text-foreground text-sm">⏱ ระยะเวลา</h3>
        <GuidelineBulletList items={STEP6_GUIDELINE_DURATION} />
      </section>

      <section className="rounded-md border border-blue-200/60 bg-white/50 px-3 py-3 space-y-1">
        <h3 className="font-semibold text-foreground text-sm">📅 วันสิ้นสุดระยะอุทธรณ์</h3>
        {announcementISO && appealDeadlineISO ? (
          <>
            <p className="text-sm text-foreground/90">
              <span className="font-medium">{formatThaiDate(appealDeadlineISO)}</span>
              <span className="text-muted-foreground">
                {" "}
                ({formatThaiDateSlash(appealDeadlineISO)})
              </span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              คำนวณจากวันประกาศผลผู้ชนะใน Step 5 (
              {formatThaiDateSlash(announcementISO)}) + 7 วันทำการ ไม่นับวันหยุดราชการ
            </p>
            {contractEarliestISO && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                สามารถเริ่มลงนามในสัญญาได้ตั้งแต่{" "}
                <span className="font-medium text-foreground">
                  {formatThaiDateSlash(contractEarliestISO)}
                </span>{" "}
                เป็นต้นไป
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            กรุณาบันทึกวันที่ลงนามในประกาศผู้ชนะในขั้นตอนที่ 5 ก่อน — ระบบจะคำนวณวันสิ้นสุดอุทธรณ์ให้อัตโนมัติ
          </p>
        )}
      </section>

      <section
        className="rounded-md px-3 py-3"
        style={{ backgroundColor: "#FFF7ED", border: "1px solid #FDBA74" }}
      >
        <h3 className="font-semibold text-sm" style={{ color: "#C2410C" }}>
          ⚠️ ข้อควรระวัง
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed" style={{ color: "#9A3412" }}>
          {STEP6_GUIDELINE_WARNINGS.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
