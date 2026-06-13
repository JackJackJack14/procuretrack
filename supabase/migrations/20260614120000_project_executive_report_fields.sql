-- ฟิลด์สำหรับ Data Flow รายงานสรุปผู้บริหาร (Step 1, 2, 4) และ Step 10
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS site_village text,
  ADD COLUMN IF NOT EXISTS site_moo integer,
  ADD COLUMN IF NOT EXISTS site_subdistrict text,
  ADD COLUMN IF NOT EXISTS site_district text,
  ADD COLUMN IF NOT EXISTS site_province text,
  ADD COLUMN IF NOT EXISTS allocated_budget numeric,
  ADD COLUMN IF NOT EXISTS site_supervisor_name text,
  ADD COLUMN IF NOT EXISTS site_supervisor_affiliation text,
  ADD COLUMN IF NOT EXISTS site_engineer_name text;

COMMENT ON COLUMN public.projects.activity_type IS 'ประเภทกิจกรรม/งาน (ขั้นตอนที่ 1)';
COMMENT ON COLUMN public.projects.site_village IS 'ชื่อบ้าน/หมู่บ้าน (ขั้นตอนที่ 1)';
COMMENT ON COLUMN public.projects.site_moo IS 'หมู่ที่ (ขั้นตอนที่ 1)';
COMMENT ON COLUMN public.projects.site_subdistrict IS 'ตำบล (ขั้นตอนที่ 1)';
COMMENT ON COLUMN public.projects.site_district IS 'อำเภอ (ขั้นตอนที่ 1)';
COMMENT ON COLUMN public.projects.site_province IS 'จังหวัด (ขั้นตอนที่ 1)';
COMMENT ON COLUMN public.projects.allocated_budget IS 'วงเงินงบประมาณที่ได้รับจัดสรร (ขั้นตอนที่ 2)';
COMMENT ON COLUMN public.projects.site_supervisor_name IS 'ชื่อ-นามสกุล ผู้ควบคุมงาน (ขั้นตอนที่ 4)';
COMMENT ON COLUMN public.projects.site_supervisor_affiliation IS 'ตำแหน่ง/สังกัด ผู้ควบคุมงาน (ขั้นตอนที่ 4)';
COMMENT ON COLUMN public.projects.site_engineer_name IS 'ชื่อ-นามสกุล วิศวกรผู้คำนวณ/คุมแบบ (ขั้นตอนที่ 4)';
