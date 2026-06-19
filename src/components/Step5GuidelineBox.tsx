import { useEffect } from "react";
import {
  STEP5_GUIDELINE_DURATION,
  STEP5_GUIDELINE_TODO,
  STEP5_GUIDELINE_WARNINGS,
} from "@/lib/step5-guideline";

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

export function Step5GuidelineBox() {
  useEffect(() => {
    console.log(
      "📘 [GUIDELINE RENDER DEBUG] Step 5 Legally Compliant Guidelines Initialized Successfully.",
    );
  }, []);

  return (
    <div
      className="rounded-lg p-4 mb-4 space-y-4"
      style={{
        backgroundColor: "#EFF6FF",
        borderLeft: "4px solid #2563EB",
      }}
    >
      <section>
        <h3 className="font-semibold text-foreground text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <GuidelineBulletList items={STEP5_GUIDELINE_TODO} />
      </section>

      <section className="rounded-md border border-blue-200/80 bg-white/60 px-3 py-3">
        <h3 className="font-semibold text-foreground text-sm">⏱ ระยะเวลาดำเนินการ</h3>
        <GuidelineBulletList items={STEP5_GUIDELINE_DURATION} />
      </section>

      <section className="rounded-md border border-red-300 bg-red-50 px-3 py-3">
        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวังสูงสุด</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-red-600">
          {STEP5_GUIDELINE_WARNINGS.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="shrink-0 font-semibold text-red-700">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
