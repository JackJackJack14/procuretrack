import {
  STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS,
  STEP9_GUIDELINE_ACTION_ITEMS,
  STEP9_GUIDELINE_ARTICLE_98_WARNING,
  STEP9_GUIDELINE_TIMELINE_NOTE,
  STEP9_SCHEDULE_INCOMPLETE_MSG,
  computeStep9EgpDeadlineISO,
  formatStep9TimelineNode1Line,
  formatStep9TimelineNode2Line,
  formatStep9TimelineNode3Line,
} from "@/lib/step9-guideline";

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

type Step9TimelineTrackProps = {
  contractSignedDateISO: string;
  egpPublicationDateISO: string;
  egpDeadlineISO: string;
};

function Step9TimelineTrack({
  contractSignedDateISO,
  egpPublicationDateISO,
  egpDeadlineISO,
}: Step9TimelineTrackProps) {
  const hasPublication = !!egpPublicationDateISO?.trim();

  return (
    <div className="mt-4 space-y-0">
      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-emerald-400 to-amber-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            🟢 จุดเริ่มต้น
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            วันที่ลงนามสัญญาจริง
          </p>
          <p className="text-lg font-bold text-emerald-700 tabular-nums mt-1">
            {formatStep9TimelineNode1Line(contractSignedDateISO)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">ดึงมาจากขั้นตอนที่ 8</p>
        </div>
      </div>

      <div className="flex gap-4 ml-0.5">
        <div className="flex flex-col items-center shrink-0 w-4">
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            +{STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS} วันปฏิทิน
          </span>
          <span className="flex-1 w-0.5 min-h-[1.5rem] bg-amber-300 my-1" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pb-4 self-center">
          {STEP9_GUIDELINE_TIMELINE_NOTE}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className={`h-3.5 w-3.5 rounded-full ring-4 ${
              hasPublication
                ? "bg-amber-500 ring-amber-100"
                : "bg-slate-300 ring-slate-100"
            }`}
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-amber-400 to-red-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            🟡 วันที่ประกาศ หส.1 จริง
          </p>
          <p
            className={`mt-1 ${
              hasPublication
                ? "text-lg font-bold text-amber-700 tabular-nums"
                : "text-sm text-slate-500 italic"
            }`}
          >
            {formatStep9TimelineNode2Line(egpPublicationDateISO)}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-100"
            aria-hidden
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            🔴 เดดไลน์เส้นตาย
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            ต้องประกาศสาระสำคัญ (หส.1) ลง e-GP ภายใน (มาตรา 98)
          </p>
          <p className="text-lg font-bold text-red-700 tabular-nums mt-1">
            {formatStep9TimelineNode3Line(egpDeadlineISO)}
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            [เดดไลน์ หส.1] = [วันที่ลงนามสัญญาจริง] + {STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS}{" "}
            วันปฏิทิน — {STEP9_GUIDELINE_TIMELINE_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  /** วันที่ลงนามสัญญาจริง — จากขั้นตอนที่ 8 (yyyy-mm-dd) */
  contractSignedDate?: string | null;
  /** วันที่ประกาศ หส.1 จริง — จากฟอร์มขั้นตอนที่ 9 */
  egpPublicationDate?: string | null;
};

/** Guideline ขั้นตอนที่ 9 — บันทึกสาระสำคัญสัญญา (มาตรา 98) */
export function Step9GuidelineBox({ contractSignedDate, egpPublicationDate }: Props) {
  const signedISO = contractSignedDate?.trim() ?? "";
  const egpDeadlineISO = signedISO ? computeStep9EgpDeadlineISO(signedISO) ?? "" : "";
  const publicationISO = egpPublicationDate?.trim() ?? "";
  const hasScheduleDates = !!signedISO && !!egpDeadlineISO;

  return (
    <div className="mb-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <GuidelineBulletList items={STEP9_GUIDELINE_ACTION_ITEMS} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">
          ⏱️ การตรวจสอบกรอบเวลา (Dynamic Timeline)
        </h3>
        {hasScheduleDates ? (
          <Step9TimelineTrack
            contractSignedDateISO={signedISO}
            egpPublicationDateISO={publicationISO}
            egpDeadlineISO={egpDeadlineISO}
          />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {STEP9_SCHEDULE_INCOMPLETE_MSG}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวังสูงสุดตามมาตรา 98</h3>
        <p className="mt-2 text-sm leading-relaxed text-red-700">
          {STEP9_GUIDELINE_ARTICLE_98_WARNING}
        </p>
      </section>
    </div>
  );
}
