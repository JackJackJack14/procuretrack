import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "สมัครใช้งาน — ProcureTrack" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (password !== confirm) return setError("รหัสผ่านไม่ตรงกัน");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">ProcureTrack</h1>
          <p className="text-sm text-muted-foreground mt-1">ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต</p>
        </div>

        <div className="bg-card border rounded-[10px] shadow-sm p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="ชื่อ-นามสกุล" value={fullName} onChange={setFullName} required />
            <Field label="อีเมล" type="email" value={email} onChange={setEmail} required />
            <Field label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" type="password" value={password} onChange={setPassword} required />
            <Field label="ยืนยันรหัสผ่าน" type="password" value={confirm} onChange={setConfirm} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              สมัครใช้งานฟรี 30 วัน
            </button>
          </form>
          <div className="mt-5 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
