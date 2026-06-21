import {
  STEP5_GUIDELINE_ACTION_ITEMS,
  STEP5_GUIDELINE_DURATION_ITEMS,
  STEP5_GUIDELINE_WARNING_ITEMS,
} from "@/lib/step5-guideline";

export function Step5GuidelineBox() {
  return (
    <div className="mb-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
          {STEP5_GUIDELINE_ACTION_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">⏱ ระยะเวลาดำเนินการ</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
          {STEP5_GUIDELINE_DURATION_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวังสูงสุด</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-red-700">
          {STEP5_GUIDELINE_WARNING_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
