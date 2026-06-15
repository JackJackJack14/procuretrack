-- เลขที่หนังสืออนุมัติราคากลาง (ขั้นตอนที่ 2) — ใช้ส่งต่อขั้นตอนที่ 3
alter table public.projects
  add column if not exists median_approval_letter_no text null;

comment on column public.projects.median_approval_letter_no is
  'เลขที่หนังสืออนุมัติราคากลางจากขั้นตอนที่ 2 — ส่งต่อให้ขั้นตอนที่ 3';
