-- ขั้นตอนที่ 5 — ประกาศผู้ชนะการเสนอราคา (พ.ร.บ. จัดซื้อจัดจ้างฯ มาตรา 66)
alter table public.projects
  add column if not exists winner_announcement_no text null,
  add column if not exists winner_announcement_date date null;

comment on column public.projects.winner_announcement_no is 'เลขที่ประกาศผลผู้ชนะในระบบ e-GP — ขั้นตอนที่ 5';
comment on column public.projects.winner_announcement_date is 'วันที่ลงนามในประกาศผู้ชนะ — ขั้นตอนที่ 5';

notify pgrst, 'reload schema';
