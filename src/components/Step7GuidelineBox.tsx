import {
  STEP7_GUIDELINE_DURATION,
  STEP7_GUIDELINE_TIMELINE_NOTE,
  STEP7_GUIDELINE_TODO,
  STEP7_GUIDELINE_WARNING,
} from "@/lib/step7-guideline";
import {
  computeAppealDeadlineISO,
  computeContractNotificationDeadlineISO,
  CONTRACT_NOTIFICATION_WORKDAYS,
} from "@/lib/workdays";
import { formatThaiDateSlash } from "@/lib/utils";

function GuidelineBulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="text-blue-500 shrink-0 font-bold">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type Step7TimelineTrackProps = {
  appealDeadlineISO: string;
  notificationDeadlineISO: string;
};

function Step7TimelineTrack({
  appealDeadlineISO,
  notificationDeadlineISO,
}: Step7TimelineTrackProps) {
  return (
    <div className="mt-4 space-y-0">
      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-blue-100"
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-blue-400 to-amber-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            จุดเริ่มต้น (Step 6)
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            วันที่พ้นระยะอุทธรณ์
          </p>
          <p className="text-lg font-bold text-blue-700 tabular-nums mt-1">
            {formatThaiDateSlash(appealDeadlineISO)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 ml-0.5">
        <div className="flex flex-col items-center shrink-0 w-4">
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            +{CONTRACT_NOTIFICATION_WORKDAYS} วันทำการ
          </span>
          <span className="flex-1 w-0.5 min-h-[1.5rem] bg-amber-300 my-1" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pb-4 self-center">
          {STEP7_GUIDELINE_TIMELINE_NOTE}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100"
            aria-hidden
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            เดดไลน์แนะนำ (ข้อ 161)
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            ต้องออกหนังสือแจ้งทำสัญญา
          </p>
          <p className="text-lg font-bold text-amber-700 tabular-nums mt-1">
            {formatThaiDateSlash(notificationDeadlineISO)}
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  /** วันที่ลงนามในประกาศผู้ชนะ — จากขั้นตอนที่ 5 (yyyy-mm-dd) ใช้คำนวณวันสิ้นสุดอุทธรณ์ */
  winnerAnnouncementDate?: string | null;
};

export function Step7GuidelineBox({ winnerAnnouncementDate }: Props) {
  console.log(
    "📝 [STEP 7 GUIDELINE UPDATED]: Infographic 3-card layout rendered with dynamic timeline.",
  );

  const announcementISO = winnerAnnouncementDate?.trim() ?? "";
  const appealDeadlineISO = announcementISO
    ? computeAppealDeadlineISO(announcementISO)
    : "";
  const notificationDeadlineISO = announcementISO
    ? computeContractNotificationDeadlineISO(announcementISO)
    : "";
  const hasTimeline =
    !!announcementISO && !!appealDeadlineISO && !!notificationDeadlineISO;

  return (
    <div className="mb-4 space-y-4">
      {/* Card 1 — Action */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <GuidelineBulletList items={STEP7_GUIDELINE_TODO} />
      </section>

      {/* Card 2 — Timeline */}
      <section className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">
          📅 กรอบกำหนดการของขั้นตอนนี้ (คำนวณจากระบบอัตโนมัติ)
        </h3>
        <div className="mt-2 space-y-2">
          <GuidelineBulletList items={STEP7_GUIDELINE_DURATION} />
        </div>
        {hasTimeline ? (
          <Step7TimelineTrack
            appealDeadlineISO={appealDeadlineISO}
            notificationDeadlineISO={notificationDeadlineISO}
          />
        ) : (
          <p className="mt-3 text-sm text-slate-500 leading-relaxed rounded-md bg-slate-50 border border-dashed border-slate-200 px-3 py-3">
            กรุณาบันทึกวันที่ลงนามในประกาศผู้ชนะในขั้นตอนที่ 5 และดำเนินการขั้นตอนที่ 6
            ก่อน — ระบบจะคำนวณวันสิ้นสุดอุทธรณ์และเดดไลน์แนะนำออกหนังสือแจ้งทำสัญญาให้อัตโนมัติ
          </p>
        )}
      </section>

      {/* Card 3 — Alert */}
      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">
          ⚠️ ข้อควรระวังสูงสุด (มาตรา 93/97)
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-red-700">{STEP7_GUIDELINE_WARNING}</p>
      </section>
    </div>
  );
}
