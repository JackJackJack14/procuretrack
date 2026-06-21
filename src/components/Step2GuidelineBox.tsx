import {
  STEP2_GUIDELINE_ACTION,
  STEP2_GUIDELINE_DURATION,
  STEP2_GUIDELINE_WARNING,
} from "@/lib/step2-guideline";

export function Step2GuidelineBox() {
  return (
    <div className="mb-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">{STEP2_GUIDELINE_ACTION}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">⏱ ระยะเวลาดำเนินการ</h3>
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">{STEP2_GUIDELINE_DURATION}</p>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวัง</h3>
        <p className="mt-2 text-sm leading-relaxed text-red-700">{STEP2_GUIDELINE_WARNING}</p>
      </section>
    </div>
  );
}
