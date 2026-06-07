-- ย้ายราคากลางจากขั้นตอนที่ 1 (estimated_price) → ขั้นตอนที่ 2 (approved_median_price)
-- รันใน Supabase Dashboard → SQL Editor

update public.projects
set approved_median_price = estimated_price
where approved_median_price is null
  and estimated_price is not null
  and estimated_price > 0;

comment on column public.projects.estimated_price is
  'legacy — ซิงก์จาก approved_median_price เมื่อบันทึกขั้นตอนที่ 2 (เดิมกรอกในขั้นตอนที่ 1)';

comment on column public.projects.approved_median_price is
  'ราคากลาง (บาท) — บันทึกจากขั้นตอนที่ 2 หลังคณะกรรมการกำหนดและได้รับอนุมัติ';
