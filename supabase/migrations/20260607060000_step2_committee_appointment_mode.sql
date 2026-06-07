-- รูปแบบการแต่งตั้งคณะกรรมการ + ประเภท committee_type ขั้นตอนที่ 2
-- รันใน Supabase Dashboard → SQL Editor

alter table public.projects
  add column if not exists committee_appointment_mode text null
    check (committee_appointment_mode is null or committee_appointment_mode in ('combined', 'separate'));

comment on column public.projects.committee_appointment_mode is
  'combined = ชุดเดียว (committee_type tor), separate = แยก tor + price_median';

-- ขยาย committee_type ให้รองรับทุกค่าที่แอปใช้ (รวม legacy)
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
