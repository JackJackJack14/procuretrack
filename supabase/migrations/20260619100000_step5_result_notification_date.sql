alter table public.projects
  add column if not exists winner_result_notification_date date null;

comment on column public.projects.winner_result_notification_date is
  'วันที่แจ้งผลให้ผู้เสนอราคาทราบ — ขั้นตอนที่ 5 (ฐานนับระยะอุทธรณ์ 7 วันทำการ)';
