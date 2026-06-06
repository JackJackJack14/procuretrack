-- สถานะการอุทธรณ์ (ขั้นตอนที่ 4) — ใช้แสดงบน Dashboard
alter table public.projects
  add column if not exists appeal_status text null,
  add column if not exists appeal_report_letter_no text null,
  add column if not exists appeal_consideration_status text null;

comment on column public.projects.appeal_status is 'none = ไม่มีอุทธรณ์ (พร้อมทำสัญญา), pending = ติดอุทธรณ์';
comment on column public.projects.appeal_report_letter_no is 'เลขที่หนังสือรายงานผลอุทธรณ์';
comment on column public.projects.appeal_consideration_status is 'สถานะผลการพิจารณาอุทธรณ์';
