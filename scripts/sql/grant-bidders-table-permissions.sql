-- สิทธิ์ตาราง bidders — แก้ error: permission denied for table bidders ตอนยกเลิกโครงการ
-- รันใน Supabase Dashboard → SQL Editor

-- สร้างตารางถ้ายังไม่มี (บาง environment มีอยู่แล้วจาก Lovable)
CREATE TABLE IF NOT EXISTS public.bidders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tax_id TEXT NULL,
  contact_name TEXT NULL,
  phone TEXT NULL,
  bid_amount NUMERIC NULL,
  submitted_at TIMESTAMPTZ NULL,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  disqualified BOOLEAN NOT NULL DEFAULT FALSE,
  disqualify_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bidders_project_id_idx ON public.bidders (project_id);

-- สิทธิ์ role authenticated (เหมือน committees / documents)
GRANT INSERT, SELECT, UPDATE, DELETE ON public.bidders TO authenticated;

-- RLS — จำกัดตาม organization
ALTER TABLE public.bidders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bidders_org_isolation ON public.bidders;
CREATE POLICY bidders_org_isolation ON public.bidders
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_my_org_id())
  WITH CHECK (organization_id = public.get_my_org_id());

NOTIFY pgrst, 'reload schema';
