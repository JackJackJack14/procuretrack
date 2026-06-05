-- ชื่อเจ้าหน้าที่ผู้รับผิดชอบ (ข้อความ) และหมายเหตุขั้นตอน แยกจาก note เดิม
alter table public.procurement_steps
  add column if not exists responsible_officer_name text null,
  add column if not exists step_notes text null;

comment on column public.procurement_steps.responsible_officer_name is 'ชื่อเจ้าหน้าที่ผู้รับผิดชอบ (ข้อความ)';
comment on column public.procurement_steps.step_notes is 'หมายเหตุขั้นตอน (ข้อความอิสระ)';
