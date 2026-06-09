import {
  getStep4TimelineDisplayLines,
  type Step4Timeline,
} from "@/lib/step-form";
import {
  STEP4_GUIDELINE_TODO,
  STEP4_GUIDELINE_WARNING,
  STEP4_SCHEDULE_EXTENSION_NOTE,
  STEP4_SCHEDULE_INCOMPLETE_MSG,
} from "@/lib/step4-guideline";

type Props = {
  step4Timeline?: Step4Timeline | null;
};

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

export function Step4GuidelineBox({ step4Timeline }: Props) {
  const timeline = step4Timeline ?? {
    bidPeriodStartISO: "",
    bidPeriodWorkdays: null,
    bidSubmissionEndISO: "",
    committeeReviewDeadlineISO: "",
  };
  const timelineLines = getStep4TimelineDisplayLines(timeline);

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
        <GuidelineBulletList items={STEP4_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3">
        <h3 className="font-semibold text-foreground text-sm">⏱ กำหนดการ</h3>
        {timelineLines ? (
          <div className="mt-2 space-y-1.5 text-sm text-foreground/90 leading-relaxed">
            <p>{timelineLines.bidSubmissionEndLine}</p>
            <p>{timelineLines.committeeDeadlineLine}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {STEP4_SCHEDULE_INCOMPLETE_MSG}
          </p>
        )}
        <p className="mt-2.5 text-xs italic text-muted-foreground leading-relaxed border-t border-blue-100 pt-2.5">
          *{STEP4_SCHEDULE_EXTENSION_NOTE}*
        </p>
      </section>

      <section
        className="rounded-md px-3 py-3"
        style={{ backgroundColor: "#FFF7ED", border: "1px solid #FDBA74" }}
      >
        <h3 className="font-semibold text-sm" style={{ color: "#C2410C" }}>
          ⚠️ ข้อควรระวัง
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed" style={{ color: "#9A3412" }}>
          {STEP4_GUIDELINE_WARNING.map((item) => (
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
