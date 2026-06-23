-- ประเภทโครงการ e-GP และหมวดงบประมาณ (ขั้นตอนที่ 1)
alter table public.projects
  add column if not exists project_type text null,
  add column if not exists budget_category text null;

comment on column public.projects.project_type is
  'ประเภทโครงการตาม e-GP (ซื้อ / จ้างทำของ / จ้างก่อสร้าง / จ้างที่ปรึกษา / จ้างออกแบบ) — ขั้นตอนที่ 1';

comment on column public.projects.budget_category is
  'หมวดงบประมาณ — ใช้แนะนำประเภทโครงการอัตโนมัติ (เช่น งบลงทุน)';
