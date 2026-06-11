import {
  STEP7_GUIDELINE_DURATION,
  STEP7_GUIDELINE_TODO,
  STEP7_GUIDELINE_WARNING,
} from "@/lib/step7-guideline";
import {
  computeAppealDeadlineISO,
  computeContractNotificationDeadlineISO,
  CONTRACT_NOTIFICATION_WORKDAYS,
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
  /** วันที่ลงนามในประกาศผู้ชนะ — จากขั้นตอนที่ 5 (yyyy-mm-dd) ใช้คำนวณวันสิ้นสุดอุทธรณ์ */
  winnerAnnouncementDate?: string | null;
};

export function Step7GuidelineBox({ winnerAnnouncementDate }: Props) {
  const announcementISO = winnerAnnouncementDate?.trim() ?? "";
  const appealDeadlineISO = announcementISO
    ? computeAppealDeadlineISO(announcementISO)
    : "";
  const notificationDeadlineISO = announcementISO
    ? computeContractNotificationDeadlineISO(announcementISO)
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
        <GuidelineBulletList items={STEP7_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3">
        <h3 className="font-semibold text-foreground text-sm">
          ⏱ ระยะเวลาดำเนินการ (ระเบียบข้อ 161)
        </h3>
        <GuidelineBulletList items={STEP7_GUIDELINE_DURATION} />
      </section>

      <section className="rounded-md border border-blue-200/60 bg-white/50 px-3 py-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">
          📅 กรอบกำหนดการของขั้นตอนนี้ (คำนวณจากระบบอัตโนมัติ)
        </h3>
        {announcementISO && appealDeadlineISO && notificationDeadlineISO ? (
          <>
            <p className="text-sm text-foreground/90">
              <span className="text-muted-foreground">วันที่พ้นระยะอุทธรณ์ (จาก Step 6):</span>{" "}
              <span className="font-medium">{formatThaiDateSlash(appealDeadlineISO)}</span>
            </p>
            <p className="text-sm text-foreground/90">
              <span className="text-muted-foreground">
                ⏱ เดดไลน์ที่ต้องออกหนังสือแจ้งทำสัญญา:
              </span>{" "}
              <span className="font-medium text-primary">
                {formatThaiDateSlash(notificationDeadlineISO)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              คำนวณจากวันสิ้นสุดอุทธรณ์ ({formatThaiDateSlash(appealDeadlineISO)}) +{" "}
              {CONTRACT_NOTIFICATION_WORKDAYS} วันทำการ ไม่นับวันหยุดราชการ
              {" — "}
              {formatThaiDate(notificationDeadlineISO)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            กรุณาบันทึกวันที่ลงนามในประกาศผู้ชนะในขั้นตอนที่ 5 และดำเนินการขั้นตอนที่ 6
            ก่อน — ระบบจะคำนวณวันสิ้นสุดอุทธรณ์และเดดไลน์ออกหนังสือแจ้งทำสัญญาให้อัตโนมัติ
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
          {STEP7_GUIDELINE_WARNING}
        </p>
      </section>
    </div>
  );
}
