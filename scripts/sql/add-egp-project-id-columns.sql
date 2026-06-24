-- รันใน Supabase Dashboard → SQL Editor แล้วกด Run
-- จากนั้น: Settings → API → Reload schema (หรือรอ NOTIFY ด้านล่าง)

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS egp_project_id TEXT;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS standard_model_code TEXT;

COMMENT ON COLUMN public.projects.egp_project_id IS
  'เลขที่โครงการ e-GP / รหัสโครงการภายใน (บังคับทุกประเภทงาน)';

COMMENT ON COLUMN public.projects.standard_model_code IS
  'รหัสแบบมาตรฐาน — เฉพาะงานจ้างก่อสร้าง (ไม่บังคับ)';

UPDATE public.projects
SET egp_project_id = COALESCE(NULLIF(TRIM(egp_project_id), ''), NULLIF(TRIM(project_code), ''))
WHERE egp_project_id IS NULL OR TRIM(egp_project_id) = '';

UPDATE public.projects
SET standard_model_code = COALESCE(
  NULLIF(TRIM(standard_model_code), ''),
  NULLIF(TRIM(design_code), '')
)
WHERE standard_model_code IS NULL OR TRIM(standard_model_code) = '';

NOTIFY pgrst, 'reload schema';
