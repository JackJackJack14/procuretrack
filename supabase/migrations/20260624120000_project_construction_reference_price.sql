-- งานจ้างก่อสร้าง ขั้นตอนที่ 2: ราคาอ้างอิงถอดแบบ + เอกสาร ปร.4/5/6 หรือ BOQ
alter table public.projects
  add column if not exists approved_reference_price numeric,
  add column if not exists reference_price_document_url text;

comment on column public.projects.approved_reference_price is
  'ยอดรวมราคากลางสุทธิจากการถอดแบบ (งานจ้างก่อสร้าง ขั้นตอนที่ 2)';
comment on column public.projects.reference_price_document_url is
  'ที่เก็บไฟล์ตารางสรุปราคารวม ปร.4/ปร.5/ปร.6 หรือเล่ม BOQ';

notify pgrst, 'reload schema';
