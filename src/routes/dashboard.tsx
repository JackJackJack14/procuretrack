import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderKanban, Banknote, Activity, AlertTriangle, AlertCircle, Clock, Info, CheckCircle2, LayoutDashboard } from "lucide-react";
import { milestoneProgressPercent } from "@/lib/egp-milestones";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { fetchAlerts, type Alert as AlertType } from "@/lib/alerts";
import { formatThaiDate } from "@/lib/utils";
import { APPEAL_STATUS_LABELS } from "@/lib/step-form";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "หน้าหลัก — ProcureTrack" }] }),
  component: DashboardPage,
});

type Project = {
  id: string;
  name: string;
  budget: number;
  status: string;
  current_step: number;
  fiscal_year: number;
  created_at: string;
  appeal_status?: string | null;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear() + 543);
  const [showAllAlerts, setShowAllAlerts] = useState(false);


  const { data: projects = [], isLoading: loading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return []; }
      const { data } = await supabase
        .from("projects")
        .select("id, name, budget, status, current_step, fiscal_year, created_at, appeal_status")
        .order("created_at", { ascending: false });
      return (data ?? []) as Project[];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
  });

  const redAlerts = useMemo(() => alerts.filter((a) => a.level === "red"), [alerts]);

  const metrics = useMemo(() => {
    const total = projects.length;
    const budget = projects.reduce((s, p) => s + Number(p.budget ?? 0), 0);
    const active = projects.filter((p) => p.status === "active").length;
    const appealPending = projects.filter((p) => p.appeal_status === "pending").length;
    const readyForContract = projects.filter((p) => p.appeal_status === "none" && p.current_step >= 4).length;
    return { total, budget, active, urgent: redAlerts.length, appealPending, readyForContract };
  }, [projects, redAlerts]);


  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === "active").slice(0, 5),
    [projects],
  );

  const chartData = useMemo(() => {
    const months = ["ต.ค.","พ.ย.","ธ.ค.","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย."];
    const buckets = months.map((m) => ({ month: m, budget: 0 }));
    (projects ?? [])
      .filter(Boolean)
      .filter((p) => p.fiscal_year === fiscalYear)
      .forEach((p) => {
        const d = new Date(p.created_at);
        // Thai fiscal year: Oct = month 0
        const idx = (d.getMonth() - 9 + 12) % 12;
        buckets[idx].budget += Number(p.budget ?? 0);
      });
    return buckets;
  }, [projects, fiscalYear]);

  const years = useMemo(() => {
    const set = new Set<number>([fiscalYear]);
    projects.forEach((p) => set.add(p.fiscal_year));
    return Array.from(set).sort((a, b) => b - a);
  }, [projects, fiscalYear]);

  return (
    <AppShell breadcrumb="หน้าหลัก">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">ภาพรวมโครงการ</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Smart Dashboard &amp; แจ้งเตือน — ข้อมูลรายละเอียดคีย์ใน e-GP
            </p>
          </div>
          <Link
            to="/executive"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline shrink-0"
          >
            <LayoutDashboard className="h-4 w-4" />
            ภาพรวมผู้บริหาร (10 ขั้นตอน)
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard label="โครงการทั้งหมด" value={metrics.total.toString()} icon={FolderKanban} tone="primary" />
          <MetricCard label="งบประมาณรวม (฿)" value={formatBaht(metrics.budget)} icon={Banknote} tone="success" />
          <MetricCard label="กำลังดำเนินการ" value={metrics.active.toString()} icon={Activity} tone="info" />
          <MetricCard label="พร้อมทำสัญญา" value={metrics.readyForContract.toString()} icon={CheckCircle2} tone="success" />
          <MetricCard label="ติดอุทธรณ์" value={metrics.appealPending.toString()} icon={AlertCircle} tone="warning" />
          <MetricCard label="ต้องดำเนินการด่วน" value={metrics.urgent.toString()} icon={AlertTriangle} tone="warning" />
        </div>

        {/* Two-column row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="ความคืบหน้าโครงการ">
            {loading ? (
              <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
            ) : activeProjects.length === 0 ? (
              <EmptyState text="ยังไม่มีโครงการ" />
            ) : (
              <ul className="divide-y">
                {activeProjects.map((p) => {
                  const pct = milestoneProgressPercent(p.current_step);
                  return (
                    <li key={p.id} className="py-3">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block hover:bg-accent/40 -mx-2 px-2 py-1 rounded-md">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <p className="text-sm font-medium truncate flex-1">{p.name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <AppealStatusBadge appealStatus={p.appeal_status} currentStep={p.current_step} />
                            <span className="text-xs text-muted-foreground">ขั้นตอน {p.current_step}/10</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct < 30 ? "bg-destructive" : pct < 70 ? "bg-warning" : "bg-success"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-10 text-right">{pct}%</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="การแจ้งเตือน">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-success" />
                ทุกโครงการดำเนินการปกติ ✓
              </div>
            ) : (
              <>
                <ul className="divide-y">
                  {(showAllAlerts ? alerts : alerts.slice(0, 5)).map((a) => (
                    <AlertRow key={a.id} alert={a} onGo={(id) => navigate({ to: "/projects/$projectId", params: { projectId: id } })} />
                  ))}
                </ul>
                {alerts.length > 5 && (
                  <button
                    onClick={() => setShowAllAlerts((s) => !s)}
                    className="mt-3 w-full text-sm text-primary font-medium hover:underline"
                  >
                    {showAllAlerts ? "แสดงน้อยลง" : `ดูทั้งหมด (${alerts.length})`}
                  </button>
                )}
              </>
            )}

          </Card>
        </div>

        {/* Chart */}
        <Card
          title="งบประมาณรายเดือน"
          action={
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="h-8 px-2 rounded-md border border-input bg-background text-xs"
            >
              {years.map((y) => <option key={y} value={y}>ปีงบประมาณ {y}</option>)}
            </select>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBahtShort(v)} />
                <Tooltip
                  formatter={(v: any) => formatBaht(Number(v)) + " บาท"}
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(0 0% 90%)" }}
                />
                <Bar dataKey="budget" fill="oklch(0.546 0.215 262)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Floating action */}
      <button
        onClick={() => navigate({ to: "/projects" })}
        className="fixed bottom-6 right-6 h-14 px-6 rounded-full bg-primary text-primary-foreground font-medium shadow-lg hover:bg-primary/90 transition flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        สร้างโครงการใหม่
      </button>
    </AppShell>
  );
}

