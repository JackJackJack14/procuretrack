import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  HardHat,
  Loader2,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import { formatBaht } from "@/lib/procurement";
import { formatThaiDateSlash } from "@/lib/utils";
import { computeStep10InstallmentPlannedDates } from "@/lib/step10-contract";
import { loadStep9FormFromNote } from "@/lib/step-form";
import {
  CONSTRUCTION_TRACKING_MENU_LABEL,
  computeConstructionDueWarnings,
  computeConstructionPhysicalProgress,
  computeConstructionStatusBadges,
  computeScurvePlannedPercent,
  feedFromInspectionRow,
  formatConstructionDueWarning,
  isProjectConstructionWork,
  isSupervisorReportBeforeDelivery,
  resolveConstructionInstallmentRows,
  saveConstructionInstallmentFeed,
  type ConstructionInstallmentFeed,
} from "@/lib/construction-tracking";

export const Route = createFileRoute("/projects_/$projectId_/construction")({
  head: () => ({ meta: [{ title: `${CONSTRUCTION_TRACKING_MENU_LABEL} — ProcureTrack` }] }),
  component: ConstructionPage,
});

type Project = {
  id: string;
  organization_id: string;
  name: string;
  project_code: string;
  budget: number;
  current_step: number;
  activity_type?: string | null;
  design_code?: string | null;
  method?: string | null;
};

function ConstructionPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const [expandedNo, setExpandedNo] = useState<number | null>(1);
  const [savingNo, setSavingNo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dailyInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["construction", projectId],
    queryFn: async () => {
      const [{ data: p }, { data: steps }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase
          .from("procurement_steps")
          .select("id, step_number, note, due_date")
          .eq("project_id", projectId)
          .order("step_number"),
      ]);
      const project = p as Project | null;
      const step9 = (steps ?? []).find((s) => s.step_number === 9);
      const schedule = loadStep9FormFromNote(step9?.note ?? null).contractSchedule;
      const total = schedule?.total_installment_count ?? 0;
      const plannedDates = computeStep10InstallmentPlannedDates(
        schedule?.work_start_date ?? "",
        schedule?.contract_duration_days,
        total,
      );
      const rows = resolveConstructionInstallmentRows(steps ?? [], project as Project, plannedDates);
      return { project, steps: steps ?? [], rows, totalInstallments: total };
    },
  });

  const project = data?.project ?? null;
  const rows = data?.rows ?? [];
  const totalInstallments = data?.totalInstallments ?? 0;
  const steps = data?.steps ?? [];

  const physicalProgress = useMemo(
    () => computeConstructionPhysicalProgress(rows, totalInstallments),
    [rows, totalInstallments],
  );
  const dueWarnings = useMemo(() => computeConstructionDueWarnings(rows), [rows]);
  const statusBadges = useMemo(
    () => computeConstructionStatusBadges(rows, totalInstallments),
    [rows, totalInstallments],
  );

  const [feeds, setFeeds] = useState<Record<number, ConstructionInstallmentFeed>>({});

  const getFeed = (installmentNo: number): ConstructionInstallmentFeed => {
    if (feeds[installmentNo]) return feeds[installmentNo];
    const row = rows.find((r) => r.installment_no === installmentNo);
    return row ? feedFromInspectionRow(row) : {
      installment_no: installmentNo,
      delivery_letter_date: "",
      supervisor_report_date: "",
      site_diary: "",
      site_obstacles: "",
    };
  };

  const patchFeed = (installmentNo: number, patch: Partial<ConstructionInstallmentFeed>) => {
    setFeeds((prev) => ({
      ...prev,
      [installmentNo]: { ...getFeed(installmentNo), ...patch, installment_no: installmentNo },
    }));
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["construction", projectId] });

  const handleSave = async (installmentNo: number) => {
    if (!project) return;
    const feed = getFeed(installmentNo);
    setError(null);

    if (!feed.delivery_letter_date.trim()) {
      setError(`งวดที่ ${installmentNo}: กรุณาระบุวันที่ส่งมอบหนังสือ`);
      return;
    }
    if (!feed.supervisor_report_date.trim()) {
      setError(`งวดที่ ${installmentNo}: กรุณาระบุวันที่รายงานผู้ควบคุมงาน`);
      return;
    }
    if (
      isSupervisorReportBeforeDelivery(
        feed.delivery_letter_date,
        feed.supervisor_report_date,
      )
    ) {
      setError(
        `งวดที่ ${installmentNo}: วันรายงานผู้ควบคุมงานต้องไม่ก่อนวันส่งมอบหนังสือ`,
      );
      return;
    }

    setSavingNo(installmentNo);
    try {
      const ok = await saveConstructionInstallmentFeed(
        { id: project.id, organization_id: project.organization_id },
        steps,
        feed,
        {
          supervisorReport: dailyInputRef.current?.files?.[0],
          deliveryLetter: photoInputRef.current?.files?.[0],
        },
      );
      if (!ok) {
        setError("บันทึกไม่สำเร็จ — กรุณาลองใหม่");
        return;
      }
      setFeeds((prev) => {
        const next = { ...prev };
        delete next[installmentNo];
        return next;
      });
      if (dailyInputRef.current) dailyInputRef.current.value = "";
      if (photoInputRef.current) photoInputRef.current.value = "";
      await invalidate();
    } finally {
      setSavingNo(null);
    }
  };

  if (isLoading) {
    return (
      <AppShell breadcrumb={CONSTRUCTION_TRACKING_MENU_LABEL}>
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell breadcrumb={CONSTRUCTION_TRACKING_MENU_LABEL}>
        <p className="text-sm text-destructive">ไม่พบโครงการ</p>
      </AppShell>
    );
  }

  if (!isProjectConstructionWork(project)) {
    return (
      <AppShell breadcrumb={`${CONSTRUCTION_TRACKING_MENU_LABEL} / ${project.name}`}>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
          <p className="font-semibold">โครงการนี้ไม่ใช่ประเภทงานก่อสร้าง</p>
          <p>
            ระบบตรวจจับจากข้อมูลโครงการหลัก (ประเภทกิจกรรม/งาน, รหัสแบบ, หรือวิธี e-bidding)
            — เมนูนี้ใช้ได้เฉพาะโครงการงานก่อสร้างที่ดำเนินงานถึงขั้นตอนที่ 10
          </p>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 text-primary font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> กลับหน้าโครงการ
          </Link>
        </div>
      </AppShell>
    );
  }

  if (project.current_step < 10) {
    return (
      <AppShell breadcrumb={`${CONSTRUCTION_TRACKING_MENU_LABEL} / ${project.name}`}>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          โครงการยังไม่ถึงขั้นตอนที่ 10 (ปัจจุบัน: ขั้นตอน {project.current_step})
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb={`${CONSTRUCTION_TRACKING_MENU_LABEL} / ${project.name}`}>
      <div className="space-y-5 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> กลับหน้าโครงการ
            </Link>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <HardHat className="h-5 w-5 text-primary" />
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground">{project.project_code} · ฿ {formatBaht(project.budget)}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>ความคืบหน้าตรวจรับ (Physical Progress)</span>
            <span className="font-semibold">{physicalProgress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${physicalProgress}%` }} />
          </div>
        </div>

        {dueWarnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
            {dueWarnings.map((w) => (
              <p key={w.installment_no} className="text-sm text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {formatConstructionDueWarning(w)}
              </p>
            ))}
          </div>
        )}

        {statusBadges.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50/80 p-3 space-y-1">
            {statusBadges.map((b) => (
              <p
                key={`${b.installment_no}-${b.type}`}
                className={`text-sm px-2 py-1 rounded ${
                  b.tone === "destructive" ? "text-red-700" : "text-orange-800"
                }`}
              >
                {b.label}
              </p>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {totalInstallments <= 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
            กรุณาบันทึกจำนวนงวดงานในขั้นตอนที่ 9 ก่อน
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const n = row.installment_no;
              const isOpen = expandedNo === n;
              const feed = getFeed(n);
              const plannedPct = computeScurvePlannedPercent(n, totalInstallments);
              const synced = row.construction_synced === true;

              return (
                <div key={n} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedNo(isOpen ? null : n)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/30"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    <span className="font-semibold text-sm">งวดที่ {n}</span>
                    {row.planned_completion_date && (
                      <span className="text-xs text-muted-foreground">
                        กำหนดเสร็จ {formatThaiDateSlash(row.planned_completion_date)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      แผน S-Curve {plannedPct}%
                    </span>
                    {synced && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                        ซิงก์แล้ว
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t p-4 space-y-4 bg-muted/5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1 text-sm">
                          <span className="font-medium">วันที่ส่งมอบหนังสือ *</span>
                          <ThaiDatePicker
                            value={feed.delivery_letter_date}
                            onChange={(v) => patchFeed(n, { delivery_letter_date: v })}
                          />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span className="font-medium">วันที่รายงานผู้ควบคุมงาน *</span>
                          <ThaiDatePicker
                            value={feed.supervisor_report_date}
                            onChange={(v) => patchFeed(n, { supervisor_report_date: v })}
                          />
                        </label>
                      </div>
                      <label className="block space-y-1 text-sm">
                        <span className="font-medium">Site Diary / ความคืบหน้าหน้างาน</span>
                        <textarea
                          rows={3}
                          value={feed.site_diary}
                          onChange={(e) => patchFeed(n, { site_diary: e.target.value })}
                          className="w-full px-3 py-2 rounded-md border border-input text-sm"
                        />
                      </label>
                      <label className="block space-y-1 text-sm">
                        <span className="font-medium">อุปสรรคหน้างาน</span>
                        <textarea
                          rows={2}
                          value={feed.site_obstacles}
                          onChange={(e) => patchFeed(n, { site_obstacles: e.target.value })}
                          className="w-full px-3 py-2 rounded-md border border-input text-sm"
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium">รายงานผู้ควบคุมงาน (PDF)</span>
                          <input ref={n === expandedNo ? dailyInputRef : undefined} type="file" accept=".pdf" className="text-xs" />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium">หนังสือส่งมอบงาน/ส่งมอบพัสดุ</span>
                          <input ref={n === expandedNo ? photoInputRef : undefined} type="file" accept=".pdf,image/*" className="text-xs" />
                        </label>
                      </div>
                      <button
                        type="button"
                        disabled={savingNo === n}
                        onClick={() => void handleSave(n)}
                        className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
                      >
                        {savingNo === n ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        บันทึกและซิงก์ไปขั้นตอนที่ 10
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
