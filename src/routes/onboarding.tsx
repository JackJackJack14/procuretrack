import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProvinceSearchSelect } from "@/components/ProvinceSearchSelect";
import { THAI_PROVINCES } from "@/lib/thai-provinces";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "เริ่มต้นใช้งาน — ProcureTrack" }] }),
  component: OnboardingPage,
});

const POSITIONS = ["นักวิชาการพัสดุ", "เจ้าพนักงานพัสดุ", "วิศวกร", "อื่นๆ"];
const DEPT_TYPES = ["เทศบาล", "อบต.", "อบจ.", "กรม", "สำนักงาน", "อื่นๆ"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // step 1
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState(POSITIONS[0]);
  const [affiliation, setAffiliation] = useState("");

  // step 2
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [deptType, setDeptType] = useState(DEPT_TYPES[0]);
  const [province, setProvince] = useState(THAI_PROVINCES[0]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(data.user.id);
      const meta = data.user.user_metadata as { full_name?: string } | null;
      if (meta?.full_name) setFullName(meta.full_name);
    });
  }, [navigate]);

  const saveAll = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Generate org id client-side so we don't need SELECT permission
      // on the freshly inserted org row (RLS SELECT requires the user's
      // profile to already point at this org, which it doesn't yet).
      const newOrgId = (globalThis.crypto as Crypto).randomUUID();

      const { error: orgErr } = await supabase.from("organizations").insert({
        id: newOrgId,
        name: orgName,
        code: orgCode || orgName.slice(0, 8),
        department_type: deptType,
        province,
      });
      if (orgErr) throw orgErr;

      // Now link the current user's profile to that organization.
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        position,
        organization_id: newOrgId,
        role: "admin",
      });
      if (profErr) throw profErr;

      setStep(3);
    } catch (e: any) {
      setError(e.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-10 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-[10px] shadow-sm p-6">
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold mb-1">ข้อมูลส่วนตัว</h2>
              <p className="text-sm text-muted-foreground mb-5">บอกเราเกี่ยวกับคุณสักนิด</p>
              <div className="space-y-4">
                <TextInput label="ชื่อ-นามสกุล" value={fullName} onChange={setFullName} />
                <SelectInput label="ตำแหน่ง" value={position} onChange={setPosition} options={POSITIONS} />
                <TextInput label="หน่วยงานที่สังกัด" value={affiliation} onChange={setAffiliation} />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!fullName}
                className="mt-6 w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50"
              >
                ถัดไป →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-1">ข้อมูลหน่วยงาน</h2>
              <p className="text-sm text-muted-foreground mb-5">สร้างพื้นที่ทำงานของหน่วยงานคุณ</p>
              <div className="space-y-4">
                <TextInput label="ชื่อหน่วยงาน" value={orgName} onChange={setOrgName} />
                <TextInput label="รหัสหน่วยงาน (ถ้ามี)" value={orgCode} onChange={setOrgCode} />
                <SelectInput label="ประเภท" value={deptType} onChange={setDeptType} options={DEPT_TYPES} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">จังหวัด</label>
                  <ProvinceSearchSelect
                    value={province}
                    onChange={setProvince}
                    allowClear={false}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive mt-3">{error}</p>}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-10 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  onClick={saveAll}
                  disabled={!orgName || loading}
                  className="flex-1 h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  บันทึก
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-semibold mb-2">🎉 ยินดีต้อนรับ!</h2>
              <p className="text-sm text-muted-foreground mb-5">พร้อมเริ่มจัดการโครงการของคุณแล้ว</p>
              <ul className="space-y-3 mb-6">
                {[
                  "สร้างโครงการจัดซื้อจัดจ้าง",
                  "ติดตาม 10 ขั้นตอนตาม พ.ร.บ.",
                  "จัดเก็บเอกสารและรายงานก่อสร้าง",
                  "บริหารสัญญาและตรวจรับงวดงาน",
                  "ออกรายงานสรุปแบบ PDF",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-success/15 text-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90"
              >
                เริ่มสร้างโครงการแรก →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
