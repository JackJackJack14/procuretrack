import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardHat, ChevronRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBaht } from "@/lib/procurement";
import {
  CONSTRUCTION_TRACKING_MENU_LABEL,
  buildConstructionProjectSummary,
  formatConstructionDueWarning,
} from "@/lib/construction-tracking";

export const Route = createFileRoute("/construction")({
  head: () => ({ meta: [{ title: `${CONSTRUCTION_TRACKING_MENU_LABEL} — ProcureTrack` }] }),
  component: ConstructionListPage,
});

function ConstructionListPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["construction-projects"],
    queryFn: async () => {
      const { data: projectRows } = await supabase
        .from("projects")
        .select("id, name, project_code, budget, current_step, status, activity_type, design_code, method")
        .gte("current_step", 10)
        .order("created_at", { ascending: false });

      const ids = (projectRows ?? []).map((p) => p.id);
      if (ids.length === 0) return [];

      const { data: steps } = await supabase
        .from("procurement_steps")
        .select("id, project_id, step_number, note")
        .in("project_id", ids);

      const stepsByProject = new Map<string, typeof steps>();
      for (const s of steps ?? []) {
        const list = stepsByProject.get(s.project_id) ?? [];
        list.push(s);
        stepsByProject.set(s.project_id, list);
      }

      return (projectRows ?? [])
        .map((p) =>
          buildConstructionProjectSummary(p, stepsByProject.get(p.id) ?? []),
        )
        .filter((s): s is NonNullable<typeof s> => s != null);
    },
  });

  return (
    <AppShell breadcrumb={CONSTRUCTION_TRACKING_MENU_LABEL}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">{CONSTRUCTION_TRACKING_MENU_LABEL}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            โครงการงานก่อสร้างที่ดำเนินงานถึงขั้นตอนที่ 10 — ระบบดึงรายการอัตโนมัติจากประเภทโครงการหลัก
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] rounded-[10px]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-card border rounded-[10px] p-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HardHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold">ยังไม่มีโครงการงานก่อสร้างในขั้นตอนที่ 10</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
              โครงการที่ระบุเป็นประเภทงานก่อสร้างตั้งแต่สร้างโครงการ และดำเนินงานถึงขั้นตอนที่ 10
              จะปรากฏที่นี่โดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId/construction"
                params={{ projectId: p.id }}
                className="bg-card border rounded-[10px] p-5 hover:border-primary transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{p.project_code}</p>
                    <h3 className="font-semibold mt-1 truncate">{p.name}</h3>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>ความคืบหน้าตรวจรับ</span>
                    <span className="font-medium text-foreground">{p.physicalProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${p.physicalProgress}%` }}
                    />
                  </div>
                </div>
                {p.dueWarnings.length > 0 && (
                  <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{formatConstructionDueWarning(p.dueWarnings[0])}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-muted-foreground">฿ {formatBaht(p.budget)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    ขั้นตอน {p.current_step}/10
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
