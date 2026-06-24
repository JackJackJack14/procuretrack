-- บันทึก Audit — ใครสั่งถอยโครงการเพื่อแก้ไขสาระสำคัญ / รีเซ็ตขั้นตอน
create table if not exists public.project_workflow_audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action text not null,
  performed_by uuid references auth.users(id) on delete set null,
  performer_name text not null default '',
  performed_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create index if not exists project_workflow_audit_logs_project_id_idx
  on public.project_workflow_audit_logs (project_id, performed_at desc);

comment on table public.project_workflow_audit_logs is
  'Audit log — ถอยกลับแก้ไขโครงการ / รีเซ็ตขั้นตอนหลังแก้ไขสาระสำคัญ';

notify pgrst, 'reload schema';
