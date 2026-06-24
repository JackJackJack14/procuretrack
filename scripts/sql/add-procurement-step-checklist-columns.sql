-- คอลัมน์ checklist / หมายเหตุขั้นตอน บน procurement_steps
-- รันใน Supabase Dashboard → SQL Editor หากเจอ error:
-- "Could not find the 'step3_checklist' column of 'procurement_steps' in the schema cache"

alter table public.procurement_steps
  add column if not exists responsible_officer_name text null,
  add column if not exists step_notes text null;

alter table public.procurement_steps
  add column if not exists step1_checklist jsonb null;

alter table public.procurement_steps
  add column if not exists step2_checklist jsonb null;

alter table public.procurement_steps
  add column if not exists step3_checklist jsonb null;

comment on column public.procurement_steps.step1_checklist is 'Smart Checklist ขั้นตอนที่ 1 (jsonb)';
comment on column public.procurement_steps.step2_checklist is 'Smart Checklist ขั้นตอนที่ 2 (jsonb)';
comment on column public.procurement_steps.step3_checklist is 'Smart Checklist ขั้นตอนที่ 3 (jsonb)';

notify pgrst, 'reload schema';
