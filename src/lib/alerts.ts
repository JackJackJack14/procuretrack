import { supabase } from "@/integrations/supabase/client";
import { STEP_DOCS_DETAILED } from "@/lib/procurement";
import { getMilestoneLabel } from "@/lib/egp-milestones";

export type AlertLevel = "red" | "yellow" | "blue";

export type Alert = {
  id: string;
  level: AlertLevel;
  projectId: string;
  projectName: string;
  title: string;
  detail: string;
  date: string; // ISO
};

const DAY = 24 * 60 * 60 * 1000;
const LEVEL_ORDER: Record<AlertLevel, number> = { red: 0, yellow: 1, blue: 2 };

export function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    const d = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (d !== 0) return d;
    return (b.date || "").localeCompare(a.date || "");
  });
}

export async function fetchAlerts(): Promise<Alert[]> {
  const now = Date.now();
  const alerts: Alert[] = [];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, current_step, status")
    .eq("status", "active");

  const projectMap = new Map<string, { id: string; name: string; current_step: number }>();
  (projects ?? []).forEach((p: any) => projectMap.set(p.id, p));
  const projectIds = Array.from(projectMap.keys());

  // ===== RED 1: progress_diff < -10
  if (projectIds.length) {
    const { data: latestReports } = await supabase
      .from("construction_reports")
      .select("project_id, progress_diff, submitted_at, report_date")
      .in("project_id", projectIds)
      .order("submitted_at", { ascending: false });

    const seen = new Set<string>();
    (latestReports ?? []).forEach((r: any) => {
      if (seen.has(r.project_id)) return;
      seen.add(r.project_id);
      const diff = Number(r.progress_diff ?? 0);
      if (diff < -10) {
        const p = projectMap.get(r.project_id)!;
        const pct = Math.abs(Math.round(diff));
        alerts.push({
          id: `slow-${p.id}`,
          level: "red",
          projectId: p.id,
          projectName: p.name,
          title: "ผลงานช้ากว่าแผน",
          detail: `${p.name} ผลงานช้ากว่าแผน ${pct}% ต้องออกหนังสือเร่งรัดผู้รับจ้างทันที`,
          date: r.submitted_at,
        });
      }
    });
  }

  // ===== RED 2: invoices pending payment > 30 days
  const cutoff30 = new Date(now - 30 * DAY).toISOString();
  const { data: pendingInspections } = await supabase
    .from("inspections")
    .select("id, installment_no, approved_at, project_id, projects:project_id(name)")
    .is("paid_at", null)
    .not("approved_at", "is", null)
    .lt("approved_at", cutoff30);

  (pendingInspections ?? []).forEach((i: any) => {
    const days = Math.floor((now - new Date(i.approved_at).getTime()) / DAY);
    const name = i.projects?.name ?? "—";
    alerts.push({
      id: `pay-${i.id}`,
      level: "red",
      projectId: i.project_id,
      projectName: name,
      title: "การเบิกจ่ายค้างเกิน 30 วัน",
      detail: `${name} การเบิกจ่ายค้าง ${days} วัน เสี่ยงต้องจ่ายดอกเบี้ยให้ผู้รับจ้าง`,
      date: i.approved_at,
    });
  });

  // ===== RED 3: contracts ending in < 14 days
  const today = new Date(now).toISOString().split("T")[0];
  const in14 = new Date(now + 14 * DAY).toISOString().split("T")[0];
  const { data: endingContracts } = await supabase
    .from("contracts")
    .select("id, end_date, project_id, projects:project_id(name)")
    .gte("end_date", today)
    .lte("end_date", in14);

  (endingContracts ?? []).forEach((c: any) => {
    const days = Math.max(0, Math.ceil((new Date(c.end_date).getTime() - now) / DAY));
    const name = c.projects?.name ?? "—";
    alerts.push({
      id: `contract-${c.id}`,
      level: "red",
      projectId: c.project_id,
      projectName: name,
      title: "สัญญาใกล้สิ้นสุด",
      detail: `${name} สัญญาเหลืออีก ${days} วัน ตรวจสอบความคืบหน้าและเตรียมตรวจรับงาน`,
      date: c.end_date,
    });
  });

  // ===== YELLOW 4: weekly report > 7 days for step >= 8 projects
  const contractMgmtProjects = (projects ?? []).filter((p: any) => p.current_step >= 10);
  if (contractMgmtProjects.length) {
    const ids = contractMgmtProjects.map((p: any) => p.id);
    const { data: reports } = await supabase
      .from("construction_reports")
      .select("project_id, submitted_at")
      .in("project_id", ids)
      .order("submitted_at", { ascending: false });

    const lastByProject = new Map<string, string>();
    (reports ?? []).forEach((r: any) => {
      if (!lastByProject.has(r.project_id)) lastByProject.set(r.project_id, r.submitted_at);
    });

    contractMgmtProjects.forEach((p: any) => {
      const last = lastByProject.get(p.id);
      const days = last ? Math.floor((now - new Date(last).getTime()) / DAY) : Infinity;
      if (days > 7) {
        alerts.push({
          id: `report-${p.id}`,
          level: "yellow",
          projectId: p.id,
          projectName: p.name,
          title: "รายงานความคืบหน้าค้าง",
          detail: `${p.name} ยังไม่ได้รายงานความคืบหน้าประจำสัปดาห์ กรุณาส่งรายงาน`,
          date: last ?? new Date(now).toISOString(),
        });
      }
    });
  }

  // ===== YELLOW 5: required documents missing in past steps
  if (projectIds.length) {
    const { data: docs } = await supabase
      .from("documents")
      .select("project_id, step_number, document_type")
      .in("project_id", projectIds);

    const docMap = new Map<string, Set<string>>(); // key = projectId|step => set of doc names
    (docs ?? []).forEach((d: any) => {
      const key = `${d.project_id}|${d.step_number}`;
      if (!docMap.has(key)) docMap.set(key, new Set());
      docMap.get(key)!.add(d.document_type);
    });

    (projects ?? []).forEach((p: any) => {
      for (let step = 1; step < p.current_step; step++) {
        const required = STEP_DOCS_DETAILED[step - 1]?.filter((d) => d.required) ?? [];
        const uploaded = docMap.get(`${p.id}|${step}`) ?? new Set<string>();
        const missing = required.filter((d) => !uploaded.has(d.name));
        if (missing.length > 0) {
          alerts.push({
            id: `docs-${p.id}-${step}`,
            level: "yellow",
            projectId: p.id,
            projectName: p.name,
            title: `เอกสารขั้นตอนที่ ${step} ยังไม่ครบ`,
            detail: `${p.name} ขั้นตอนที่ ${step} เอกสารยังไม่ครบ (${missing.length} รายการ) กรุณาอัปโหลดให้ครบ`,
            date: new Date(now).toISOString(),
          });
          break; // one per project to avoid spam
        }
      }
    });
  }

  // ===== BLUE 6: current/next step info
  (projects ?? []).forEach((p: any) => {
    const cur = p.current_step;
    if (cur >= 1 && cur < 10) {
      const currentLabel = getMilestoneLabel(cur);
      const nextLabel = getMilestoneLabel(cur + 1);
      alerts.push({
        id: `next-${p.id}`,
        level: "blue",
        projectId: p.id,
        projectName: p.name,
        title: `ขั้นตอนปัจจุบัน: ${cur}`,
        detail: `${p.name} ปัจจุบัน: ${currentLabel} → ถัดไป: ${nextLabel}`,
        date: new Date(now).toISOString(),
      });
    }
  });

  // ===== BLUE 7: step completed in last 24h
  if (projectIds.length) {
    const since = new Date(now - DAY).toISOString();
    const { data: completed } = await supabase
      .from("procurement_steps")
      .select("project_id, step_number, completed_at")
      .in("project_id", projectIds)
      .eq("status", "completed")
      .gte("completed_at", since);

    (completed ?? []).forEach((s: any) => {
      const p = projectMap.get(s.project_id);
      if (!p) return;
      alerts.push({
        id: `done-${s.project_id}-${s.step_number}`,
        level: "blue",
        projectId: s.project_id,
        projectName: p.name,
        title: `ขั้นตอน ${s.step_number} เสร็จสมบูรณ์`,
        detail: `${p.name} ✓ ขั้นตอน ${s.step_number} เสร็จสมบูรณ์`,
        date: s.completed_at,
      });
    });
  }

  return sortAlerts(alerts);
}
