import { supabase } from "@/integrations/supabase/client";
import { uploadStepDocument, type ProjectDocRef } from "@/lib/doc-upload";
import {
  buildStep10InspectionRows,
  loadStep10FormFromNote,
  loadStep9FormFromNote,
  parseStepNote,
  resolveProjectTotalInstallmentCount,
  serializeStepNote,
  type Step10InspectionRow,
  type Step10ProjectType,
} from "@/lib/step-form";
import {
  STEP10_INSTALLMENT_DOC,
  computeStep10InstallmentPlannedDates,
  isStep10InspectionBeforeDelivery,
  isStep10RowInspectionPassed,
} from "@/lib/step10-contract";
import { formatThaiDateSlash } from "@/lib/utils";

export const CONSTRUCTION_TRACKING_MENU_LABEL = "ติดตามงานก่อสร้าง";

/** ข้อมูลประเภทงานหลักจากตาราง projects (ระบุตั้งแต่สร้างโครงการ / ขั้นตอนที่ 1) */
export type ProjectWorkTypeSource = {
  project_type?: string | null;
};

/**
 * แปลงประเภทโครงการ e-GP → โหมดขั้นตอนที่ 10 (construction / general)
 */
export function resolveProjectWorkType(project: ProjectWorkTypeSource): Step10ProjectType {
  const type = project.project_type?.trim() ?? "";
  return type === "จ้างก่อสร้าง" ? "construction" : "general";
}

/** โครงการจ้างก่อสร้าง — อิง projects.project_type เท่านั้น */
export function isProjectConstructionWork(project: ProjectWorkTypeSource): boolean {
  return project.project_type?.trim() === "จ้างก่อสร้าง";
}

export function projectWorkTypeLabel(type: Step10ProjectType): string {
  return type === "construction"
    ? "โครงการประเภทงานก่อสร้าง"
    : "โครงการทั่วไป (ซื้อ/จ้าง)";
}

export type ConstructionInstallmentFeed = {
  installment_no: number;
  /** วันที่คู่สัญญากื่นหนังสือส่งมอบงาน */
  delivery_letter_date: string;
  /** วันที่ผู้ควบคุมงานรายงานผลสำเร็จ */
  supervisor_report_date: string;
  site_diary: string;
  site_obstacles: string;
};

export function isSupervisorReportBeforeDelivery(
  deliveryLetterDate: string,
  supervisorReportDate: string,
): boolean {
  return isStep10InspectionBeforeDelivery(deliveryLetterDate, supervisorReportDate);
}

export function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ความคืบหน้าภาพรวม 0–100% จากงวดที่ตรวจรับผ่านแล้ว */
export function computeConstructionPhysicalProgress(
  rows: Step10InspectionRow[],
  totalInstallments: number,
): number {
  const total = Math.max(1, Math.floor(totalInstallments));
  const passed = rows.filter(isStep10RowInspectionPassed).length;
  return Math.round((passed / total) * 100);
}

/** เปอร์เซ็นต์แผน S-Curve ตามลำดับงวด */
export function computeScurvePlannedPercent(
  installmentNo: number,
  totalInstallments: number,
): number {
  const total = Math.max(1, Math.floor(totalInstallments));
  const n = Math.max(1, Math.min(total, Math.floor(installmentNo)));
  return Math.round((n / total) * 100);
}

export type ConstructionDueWarning = {
  installment_no: number;
  planned_completion_date: string;
  days_until_due: number;
};

/** แจ้งเตือนงวดที่ใกล้ครบกำหนดส่งมอบ (ภายใน 7 วันปฏิทิน) */
export function computeConstructionDueWarnings(
  rows: Step10InspectionRow[],
): ConstructionDueWarning[] {
  const today = todayLocalISO();
  const warnings: ConstructionDueWarning[] = [];
  for (const row of rows) {
    const planned = row.planned_completion_date?.trim() ?? "";
    if (!planned || row.delivery_date?.trim() || isStep10RowInspectionPassed(row)) continue;
    if (planned < today) continue;
    const days = countCalendarDaysBetween(today, planned);
    if (days >= 0 && days <= 7) {
      warnings.push({
        installment_no: row.installment_no,
        planned_completion_date: planned,
        days_until_due: days,
      });
    }
  }
  return warnings;
}

