import { isSpecificMethodShortWorkflow } from "@/lib/dynamic-stepper";
import { addWorkdays, parseISODateLocal, toISODate } from "@/lib/workdays";

type TimelineStepRow = {
  step_number: number;
  completed_at: string | null;
};

export type TimelineEstimationItem = {
  stepNumber: number;
  date: Date | null;
  estimated: boolean;
  isDone: boolean;
  isCurrent: boolean;
};

/**
 * จำนวนวันทำการมาตรฐานต่อขั้น (backend step) — สำหรับประมาณการล่วงหน้า
 * อ้างอิงจากขั้นก่อนหน้าแบบลูกโซ่ (Global Auto-Estimation)
 */
export function getGlobalTimelineEstimationWorkdays(
  method: string,
  backendStepNumber: number,
): number {
  if (isSpecificMethodShortWorkflow(method)) {
    switch (backendStepNumber) {
      case 2:
        return 2;
      case 4:
        return 1;
      case 5:
        return 5;
      case 10:
        return 5;
      default:
        return 0;
    }
  }

  switch (backendStepNumber) {
    case 2:
      return 1;
    case 3:
      return 3;
    case 4:
      return 3;
    case 5:
      return 3;
    case 6:
      return 7;
    case 7:
      return 7;
    case 8:
      return 7;
    case 9:
      return 7;
    case 10:
      return 7;
    default:
      return 0;
  }
}

function hasRecordedActualDate(item: TimelineEstimationItem): boolean {
  return !!item.date && !item.estimated;
}

/**
 * เติมวันที่ประมาณการให้ขั้นตอนที่ยังไม่มีวันจริง — บวกวันทำการจากขั้นก่อนหน้าแบบลูกโซ่
 */
export function applyGlobalTimelineAutoEstimation(
  items: TimelineEstimationItem[],
  method: string,
  steps: TimelineStepRow[],
): TimelineEstimationItem[] {
  const sorted = [...items].sort((a, b) => a.stepNumber - b.stepNumber);
  let cursor: Date | null = null;

  return sorted.map((item) => {
    const stepRecord = steps.find((s) => s.step_number === item.stepNumber);
    const completed = !!stepRecord?.completed_at;

    if (hasRecordedActualDate(item) || (completed && item.date)) {
      cursor = item.date ? new Date(item.date.getTime()) : cursor;
      return {
        ...item,
        estimated: false,
        isDone: completed || item.isDone,
      };
    }

    if (item.date && item.estimated) {
      cursor = new Date(item.date.getTime());
      return item;
    }

    if (cursor) {
      const workdays = getGlobalTimelineEstimationWorkdays(method, item.stepNumber);
      if (workdays > 0) {
        const next = addWorkdays(cursor, workdays);
        cursor = next;
        return {
          ...item,
          date: parseISODateLocal(toISODate(next)),
          estimated: true,
          isDone: completed,
        };
      }
    }

    return item;
  });
}
