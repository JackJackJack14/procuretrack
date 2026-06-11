import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, FileText, Upload, X, AlertTriangle, TrendingUp, TrendingDown,
  CalendarDays, HardHat, Loader2, Eye,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatBaht } from "@/lib/procurement";
import { formatThaiDate } from "@/lib/utils";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import { checkStorageQuota, incrementStorageUsage } from "@/lib/storage";

export const Route = createFileRoute("/projects_/$projectId_/construction")({
  head: () => ({ meta: [{ title: "ติดตามก่อสร้าง — ProcureTrack" }] }),
  component: ConstructionPage,
});

type Project = {
  id: string; organization_id: string; name: string; project_code: string;
  budget: number; current_step: number;
};
type Contract = {
  id: string; contract_number: string; contractor_name: string;
  contract_amount: number; start_date: string; end_date: string;
  announcement_date: string | null; winner_date: string | null;
  duration_days: number | null; result_accumulated: string | null;
};
type Report = {
  id: string; report_date: string; report_type: string; week_number: number | null;
  progress_plan: number | null; progress_actual: number | null; progress_diff: number | null;
  work_done: string | null; problems: string | null; solutions: string | null;
  next_plan: string | null; weather_impact: boolean | null; submitted_at: string;
};
type Photo = {
  id: string; report_id: string; storage_path: string; caption: string | null;
};

function ConstructionPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [detailReport, setDetailReport] = useState<Report | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["construction", projectId],
    queryFn: async () => {
      const [{ data: p }, { data: c }, { data: r }, { data: ph }, { data: org }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("contracts").select("*").eq("project_id", projectId)
          .order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("construction_reports").select("*").eq("project_id", projectId)
          .order("report_date", { ascending: false }),
        supabase.from("report_photos").select("*").eq("organization_id",
          ((await supabase.from("projects").select("organization_id").eq("id", projectId).single()).data?.organization_id ?? "00000000-0000-0000-0000-000000000000")),
        supabase.from("profiles").select("organizations(name)").eq("id",
          (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(),
      ]);
      return {
        project: p as Project | null,
        contract: c as Contract | null,
        reports: (r as Report[]) ?? [],
        photos: (ph as Photo[]) ?? [],
        orgName: ((org as any)?.organizations?.name ?? "") as string,
      };
    },
  });

  const project = data?.project ?? null;
  const contract = data?.contract ?? null;
  const reports = data?.reports ?? [];
  const photos = data?.photos ?? [];
  const orgName = data?.orgName ?? "";

  const latest = reports[0] ?? null;
  const planPct = Number(latest?.progress_plan ?? 0);
  const actualPct = Number(latest?.progress_actual ?? 0);
  const daysLeft = useMemo(() => {
    if (!contract?.end_date) return null;
    const diff = Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / 86400000);
    return diff;
  }, [contract?.end_date]);

  const chartData = useMemo(() => {
    return [...reports]
      .sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0))
      .map((r) => ({
        week: `สัปดาห์ ${r.week_number ?? "-"}`,
        แผน: Number(r.progress_plan ?? 0),
        จริง: Number(r.progress_actual ?? 0),
      }));
  }, [reports]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["construction", projectId] });

  const exportExcel = () => {
    if (!project) return;
    const wb = XLSX.utils.book_new();

    const summaryRows: (string | number)[][] = [
      ["ชื่อโครงการ", project.name],
      ["รหัสโครงการ", project.project_code],
      ["งบประมาณ (บาท)", Number(project.budget)],
      ["วิธีจัดซื้อ", (project as any).method ?? "-"],
      ["ปีงบประมาณ", (project as any).fiscal_year ?? "-"],
      ["", ""],
      ["ผู้รับจ้าง", contract?.contractor_name ?? "-"],
      ["เลขที่สัญญา", contract?.contract_number ?? "-"],
      ["มูลค่าสัญญา (บาท)", contract ? Number(contract.contract_amount) : "-"],
      ["วันเริ่มสัญญา", contract ? formatThaiDate(contract.start_date) : "-"],
      ["วันสิ้นสุดสัญญา", contract ? formatThaiDate(contract.end_date) : "-"],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1["!cols"] = [{ wch: 24 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, "สรุปโครงการ");

    const header = ["สัปดาห์ที่", "วันที่", "% ตามแผน", "% จริง", "% ต่าง", "สถานะ", "งานที่ทำ", "ปัญหา"];
    const body = [...reports].reverse().map((r) => {
      const plan = Number(r.progress_plan ?? 0);
      const actual = Number(r.progress_actual ?? 0);
      return [
        r.week_number ?? "-",
        formatThaiDate(r.report_date),
        plan,
        actual,
        Number((actual - plan).toFixed(2)),
        actual >= plan ? "ตามแผน" : "ล่าช้า",
        r.work_done ?? "-",
        r.problems ?? "-",
      ];
    });
    const ws2 = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws2["!cols"] = [
      { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "รายงานความคืบหน้า");

    const dateStr = formatThaiDate(new Date()).replace(/\s/g, "_");
    XLSX.writeFile(wb, `รายงาน_${project.name}_${dateStr}.xlsx`);
  };

  if (isLoading) {
    return <AppShell breadcrumb="ติดตามก่อสร้าง"><p className="text-sm text-muted-foreground">กำลังโหลด...</p></AppShell>;
  }
  if (!project) {
    return <AppShell breadcrumb="ติดตามก่อสร้าง"><p className="text-sm text-destructive">ไม่พบโครงการ</p></AppShell>;
  }

  return (
    <AppShell breadcrumb={`ติดตามก่อสร้าง / ${project.name}`}>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link to="/projects/$projectId" params={{ projectId }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> กลับไปยังโครงการ
          </Link>
          <button onClick={exportExcel} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
            <FileText className="h-4 w-4" /> 📊 Export รายงานผู้บริหาร Excel
          </button>
        </div>

        {/* Header */}
        <div className="bg-card border rounded-[10px] p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              <HardHat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.project_code} · งบ ฿ {formatBaht(Number(project.budget))}</p>
            </div>
          </div>
          {contract && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Info label="เลขที่สัญญา" value={contract.contract_number} />
              <Info label="ผู้รับจ้าง" value={contract.contractor_name} />
              <Info label="วันเริ่มสัญญา" value={formatThaiDate(contract.start_date)} />
              <Info label="วันสิ้นสุดสัญญา" value={formatThaiDate(contract.end_date)} />
              {contract.announcement_date && <Info label="วันที่ประกาศจัดซื้อจัดจ้าง" value={formatThaiDate(contract.announcement_date)} />}
              {contract.winner_date && <Info label="วันที่ประกาศผู้ชนะ" value={formatThaiDate(contract.winner_date)} />}
              {contract.duration_days != null && <Info label="ระยะเวลาสัญญา" value={`${contract.duration_days} วัน`} />}
              {contract.result_accumulated && <Info label="ผลสะสม" value={contract.result_accumulated} />}
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="ความคืบหน้าจริง"
            value={`${actualPct}%`}
            tone={actualPct >= planPct ? "success" : "destructive"}
            icon={actualPct >= planPct ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            hint={actualPct >= planPct ? "เป็นไปตามแผน" : `ช้ากว่าแผน ${(planPct - actualPct).toFixed(1)}%`}
          />
          <SummaryCard
            label="ความคืบหน้าตามแผน"
            value={`${planPct}%`}
            tone="primary"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <SummaryCard
            label="วันที่เหลือก่อนสัญญาครบ"
            value={daysLeft === null ? "⚠️ ไม่พบสัญญา" : `${daysLeft} วัน`}
            tone={daysLeft !== null && daysLeft < 30 ? "destructive" : "primary"}
            icon={<CalendarDays className="h-5 w-5" />}
            hint={
              contract?.end_date
                ? `ครบ ${formatThaiDate(contract.end_date)}`
                : "⚠️ ยังไม่มีข้อมูลสัญญา กรุณากรอกข้อมูลสัญญาในขั้นตอนที่ 8 ก่อน"
            }
          />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: history */}
          <div className="space-y-5">
            <div className="bg-card border rounded-[10px] p-5">
              <h3 className="font-semibold mb-4">กราฟความคืบหน้า</h3>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">ยังไม่มีข้อมูล</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="แผน" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="จริง" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card border rounded-[10px] p-5">
              <h3 className="font-semibold mb-4">ประวัติรายงาน ({reports.length})</h3>
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีรายงาน</p>
              ) : (
                <ul className="space-y-3">
                  {reports.map((r) => {
                    const diff = Number(r.progress_actual ?? 0) - Number(r.progress_plan ?? 0);
                    return (
                      <li key={r.id} className="border rounded-md p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-medium text-sm">สัปดาห์ที่ {r.week_number ?? "-"} · {formatThaiDate(r.report_date)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              จริง {r.progress_actual ?? 0}% / แผน {r.progress_plan ?? 0}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              diff >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                            }`}>
                              {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                            </span>
                            <button onClick={() => setDetailReport(r)} className="h-7 px-2 text-xs border rounded-md hover:bg-accent flex items-center gap-1">
                              <Eye className="h-3 w-3" /> ดูรายละเอียด
                            </button>
                          </div>
                        </div>
                        {r.work_done && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.work_done}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right: form */}
          <ReportForm
            project={project}
            contract={contract}
            existingWeeks={reports.map((r) => r.week_number ?? 0)}
            onSaved={invalidate}
            onError={setError}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          photos={photos.filter((p) => p.report_id === detailReport.id)}
          onClose={() => setDetailReport(null)}
        />
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function SummaryCard({
  label, value, hint, tone, icon,
}: {
  label: string; value: string; hint?: string;
  tone: "success" | "destructive" | "primary";
  icon: React.ReactNode;
}) {
  const toneCls = tone === "success"
    ? "bg-success/10 text-success"
    : tone === "destructive"
    ? "bg-destructive/10 text-destructive"
    : "bg-primary/10 text-primary";
  return (
    <div className="bg-card border rounded-[10px] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`h-9 w-9 rounded-md flex items-center justify-center ${toneCls}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold mt-3">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function ReportForm({
  project, contract, existingWeeks, onSaved, onError,
}: {
  project: Project;
  contract: Contract | null;
  existingWeeks: number[];
  onSaved: () => void;
  onError: (e: string | null) => void;
}) {
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const today = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(today);
  const [progressActual, setProgressActual] = useState<string>("");
  const [progressPlan, setProgressPlan] = useState<string>("");
  const [workDone, setWorkDone] = useState("");
  const [problems, setProblems] = useState("");
  const [solutions, setSolutions] = useState("");
  const [nextPlan, setNextPlan] = useState("");
  const [weather, setWeather] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const weekNumber = useMemo(() => {
    if (!contract?.start_date) return 1;
    const start = new Date(contract.start_date).getTime();
    const d = new Date(reportDate).getTime();
    return Math.max(1, Math.floor((d - start) / (7 * 86400000)) + 1);
  }, [contract?.start_date, reportDate]);

  const reset = () => {
    setProgressActual(""); setProgressPlan(""); setWorkDone("");
    setProblems(""); setSolutions(""); setNextPlan(""); setWeather(false);
    setPhotos([]);
  };

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const valid: File[] = [];
    for (const f of list) {
      if (!/image\/(jpe?g|png)/i.test(f.type)) { alert(`${f.name}: ใช้ได้เฉพาะ JPG/PNG`); continue; }
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name}: ขนาดเกิน 10MB`); continue; }
      valid.push(f);
    }
    setPhotos((p) => [...p, ...valid].slice(0, 3));
  };

  const submit = async (asDraft: boolean) => {
    onError(null);
    if (!progressActual || !progressPlan || !workDone) {
      onError("กรุณากรอกข้อมูลที่จำเป็น (% จริง, % แผน, งานที่ทำ)");
      return;
    }
    setSubmitting(true);
    try {
      const actual = Number(progressActual);
      const plan = Number(progressPlan);
      const { data: u } = await supabase.auth.getUser();
      const { data: inserted, error: insErr } = await supabase
        .from("construction_reports")
        .insert({
          organization_id: project.organization_id,
          project_id: project.id,
          contract_id: contract?.id ?? null,
          report_type: reportType,
          report_date: reportDate,
          week_number: weekNumber,
          progress_plan: plan,
          progress_actual: actual,
          progress_diff: actual - plan,
          work_done: workDone || null,
          problems: problems || null,
          solutions: solutions || null,
          next_plan: nextPlan || null,
          weather_impact: weather,
          submitted_by: u.user?.id ?? null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      if (!asDraft && photos.length > 0 && inserted) {
        const totalSize = photos.reduce((sum, f) => sum + f.size, 0);
        const quota = await checkStorageQuota(project.organization_id, totalSize);
        if (!quota.ok) throw new Error("พื้นที่จัดเก็บไม่เพียงพอ");
        for (const f of photos) {
          const ext = f.name.split(".").pop() ?? "jpg";
          const path = `${project.organization_id}/${project.id}/${inserted.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage.from("construction-photos").upload(path, f);
          if (upErr) throw upErr;
          await supabase.from("report_photos").insert({
            organization_id: project.organization_id,
            report_id: inserted.id,
            storage_path: path,
            caption: null,
          });
          await incrementStorageUsage(project.organization_id, f.size);
        }
      }

      reset();
      onSaved();
    } catch (e: any) {
      onError(e.message ?? "ส่งรายงานไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-[10px] p-5 space-y-4 self-start">
      <h3 className="font-semibold">เพิ่มรายงานสัปดาห์นี้</h3>

      {!contract && (
        <div className="rounded-md bg-warning/10 border border-warning/30 p-3 text-sm text-warning flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>ยังไม่มีข้อมูลสัญญา กรุณากรอกข้อมูลสัญญาในขั้นตอนที่ 8 ก่อนจึงจะส่งรายงานได้</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">ประเภทรายงาน</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="rtype" checked={reportType === "weekly"} onChange={() => setReportType("weekly")} />
            รายสัปดาห์
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="rtype" checked={reportType === "monthly"} onChange={() => setReportType("monthly")} />
            รายเดือน
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="วันที่รายงาน">
          <ThaiDatePicker value={reportDate} onChange={setReportDate} />
        </Field>
        <Field label="สัปดาห์ที่ (auto)">
          <input value={weekNumber} readOnly className={`${inputCls} bg-muted`} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="% จริง *">
          <input type="number" min={0} max={100} value={progressActual} onChange={(e) => setProgressActual(e.target.value)} className={inputCls} />
        </Field>
        <Field label="% ตามแผน *">
          <input type="number" min={0} max={100} value={progressPlan} onChange={(e) => setProgressPlan(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="งานที่ทำในช่วงนี้ *">
        <textarea rows={3} value={workDone} onChange={(e) => setWorkDone(e.target.value)} className={textCls} />
      </Field>
      <Field label="ปัญหา/อุปสรรค">
        <textarea rows={2} value={problems} onChange={(e) => setProblems(e.target.value)} placeholder="ถ้าไม่มีปัญหาใส่ -" className={textCls} />
      </Field>
      {problems && problems !== "-" && (
        <Field label="การแก้ไขปัญหา">
          <textarea rows={2} value={solutions} onChange={(e) => setSolutions(e.target.value)} className={textCls} />
        </Field>
      )}
      <Field label="แผนงานถัดไป">
        <textarea rows={2} value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} className={textCls} />
      </Field>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={weather} onChange={(e) => setWeather(e.target.checked)} />
        <AlertTriangle className="h-4 w-4 text-warning" />
        มีผลกระทบจากสภาพอากาศ
      </label>

      <div>
        <label className="block text-sm font-medium mb-1.5">รูปถ่ายหน้างาน (สูงสุด 3 รูป)</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="grid grid-cols-3 gap-2"
        >
          {[0, 1, 2].map((i) => {
            const f = photos[i];
            return (
              <div
                key={i}
                onClick={() => !f && fileRef.current?.click()}
                className="aspect-square border-2 border-dashed border-input rounded-md flex items-center justify-center bg-muted/30 hover:bg-muted/50 cursor-pointer relative overflow-hidden"
              >
                {f ? (
                  <>
                    <img src={URL.createObjectURL(f)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setPhotos((p) => p.filter((_, idx) => idx !== i)); }}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-xs text-muted-foreground">
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    คลิก/ลากไฟล์
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        />
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG · ไม่เกิน 10MB ต่อรูป</p>
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <button
          onClick={() => submit(true)}
          disabled={submitting || !contract}
          className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          บันทึกร่าง
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting || !contract}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 flex-1 justify-center"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          ส่งรายงาน
        </button>
      </div>
    </div>
  );
}

function ReportDetailModal({
  report, photos, onClose,
}: { report: Report; photos: Photo[]; onClose: () => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const out: string[] = [];
      for (const p of photos) {
        const { data } = await supabase.storage.from("construction-photos").createSignedUrl(p.storage_path, 600);
        if (data?.signedUrl) out.push(data.signedUrl);
      }
      setUrls(out);
    })();
  }, [photos]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">สัปดาห์ที่ {report.week_number ?? "-"}</h3>
            <p className="text-sm text-muted-foreground">{formatThaiDate(report.report_date)}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <Row label="ความคืบหน้าจริง" value={`${report.progress_actual ?? 0}%`} />
          <Row label="ความคืบหน้าตามแผน" value={`${report.progress_plan ?? 0}%`} />
          <Row label="ส่วนต่าง" value={`${report.progress_diff ?? 0}%`} />
          <Row label="งานที่ทำ" value={report.work_done ?? "-"} />
          <Row label="ปัญหา/อุปสรรค" value={report.problems ?? "-"} />
          <Row label="การแก้ไข" value={report.solutions ?? "-"} />
          <Row label="แผนถัดไป" value={report.next_plan ?? "-"} />
          <Row label="ผลกระทบจากสภาพอากาศ" value={report.weather_impact ? "ใช่" : "ไม่"} />
          {urls.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">รูปถ่ายหน้างาน</p>
              <div className="grid grid-cols-3 gap-2">
                {urls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="aspect-square rounded-md overflow-hidden border">
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b pb-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="col-span-2 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const textCls = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
