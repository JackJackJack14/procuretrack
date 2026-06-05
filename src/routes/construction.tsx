import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardHat, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBaht } from "@/lib/procurement";

export const Route = createFileRoute("/construction")({
  head: () => ({ meta: [{ title: "ติดตามก่อสร้าง — ProcureTrack" }] }),
  component: ConstructionListPage,
});

function ConstructionListPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["construction-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, project_code, budget, current_step, status")
        .gte("current_step", 10)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AppShell breadcrumb="ติดตามก่อสร้าง">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">ติดตามก่อสร้าง</h1>
          <p className="text-sm text-muted-foreground mt-1">
            โครงการที่อยู่ในขั้นตอนติดตามก่อสร้าง (ขั้นตอนที่ 8 เป็นต้นไป)
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-[10px]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-card border rounded-[10px] p-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HardHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold">ยังไม่มีโครงการที่อยู่ในขั้นตอนก่อสร้าง</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              โครงการจะปรากฏที่นี่เมื่อดำเนินงานถึงขั้นตอนที่ 8 (ติดตามความคืบหน้าก่อสร้าง)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: any) => (
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-muted-foreground">฿ {formatBaht(Number(p.budget))}</span>
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
