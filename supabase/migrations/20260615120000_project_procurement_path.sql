-- รูปแบบการจัดซื้อจัดจ้าง: self = ดำเนินการเอง, external = ส่วนกลาง/สพข. จัดให้ (Bypass Step 1-7)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS procurement_path text NOT NULL DEFAULT 'self';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_procurement_path_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_procurement_path_check
  CHECK (procurement_path IN ('self', 'external'));

COMMENT ON COLUMN public.projects.procurement_path IS 'self=จัดซื้อเองตั้งแต่ต้น, external=หน่วยงานอื่นจัดให้ (ข้าม Step 1-7)';
