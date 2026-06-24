-- งานจ้างก่อสร้าง ขั้นตอนที่ 2: ราคาอ้างอิงถอดแบบ + เอกสาร ปร.4/5/6 หรือ BOQ
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS approved_reference_price numeric,
  ADD COLUMN IF NOT EXISTS reference_price_document_url text;

COMMENT ON COLUMN public.projects.approved_reference_price IS
  'ยอดรวมราคากลางสุทธิจากการถอดแบบ (งานจ้างก่อสร้าง ขั้นตอนที่ 2)';
COMMENT ON COLUMN public.projects.reference_price_document_url IS
  'ที่เก็บไฟล์ตารางสรุปราคารวม ปร.4/ปร.5/ปร.6 หรือเล่ม BOQ';

NOTIFY pgrst, 'reload schema';
