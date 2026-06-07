-- Smart Checklist ขั้นตอนที่ 3 — เก็บสถานะการติ๊ก (jsonb)
-- รันใน Supabase Dashboard → SQL Editor หากยังไม่ได้ migrate

alter table public.procurement_steps
  add column if not exists step3_checklist jsonb null;

comment on column public.procurement_steps.step3_checklist is
  'Smart Checklist ขั้นตอนที่ 3: draft_announcement_standard_compliant, spec_no_lock_in_verified, internal_memo_director_approval, median_price_step2_verified, hearing_files_prepared, egp_published_for_comment, comment_channel_prepared';
