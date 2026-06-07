-- แก้ check constraint committee_type ให้รองรับขั้นตอนที่ 2
-- รันใน Supabase Dashboard → SQL Editor (จำเป็นถ้าบันทึกคณะกรรมการ error)

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
