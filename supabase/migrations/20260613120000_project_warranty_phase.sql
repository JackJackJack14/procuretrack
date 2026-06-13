-- ระยะค้ำประกันความชำรุด 2 ปี หลังปิดงานจ้าง (ขั้นตอนที่ 10)
alter table public.projects
  add column if not exists warranty_started_at date null,
  add column if not exists warranty_end_date date null;

comment on column public.projects.warranty_started_at is 'วันเริ่มนับค้ำประกัน — วันตรวจรับงวดสุดท้าย (ขั้น 10)';
comment on column public.projects.warranty_end_date is 'วันสิ้นสุดค้ำประกันผลงาน (+2 ปีปฏิทินจาก warranty_started_at)';
