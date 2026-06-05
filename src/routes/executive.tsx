import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FolderKanban,
  Activity,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { MilestoneTimeline } from "@/components/MilestoneTimeline";
import { fetchAlerts } from "@/lib/alerts";
import { EGP_TOTAL_STEPS, milestoneProgressPercent } from "@/lib/egp-milestones";
import { formatBaht, STATUS_LABEL } from "@/lib/procurement";

export const Route = createFileRoute("/executive")({
  head: () => ({ meta: [{ title: "ภาพรวมผู้บริหาร — ProcureTrack" }] }),
  component: ExecutiveDashboardPage,
});

type Project = {
  id: string;
  name: string;
  project_code: string;
  budget: number;
  status: string;
  current_step: number;
  fiscal_year: number;
};

function ExecutiveDashboardPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login" });
        return [];
      }
      const { data } = await supabase
        .from("projects")
        .select("id, name, project_code, budget, status, current_step, fiscal_year")
        .order("created_at", { ascending: false });
      return (data ?? []) as Project[];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
  });

  const redCount = useMemo(() => alerts.filter((a) => a.level === "red").length, [alerts]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  const metrics = useMemo(() => {
    const active = projects.filter((p) => p.status === "active");
    const avgProgress =
      projects.length === 0
        ? 0
        : Math.round(
            projects.reduce((s, p) => s + milestoneProgressPercent(p.current_step), 0) /
              projects.length,
          );
    const atStep = (n: number) => projects.filter((p) => p.current_step === n).length;
    return {
      total: projects.length,
      active: active.length,
      avgProgress,
      urgent: redCount,
      stepDistribution: Array.from({ length: EGP_TOTAL_STEPS }, (_, i) => atStep(i + 1)),
    };
  }, [projects, redCount]);

  return (
    <AppShell breadcrumb="ภาพรวมผู้บริหาร">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-sm font-medium">Executive View</span>
            </div>
            <h1 className="text-2xl font-semibold">Dashboard สรุปภาพรวมโครงการ</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ติดตาม Milestone 10 ขั้นตอน (e-GP e-bidding) — ไม่ต้องคีย์ข้อมูลซ้ำในระบบนี้
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm w-full sm:w-auto"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="draft">แบบร่าง</option>
          </select>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="โครงการทั้งหมด" value={String(metrics.total)} icon={FolderKanban} />
          <SummaryCard label="กำลังดำเนินการ" value={String(metrics.active)} icon={Activity} />
          <SummaryCard
            label="ความคืบหน้าเฉลี่ย"
            value={`${metrics.avgProgress}%`}
            icon={LayoutDashboard}
          />
          <SummaryCard
            label="แจ้งเตือนด่วน"
            value={String(metrics.urgent)}
            icon={AlertTriangle}
            warn={metrics.urgent > 0}
          />
        </div>

        <div className="bg-card border rounded-[10px] shadow-sm p-5">
          <h2 className="font-semibold mb-4">ภาพรวม Milestone ทั้งหน่วยงาน</h2>
          <p className="text-xs text-muted-foreground mb-4">
            จำนวนโครงการที่อยู่ในแต่ละขั้นตอนปัจจุบัน (1–10)
          </p>
          <div className="flex gap-1 items-end h-24">
            {metrics.stepDistribution.map((count, i) => {
              const max = Math.max(...metrics.stepDistribution, 1);
              const h = count === 0 ? 4 : Math.max(12, (count / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] font-medium">{count || ""}</span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${h}%` }}
                    title={`ขั้นที่ ${i + 1}: ${count} โครงการ`}
                  />
                  <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Timeline รายโครงการ</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border rounded-[10px] bg-card">
              ไม่มีโครงการในตัวกรองนี้
            </p>
          ) : (
            filtered.map((p) => (
              <ProjectMilestoneCard key={p.id} project={p} />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ProjectMilestoneCard({ project }: { project: Project }) {
  const statusLabel = STATUS_LABEL[project.status] ?? project.status;

  return (
    <div className="bg-card border rounded-[10px] shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="text-base font-semibold hover:text-primary transition truncate block"
          >
            {project.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {project.project_code} · ปีงบ {project.fiscal_year} · {formatBaht(project.budget)} บาท
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{statusLabel}</span>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
          >
            รายละเอียด
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <MilestoneTimeline currentStep={project.current_step} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  warn,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  warn?: boolean;
}) {
  return (
    <div className="bg-card border rounded-[10px] shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={`mt-1 text-2xl font-semibold ${warn ? "text-destructive" : ""}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            warn ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
