-- ฟิลด์ราคากลางระดับโครงการ (ขั้นตอนที่ 1)
alter table public.projects
  add column if not exists estimated_price numeric null;

comment on column public.projects.estimated_price is 'ราคากลาง (บาท) — บันทึกจากขั้นตอนที่ 1';
