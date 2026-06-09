-- ราคาที่ตกลงซื้อหรือจ้างจริง (กรณีต่อรองราคา) — ขั้นตอนที่ 4
alter table public.projects
  add column if not exists final_agreed_amount numeric null;

comment on column public.projects.final_agreed_amount is
  'ราคาที่ตกลงซื้อหรือจ้างจริง (บาท) หลังต่อรองราคา — ส่งต่อมูลค่าสัญญา (หากว่างใช้ winning_bid_amount)';
