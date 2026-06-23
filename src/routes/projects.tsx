import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, X, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrganizationProjects } from "@/lib/organization-projects";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  METHOD_OPTIONS, METHOD_LABEL, STATUS_LABEL,
  formatBaht, progressColor,
} from "@/lib/procurement";
import { EGP_MILESTONES, getMilestoneLabel, milestoneProgressPercent } from "@/lib/egp-milestones";
import { getWorkflowDisplayStepCount, backendStepToUiStep } from "@/lib/dynamic-stepper";
import { APPEAL_STATUS_LABELS, isStep1ResultUnitSubmitBlocked, shouldShowStep1SpecificMethodBudgetComplianceWarning, STEP1_SPECIFIC_METHOD_BUDGET_COMPLIANCE_WARNING_MSG } from "@/lib/step-form";
import { ResultUnitSelect } from "@/components/ResultUnitSelect";
import {
  BUDGET_CATEGORY_OPTIONS,
  EGP_PROJECT_TYPE_CONSTRUCTION,
  EGP_PROJECT_TYPE_OPTIONS,
  isCapitalBudgetCategory,
  suggestEgpProjectTypeFromBudgetCategory,
} from "@/lib/egp-project-type";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "โครงการทั้งหมด — ProcureTrack" }] }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  name: string;
  project_code: string;
  budget: number;
  status: string;
  method: string;
  fiscal_year: number;
  current_step: number;
  appeal_status?: string | null;
};

const YEARS = [2566, 2567, 2568, 2569, 2570];

