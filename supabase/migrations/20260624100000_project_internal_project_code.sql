-- แยกรหัสโครงการภายในออกจากรหัสแบบ (เดิมรวมในช่อง design_code)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS internal_project_code text;

COMMENT ON COLUMN public.projects.design_code IS 'รหัสแบบ (เช่น ฝ. ฉช.0168)';
COMMENT ON COLUMN public.projects.internal_project_code IS 'รหัสโครงการภายในหน่วยงาน (เช่น 01268)';
