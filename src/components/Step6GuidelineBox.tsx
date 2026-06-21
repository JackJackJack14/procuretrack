import {
  formatStep6AppealHolidayBridgeLabel,
  STEP6_GUIDELINE_ACTION_ITEMS,
  STEP6_GUIDELINE_SCHEDULE_STATIC_ITEMS,
  STEP6_GUIDELINE_WARNING,
  STEP6_SCHEDULE_INCOMPLETE_MSG,
} from "@/lib/step6-guideline";
import {
  APPEAL_PERIOD_WORKDAYS,
  computeAppealDeadlineISO,
  computeContractEarliestISO,
} from "@/lib/workdays";
import { formatThaiDateSlash } from "@/lib/utils";

type Props = {
  /** วันที่ลงนามในประกาศผู้ชนะ — จากขั้นตอนที่ 5 (yyyy-mm-dd) */
  winnerAnnouncementDate?: string | null;
};

type Step6TimelineTrackProps = {
  announcementISO: string;
  appealDeadlineISO: string;
  contractEarliestISO: string;
};

function Step6TimelineTrack({
  announcementISO,
  appealDeadlineISO,
  contractEarliestISO,
}: Step6TimelineTrackProps) {
  console.log(
    "🎨 [STEP 6 TIMELINE TRACK]: Successfully upgraded Step 6 timeline to visual node component.",
  );

  const holidayBridgeLabel = formatStep6AppealHolidayBridgeLabel(
    appealDeadlineISO,
    contractEarliestISO,
  );

  return (
    <div className="mt-4 space-y-0">
      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-slate-500 ring-4 ring-slate-100"
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-slate-400 to-blue-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            จุดเริ่มต้น (Step 5)
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            วันที่แจ้งผลให้ผู้เสนอราคาทราบ (Step 5)
          </p>
          <p className="text-lg font-bold text-slate-700 tabular-nums mt-1">
            {formatThaiDateSlash(announcementISO)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 ml-0.5">
        <div className="flex flex-col items-center shrink-0 w-4">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            +{APPEAL_PERIOD_WORKDAYS} วันทำการ
          </span>
          <span className="flex-1 w-0.5 min-h-[1.5rem] bg-blue-300 my-1" />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-blue-100"
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-blue-400 to-emerald-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-sm font-semibold text-slate-800 mt-0.5">📅 วันสิ้นสุดระยะอุทธรณ์</p>
          <p className="text-lg font-bold text-blue-700 tabular-nums mt-1">
            {formatThaiDateSlash(appealDeadlineISO)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 ml-0.5 pb-1">
        <div className="flex flex-col items-center shrink-0 w-4">
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            {holidayBridgeLabel}
          </span>
          <span className="flex-1 w-0.5 min-h-[1.5rem] bg-emerald-300 my-1" />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
            aria-hidden
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            จุดปลายทาง
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">วันที่เริ่มลงนามในสัญญาได้</p>
          <p className="text-lg font-bold text-emerald-700 tabular-nums mt-1">
            {formatThaiDateSlash(contractEarliestISO)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Step6GuidelineBox({ winnerAnnouncementDate }: Props) {
  const announcementISO = winnerAnnouncementDate?.trim() ?? "";
  const appealDeadlineISO = announcementISO
    ? computeAppealDeadlineISO(announcementISO)
    : "";
  const contractEarliestISO = announcementISO
    ? computeContractEarliestISO(announcementISO)
    : "";
  const hasScheduleDates =
    !!announcementISO && !!appealDeadlineISO && !!contractEarliestISO;

  return (
    <div className="mb-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
          {STEP6_GUIDELINE_ACTION_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">⏱ ระยะเวลาและกรอบกำหนดการ</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
          {STEP6_GUIDELINE_SCHEDULE_STATIC_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {hasScheduleDates ? (
          <Step6TimelineTrack
            announcementISO={announcementISO}
            appealDeadlineISO={appealDeadlineISO}
            contractEarliestISO={contractEarliestISO}
          />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {STEP6_SCHEDULE_INCOMPLETE_MSG}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวังสูงสุด</h3>
        <p className="mt-2 text-sm leading-relaxed text-red-700">{STEP6_GUIDELINE_WARNING}</p>
      </section>
    </div>
  );
}
