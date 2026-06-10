-- รวม migration ที่อาจยังไม่ได้รันบน Cloud (ถ้ารันซ้ำ IF NOT EXISTS จะข้ามได้)
-- รันใน Supabase Dashboard → SQL Editor

alter table public.projects
  add column if not exists estimated_price numeric null;

alter table public.projects
  add column if not exists procurement_request_letter_no text null,
  add column if not exists procurement_request_approval_date date null,
  add column if not exists committee_review_workdays integer null;

alter table public.projects
  add column if not exists egp_doc_request_count integer null,
  add column if not exists egp_bid_submission_count integer null,
  add column if not exists winning_bidder_name text null,
  add column if not exists winning_bid_amount numeric null,
  add column if not exists evaluation_report_letter_no text null,
  add column if not exists evaluation_report_approval_date date null,
  add column if not exists final_agreed_amount numeric null;

alter table public.projects
  add column if not exists appeal_status text null,
  add column if not exists appeal_report_letter_no text null,
  add column if not exists appeal_consideration_status text null;

alter table public.procurement_steps
  add column if not exists responsible_officer_name text null,
  add column if not exists step_notes text null;

alter table public.procurement_steps
  add column if not exists step1_checklist jsonb null;

alter table public.projects
  add column if not exists committee_appointment_order_no text null,
  add column if not exists committee_appointment_order_date date null,
  add column if not exists approved_median_price numeric null,
  add column if not exists median_price_approval_date date null,
  add column if not exists committee_appointment_mode text null;

alter table public.procurement_steps
  add column if not exists step2_checklist jsonb null;

-- ย้ายราคากลาง legacy → approved_median_price (ขั้นตอนที่ 2)
update public.projects
set approved_median_price = estimated_price
where approved_median_price is null
  and estimated_price is not null
  and estimated_price > 0;

-- committee_type ขั้นตอนที่ 2: tor | price_median (+ legacy tor_and_median, median_price)
grant insert, select, update, delete on public.committees to authenticated;

alter table public.committees drop constraint if exists committees_committee_type_check;
alter table public.committees add constraint committees_committee_type_check
  check (committee_type in (
    'tor',
    'price_median',
    'tor_and_median',
    'median_price',
    'evaluation',
    'inspection'
  ));

alter table public.procurement_steps
  add column if not exists step3_checklist jsonb null;

-- ขั้นตอนที่ 5 — ประกาศผู้ชนะการเสนอราคา
alter table public.projects
  add column if not exists winner_announcement_no text null,
  add column if not exists winner_announcement_date date null;

comment on column public.projects.winner_announcement_no is 'เลขที่ประกาศผลผู้ชนะในระบบ e-GP — ขั้นตอนที่ 5';
comment on column public.projects.winner_announcement_date is 'วันที่ลงนามในประกาศผู้ชนะ — ขั้นตอนที่ 5';

notify pgrst, 'reload schema';