function AppealStatusBadge({
  appealStatus,
  currentStep,
}: {
  appealStatus?: string | null;
  currentStep: number;
}) {
  if (currentStep < 4 || !appealStatus) return null;
  if (appealStatus === "pending") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium whitespace-nowrap">
        {APPEAL_STATUS_LABELS.pending}
      </span>
    );
  }
  if (appealStatus === "none") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium whitespace-nowrap">
        {APPEAL_STATUS_LABELS.none}
      </span>
    );
  }
  return null;
}

function MetricCard({
  label, value, icon: Icon, tone,
}: { label: string; value: string; icon: any; tone: "primary" | "success" | "info" | "warning" }) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <div className="bg-card border rounded-[10px] shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-semibold" style={{ fontSize: 28 }}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-[10px] shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AlertRow({ alert, onGo }: { alert: AlertType; onGo: (id: string) => void }) {
  const cfg = {
    red: { Icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
    yellow: { Icon: Clock, bg: "bg-yellow-500/10", color: "text-yellow-600" },
    blue: { Icon: Info, bg: "bg-blue-500/10", color: "text-blue-600" },
  }[alert.level];
  const { Icon } = cfg;
  return (
    <li className="py-2.5 flex gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{alert.projectName}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.detail}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{formatThaiDate(alert.date)}</span>
          <button onClick={() => onGo(alert.projectId)} className="text-xs text-primary font-medium hover:underline">
            ดูโครงการ →
          </button>
        </div>
      </div>
    </li>
  );
}


function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-8 text-center">{text}</p>;
}

function formatBaht(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}
function formatBahtShort(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "ล.";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toString();
}
