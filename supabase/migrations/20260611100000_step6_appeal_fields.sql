-- ขั้นตอนที่ 6 — อุทธรณ์ (มาตรา 117)
alter table public.projects
  add column if not exists appeal_report_approval_date date null;

comment on column public.projects.appeal_report_approval_date is
  'วันที่หัวหน้าหน่วยงานลงนามในหนังสือผลอุทธรณ์ — ขั้นตอนที่ 6';

notify pgrst, 'reload schema';
