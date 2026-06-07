import { supabase } from "@/integrations/supabase/client";

export type OrgProfile = {
  full_name: string | null;
  organization_id: string | null;
};

export type FetchOrgProjectsResult<T> = {
  projects: T[];
  error: string | null;
  errorCode?: "NOT_AUTH" | "NO_ORG" | "QUERY" | "SCHEMA";
  profile: OrgProfile | null;
};

/** ดึงโครงการของหน่วยงานปัจจุบัน (RLS + ตรวจ profile ก่อน) */
export async function fetchOrganizationProjects<T = Record<string, unknown>>(
  columns: string,
): Promise<FetchOrgProjectsResult<T>> {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return {
      projects: [],
      error: "กรุณาเข้าสู่ระบบ",
      errorCode: "NOT_AUTH",
      profile: null,
    };
  }

  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("full_name, organization_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr) {
    return {
      projects: [],
      error: profErr.message,
      errorCode: "QUERY",
      profile: null,
    };
  }

  if (!prof?.organization_id) {
    return {
      projects: [],
      error:
        "บัญชีนี้ยังไม่ได้ผูกกับหน่วยงาน — ข้อมูลโครงการจะไม่แสดงจนกว่าจะตั้งค่าหน่วยงานให้ถูกต้อง",
      errorCode: "NO_ORG",
      profile: prof,
    };
  }

  const { data, error } = await supabase
    .from("projects")
    .select(columns)
    .order("created_at", { ascending: false });

  if (error) {
    const isSchema = /column|schema|does not exist/i.test(error.message);
    return {
      projects: [],
      error: isSchema
        ? `${error.message} — กรุณารัน SQL Migration ล่าสุดใน Supabase Dashboard (โฟลเดอร์ supabase/migrations)`
        : error.message,
      errorCode: isSchema ? "SCHEMA" : "QUERY",
      profile: prof,
    };
  }

  return {
    projects: (data ?? []) as T[],
    error: null,
    profile: prof,
  };
}

/** ตรวจว่าเชื่อม Supabase cloud ได้และมี session */
export async function verifySupabaseSession(): Promise<{
  ok: boolean;
  userEmail?: string;
  profileName?: string | null;
  organizationId?: string | null;
  supabaseUrl?: string;
  error?: string;
}> {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return { ok: false, supabaseUrl, error: authErr?.message ?? "ไม่ได้เข้าสู่ระบบ" };
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("full_name, organization_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  return {
    ok: true,
    userEmail: auth.user.email,
    profileName: prof?.full_name ?? null,
    organizationId: prof?.organization_id ?? null,
    supabaseUrl,
  };
}