function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: projectResult, isLoading: loading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await fetchOrganizationProjects<Project>(
        "id, name, project_code, budget, status, method, fiscal_year, current_step, appeal_status",
      );
      if (result.errorCode === "NOT_AUTH") {
        navigate({ to: "/login" });
      }
      if (result.errorCode === "NO_ORG") {
        navigate({ to: "/onboarding" });
      }
      return result;
    },
  });
  const projects = projectResult?.projects ?? [];
  const projectsError = projectResult?.error ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.project_code.toLowerCase().includes(q))) return false;
      if (yearFilter !== "all" && String(p.fiscal_year) !== yearFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      return true;
    });
  }, [projects, search, yearFilter, statusFilter, methodFilter]);

  return (
    <AppShell breadcrumb="โครงการทั้งหมด">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">โครงการทั้งหมด</h1>
            <p className="text-sm text-muted-foreground mt-1">บริหารโครงการจัดซื้อจัดจ้าง 10 ขั้นตอน</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> สร้างโครงการใหม่
          </button>
        </div>

        {projectsError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {projectsError}
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border rounded-[10px] p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือรหัสโครงการ..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <FilterSelect value={yearFilter} onChange={setYearFilter}
            options={[{ v: "all", l: "ทุกปีงบประมาณ" }, ...YEARS.map((y) => ({ v: String(y), l: `ปี ${y}` }))]} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter}
            options={[{ v: "all", l: "ทุกสถานะ" }, ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ v, l }))]} />
          <FilterSelect value={methodFilter} onChange={setMethodFilter}
            options={[{ v: "all", l: "ทุกวิธี" }, ...METHOD_OPTIONS.map((m) => ({ v: m.value, l: METHOD_LABEL[m.value] }))]} />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-[10px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border rounded-[10px] p-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold">ยังไม่มีโครงการ</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              เริ่มต้นบริหารงานจัดซื้อจัดจ้างด้วยการสร้างโครงการแรกของคุณ
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 h-10 px-5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> สร้างโครงการแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); navigate({ to: "/projects/$projectId", params: { projectId: id } }); }}
        />
      )}
    </AppShell>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 px-3 rounded-md border border-input bg-background text-sm"
    >
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const displayStep = backendStepToUiStep(project.current_step, project.method);
  const displayTotal = getWorkflowDisplayStepCount(project.method);
  const pct = Math.round((displayStep / displayTotal) * 100);
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="block bg-card border rounded-[10px] shadow-sm p-5 hover:shadow-md hover:border-primary/40 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{project.project_code}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>
      <p className="text-lg font-semibold">฿ {formatBaht(Number(project.budget))}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {METHOD_LABEL[project.method] ?? project.method} • ปี {project.fiscal_year}
      </p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
          <span className="text-muted-foreground truncate">
            ขั้น {displayStep}: {getMilestoneLabel(project.current_step, true)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {project.current_step >= 6 && project.appeal_status === "pending" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                {APPEAL_STATUS_LABELS.pending}
              </span>
            )}
            {project.current_step >= 6 && project.appeal_status === "none" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium">
                {APPEAL_STATUS_LABELS.none}
              </span>
            )}
            <span className="font-medium">{pct}%</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [fiscalYear, setFiscalYear] = useState(2568);
  const [method, setMethod] = useState("e_bidding");
  const [districtOffice, setDistrictOffice] = useState("");
  const [designCode, setDesignCode] = useState("");
  const [approvingAgency, setApprovingAgency] = useState("");
  const [procurementAgency, setProcurementAgency] = useState("");
  const [resultUnit, setResultUnit] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [egpProjectType, setEgpProjectType] = useState("");
  const [egpProjectTypeTouched, setEgpProjectTypeTouched] = useState(false);
  const [resultUnitOtherPending, setResultUnitOtherPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "🛡️ [PROJECT INITIALIZATION ACTIVE]: Master project creation form with auto-reset constraints and compliance validators is fully deployed.",
    );
  }, []);

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("ไม่พบผู้ใช้");
      const { data: prof } = await supabase.from("profiles").select("organization_id").eq("id", u.user.id).single();
      if (!prof?.organization_id) throw new Error("ยังไม่ได้ตั้งค่าหน่วยงาน");

      const newId = (globalThis.crypto as Crypto).randomUUID();
      const { error: insErr } = await supabase.from("projects").insert({
        id: newId,
        organization_id: prof.organization_id,
        name,
        project_code: code,
        description: description || null,
        budget: Number(budget.replace(/,/g, "")),
        fiscal_year: fiscalYear,
        method,
        district_office: districtOffice || null,
        design_code: designCode || null,
        approving_agency: approvingAgency || null,
        procurement_agency: procurementAgency || null,
        result_unit: resultUnit || null,
        target_quantity: targetQuantity ? Number(targetQuantity) : null,
        project_type: egpProjectType || null,
        budget_category: budgetCategory || null,
        current_step: 1,
        status: "active",
        created_by: u.user.id,
      });
      if (insErr) throw insErr;

      // Auto-create 10 procurement steps (in case DB trigger not attached)
      const steps = EGP_MILESTONES.map((nm, i) => ({
        organization_id: prof.organization_id,
        project_id: newId,
        step_number: i + 1,
        step_name: nm,
        status: i === 0 ? "in_progress" : "pending",
      }));
      // Ignore conflict in case a trigger already inserted them
      await supabase.from("procurement_steps").insert(steps);

      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("บันทึกสำเร็จ ✓");
      onCreated(newId);
    } catch (e: any) {
      const msg = e.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (v: string) => {
    const num = v.replace(/[^\d]/g, "");
    if (!num) return "";
    return new Intl.NumberFormat("th-TH").format(Number(num));
  };

  const showSpecificMethodBudgetWarning =
    shouldShowStep1SpecificMethodBudgetComplianceWarning(budget, method);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="flex h-auto w-full max-h-[85vh] max-w-2xl flex-col overflow-hidden rounded-[12px] border bg-card shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b p-5">
          <h2 id="create-project-title" className="text-lg font-semibold">
            สร้างโครงการใหม่
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="ชื่อโครงการ *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="เลขที่โครงการ e-GP / รหัสโครงการภายใน *">
            <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
          </Field>
          <Field label="คำอธิบาย">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="งบประมาณ (฿) *">
            <input value={budget} onChange={(e) => setBudget(formatBudget(e.target.value))}
              placeholder="0" className={inputCls} />
          </Field>
          {showSpecificMethodBudgetWarning && (
            <div className="rounded-md bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 px-4 py-3 text-sm">
              {STEP1_SPECIFIC_METHOD_BUDGET_COMPLIANCE_WARNING_MSG}
            </div>
          )}
          <Field label="หมวดงบประมาณ *">
            <select
              value={budgetCategory}
              onChange={(e) => {
                const next = e.target.value;
                setBudgetCategory(next);
                if (!egpProjectTypeTouched) {
                  const suggested = suggestEgpProjectTypeFromBudgetCategory(next);
                  if (suggested) setEgpProjectType(suggested);
                }
              }}
              className={inputCls}
            >
              <option value="">— เลือกหมวดงบประมาณ —</option>
              {BUDGET_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {isCapitalBudgetCategory(budgetCategory) && (
              <p className="text-xs text-sky-700 mt-1">
                แนะนำประเภท «{EGP_PROJECT_TYPE_CONSTRUCTION}» — เปลี่ยนได้ก่อนบันทึก
              </p>
            )}
          </Field>
          <Field label="ประเภทโครงการ (e-GP) *">
            <select
              value={egpProjectType}
              onChange={(e) => {
                setEgpProjectTypeTouched(true);
                setEgpProjectType(e.target.value);
                setResultUnit("");
                setResultUnitOtherPending(false);
              }}
              className={inputCls}
            >
              <option value="">— เลือกประเภทโครงการ —</option>
              {EGP_PROJECT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ปีงบประมาณ">
              <select value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} className={inputCls}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="วิธีจัดซื้อ">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                {METHOD_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="หน่วยงานส่วนภูมิภาค / เขตที่รับผิดชอบ">
              <input value={districtOffice} onChange={(e) => setDistrictOffice(e.target.value)} placeholder="เช่น สพข.6 เชียงใหม่" className={inputCls} />
            </Field>
            <Field label="รหัสแบบ/รหัสโครงการ">
              <input value={designCode} onChange={(e) => setDesignCode(e.target.value)} placeholder="เช่น ฝ. ฉช.0168 / 01268" className={inputCls} />
            </Field>
          </div>
          <Field label="หน่วยงานที่อนุมัติเบิกจ่าย">
            <input value={approvingAgency} onChange={(e) => setApprovingAgency(e.target.value)} className={inputCls} />
          </Field>
          <Field label="หน่วยงานที่ดำเนินการจัดซื้อจัดจ้าง">
            <input value={procurementAgency} onChange={(e) => setProcurementAgency(e.target.value)} className={inputCls} />
          </Field>
          <Field label="หน่วยวัดผลสัมฤทธิ์ของงาน *">
            <ResultUnitSelect
              key={egpProjectType || "none"}
              value={resultUnit}
              onChange={setResultUnit}
              onOtherModeChange={setResultUnitOtherPending}
              inputClassName={inputCls}
            />
          </Field>
          <Field label="จำนวนผลสัมฤทธิ์ของงาน *">
            <input
              type="number"
              min={1}
              step={1}
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value.replace(/[^\d]/g, ""))}
              className={inputCls}
              placeholder="เช่น 1"
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex shrink-0 gap-3 border-t bg-card p-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent">
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={
              !name
              || !code
              || !budget
              || !budgetCategory
              || !egpProjectType
              || !targetQuantity
              || isStep1ResultUnitSubmitBlocked(resultUnit, resultUnitOtherPending)
              || loading
            }
            className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            สร้างโครงการ
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