function countCalendarDaysBetween(fromISO: string, toISO: string): number {
  const from = parseLocalISODate(fromISO);
  const to = parseLocalISODate(toISO);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function parseLocalISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatConstructionDueWarning(w: ConstructionDueWarning): string {
  const dateLabel = formatThaiDateSlash(w.planned_completion_date);
  if (w.days_until_due === 0) {
    return `งวดที่ ${w.installment_no}: ครบกำหนดส่งมอบวันนี้ (${dateLabel})`;
  }
  return `งวดที่ ${w.installment_no}: ใกล้ครบกำหนดส่งมอบใน ${w.days_until_due} วัน (${dateLabel})`;
}

export type ConstructionStatusBadge = {
  installment_no: number;
  type: "obstacle" | "behind_plan";
  label: string;
  tone: "warning" | "destructive";
};

export function computeConstructionStatusBadges(
  rows: Step10InspectionRow[],
  totalInstallments: number,
): ConstructionStatusBadge[] {
  const badges: ConstructionStatusBadge[] = [];
  const total = Math.max(1, Math.floor(totalInstallments));
  for (const row of rows) {
    if (row.site_obstacles?.trim()) {
      badges.push({
        installment_no: row.installment_no,
        type: "obstacle",
        label: `งวดที่ ${row.installment_no}: มีอุปสรรคหน้างาน — ${row.site_obstacles.trim()}`,
        tone: "warning",
      });
    }
    const plannedPct = computeScurvePlannedPercent(row.installment_no, total);
    const actualPct = row.progress_pct ?? 0;
    if (
      actualPct > 0 &&
      actualPct < plannedPct - 5 &&
      !isStep10RowInspectionPassed(row)
    ) {
      badges.push({
        installment_no: row.installment_no,
        type: "behind_plan",
        label: `งวดที่ ${row.installment_no}: ผลงานจริง ${actualPct}% ช้ากว่าแผน S-Curve ${plannedPct}%`,
        tone: "destructive",
      });
    }
  }
  return badges;
}

type StepLike = { id?: string; step_number?: number; note?: string | null };

export function resolveConstructionInstallmentRows(
  steps: StepLike[],
  project: ProjectWorkTypeSource,
  plannedDates: string[] = [],
): Step10InspectionRow[] {
  const total = resolveProjectTotalInstallmentCount(steps);
  const step10 = steps.find((s) => s.step_number === 10);
  const form = loadStep10FormFromNote(step10?.note ?? null);
  return buildStep10InspectionRows(total, form.inspectionRows ?? [], plannedDates);
}

export function feedFromInspectionRow(row: Step10InspectionRow): ConstructionInstallmentFeed {
  return {
    installment_no: row.installment_no,
    delivery_letter_date: row.delivery_date?.trim() ?? "",
    supervisor_report_date: row.supervisor_report_date?.trim() ?? "",
    site_diary: row.site_diary?.trim() ?? "",
    site_obstacles: row.site_obstacles?.trim() ?? "",
  };
}

export async function saveConstructionInstallmentFeed(
  project: ProjectDocRef & { id: string },
  steps: StepLike[],
  feed: ConstructionInstallmentFeed,
  files?: { supervisorReport?: File; deliveryLetter?: File },
): Promise<boolean> {
  const step10 = steps.find((s) => s.step_number === 10);
  if (!step10?.id) return false;

  const { userNote, form } = parseStepNote(step10.note ?? null);
  const step10Form = form as ReturnType<typeof loadStep10FormFromNote>;
  const rows = [...(step10Form.inspectionRows ?? [])];
  const idx = rows.findIndex((r) => r.installment_no === feed.installment_no);
  const base =
    idx >= 0
      ? rows[idx]
      : {
          installment_no: feed.installment_no,
          planned_completion_date: "",
          delivery_date: "",
          inspection_date: "",
          progress_pct: null,
          progress_cumulative_units: null,
          inspector_note: "",
          installment_status: "",
        };

  const patched: Step10InspectionRow = {
    ...base,
    delivery_date: feed.delivery_letter_date.trim(),
    supervisor_report_date: feed.supervisor_report_date.trim(),
    site_diary: feed.site_diary.trim(),
    site_obstacles: feed.site_obstacles.trim(),
    construction_synced: true,
  };

  if (idx >= 0) rows[idx] = patched;
  else rows.push(patched);

  const nextNote = serializeStepNote(userNote, {
    checklist: step10Form.checklist,
    inspectionRows: rows,
    ...(step10Form.project_type != null ? { project_type: step10Form.project_type } : {}),
  });

  const { error } = await supabase
    .from("procurement_steps")
    .update({ note: nextNote })
    .eq("id", step10.id);
  if (error) return false;

  const n = feed.installment_no;
  if (files?.supervisorReport) {
    await uploadStepDocument(
      project,
      10,
      STEP10_INSTALLMENT_DOC.supervisorReport(n),
      files.supervisorReport,
    );
  }
  if (files?.deliveryLetter) {
    await uploadStepDocument(
      project,
      10,
      STEP10_INSTALLMENT_DOC.deliveryLetter(n),
      files.deliveryLetter,
    );
  }

  return true;
}

export type ConstructionProjectSummary = {
  id: string;
  name: string;
  project_code: string;
  budget: number;
  current_step: number;
  status: string;
  physicalProgress: number;
  dueWarnings: ConstructionDueWarning[];
  totalInstallments: number;
};

export function buildConstructionProjectSummary(
  project: ProjectWorkTypeSource & {
    id: string;
    name: string;
    project_code: string;
    budget: number;
    current_step: number;
    status: string;
  },
  steps: StepLike[],
): ConstructionProjectSummary | null {
  if ((project.current_step ?? 0) < 10) return null;
  if (!isProjectConstructionWork(project)) return null;

  const step9 = steps.find((s) => s.step_number === 9);
  const schedule = loadStep9FormFromNote(step9?.note ?? null).contractSchedule;
  const plannedDates = computeStep10InstallmentPlannedDates(
    schedule?.work_start_date ?? "",
    schedule?.contract_duration_days,
    resolveProjectTotalInstallmentCount(steps),
  );
  const rows = resolveConstructionInstallmentRows(steps, project, plannedDates);
  const total = resolveProjectTotalInstallmentCount(steps);

  return {
    id: project.id,
    name: project.name,
    project_code: project.project_code,
    budget: Number(project.budget ?? 0),
    current_step: project.current_step,
    status: project.status,
    physicalProgress: computeConstructionPhysicalProgress(rows, total),
    dueWarnings: computeConstructionDueWarnings(rows),
    totalInstallments: total,
  };
}
