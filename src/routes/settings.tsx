import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { THAI_PROVINCES } from "@/lib/thai-provinces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Shield, Download, Trash2, CreditCard, HardDrive, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatBytes, getStorageLimit, getStoragePercent } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "ตั้งค่า — ProcureTrack" }] }),
  component: SettingsPage,
});

const DEPT_TYPES = ["เทศบาล", "อบต.", "อบจ.", "กรม", "สำนักงาน", "อื่นๆ"];
type TabId = "profile" | "org" | "notify" | "security";

function SettingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // profile
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");

  // org
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [deptType, setDeptType] = useState(DEPT_TYPES[0]);
  const [province, setProvince] = useState(THAI_PROVINCES[0]);

  // notify
  const [nReport, setNReport] = useState(true);
  const [nContract, setNContract] = useState(true);
  const [nInspection, setNInspection] = useState(true);

  // storage
  const [plan, setPlan] = useState<string>("trial");
  const [storageUsed, setStorageUsed] = useState<number>(0);

  // password
  const [newPwd, setNewPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return; }
      setUserId(u.user.id);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, position, organization_id")
        .eq("id", u.user.id)
        .maybeSingle();
      if (prof) {
        setFullName(prof.full_name ?? "");
        setPosition(prof.position ?? "");
        setOrgId(prof.organization_id);

        if (prof.organization_id) {
          const { data: org } = await supabase
            .from("organizations")
            .select("name, code, department_type, province, notify_report, notify_contract, notify_inspection, plan, storage_used_bytes")
            .eq("id", prof.organization_id)
            .maybeSingle();
          if (org) {
            setOrgName(org.name ?? "");
            setOrgCode(org.code ?? "");
            setDeptType(org.department_type ?? DEPT_TYPES[0]);
            setProvince(org.province ?? THAI_PROVINCES[0]);
            setNReport(org.notify_report ?? true);
            setNContract(org.notify_contract ?? true);
            setNInspection(org.notify_inspection ?? true);
            setPlan(org.plan ?? "trial");
            setStorageUsed(Number(org.storage_used_bytes ?? 0));
          }
        }
      }
      setLoading(false);
    })();
  }, [navigate]);

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: fullName, position }).eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("บันทึกข้อมูลส่วนตัวแล้ว");
  };

  const saveOrg = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await supabase.from("organizations")
      .update({ name: orgName, code: orgCode, department_type: deptType, province })
      .eq("id", orgId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("บันทึกข้อมูลหน่วยงานแล้ว");
  };

  const saveNotify = async (patch: Partial<{ notify_report: boolean; notify_contract: boolean; notify_inspection: boolean }>) => {
    if (!orgId) return;
    const { error } = await supabase.from("organizations").update(patch).eq("id", orgId);
    if (error) toast.error(error.message);
  };

  const changePassword = async () => {
    if (newPwd.length < 8) { toast.error("รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร"); return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("เปลี่ยนรหัสผ่านสำเร็จ"); setNewPwd(""); }
  };

  if (loading) {
    return (
      <AppShell breadcrumb="ตั้งค่า">
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="ตั้งค่า">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">ตั้งค่า</h1>
            <p className="text-sm text-muted-foreground mt-1">จัดการข้อมูลส่วนตัว หน่วยงาน และการแจ้งเตือน</p>
          </div>
          <Link to="/settings/subscription">
            <Button variant="outline" className="gap-2"><CreditCard className="h-4 w-4" />แพ็กเกจของฉัน</Button>
          </Link>
        </div>

        <div className="border-b border-border flex gap-1 overflow-x-auto">
          {(
            [
              ["profile", "ข้อมูลส่วนตัว"],
              ["org", "ข้อมูลหน่วยงาน"],
              ["notify", "การแจ้งเตือน"],
              ["security", "ความปลอดภัยและข้อมูล"],
            ] as [TabId, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >{label}</button>
          ))}
        </div>

        {tab === "profile" && (
          <Card>
            <CardHeader><CardTitle>ข้อมูลส่วนตัว</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>ชื่อ-นามสกุล</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>ตำแหน่ง</Label>
                  <Input value={position} onChange={(e) => setPosition(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}บันทึก
                </Button>
              </div>

              <div className="pt-5 border-t">
                <h3 className="font-medium mb-3">เปลี่ยนรหัสผ่าน</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label>รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</Label>
                    <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                  </div>
                  <Button onClick={changePassword} disabled={pwdLoading || !newPwd}>
                    {pwdLoading && <Loader2 className="h-4 w-4 animate-spin" />}เปลี่ยนรหัสผ่าน
                  </Button>
                </div>
              </div>

              <div className="pt-5 border-t space-y-3">
                <h3 className="font-medium">พื้นที่จัดเก็บข้อมูล</h3>
                <StorageUsageSection used={storageUsed} plan={plan} />
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "org" && (
          <Card>
            <CardHeader><CardTitle>ข้อมูลหน่วยงาน</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>ชื่อหน่วยงาน</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>รหัสหน่วยงาน</Label>
                  <Input value={orgCode} onChange={(e) => setOrgCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>ประเภทหน่วยงาน</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={deptType} onChange={(e) => setDeptType(e.target.value)}>
                    {DEPT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>จังหวัด</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={province} onChange={(e) => setProvince(e.target.value)}>
                    {THAI_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveOrg} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}บันทึก
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {tab === "notify" && (
          <Card>
            <CardHeader>
              <CardTitle>การแจ้งเตือน</CardTitle>
              <CardDescription>การตั้งค่ามีผลกับทั้งหน่วยงาน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "แจ้งเตือนเมื่อรายงานก่อสร้างค้างเกิน 7 วัน", val: nReport, set: setNReport, key: "notify_report" as const },
                { label: "แจ้งเตือนเมื่อสัญญาใกล้หมดอายุใน 30 วัน", val: nContract, set: setNContract, key: "notify_contract" as const },
                { label: "แจ้งเตือนเมื่อตรวจรับงานค้างเกิน 30 วัน", val: nInspection, set: setNInspection, key: "notify_inspection" as const },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{row.label}</span>
                  <Switch
                    checked={row.val}
                    onCheckedChange={(v) => { row.set(v); saveNotify({ [row.key]: v } as any); }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === "security" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />ความปลอดภัยและข้อมูล</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md bg-muted p-4 text-sm space-y-2">
                <p>ข้อมูลของคุณถูกจัดเก็บอย่างปลอดภัยตามมาตรฐาน พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) 2562</p>
                <p className="text-muted-foreground">ข้อมูลถูกเข้ารหัสและแยกเป็นอิสระจากหน่วยงานอื่น</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2" onClick={() => toast("อยู่ระหว่างพัฒนา")}>
                  <Download className="h-4 w-4" />ส่งออกข้อมูลของฉัน
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />ลบบัญชี
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ยืนยันการลบบัญชี</AlertDialogTitle>
                      <AlertDialogDescription>
                        การลบบัญชีไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร
                        หากต้องการดำเนินการกรุณาติดต่อ contact@procuretrack.th
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toast("กรุณาติดต่อ contact@procuretrack.th")}>
                        ดำเนินการ
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function StorageUsageSection({ used, plan }: { used: number; plan: string }) {
  const limit = getStorageLimit(plan);
  const pct = getStoragePercent(used, plan);
  const barColor = pct >= 95 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-primary";
  const warn = pct >= 80;

  return (
    <div className="pt-5 border-t space-y-3">
      <div className="flex items-center gap-2">
        <HardDrive className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">พื้นที่จัดเก็บข้อมูล</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        พื้นที่ที่ใช้: <span className="font-medium text-foreground">{formatBytes(used)}</span> / {formatBytes(limit)} ({pct}%)
      </p>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {warn && (
        <div className="flex items-start gap-2 rounded-md bg-orange-500/10 border border-orange-500/30 p-3 text-sm text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>พื้นที่เหลือน้อย กรุณาลบไฟล์ที่ไม่ใช้ หรืออัปเกรดแพ็กเกจ</p>
        </div>
      )}
      {warn && (
        <Link to="/settings/subscription">
          <Button variant="outline" className="gap-2">
            <CreditCard className="h-4 w-4" />อัปเกรดเพื่อพื้นที่เพิ่ม
          </Button>
        </Link>
      )}
    </div>
  );
}
