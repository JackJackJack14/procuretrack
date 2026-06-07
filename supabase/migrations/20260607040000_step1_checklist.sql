-- Smart Checklist ขั้นตอนที่ 1 — เก็บสถานะการติ๊ก (jsonb)
-- รันใน Supabase Dashboard → SQL Editor หากยังไม่ได้ migrate

alter table public.procurement_steps
  add column if not exists step1_checklist jsonb null;

comment on column public.procurement_steps.step1_checklist is
  'Smart Checklist ขั้นตอนที่ 1: budget_allocated_confirmed, annual_plan_published, egp_plan_code_verified, project_name_and_type_verified, responsible_officer_confirmed';
