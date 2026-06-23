-- จำนวนผลสัมฤทธิ์ของงาน — ขั้นตอนที่ 1
alter table public.projects
  add column if not exists target_quantity numeric null;

comment on column public.projects.target_quantity is
  'จำนวนผลสัมฤทธิ์ของงาน (หน่วยตาม result_unit) — บันทึกจากขั้นตอนที่ 1';
