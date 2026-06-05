import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Star } from "lucide-react";

export const Route = createFileRoute("/settings_/subscription")({
  head: () => ({ meta: [{ title: "แพ็กเกจของฉัน — ProcureTrack" }] }),
  component: SubscriptionPage,
});

type Cycle = "monthly" | "yearly";
type PlanKey = "trial" | "starter" | "pro" | "team";

interface Plan {
  key: PlanKey;
  name: string;
  recommended?: boolean;
  monthly: number | null; // null = contact us
  yearly: number | null;
  yearlySavingsPct?: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    key: "trial",
    name: "Free Trial",
    monthly: 0,
    yearly: 0,
    features: ["ฟรี 30 วัน", "3 โครงการ", "พื้นที่ 500 MB", "Export Excel", "ระบบ Workflow 10 ขั้นตอน"],
  },
  {
    key: "starter",
    name: "Starter",
    recommended: true,
    monthly: 299,
    yearly: 2500,
    yearlySavingsPct: 15,
    features: ["ไม่จำกัดโครงการ", "พื้นที่ 5 GB", "Export Excel", "ระบบแจ้งเตือน", "ระบบ Workflow 10 ขั้นตอน"],
  },
  {
    key: "pro",
    name: "Pro",
    monthly: 499,
    yearly: 4490,
    yearlySavingsPct: 15,
    features: [
      "ทุกอย่างใน Starter",
      "พื้นที่ 10 GB",
      "Audit trail (บันทึกการทำงานทุกขั้นตอน)",
      "Export สรุปพิเศษสำหรับ สตง.",
      "Priority support",
    ],
  },
  {
    key: "team",
    name: "Team",
    monthly: null,
    yearly: null,
    features: ["สำหรับทั้งแผนก/หน่วยงาน", "ไม่จำกัดผู้ใช้", "Custom onboarding"],
  },
];

function fmtBaht(n: number) { return n.toLocaleString("th-TH"); }

function SubscriptionPage() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>("trial");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return; }
      const { data: prof } = await supabase.from("profiles")
        .select("organization_id").eq("id", u.user.id).maybeSingle();
      if (prof?.organization_id) {
        const { data: org } = await supabase.from("organizations")
          .select("plan").eq("id", prof.organization_id).maybeSingle();
        if (org?.plan) setCurrentPlan(org.plan);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const choose = (plan: Plan) => {
    if (plan.key === "team") {
      window.location.href = "mailto:contact@procuretrack.th?subject=สอบถามแพ็กเกจ Team";
      return;
    }
    toast("กรุณาติดต่อ contact@procuretrack.th เพื่อดำเนินการอัปเกรด");
  };

  if (loading) {
    return (
      <AppShell breadcrumb="แพ็กเกจของฉัน">
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="แพ็กเกจของฉัน">
      <div className="max-w-6xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold">เลือกแพ็กเกจที่เหมาะกับคุณ</h1>
          <p className="text-muted-foreground">เริ่มใช้งานได้ทันที ยกเลิกได้ตลอดเวลา</p>

          <div className="inline-flex items-center bg-muted rounded-full p-1 mt-2">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                cycle === "monthly" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >รายเดือน</button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition flex items-center gap-2 ${
                cycle === "yearly" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              รายปี
              <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">ประหยัด 15%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            return (
              <Card
                key={plan.key}
                className={`relative flex flex-col ${plan.recommended ? "border-primary border-2 shadow-lg" : ""}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />แนะนำ
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrent && (
                      <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                        แพ็กเกจปัจจุบัน
                      </span>
                    )}
                  </div>
                  <div className="pt-2">
                    {plan.monthly === null ? (
                      <div className="text-2xl font-semibold">ติดต่อขอราคา</div>
                    ) : plan.monthly === 0 ? (
                      <div className="text-2xl font-semibold">ฟรี</div>
                    ) : cycle === "monthly" ? (
                      <div>
                        <span className="text-3xl font-semibold">฿{fmtBaht(plan.monthly)}</span>
                        <span className="text-sm text-muted-foreground"> /เดือน</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-semibold">฿{fmtBaht(plan.yearly!)}</span>
                        <span className="text-sm text-muted-foreground"> /ปี</span>
                        {plan.yearlySavingsPct && (
                          <div className="mt-1">
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                              ประหยัด {plan.yearlySavingsPct}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2.5 text-sm flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={plan.recommended ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => choose(plan)}
                  >
                    {isCurrent ? "ใช้งานอยู่" : plan.key === "team" ? "ติดต่อเรา" : "เลือกแพ็กเกจนี้"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center space-y-1.5 text-sm text-muted-foreground">
          <p>💬 ต้องการใบเสร็จสำหรับเบิกจ่าย? ติดต่อ <a className="text-primary underline" href="mailto:contact@procuretrack.th">contact@procuretrack.th</a></p>
          <p>🔒 ข้อมูลปลอดภัยตามมาตรฐาน PDPA 2562</p>
        </div>
      </div>
    </AppShell>
  );
}
