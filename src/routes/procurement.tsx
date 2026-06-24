import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Search } from "lucide-react";
import { fetchOrganizationProjects } from "@/lib/organization-projects";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBaht } from "@/lib/procurement";
import { getMilestoneLabel } from "@/lib/egp-milestones";
import { formatThaiDate } from "@/lib/utils";
import { resolveEgpProjectId } from "@/lib/project-refs";

export const Route = createFileRoute("/procurement")({
  head: () => ({ meta: [{ title: "จัดซื้อจัดจ้าง — ProcureTrack" }] }),
  component: ProcurementListPage,
});

type ProcurementProject = {
  id: string;
  name: string;
  project_code: string;
  egp_project_id?: string | null;
  budget: number;
  allocated_budget?: number | null;
  current_step: number;
  status: string;
  updated_at: string;
};

/** คอลัมน์พื้นฐาน — มีในทุกฐานข้อมูล (budget แทน allocated_budget จนกว่าจะรัน migration) */
const PROCUREMENT_COLUMNS_BASE =
  "id, name, project_code, egp_project_id, budget, current_step, status, updated_at";

const PROCUREMENT_COLUMNS_WITH_ALLOCATED =
  `${PROCUREMENT_COLUMNS_BASE}, allocated_budget`;

async function fetchProcurementProjects() {
  const withAllocated = await fetchOrganizationProjects<ProcurementProject>(
    PROCUREMENT_COLUMNS_WITH_ALLOCATED,
  );
  if (
    withAllocated.errorCode === "SCHEMA" &&
    /allocated_budget/i.test(withAllocated.error ?? "")
  ) {
    return fetchOrganizationProjects<ProcurementProject>(PROCUREMENT_COLUMNS_BASE);
  }
  return withAllocated;
}

function resolveDisplayBudget(project: ProcurementProject): number {
  const allocated = project.allocated_budget;
  if (allocated != null && Number(allocated) > 0) return Number(allocated);
  return Number(project.budget ?? 0);
}

/** โครงการที่อยู่ระหว่างจัดซื้อจัดจ้าง — ขั้นตอนที่ 1–9 เท่านั้น */
export function isActiveProcurementProject(project: Pick<ProcurementProject, "current_step">): boolean {
  const step = Number(project.current_step);
  return Number.isFinite(step) && step >= 1 && step <= 9;
}

function ProcurementListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: projectResult, isLoading } = useQuery({
    queryKey: ["procurement-projects"],
    queryFn: async () => {
      const result = await fetchProcurementProjects();
      if (result.errorCode === "NOT_AUTH") {
        navigate({ to: "/login" });
      }
      if (result.errorCode === "NO_ORG") {
        navigate({ to: "/onboarding" });
      }
      return result;
    },
  });

  const projectsError = projectResult?.error ?? null;

  const filtered = useMemo(() => {
    const active = (projectResult?.projects ?? []).filter(isActiveProcurementProject);
    const q = search.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        resolveEgpProjectId(p).toLowerCase().includes(q),
    );
  }, [projectResult?.projects, search]);

  return (
    <AppShell breadcrumb="จัดซื้อจัดจ้าง">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">จัดซื้อจัดจ้าง</h1>
          <p className="text-sm text-muted-foreground mt-1">
            รายการโครงการที่อยู่ระหว่างดำเนินการจัดซื้อจัดจ้าง (ขั้นตอนที่ 1–9)
          </p>
        </div>

        {projectsError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {projectsError}
          </div>
        )}

        <div className="bg-card border rounded-[10px] p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือรหัสโครงการ..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[320px] w-full rounded-[10px]" />
        ) : filtered.length === 0 ? (
          <div className="bg-card border rounded-[10px] p-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold">ไม่มีโครงการที่อยู่ระหว่างจัดซื้อจัดจ้าง</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              โครงการจะแสดงที่นี่เมื่ออยู่ในขั้นตอนที่ 1 ถึง 9 — โครงการที่ถึงขั้นตอนที่ 10 หรือจบแล้วจะไม่แสดง
            </p>
          </div>
        ) : (
          <div className="bg-card border rounded-[10px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">ชื่อโครงการ</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      วงเงินงบประมาณ
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      ขั้นตอนปัจจุบัน
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      อัปเดตล่าสุด
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => (
                    <ProcurementRow key={project.id} project={project} />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-2 text-xs text-muted-foreground border-t">
              แสดง {filtered.length} โครงการ — คลิกแถวเพื่อเปิดหน้าทำงานโครงการ
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ProcurementRow({ project }: { project: ProcurementProject }) {
  const stepLabel = `ขั้นตอนที่ ${project.current_step}: ${getMilestoneLabel(project.current_step, true)}`;
  const updatedDisplay = project.updated_at
    ? formatThaiDate(project.updated_at.slice(0, 10))
    : "—";

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="block min-w-[200px] group"
        >
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {project.name}
          </span>
          <span className="block text-xs text-muted-foreground mt-0.5">{resolveEgpProjectId(project)}</span>
        </Link>
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-medium">
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="block hover:text-primary transition-colors"
        >
          ฿ {formatBaht(resolveDisplayBudget(project))}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="block min-w-[160px]"
        >
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {stepLabel}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="block hover:text-primary transition-colors"
        >
          {updatedDisplay}
        </Link>
      </td>
    </tr>
  );
}
