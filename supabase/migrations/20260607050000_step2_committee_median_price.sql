-- ขั้นตอนที่ 2: คำสั่งแต่งตั้งคณะกรรมการ + ราคากลาง + Smart Checklist
-- รันใน Supabase Dashboard → SQL Editor หากยังไม่ได้ migrate

alter table public.projects
  add column if not exists committee_appointment_order_no text null,
  add column if not exists committee_appointment_order_date date null,
  add column if not exists approved_median_price numeric null,
  add column if not exists median_price_approval_date date null;

alter table public.procurement_steps
  add column if not exists step2_checklist jsonb null;

comment on column public.projects.committee_appointment_order_no is
  'เลขที่คำสั่งแต่งตั้งคณะกรรมการ (ขั้นตอนที่ 2)';
comment on column public.projects.committee_appointment_order_date is
  'วันที่ลงนามในคำสั่งแต่งตั้งคณะกรรมการ (ขั้นตอนที่ 2)';
comment on column public.projects.approved_median_price is
  'วงเงินราคากลางที่ได้รับอนุมัติ (ขั้นตอนที่ 2)';
comment on column public.projects.median_price_approval_date is
  'วันที่หัวหน้าหน่วยงานอนุมัติราคากลาง (ขั้นตอนที่ 2)';
comment on column public.procurement_steps.step2_checklist is
  'Smart Checklist ขั้นตอนที่ 2';
