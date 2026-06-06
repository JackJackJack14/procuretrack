-- ฟิลด์รายงานขอซื้อขอจ้าง (บันทึกจากขั้นตอนที่ 3 → ส่งต่อขั้นตอนที่ 4)
alter table public.projects
  add column if not exists procurement_request_letter_no text null,
  add column if not exists procurement_request_approval_date date null,
  add column if not exists committee_review_workdays integer null;

comment on column public.projects.procurement_request_letter_no is 'เลขที่หนังสือรายงานขอซื้อขอจ้าง (ขั้นตอนที่ 3)';
comment on column public.projects.procurement_request_approval_date is 'วันที่หัวหน้าหน่วยงานอนุมัติเห็นชอบรายงานขอซื้อขอจ้าง';
comment on column public.projects.committee_review_workdays is 'ระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ) — ส่งต่อขั้นตอนที่ 4';
