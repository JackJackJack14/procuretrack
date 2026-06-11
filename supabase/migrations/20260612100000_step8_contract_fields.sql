-- ขั้นตอนที่ 8 — ตรวจหลักประกันสัญญาและลงนามสัญญา
alter table public.projects
  add column if not exists contract_no text null,
  add column if not exists contract_signed_date date null,
  add column if not exists contract_guarantee_type text null,
  add column if not exists contract_guarantee_amount numeric null,
  add column if not exists contract_guarantee_document_no text null;

comment on column public.projects.contract_no is 'เลขที่สัญญา — ขั้นตอนที่ 8';
comment on column public.projects.contract_signed_date is 'วันที่ลงนามในสัญญา — ขั้นตอนที่ 8';
comment on column public.projects.contract_guarantee_type is 'ประเภทหลักประกันสัญญา — ขั้นตอนที่ 8';
comment on column public.projects.contract_guarantee_amount is 'มูลค่าหลักประกันสัญญา (บาท) — ขั้นตอนที่ 8';
comment on column public.projects.contract_guarantee_document_no is 'เลขที่เอกสารหลักประกัน — ขั้นตอนที่ 8';

notify pgrst, 'reload schema';
