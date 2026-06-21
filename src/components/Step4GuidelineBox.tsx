import { getStep4TimelineDisplayLines, type Step4Timeline } from "@/lib/step-form";

import {

  STEP4_GUIDELINE_ACTION,

  STEP4_GUIDELINE_WARNING,

  STEP4_SCHEDULE_EXTENSION_NOTE,

  STEP4_SCHEDULE_INCOMPLETE_MSG,

  STEP4_TIMELINE_CONNECTOR_BADGE,

  STEP4_TIMELINE_NODE1_TITLE,

  STEP4_TIMELINE_NODE2_DETAIL_PREFIX,

  STEP4_TIMELINE_NODE2_DETAIL_SUFFIX,

  STEP4_TIMELINE_NODE2_TITLE,

} from "@/lib/step4-guideline";

import { formatThaiDateSlash } from "@/lib/utils";



type Props = {

  step4Timeline?: Step4Timeline | null;

};



type Step4TimelineTrackProps = {

  bidSubmissionEndISO: string;

  committeeReviewDeadlineISO: string;

};



function Step4TimelineTrack({

  bidSubmissionEndISO,

  committeeReviewDeadlineISO,

}: Step4TimelineTrackProps) {

  const committeeDeadlineLabel = formatThaiDateSlash(committeeReviewDeadlineISO);



  return (

    <div className="mt-4 space-y-0">

      <div className="flex gap-4">

        <div className="flex flex-col items-center shrink-0 w-5">

          <span

            className="h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-blue-100"

            aria-hidden

          />

          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-blue-400 to-orange-400 my-1" />

        </div>

        <div className="pb-5">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            จุดเริ่มต้น

          </p>

          <p className="text-sm font-semibold text-slate-800 mt-0.5">

            {STEP4_TIMELINE_NODE1_TITLE}

          </p>

          <p className="text-lg font-bold text-blue-700 tabular-nums mt-1">

            {formatThaiDateSlash(bidSubmissionEndISO)}

          </p>

        </div>

      </div>



      <div className="flex gap-4 ml-0.5 pb-1">

        <div className="flex flex-col items-center shrink-0 w-4">

          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 whitespace-nowrap">

            {STEP4_TIMELINE_CONNECTOR_BADGE}

          </span>

          <span className="flex-1 w-0.5 min-h-[1.5rem] bg-orange-300 my-1" />

        </div>

      </div>



      <div className="flex gap-4">

        <div className="flex flex-col items-center shrink-0 w-5">

          <span

            className="h-3.5 w-3.5 rounded-full bg-orange-500 ring-4 ring-orange-100"

            aria-hidden

          />

        </div>

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            เดดไลน์

          </p>

          <p className="text-sm font-semibold text-slate-800 mt-0.5">

            {STEP4_TIMELINE_NODE2_TITLE}

          </p>

          <p className="text-sm text-slate-700 leading-relaxed mt-1">

            {STEP4_TIMELINE_NODE2_DETAIL_PREFIX}{" "}

            <span className="text-lg font-bold text-orange-700 tabular-nums">

              {committeeDeadlineLabel}

            </span>{" "}

            {STEP4_TIMELINE_NODE2_DETAIL_SUFFIX}

          </p>

        </div>

      </div>



      <p className="mt-4 text-sm text-slate-600 leading-relaxed italic">

        *{STEP4_SCHEDULE_EXTENSION_NOTE}*

      </p>

    </div>

  );

}



export function Step4GuidelineBox({ step4Timeline }: Props) {

  const timeline = step4Timeline ?? {

    bidPeriodStartISO: "",

    bidPeriodWorkdays: null,

    bidSubmissionEndISO: "",

    committeeReviewDeadlineISO: "",

  };

  const hasTimeline = !!getStep4TimelineDisplayLines(timeline);



  return (

    <div className="mb-4 space-y-4">

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">

        <h3 className="font-semibold text-slate-900 text-sm">📘 คำแนะนำตามระเบียบพัสดุฯ (ข้อ 22)</h3>

        <p className="mt-3 text-sm text-slate-700 leading-relaxed">{STEP4_GUIDELINE_ACTION}</p>

      </section>



      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">

        <h3 className="font-semibold text-slate-900 text-sm">⏱ กำหนดการ (คำนวณอัตโนมัติ)</h3>

        {hasTimeline ? (

          <Step4TimelineTrack

            bidSubmissionEndISO={timeline.bidSubmissionEndISO}

            committeeReviewDeadlineISO={timeline.committeeReviewDeadlineISO}

          />

        ) : (

          <p className="mt-3 text-sm text-slate-700 leading-relaxed">{STEP4_SCHEDULE_INCOMPLETE_MSG}</p>

        )}

      </section>



      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">

        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวัง</h3>

        <p className="mt-2 text-sm leading-relaxed text-red-700">{STEP4_GUIDELINE_WARNING}</p>

      </section>

    </div>

  );

}


