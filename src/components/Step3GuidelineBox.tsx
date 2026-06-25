import {

  formatBudgetBahtShort,

  getStep3HearingTier,

  getStep3TierAlert,

  type Step3SkipReason,

} from "@/lib/step3-hearing";

import {

  getStep3GuidelineAction,

  getStep3GuidelinePublicationCriteriaHeading,

  shouldShowStep3GuidelineTimeline,

  STEP3_GUIDELINE_RECORDING_BULLET_ITEMS,

  STEP3_GUIDELINE_WARNING,

  STEP3_TIMELINE_CONNECTOR_BADGE,

  STEP3_TIMELINE_NODE1_NOTE,

  STEP3_TIMELINE_NODE1_TITLE,

  STEP3_TIMELINE_NODE2_NOTE,

  STEP3_TIMELINE_NODE2_TITLE,

  STEP3_TIMELINE_NODE3_NOTE,

  STEP3_TIMELINE_NODE3_TITLE,

} from "@/lib/step3-guideline";

import {

  defaultPublicationEndISO,

  MIN_DRAFT_PUBLICATION_WORKDAYS,

} from "@/lib/workdays";

import { formatThaiDateSlash } from "@/lib/utils";



type Props = {

  budget: number;

  onSkip: (reason: Step3SkipReason) => void;

  onProceedHearing?: () => void;

  hearingProceed?: boolean;

  skipping?: boolean;

  readOnly?: boolean;

  /** วันที่เริ่มเผยแพร่ร่างประกาศ (yyyy-mm-dd) — ใช้แสดงวันที่บนเส้นไทม์ไลน์ */

  publicationStartDate?: string | null;

};



type Step3TimelineTrackProps = {

  publicationStartISO: string;

  minPublicationEndISO: string;

  publicationCriteriaHeading: string;

};



function Step3TimelineTrack({

  publicationStartISO,

  minPublicationEndISO,

  publicationCriteriaHeading,

}: Step3TimelineTrackProps) {

  const hasDates = !!publicationStartISO && !!minPublicationEndISO;



  return (

    <div className="mt-3 space-y-0">

      <p className="text-sm text-slate-700 leading-relaxed mb-4">

        {publicationCriteriaHeading}

      </p>



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

            จุดเริ่มต้น (Day 0)

          </p>

          <p className="text-sm font-semibold text-slate-800 mt-0.5">

            {STEP3_TIMELINE_NODE1_TITLE}

          </p>

          {hasDates && (

            <p className="text-lg font-bold text-slate-700 tabular-nums mt-1">

              {formatThaiDateSlash(publicationStartISO)}

            </p>

          )}

          <p className="text-xs text-slate-500 leading-relaxed mt-1">

            {STEP3_TIMELINE_NODE1_NOTE}

          </p>

        </div>

      </div>



      <div className="flex gap-4 ml-0.5">

        <div className="flex flex-col items-center shrink-0 w-4">

          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">

            {STEP3_TIMELINE_CONNECTOR_BADGE}

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

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            ระหว่างทาง

          </p>

          <p className="text-sm font-semibold text-slate-800 mt-0.5">

            {STEP3_TIMELINE_NODE2_TITLE}

          </p>

          <p className="text-xs text-slate-500 leading-relaxed mt-1">

            {STEP3_TIMELINE_NODE2_NOTE}

          </p>

        </div>

      </div>



      <div className="flex gap-4 ml-0.5 pb-1">

        <div className="flex flex-col items-center shrink-0 w-4">

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

          <p className="text-sm font-semibold text-slate-800 mt-0.5">

            {STEP3_TIMELINE_NODE3_TITLE}

          </p>

          {hasDates && (

            <p className="text-lg font-bold text-emerald-700 tabular-nums mt-1">

              {formatThaiDateSlash(minPublicationEndISO)}

            </p>

          )}

          <p className="text-xs text-slate-500 leading-relaxed mt-1">

            {STEP3_TIMELINE_NODE3_NOTE}

          </p>

        </div>

      </div>

    </div>

  );

}



export function Step3GuidelineBox({

  budget,

  onSkip,

  onProceedHearing,

  hearingProceed = false,

  skipping = false,

  readOnly = false,

  publicationStartDate,

}: Props) {

  const tier = getStep3HearingTier(budget);

  const alert = getStep3TierAlert(tier);

  const showDetailedGuide = shouldShowStep3GuidelineTimeline(tier, hearingProceed);

  const guidelineAction = getStep3GuidelineAction(budget);

  const publicationCriteriaHeading = getStep3GuidelinePublicationCriteriaHeading(budget);

  const publicationStartISO = publicationStartDate?.trim() ?? "";

  const minPublicationEndISO = publicationStartISO

    ? defaultPublicationEndISO(publicationStartISO, MIN_DRAFT_PUBLICATION_WORKDAYS)

    : "";



  return (

    <div data-compliance-target="step3_hearing_gate" className="mb-4 space-y-4">

      <p className="text-xs text-muted-foreground">

        วงเงินงบประมาณโครงการ: ฿{formatBudgetBahtShort(budget)} บาท

      </p>



      <div

        className="rounded-md px-3 py-2.5 text-sm font-medium"

        style={{

          backgroundColor: alert.bg,

          border: `1px solid ${alert.border}`,

          color: alert.text,

        }}

      >

        {alert.message}

      </div>



      {tier === "mandatory" && !readOnly && (

        <div

          className="rounded-md px-3 py-2 text-sm"

          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}

        >

          บังคับดำเนินการจัดฟังคำวิจารณ์ — ต้องกรอกข้อมูลและแนบหลักฐานครบก่อนปิดขั้นตอน

        </div>

      )}



      {tier === "discretionary" && !readOnly && (

        <div className="flex flex-wrap gap-2">

          <button

            type="button"

            disabled={skipping}

            onClick={() => onSkip("discretionary")}

            className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"

          >

            ⏭️ ข้ามขั้นตอนการฟังคำวิจารณ์ร่างประกาศ

          </button>

          {!hearingProceed && (

            <button

              type="button"

              onClick={onProceedHearing}

              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"

            >

              ดำเนินการจัดฟังคำวิจารณ์ร่างประกาศ

            </button>

          )}

        </div>

      )}



      {tier === "exempt" && !readOnly && (

        <button

          type="button"

          disabled={skipping}

          onClick={() => onSkip("exempt")}

          className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"

        >

          ⏭️ ข้ามขั้นตอนนี้อัตโนมัติ

        </button>

      )}



      {showDetailedGuide && (

        <>

          <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">

            <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>

            <p className="mt-3 text-sm text-slate-700 leading-relaxed">{guidelineAction}</p>

          </section>



          <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">

            <h3 className="font-semibold text-slate-900 text-sm">⏱ ไกด์ไลน์การบันทึกข้อมูล</h3>

            <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">

              {STEP3_GUIDELINE_RECORDING_BULLET_ITEMS.map((item) => (

                <li key={item}>{item}</li>

              ))}

            </ul>

            <Step3TimelineTrack

              publicationStartISO={publicationStartISO}

              minPublicationEndISO={minPublicationEndISO}

              publicationCriteriaHeading={publicationCriteriaHeading}

            />

          </section>



          <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">

            <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวัง</h3>

            <p className="mt-2 text-sm leading-relaxed text-red-700">{STEP3_GUIDELINE_WARNING}</p>

          </section>

        </>

      )}

    </div>

  );

}


